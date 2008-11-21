/*
An Expr is any one of the following:
	* Number, String, Bool
	* Fun
	* StartCap - TODO
	* ScafOb - TODO
	* Var
	*	{
			kind: "cons",
			cons: "apply",
			left: Expr,
			right: Expr
		}
	*	{
			kind: "cons",
			cons: "lambda",
			left: Var,
			right: Expr
		}

A Var is:
	{
		kind: "var",
		value: String
	}
*/



function makeVar(name) {
	return {kind: "var", value: name};
}
function makeCons(cons, left, right) {
	return {kind: "cons", cons: cons, left: left, right: right};
}
function makeApply(left, right) {
	// We can put a typechecker here...
	return makeCons("apply", left, right);
}
function makeLambda(left, right) {
	return makeCons("lambda", left, right);
}

function parseExpr(s) {
	/*
	Takes in a string and returns an Expr.
	After parsing the string to an AST,
		for each word we look it up in baseEnv
		for each apply we make the appropriate apply Expr
		for each lambda we make the appropriate lambda Expr
	*/
	
	function helper(ast, env) {
		if (typeOf(ast) === "string") {
			return env(ast);
		} else if (ast.cons === "lambda") {
			var name = ast.left;
			var v = makeVar(name);
			return makeLambda(v, helper(ast.right, envAdd(env, name, v)));
		} else if (ast.cons === "apply") {
			return makeApply(helper(ast.left, env), helper(ast.right, env));
		}
	}
	return helper(parse(s), baseEnv);
}

function unparseExpr(expr) {
	function helper(expr) {
		if (expr.kind === "cons") {
			return {
				cons: expr.cons,
				left: helper(expr.left),
				right: helper(expr.right)
			};
		} else if (expr.kind === "var") {
			return expr.value;
		} else if (expr.stringify) { // replace all this stuff with stringify()...
			return expr.stringify;
		} else {
			return expr.toString();
		}
	}
	return unparse(helper(expr));
}


function normalizeVariables(expr, prefix) {
	/*
	Takes in a closed Expr and returns it back but with every lambda's parameter renamed in a standard way
		Properties:
			Every lambda expression will have a unique parameter name
			normalizeVariables will return the same thing on any Expr's that are "alpha-equivalent" (equivalent up to variable names)
		Optional parameter prefix: will name variables starting with this prefix, default is "x"
	*/
	
	function helper(expr, nameGen, env) {
		if (expr.kind === "cons") {
			if (expr.cons === "apply") {
				return makeApply(helper(expr.left, nameGen, env), helper(expr.right, nameGen, env));
			} else if (expr.cons === "lambda") {
				var newVar = makeVar(nameGen());
				var newEnv = envAdd(env, expr.left.value, newVar);
				return makeLambda(newVar, helper(expr.right, nameGen, newEnv));
			}
		} else if (expr.kind === "var") {
			return env(expr.value);
		} else {
			return expr;
		}
	}
	
	if (!prefix) prefix = "x";
	return helper(expr, makeGenerator(prefix), emptyEnv);
}


function betaReplace(expr, name, replaceExpr) {
	// replaces all Var's with (.value == name) with replaceExpr in expr
	// this should only be called if expr and replaceExpr share no variable names (to avoid collisions)
	if (expr.kind === "var" && expr.value === name) {
		return replaceExpr;
	} else if (expr.kind === "cons") {
		return makeCons(expr.cons, betaReplace(expr.left, name, replaceExpr), betaReplace(expr.right, name, replaceExpr));
	} else {
		return expr;
	}
}

function betaReduce(expr) {
	// applies beta reduction wherever possible in an Expr
	// this should only be called on Expr's with normalized variables (to avoid collisions)
	if (expr.kind === "cons") {
		if (expr.cons === "apply") {
			var fun = betaReduce(expr.left);
			var input = betaReduce(expr.right);
			if (fun.cons === "lambda") {
				// we can do a beta reduction here
				return betaReduce(betaReplace(fun.right, fun.left.value, input));
			} else {
				return makeApply(fun, input);
			}
		} else if (expr.cons === "lambda") {
			return makeLambda(expr.left, betaReduce(expr.right));
		}
	} else {
		return expr;
	}
}

function normalizeExpr(expr) {
	return normalizeVariables(betaReduce(normalizeVariables(expr)));
}

