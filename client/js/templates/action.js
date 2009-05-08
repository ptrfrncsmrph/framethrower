/*


So we can take an actionCode (this is just like a templateCode) and make a closure in a similar way.

Such a closure is then a function which returns an Action.

An Action consists of a list of Instructions and an (optional) output.

ACTION
	{kind: "action", instructions: [INSTRUCTION], output?: ACTIONREF}

INSTRUCTION
	INSTRUCTIONCREATE | INSTRUCTIONUPDATE

INSTRUCTIONCREATE
	{kind: "instructionCreate", type: TYPE, prop: {PROPERTYNAME: ACTIONREF}, name: ACTIONVARTOCREATE} |

INSTRUCTIONUPDATE
	{kind: "instructionUpdate", target: ACTIONREF, actionType: "add" | "remove", key?: ACTIONREF, value?: ACTIONREF}

ACTIONREF
	{kind: "actionRef", name: ACTIONVAR, type: TYPE} |
	{kind: "actionRef", left: OBJECTFUN, right: ACTIONREF} |
	OBJECT/CELL/LITERAL


*/

function makeActionRef(name, type) {
	return {kind: "actionRef", name: name, type: type};
}

function makeActionClosure(actionCode, env) {
	var params = actionCode.params;
	//var type = actionCode.type;
	var type = parseType(actionCode.type);
	
	var f = curry(function () {
		var scope = {};
		var args = arguments;
		forEach(params, function (param, i) {
			scope[param] = args[i];
		});
		var envWithParams = extendEnv(env, scope);
		
		/* note that for actions, there is an ordering and you can't refer to your lets out of order,
		so we're just going to be adding to scope here and using envWithParams
		instead of the mutual recursion in normal makeClosure() */
		
		var instructions = [];
		var output;
		
		forEach(actionCode.actions, function (actionLet) {
			var action = actionLet.action;
			var result;
			if (action.kind === "actionCreate") {
				var created = {
					kind: "instructionCreate",
					type: parseType(action.type),
					prop: map(action.prop, function (expr) {
						return evaluate(parseExpression(parse(expr), envWithParams));
					}),
					name: localIds()
				};
				instructions.push(created);
				result = makeActionRef(created.name, created.type);
			} else if (action.kind === "actionUpdate") {
				instructions.push({
					kind: "instructionUpdate",
					target: evaluate(parseExpression(parse(action.target), envWithParams)),
					actionType: action.actionType,
					key: action.key ? evaluate(parseExpression(parse(action.key), envWithParams)) : undefined,
					value: action.value ? evaluate(parseExpression(parse(action.value), envWithParams)) : undefined
				});
			} else {
				var evaled = evaluateLine(action, envWithParams);
				if (evaled.kind === "action") {
					instructions = instructions.concat(evaled.instructions);
					result = evaled.output;
				} else {
					result = evaled;
				}
			}
			
			if (result && actionLet.name) {
				scope[actionLet.name] = result;
			}
			output = result;
		});
		
		var ret = {
			kind: "action",
			instructions: instructions,
			output: output,
			type: actionType,
			remote: 2
		};
		console.log("made an action", ret);
		lastAction = ret;
		return ret;
	}, params.length);
	
	if (params.length > 0) {
		return makeFun(type, f);
	} else {
		return f;
	}
}

var lastAction;

function executeAction(action) {
	var scope = {};
	
	var processActionRef = function(actionRef) {
		if (actionRef.kind === "actionRef") {
			if (actionRef.name !== undefined) {
				//{kind: "actionRef", name: ACTIONVAR, type: TYPE}
				var avar = scope[actionRef.name];
				//DEBUG
				if (avar == undefined) {
					debug.error("Variable used in action not found in action scope, Variable Name: " + actionRef.name);
				}
				return avar;
			} else if (actionRef.left !== undefined) {
				//{kind: "actionRef", left: OBJECTFUN, right: ACTIONREF}
				var objectFun = actionRef.left;
				var input = processActionRef(actionRef.right);
				//TODO: check evaluate and makeapply syntax
				return evaluate(makeApply(objectFun, input));
			}
		} else {
			//OBJECT/CELL/LITERAL
			return actionRef;
		}
	};
	
	
	forEach(action.instructions, function(instruction) {
		if (instruction.kind === "instructionCreate") {
			var processedProp = {};
			forEach(instruction.prop, function(property, propName) {
				processedProp[propName] = processActionRef(property);
			});
			
			var made = objects.make(instruction.type.value, processedProp);
			if (instruction.name !== undefined) {
				scope[instruction.name] = made;
			}
		} else if (instruction.kind === "instructionUpdate") {
			var target = processActionRef(instruction.target);
			var key, value;
			if (instruction.key !== undefined) {
				key = processActionRef(instruction.key);
			}
			if (instruction.value !== undefined) {
				value = processActionRef(instruction.value);
			}
			//DEBUG
			if (target.control === undefined) {
				debug.error("Trying to do action update on non-controlled cell: " + target);
			} else {
				target.control[instruction.actionType](key, value);
			}
		}
	});
}




function intact(object, property, action, key, value) {
	// params has properties key and value, or just key
	objects.actOnProp(property, object, action, key, value);
	//object.prop[property].control[action](key, value);
}