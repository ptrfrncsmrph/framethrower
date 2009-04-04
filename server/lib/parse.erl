-module (parse).
-compile( export_all ).

-define (do(X, Y, Next), then( Y, fun(X) -> Next end )).
-define( trace(X), io:format("TRACE ~p:~p ~p~n", [?MODULE, ?LINE, X])).

%% ====================================================
%% Parser
%% ====================================================

%% 
%% Ast :: List(Tuple(X, Y)) | List()
%% 
%% 
%% Parser :: ¬ String -> Ast
%% 


%% 
%% return X -> ¬ Y -> Ast
%% 

return(Ast) ->
	fun(String) -> [{Ast, String}] end.
%% 
%% failure -> ¬ X -> Ast
%% 

failure() ->
	fun(_String) -> [] end.

%% 
%% item -> ¬ String -> Ast
%% 

item() ->
	fun(String) ->
		case String of
			[] -> [];
			[H|T] -> [{H, T}]
		end
	end.

%% 
%% parser (Parser A) String -> Ast
%% 

parse(Parser, String) ->
	Parser(String).

%% 
%% then (Parser A) (¬ Parser B) -> Ast		¬ Parser B = ¬ String -> Parser B
%% 		the monadic part is that you can compose parsers into a new parser

then(Parser, FunToParser) ->
	fun(String) ->
		case parse(Parser, String) of
			[] -> [];
			[{H, Tail}] -> parse( FunToParser(H), Tail )
		end
	end.

%% 
%% choice (Parser A) (Parser B) -> Ast
%% 

choice(Parser1, Parser2) ->
	fun(String) ->
		case parse(Parser1, String) of
			[] -> parse(Parser2, String);
			[{H, Tail}] -> [{H, Tail}]
		end
	end.

choice([]) -> failure();
choice([H|T]) ->
	choice(H, choice(T)).


%% 
%% nest:: FirstElement -> Parser -> Fun -> Parser
%%		nest was my solution to the left associativity of Apply's.  This could be a slow process but essentially it
%%		returns a parser that takes the first element of something that is left associative (LeftMost) and then 
%%		looks to see if there are more of those left associative elements to the right of it... it 
%%		then folds NestFun on the elements that were parsed out so that you have for example:
%%
%%		nest(apply1, apply(),  fun(X, Acc) -> {cons, apply, Acc, X} end) -> Parser st.
%%			parse(Parser, "apply2 apply3 apply4 apply5") ->
%%				((((apply1 apply2) apply3) apply4) apply5)
%% 

	
nest(LeftMost, Parser, NestFun) ->
	fun(String) ->
		case nestList(Parser, String) of
			[] -> [];
			[{ElemList, Tail}] -> [{lists:foldl(NestFun, LeftMost, ElemList), Tail}]
		end			
	end.
	
nestList(Parser, String) ->
	nestList(Parser, [], String).
	
nestList(Parser, Acc, String) -> 
		case parse(Parser, String) of
			[] -> [{Acc, String}];
			[{H, Tail}] -> nestList(Parser, Acc ++ [H], Tail)
		end.

%% 
%% sat (Char -> Bool) -> (¬ Y -> Ast)
%% 

% do(X,Y,Z) says Parse a Y off the string and then take Z and make a parser out of it that includes Y in some way

sat(Predicate) ->
	?do( X, item(),
		case Predicate(X) of
			true -> return(X);
			false -> failure()
		end).

%% 
%% notSat (Char -> Bool) -> (¬ Y -> Ast)
%% 
	
notSat(Predicate) ->
	?do( X, item(),
		case Predicate(X) of
			true -> failure();
			false -> return(X)
		end
	).

many(Parser) ->
	choice( many1(Parser), return([]) ).

many1(Parser) ->
	?do(V, Parser, 
	?do(VS, many(Parser), 
	return([V|VS]))).

token(Parser) ->
	?do( _, space(),
	?do(V, Parser,
	?do(_, space(),
	return(V)))).
		
% p() ->
% 	then( symbol("("), fun(_) ->
% 			then( natural(), fun(N) ->
% 					then( many( then( symbol(","), fun(_) -> natural() end )), fun(NS) ->
% 						then( symbol(")"), fun(_) ->
% 								return([N|NS])
% 							end)
% 					end)
% 			end)
% 	end).



%% ====================================================
%% utilities
%% ====================================================

%% 
%% parsers
%% 

digit() ->
	sat(fun isDigit/1).

lower() ->
	sat(fun isLower/1).

upper() ->
	sat(fun isUpper/1).

letter() ->
	sat(fun isAlpha/1).

bool() ->
	choice(
		string("true"),
		string("false")
	).
	
nul() ->
	string("null").

alphaNum() ->
	sat(fun isAlphaNum/1).

alphaNumSpace() ->
	sat(fun isAlphaNumSpace/1).

alphaNumPunc() ->
	sat(fun isAlphaNumPunc/1).

char(Char) ->
	sat(isChar(Char)).

string([]) ->
	return([]);
string([H|T] = String) ->
	then(char(H), fun(_) -> 
				then( string(T), fun(_) ->
					return(String)
				end
				)
		end
	).

quotable() ->
	many( choice(
		notSat(isChar($")), %or
		symbol("\\\"")
	)).

lit() ->
	?do(_, symbol([$"]),
	?do(Literal, quotable(),
	?do(_, symbol([$"]),
	return(Literal)))).
	% return([$"] ++ Literal ++ [$"])))).

ident() ->
	?do(X, letter(),
	?do(XS, many( alphaNumPunc() ),
	return([X|XS]))).
	
typ() ->
	?do(X, upper(),
	?do(XS, many( alphaNumPunc() ),
	return([X|XS]))).
	
typeW() ->
	?do(X, upper(),
	?do(Z, many( alphaNum() ),
	?do(Y, typeVar(),
	return([X|Y])))).
	
nat() ->
	choice( 
		?do( XS, many1( digit() ),
		return(list_to_integer(XS)) ),
		
		?do( Neg, symbol([$-]),
		?do( XS, many1( digit() ),
		return(list_to_integer(Neg ++ XS)) ))
	).

floa() ->
	choice( 
		?do(Lead, many1( digit() ),
		?do(_, symbol([$.]),
		?do(Follow, many1( digit() ),
		return( list_to_float(Lead ++ "." ++ Follow)) ))),
		
		?do( Neg, symbol([$-]),
		?do(Lead, many1( digit() ),
		?do(_, symbol([$.]),
		?do(Follow, many1( digit() ),
		return( list_to_float(Neg ++ Lead ++ "." ++ Follow)) ))))
	).

space() ->
	then( many( sat( fun isSpace/1)), fun(_) -> return({}) end).

identifier() ->
	token( ident() ).

type() ->
	token( typ() ).
	
typeVar() ->
	token( ident() ).
	
typeWithVar() ->
	token( typeW() ).

natural() ->
	token( nat() ).

float() ->
	token( floa() ).

symbol(XS) ->
	token( string(XS) ).
	
literal() ->
	token( lit() ).
	
boolean() ->
	token( bool() ).

null() ->
	token( nul() ).

%% ====================================================
%% Char -> Bool functions
%% ====================================================

isDigit(Char) when Char >= $0, Char =< $9 -> true;
isDigit(_) -> false.

isLower(Char) when Char >= $a, Char =< $z -> true;
isLower(_) -> false.

isUpper(Char) when Char >= $A, Char =< $Z -> true;
isUpper(_) -> false.

isAlpha(Char) -> isLower(Char) orelse isUpper(Char).

isEndOfString(eos) -> true;
isEndOfString(_) -> false.

isAlphaNum(Char) -> isLower(Char) orelse isUpper(Char) orelse isDigit(Char).

isAlphaNumSpace(Char) -> isAlphaNum(Char) orelse isSpace(Char).

isAlphaNumPunc(Char) -> isAlphaNum(Char) orelse Char =:= $. orelse Char =:= $~ orelse Char =:= $:.

isChar(Char) ->
	fun(TestChar) -> Char =:= TestChar end. 

isSpace(Char) -> Char =:= $ .