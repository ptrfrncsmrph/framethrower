%% @author author <author@example.com>
%% @copyright YYYY author.

%% @doc Web server for pipeline.

-module(pipeline_web).
-author('author <author@example.com>').
-include ("../../mbrella/include/scaffold.hrl").

-export([start/1, stop/0, loop/2]).

-define( trace(X), io:format("TRACE ~p:~p ~p~n", [?MODULE, ?LINE, X])).
-define( colortrace(X), io:format("\033[40mTRACE \033[31m~p\033[39m:\033[95m~p\033[39m ~p\033[0m~n~n", [?MODULE, ?LINE, X])).

-define (pipelineBufferTime, 50).

%% External API

start(Options) ->
    {DocRoot, Options1} = get_option(docroot, Options),
    Loop = fun (Req) ->
                   ?MODULE:loop(Req, DocRoot)
           end,
    mochiweb_http:start([{name, ?MODULE}, {loop, Loop} | Options1]).

stop() ->
    mochiweb_http:stop(?MODULE).

loop(Req, DocRoot) ->
    "/" ++ Path = Req:get(path),
    case Req:get(method) of
        Method when Method =:= 'GET'; Method =:= 'HEAD' ->
            case Path of
				% "newSession" ->
				% 	SessionId = session:new(),
				% 	spit(Req, "sessionId", SessionId);
				"test" ->
					% spit(Req, "test", list_to_binary(io_lib:format("~p", [catch erlang:error(test) ] )));
					spit(Req, {struct, [{<<"test">>, value}]});
				"debug" ->
					Data = Req:parse_qs(),
					Name = proplists:get_value("name", Data),
					if
						Name =:= undefined -> Req:ok({"text/html", [], [ debug:httpSearchPage() ]});
						true ->
							case debug:getDebugHTML(Name, "/debug?name=") of
								notfound ->
									Req:ok({"text/plain", [], [ Name ++ " was not found on the server." ] });
								HTML ->
									Req:ok({"text/html", [], [ "<html>" ++ HTML ++ "</html>"]})
							end
					end;
				"serialize" ->
					Data = Req:parse_qs(),
					{Username, Password} = mblib:pump(["username", "password"], 
												fun(Element) -> proplists:get_value(Element, Data) end),
					if 
						Username =:= "echostorm", Password =:= "insecurepassword" ->
							try serialize:serializeEnv() of
								ok -> Req:ok({ "text/plain", [], [ "server state serialized successfully." ]})
							catch _:_ -> Req:ok({ "text/plain", [], [ "error, serialize screwed up (andrews fault)." ]})
							end;
						true ->
							Req:ok({ "text/plain", [], [ "invalid username/password." ]})
					end;
                _ ->
                    Req:serve_file(Path, DocRoot)
            end;
        'POST' ->
            case Path of
				"newSession" ->
					SessionPointer = sessionManager:newSession(),
					spit(Req, "sessionId", sessionPointer:name(SessionPointer));
				"sharedLets" ->
					SharedLets = action:getSharedLets(),
					SharedLetsJson = {struct, lists:map(fun({Name, Value}) ->
						{list_to_binary(Name), mblib:exprElementToJson(ast:toTerm(Value))}
					end, SharedLets)},
					spit(Req, SharedLetsJson);
				"test" ->
					% spit(Req, "test", list_to_binary(io_lib:format("~p", [catch erlang:error(test) ] )));
					spit(Req, {struct, [{<<"object.1">>, mblib:exprElementToJson({objectPointer, "object.1"})}]});
				"pipeline" ->
					Data = Req:parse_post(),
					Json = proplists:get_value("json", Data),
					JsonOut = try mochijson2:decode(Json) of Struct ->
						LastMessageId = struct:get_value(<<"lastMessageId">>, Struct),
						SessionName = struct:get_value(<<"sessionId">>, Struct),
						case sessionManager:lookup(SessionName) of
							sessionClosed -> {struct, [{"sessionClosed", true}] };
							SessionPointer ->
								case session:pipeline(SessionPointer, LastMessageId) of
									timeout ->
										TimeoutError = {struct, [{"errorType", timeout}, {"reason", no_response_for_pipeline}]},
										{struct, [{"responses", [TimeoutError]},{"lastMessageId", LastMessageId}]};
									{updates, Updates, LastMessageId2} ->
										{struct, [{"responses", Updates},{"lastMessageId", LastMessageId2}]};
									OtherJson -> 
										?colortrace(wrong_format),
										OtherJson
								end
						end
					catch _:_ -> 
						?trace("Decode Error: "), ?trace(Json),
						DecodeError = {struct, [{"errorType", decodeError}, {"reason", bad_json}]},
						{struct, [{"responses", [DecodeError]}]}
					end,
					spit(Req, JsonOut);
				"post" ->
					Data = Req:parse_post(),
					Json = proplists:get_value("json", Data),
					Struct = mochijson2:decode(Json),
					SessionName = struct:get_value(<<"sessionId">>, Struct),
					case sessionManager:lookup(SessionName) of
						session_closed ->
							spit(Req, {struct, [{"sessionClosed", true}] });
						SessionPointer ->
							Messages = struct:get_value(<<"messages">>, Struct),
							
							ProcessMessage = fun( Message ) ->
								case struct:get_first(Message) of
									{<<"query">>, Query} -> processQuery(Query, SessionPointer);
									{<<"remove">>, Query} -> removeQuery(Query, SessionPointer);
									{<<"action">>, Action} -> processActionJson(Action, SessionPointer)
								end
							end,
							
							try lists:foreach( ProcessMessage, Messages) of
								ok -> spit(Req, {struct, [{"result", true}]})
							catch 
								ErrorType:Reason -> 
									spit(Req, {struct, [
										{"errorType", ErrorType}, 
										{"reason", 
											list_to_binary(io_lib:format("~p", [{Reason, erlang:get_stacktrace()}]))
										}
									] }),
									throw([ErrorType, Reason, erlang:get_stacktrace()])
							end
					end;
                _ ->
                    Req:not_found()
            end;
        _ ->
            Req:respond({501, [], []})
    end.

%Utility
getFromStruct(StringKey, Struct) ->
	Result = struct:get_value(list_to_binary(StringKey), Struct),
	if
		is_binary(Result) -> binary_to_list(Result);
		true -> Result
	end.

%% ====================================================
%% Internal API
%% ====================================================

%% 
%% processQuery :: JSONStruct -> SessionPointer -> ok
%% 		
%%		

processQuery( Query, SessionPointer ) ->
	Expr = getFromStruct("expr", Query),
	QueryId = getFromStruct("queryId", Query),
	AST = parse:parse(Expr),
	session:connect(SessionPointer, AST, QueryId).

%% 
%% removeQuery :: JSONStruct -> SessionPointer -> ok
%% 		
%%		

removeQuery( Query, SessionPointer ) ->
	QueryId = getFromStruct("queryId", Query),
	session:disconnect(SessionPointer, QueryId).

%% 
%% processActionJson :: JSONStruct -> SessionPointer -> ok
%% 		
%%		
	
processActionJson ( Action, SessionPointer ) ->
	ActionId = getFromStruct("actionId", Action),
	ActionName = binary_to_list(struct:get_value(<<"actionName">>, Action)),
	BinaryParams = struct:get_value(<<"params">>, Action),

	%Convert Params to ASTs

	Params = lists:map(fun(Param) ->
		eval:evalAST(binary_to_list(Param))
	end, BinaryParams),

	Returned = ast:toTerm(action:performAction(ActionName, Params)),
	
	ActionResponse = {struct, [{"actionResponse", 
		{struct, [{"actionId", list_to_binary(ActionId)}, {"success", true}, {"returned", mblib:exprElementToJson(Returned)}] }
	}]},
	
	session:sendActionUpdate(SessionPointer, ActionResponse).


%% 
%% spit :: Request -> JsonKeyName -> JsonKeyValue -> Json
%% 			spit has the side effect that the Json result is sent to the Request and then forwarded 
%%			to the client that made the request
%% 

spit(Req, ObName, ObValue) ->
	Req:ok({"text/plain", [], [mochijson2:encode({struct, [{ObName, ObValue}] } )] } ).
spit(Req, Json) ->
	Req:ok({"text/plain", [], [ mochijson2:encode(Json) ] }).

%% 
%% get_option :: 
%% 		
%%		

get_option(Option, Options) ->
    {proplists:get_value(Option, Options), proplists:delete(Option, Options)}.
