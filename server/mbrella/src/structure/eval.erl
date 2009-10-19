-module (eval).
-compile( export_all).

-define( trace(X), io:format("TRACE ~p:~p ~p~n", [?MODULE, ?LINE, X])).
-define(consKeysRight, [4] ).

-include ("../../include/scaffold.hrl").

%% ====================================================
%% External API
%% ====================================================

%% 
%% evaluate :: AST -> AST | CellPointer | ObjectPointer | Literal ... etc...
%% 		
%%		

evaluate(AST) ->
	evaluate(ast:type(AST), AST).

%% ====================================================
%% Internal API
%% ====================================================

%% 
%% evaluate :: Atom -> AST -> AST | CellPointer | ObjectPointer | Literal ... etc...
%% 		
%%		

evaluate(apply, AST) ->
	FunctionOrLambda = ast:getApplyFunction(AST),
	Parameters = ast:getApplyParameters(AST),
	case ast:type(FunctionOrLambda) of
		lambda ->
			evaluate( ast:betaReduce(FunctionOrLambda, Parameters) );
		function ->
			Arity = ast:getArity(FunctionOrLambda),
			if
				Arity =:= length(Parameters) ->
					ReducedParameters = evaluateList( Parameters ),
					case mewpile:get(AST) of
						false ->
							ASTResult = ast:apply(FunctionOrLambda, ReducedParameters),
							case cellPointer:isCellPointer(ASTResult) of
								true ->
									CellAST = ast:makeCell(ASTResult),
									mewpile:store( AST, CellAST ),
									CellAST;
								false ->
									ASTResult
							end;
						CellAst ->
							CellAst
					end;
				true ->
					AST
			end
	end;
evaluate(_Type, AST) ->
	AST.

%% 
%% evaluateList :: List AST -> List (evaluate AST)
%% 		
%%		

evaluateList( [] ) -> [];
evaluateList( [H|T] ) -> 
	[evaluate(H)|evaluateList(T)].

% Evaluate with older memoization strategy
% evaluate(Expr) when is_record(Expr, exprApply) orelse is_record(Expr, exprLambda) ->
% 	case Expr of
% 		Lambda when is_record(Lambda, exprLambda) ->
% 			Lambda;
% 		Apply when is_record(Apply, exprApply) ->
% 			case evaluate( Apply#exprApply.left ) of
% 				Lambda when is_record(Lambda, exprLambda) ->
% 					evaluate( betaReduce(Lambda#exprLambda.expr, Apply#exprApply.right) );
% 				Left ->
% 					BottomExpr = bottomOut(Apply),
% 					case memoize:get( BottomExpr ) of
% 						Cell when is_record(Cell, cellPointer) -> Cell;
% 						_ ->
% 							F = evaluate( Left ), 
% 							Input = evaluate( Apply#exprApply.right ),
% 							case applyFun( F, Input ) of
% 								X when is_function(X) ->
% 									%decide if it needs to be named
% 									#exprFun{function = X, bottom = BottomExpr};
% 								Result when is_record(Result, cellPointer) ->
% 									Cell = cellStore:lookup(Result#cellPointer.name),
% 									CellWithBottom = Cell#exprCell{bottom = BottomExpr},
% 									cellStore:store(Result#cellPointer.name, CellWithBottom),
% 									OnRemove = memoize:add( BottomExpr, Result),
% 									cell:addOnRemove(Result, OnRemove),
% 									Result;
% 								NumStringBool ->
% 									NumStringBool
% 							end
% 					end
% 			end
% 	end;
% evaluate(Object) when is_record(Object, object) -> 
% 	#objectPointer{name = Object#object.name};
% evaluate(NumStringBool) -> NumStringBool.	
	
% bottomOut( InExpr ) -> 
% 	case InExpr of
% 		ExprFun when is_record(ExprFun, exprFun) ->
% 			case ExprFun#exprFun.bottom of
% 				undefined ->
% 					#exprFun{name=ExprFun#exprFun.name};
% 				_ ->
% 					ExprFun#exprFun.bottom
% 			end;
% 		ExprPointer when is_record(ExprPointer, cellPointer) ->
% 			Expr = cellStore:lookup(ExprPointer#cellPointer.name),
% 			case Expr#exprCell.bottom of 
% 				undefined ->
% 					Expr#exprCell.name;
% 				_ ->
% 					Expr#exprCell.bottom
% 			end;
% 		ExprApply when is_record(ExprApply, exprApply) ->
% 			ExprApply#exprApply{
% 				left = bottomOut(ExprApply#exprApply.left),
% 				right = bottomOut(ExprApply#exprApply.right)
% 			};
% 		ExprLambda when is_record(ExprLambda, exprLambda) ->
% 			ExprLambda#exprLambda{
% 				expr = bottomOut(ExprLambda#exprLambda.expr)
% 			};
% 		_ -> InExpr
% 	end.