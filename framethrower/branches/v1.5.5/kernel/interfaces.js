var interfaceInstantiators = {
	unit: function (a) {
		var cache;
		return {
			actions: {
				set: function (o) {
					if (o !== undefined) typeCheck(a, o);
					cache = o;
				}
			},
			addInform: function (pin) {
				pin.set(cache);
			},
			getState: function () {
				return cache;
			}
		};
	},
	set: function (a) {
		var cache = makeObjectHash();
		return {
			actions: {
				add: function (o) {
					typeCheck(a, o);
					cache.set(o, o);
				},
				remove: function (o) {
					typeCheck(a, o);
					cache.remove(o);
				}
			},
			addInform: function (pin) {
				cache.forEach(function (o) {
					pin.add(o);
				});
			},
			getState: function () {
				return cache.toArray();
			}
		};
	},
	list: function (a) {
		var cache = [];
		return {
			actions: {
				insert: function (o, index) {
					typeCheck(a, o);
					cache.splice(index, 0, o);
				},
				update: function (o, index) {
					typeCheck(a, o);
					cache[index] = o;
				},
				remove: function (index) {
					cache.splice(index, 1);
				}
			},
			addInform: function (pin) {
				cache.forEach(function (o, index) {
					pin.insert(o, index);
				});					
			},
			getState: function () {
				return cache;
			}
		};
	},
	assoc: function (a, b) {
		var cache = makeObjectHash();
		return {
			actions: {
				set: function (key, value) {
					typeCheck(a, key);
					typeCheck(b, value);
					cache.set(key, value);
				},
				remove: function (key) {
					typeCheck(a, key);
					cache.remove(key);
				}
			},
			addInform: function (pin) {
				cache.forEach(function (value, key) {
					pin.set(key, value);
				});
			},
			getState: function () {
				return cache.toObject();
			}
		};
	},
	tree: function (a) { //for now this can only have one copy of an object at a point in the tree. if an object is added twice, it is removed from it's original position
		var cache = makeObjectHash();
		var roots = makeObjectHash();
		
		var recurseAddInfom = function(o, pin){
			cache.get(o).children.forEach(function(child){
				pin.addChild(o, child);
				recurseAddInfom(child, pin);
			});
		};
		return {
			actions: {
				addRoot: function (o) {
					typeCheck(a, o);
					this.remove(o);
					roots.set(o, o);
					cache.set(o, {obj:o, children:makeObjectHash(), parent:null});
				},
				addChild: function (parent, o) {
					typeCheck(a, o);
					this.remove(o);
					cache.get(parent).children.set(o, o);
					cache.set(o, {obj:o, children:makeObjectHash(), parent:parent});
				},
				remove: function (o) {
					var oprev = cache.get(o);
					if(oprev){
						if(oprev.parent){
							cache.get(oprev.parent).children.remove(o);
						} else {
							roots.remove(o);
						}
						cache.remove(o);
					}
				}
			},
			addInform: function (pin) {
				roots.forEach(function (o){
					pin.addRoot(o);
					recurseAddInfom(o, pin);
				});
			},
			getState: function () {
				var retcache = cache.toArray();
				forEach(retcache, function(o) {
					o.children = o.children.toArray();
				});
				return {roots:roots.toArray(), cache:retcache};
			}
		};
	}
};


/*
interfaces are functions that take type(s) as arguments and return a new type
for example: interfaces.set(kernel.individual) is a type
interface types are special in that they have an instantiate method which is used by outputPins
*/

var interfaces = {};
forEach(interfaceInstantiators, function (interfaceInstantiate, name) {
	interfaces[name] = memoize(function () {
		var args = arguments;
		
		// makes the name = "interfaces.NAME(ARG1, ARG2, ...)"
		var intf = makeType("interface." + name + "(" + map(args, function (a) {return a.getName();}).join(", ") + ")");
		
		intf.instantiate = function () {
			return interfaceInstantiate.apply(null, args);
		};
		
		// these are just used for matching against
		intf.getConstructor = getter(interfaces[name]);
		intf.getArguments = getter(args);
		
		// checks that interfaceInstantiate (ie: the same type of interface) matches, and then matches the arguments
		intf.match = function (instanceType) {
			if (instanceType.getConstructor && instanceType.getConstructor() === intf.getConstructor()) {
				var instanceArgs = instanceType.getArguments();
				var myArgs = intf.getArguments();
				
				return all(myArgs, function (arg, i) {
					return arg.match(instanceArgs[i]);
				});
			} else {
				return false;
			}
		};
		
		return intf;
	});
	
	makeIded("interface", interfaces[name]);
});