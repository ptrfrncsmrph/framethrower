(function () {
	
	
	var primFuncs = function () {
		function applyFunc(func, input) {
			return evaluate(makeApply(func, input));		
		}

		function applyAndInject(func, input, depender, inject) {
			return evaluateAndInject(makeApply(func, input), depender, inject);
		}	

		var bindUnitOrSetHelper = function (f, cell) {
			var outputCell = makeCell();

			cell.inject(outputCell, function (val) {
				return applyAndInject(f, val, outputCell, function (innerVal) {
					return outputCell.addLine(innerVal);
				});
			});

			return outputCell;
		};

		var rangeHelper = function (outputCell, setRangeFunc, startCell, endCell, cell) {
			outputCell.makeSorted();
			var start;
			var end;

			var updateRange = function () {
				if (start != undefined && end != undefined) {
					setRangeFunc(start, end);
				} else if (start == undefined && end == undefined) {
					outputCell.clearRange();
				}
			};
			outputCell.leash();
			startCell.inject(outputCell, function(val) {
				start = val;
				updateRange();
				return function () {
					start = undefined;
					updateRange();
				};
			});
			endCell.inject(outputCell, function(val) {
				end = val;
				updateRange();
				return function () {
					end = undefined;
					updateRange();
				};
			});
			cell.inject(outputCell, function (val) {
				return outputCell.addLine(val);
			});
			outputCell.unleash();
			return outputCell;
		};

		return {
			// ============================================================================
			// Monadic Operators
			// ============================================================================
		 	returnUnit : {
				type : "a -> Unit a",
				func : function (val) {
					var outputCell = makeCell();
					outputCell.addLine(val);
					outputCell.setDone();
					return outputCell;
				}
			},
			returnFuture : { // TODO: test this, merge code with returnUnit
				type : "a -> Future a",
				func : function (val) {
					var outputCell = makeCell();
					outputCell.addLine(val);
					outputCell.setDone();
					return outputCell;
				}
			},
		 	returnUnitSet : {
				type : "Unit a -> Set a",
				func : function (cell) {
					var outputCell = makeCell();
					cell.inject(outputCell, function (val) {
						return outputCell.addLine(val);
					});
					return outputCell;
				}
			},
			returnUnitMap : {
				type : "a -> Unit b -> Map a b",
				func : function (key, cell) {
					var outputCell = makeCellMapInput();
					cell.inject(outputCell, function (val) {
						return outputCell.addLine({key:key, val:val});
					});
					return outputCell;
				}
			},
			returnFutureUnit : {
				type : "Future a -> Unit a",
				func : function (cell) {
					var outputCell = makeCell();
					cell.inject(outputCell, function(val) {
						outputCell.addLine(val);
					});
					return outputCell;
				}
			},
		 	bindUnit : {
				type : "(a -> Unit b) -> Unit a -> Unit b",
				func : bindUnitOrSetHelper
			},
		 	bindSet : {
				type : "(a -> Set b) -> Set a -> Set b",
				func : bindUnitOrSetHelper
			},
		 	bindMap : {
				type : "(a -> b -> Map a c) -> Map a b -> Map a c",
				func : function (f, cell) {
					var outputCell = makeCellMapInput();

					cell.inject(outputCell, function (keyVal) {
						return applyAndInject(applyFunc(f, keyVal.key), keyVal.val, outputCell, function (innerKeyVal) {
							return outputCell.addLine(innerKeyVal);
						});
					});

					return outputCell;
				}
			},
			bindFuture : {
				type : "(a -> Future b) -> Future a -> Future b",
				func : function (f, cell) {
					var outputCell = makeCell();

					cell.inject(outputCell, function (val) {
						return applyAndInject(f, val, outputCell, function (innerVal) {
							outputCell.addLine(innerVal);
						});
					});
					return outputCell;
				}
			},
			// ============================================================================
			// Set utility functions
			// ============================================================================		
			union : {
				type : "Set a -> Set a -> Set a",
				func : function (cell1, cell2) {
					var outputCell = makeCell();
					outputCell.leash();
					cell1.inject(outputCell, function (val) {
						return outputCell.addLine(val);
					});
					cell2.inject(outputCell, function (val) {
						return outputCell.addLine(val);
					});
					outputCell.unleash();
					return outputCell;
				}
			},
			setDifference : {
				type : "Set a -> Set a -> Set a",
				func : function (cell1, cell2) {
					var outputCell = makeCell();
					var countHash = {};

					var add = function (count, value) {
						count.num++;
						if (count.num == 1) count.onRemove = outputCell.addLine(value);					
					};

					var sub = function (count) {
						count.num--;
						if(count.num == 0) count.onRemove();
					};

					var getOrMake = function (value) {
						if (countHash[value] === undefined) {
							countHash[value] = {num:0};
						}
						return countHash[value];
					};
					outputCell.leash();
					cell1.inject(outputCell, function (value) {
						var count = getOrMake(value);
						add(count, value);
						return function () {
							sub(count);
						};
					});
					cell2.inject(outputCell, function (value) {
						var count = getOrMake(value);
						sub(count);
						return function () {
							add(count, value);
						};
					});
					outputCell.unleash();
					return outputCell;
				}
			},
			takeOne : {
				type : "Set a -> Unit a",
				func : function (cell) {
					var outputCell = makeCell();
					var cache;

					cell.inject(outputCell, function (val) {
						if (cache === undefined) {
							outputCell.addLine(val);
							cache = val;
						}
						return function () {
							if (cache === val) {
								outputCell.removeLine(val);
								cache = cell.getState()[0];
								if (cache !== undefined) {
									outputCell.addLine(cache);
								}
							}
						};
					});

					return outputCell;
				}
			},

			// ============================================================================
			// Bool utility functions
			// ============================================================================

			boolToUnit : {
				type : "Bool -> Unit Null",
				func : function (val) {
					var outputCell = makeCell();
					if (val) {
						outputCell.addLine(nullObject);
						outputCell.setDone();
					}
					return outputCell;
				}
			},

			// ============================================================================
			// Other functions?
			// ============================================================================
			// Just for Testing!!
			// takes a number x, and returns a set with 1,2..x
			oneTo : {
				type : "Number -> Set Number",
				func : function (val1) {
					var outputCell = makeCell();
					for(var i=1; i<= val1; i++) {
						outputCell.addLine(i);
					}
					outputCell.setDone();
					return outputCell;
				}
			},
			oneToMap : {
				type : "Number -> Number -> Map Number Number",
				func : function (val1, val2) {
					var outputCell = makeCellMapInput();
					for(var i=1; i<= val1; i++) {
						outputCell.addLine({key:i, val:val2});
					}
					outputCell.setDone();
					return outputCell;
				}
			},
		 	reactiveApply : {
				type : "Unit (a -> b) -> a -> Unit b",
				func : function (cell, input) {
					var outputCell = makeCell();
					cell.inject(outputCell, function (val) {
						return outputCell.addLine(applyFunc(val, input));
					});
					return outputCell;
				}
			},
			mapUnit2 : {
				type : "(a -> b -> c) -> Unit a -> Unit b -> Unit c",
				func : function(func, cell1, cell2) {
					return mapUnitJS(function (x, y) {
						return evaluate(makeApply(makeApply(func, x), y));
					})(cell1, cell2);
				}
			},

			// ============================================================================
			// Null Type Functions
			// ============================================================================
			reactiveNot: {
				type: "Unit a -> Unit Null", // TODO: change this type (from Unit Null -> Unit Null) server-side...
				func: function (cell) {
					var outputCell = makeCell();
					outputCell.addLine(nullObject);
					cell.inject(outputCell, function (val) {
						outputCell.removeLine(nullObject);
						return function() {
							outputCell.addLine(nullObject);
						};
					});
					return outputCell;
				}
			},
			reactiveAnd: {
				type: "Unit Null -> Unit Null -> Unit Null",
				func: function (cell1, cell2) {
					var bool1 = false;
					var bool2 = false;
					var isSet = false;
					var outputCell = makeCell();

					function updateOutputCell() {
						if (bool1 && bool2 && !isSet) {
							outputCell.addLine(nullObject);
							isSet = true;
						} else if (isSet) {
							outputCell.removeLine(nullObject);
							isSet = false;
						}
					}
					outputCell.leash();
					cell1.inject(outputCell, function (val) {
						bool1 = true;
						updateOutputCell();
						return function () {
							bool1 = false;
							updateOutputCell();
						};
					});
					cell2.inject(outputCell, function (val) {
						bool2 = true;
						updateOutputCell();
						return function () {
							bool2 = false;
							updateOutputCell();
						};
					});
					outputCell.unleash();
					return outputCell;
				}
			},
			reactiveOr: {
				type: "Unit Null -> Unit Null -> Unit Null",
				func: function (cell1, cell2) {
					var bool1 = false;
					var bool2 = false;
					var isSet = false;
					var outputCell = makeCell();

					function updateOutputCell() {
						if ((bool1 || bool2) && !isSet) {
							outputCell.addLine(nullObject);
							isSet = true;
						} else if (!bool1 && !bool2 && isSet) {
							outputCell.removeLine(nullObject);
							isSet = false;
						}
					}
					outputCell.leash();
					cell1.inject(outputCell, function (val) {
						bool1 = true;
						updateOutputCell();
						return function () {
							bool1 = false;
							updateOutputCell();
						};
					});
					cell2.inject(outputCell, function (val) {
						bool2 = true;
						updateOutputCell();
						return function () {
							bool2 = false;
							updateOutputCell();
						};
					});
					outputCell.unleash();
					return outputCell;				
				}
			},
			defaultValue: {
				type: "a -> Unit a -> Unit a",
				func: function (defaultValue, cell) {
					// TODO: add this server-side
					var outputCell = makeCell();
					var current = defaultValue;
					outputCell.addLine(defaultValue);
					cell.inject(outputCell, function (val) {
						outputCell.removeLine(current);
						current = val;
						outputCell.addLine(current);
						return function () {
							outputCell.removeLine(current);
							current = defaultValue;
							outputCell.addLine(current);
						};
					});
					return outputCell;
				}
			},
			reactiveIfThen: {
				type: "Unit a -> b -> b -> Unit b",
				func: function (predicate, consequent, alternative) {
					var outputCell = makeCell();
					outputCell.addLine(alternative);
					predicate.inject(outputCell, function (val) {
						outputCell.removeLine(alternative);
						outputCell.addLine(consequent);
						return function () {
							outputCell.removeLine(consequent);
							outputCell.addLine(alternative);
						};
					});
					return outputCell;
				}
			},
			isEmpty: {
				type: "Set a -> Unit Null",
				func: function (cell) {
					var outputCell = makeCell();
					var count = 0;
					outputCell.addLine(nullObject);

					cell.inject(outputCell, function (val) {
						if (count === 0) outputCell.removeLine(nullObject);
						count++;
						return function() {
							count--;
							if (count === 0) outputCell.addLine(nullObject);
						};
					});
					return outputCell;				
				}
			},
			getPosition: {
				type: "a -> Set a -> Unit Number", // TODO: add to server
				func: function (element, cell) {
					var outputCell = makeCell();

					cell.makeSorted();

					var current = null;
					function update() {
						var a = cell.getState();
						var found = false;
						forEach(a, function (x, i) {
							if (x === element) {
								found = true;
								if (current !== i) {
									if (current !== null) {
										outputCell.removeLine(current);						
									}
									outputCell.addLine(i);
									current = i;								
								}
							}
						});
						if (!found) {
							if (current !== null) {
								outputCell.removeLine(current);
								current = null;
							}
						}
					}
					cell.inject(outputCell, function (val) {
						update();
						return update;
					});
					return outputCell;
				}
			},
			gate: {
				type: "Unit b -> a -> Unit a",
				func: function (gatekeeper, passer) {
					// if gatekeeper is set, send passer through
					// if gatekeeper is empty, output is empty
					var bool1 = false;
					var isSet = false;
					var outputCell = makeCell();

					function updateOutputCell() {
						if (bool1 && !isSet) {
							outputCell.addLine(passer);
							isSet = true;
						} else if (!bool1 && isSet) {
							outputCell.removeLine(passer);
							isSet = false;
						}
					}

					gatekeeper.inject(outputCell, function (val) {
						bool1 = true;
						updateOutputCell();
						return function () {
							bool1 = false;
							updateOutputCell();
						};
					});

					return outputCell;
				}
			},

			// 	 	any : {
			// 	type : "(a -> Unit Bool) -> Set a -> Unit Bool",
			// 	func : function (f, cell) {
			// 		var outputCell = makeCell();
			// 		var count = 0;
			// 		outputCell.addLine(false);
			// 
			// 		cell.inject(outputCell, function (val) {
			// 			return applyAndInject(f, val, outputCell, function (innerVal) {
			// 				if (innerVal) {
			// 					if (count == 0) {
			// 						outputCell.removeLine(false);
			// 						outputCell.addLine(true);
			// 					}
			// 					count++;
			// 					return function () {
			// 						count--;
			// 						if (count == 0) {
			// 							outputCell.removeLine(true);
			// 							outputCell.addLine(false);
			// 						}
			// 					};
			// 				}
			// 			});
			// 		});
			// 		
			// 		return outputCell;
			// 	}
			// },
			fold : {
				//type : "(a -> b -> b) -> (b -> a -> a) -> b -> Set a -> Unit b",
				type : "(a -> b -> b) -> (a -> b -> b) -> b -> Set a -> Unit b",
				func : function (f, finv, init, cell) {
					var outputCell = makeCell();
					var cache = init;
					outputCell.addLine(cache);

					cell.inject(outputCell, function (val) {
						outputCell.removeLine(cache);
						cache = applyFunc(applyFunc(f, val), cache);
						outputCell.addLine(cache);
						return function () {
							outputCell.removeLine(cache);
							//cache = applyFunc(applyFunc(finv, cache), val);
							cache = applyFunc(applyFunc(finv, val), cache);
							outputCell.addLine(cache);
						};
					});

					return outputCell;
				}
			},
			unfoldSet : {
				type : "(a -> Set a) -> a -> Set a",
				func : function (f, init) {
					var outputCell = makeCell();

					outputCell.addLine(init);
					//TODO: make this inject more like the erlang version
					outputCell.inject(function(){}, function (val) {
						return applyAndInject(f, val, outputCell, function (innerVal) {
							return outputCell.addLine(innerVal);
						});
					});

					return outputCell;
				}
			},
			unfoldMap : {
				type : "(a -> Set a) -> a -> Map a Number",
				func : function (f, init) {
					var outputCell = makeCellMapInput();

					outputCell.addLine({key:init, val:0});
					//TODO: make this inject more like the erlang version
					outputCell.inject(function(){}, function (keyVal) {
						return applyAndInject(f, keyVal.key, outputCell, function (val) {
							return outputCell.addLine({key:val, val:keyVal.val+1});
						});
					});

					return outputCell;
				}
			},
			// ============================================================================
			// Map functions
			// ============================================================================
			buildMap : {
				type : "(a -> b) -> Set a -> Map a b",
				func : function (f, cell) {
					var outputCell = makeCellMapInput();

					cell.inject(outputCell, function (val) {
						var result = applyFunc(f, val);
						return outputCell.addLine({key:val, val:result});
					});

					return outputCell;
				}
			},
			invert : {
				type : "Map a (Set b) -> Map b (Set a)",
				func : function (cell) {
					var setType = GLOBAL.typeCheck ? buildType(getType(cell), "Map a (Set b)", "Set a") : undefined;

					var outputCell = makeCellMapInput();
					var bHash = makeObjectHash();

					var bHashCell = makeCell();

					//this is to make outputCell depend on BHashCell for being 'done' 
					bHashCell.inject(outputCell, function (bValue) {});

					bHashCell.inject(
						function() {
							bHash.forEach(function(bCell) {
								bCell.setDone();
							});
						},
						function (bValue) {
							var newCell = makeCell();
							newCell.type = setType;
							bHash.set(bValue, newCell);
							var onRemove = outputCell.addLine({key:bValue, val:newCell});
							return function () {
								bHash.remove(bValue);
								onRemove();
							};
						}
					);

					cell.inject(outputCell, function (keyVal) {
						return keyVal.val.inject(bHashCell, function (innerVal) {
							var onRemove1 = bHashCell.addLine(innerVal);
							var onRemove2 = bHash.get(innerVal).addLine(keyVal.key);
							return function () {
								onRemove2();
								onRemove1();
							};
						});
					});

					return outputCell;
				}
			},
			mapMapValue : {
				type : "(a -> b) -> Map c a -> Map c b",
				func : function (f, cell) {
					var outputCell = makeCellMapInput();

					cell.inject(outputCell, function (keyVal) {
						var result = applyFunc(f, keyVal.val);
						return outputCell.addLine({key:keyVal.key, val:result});
					});

					return outputCell;
				}
			},
			getKey : {
				type : "a -> Map a b -> Unit b",
				func : function (key, cell) {
					var outputCell = makeCell();

					cell.inject(outputCell, function (keyVal) {
						if (keyVal.key == key) {
							return outputCell.addLine(keyVal.val);
						}
					});

					return outputCell;
				}
			},
			keys : {
				type : "Map a b -> Set a",
				func : function (cell) {
					var outputCell = makeCell();

					cell.inject(outputCell, function (keyVal) {
						return outputCell.addLine(keyVal.key);
					});

					return outputCell;
				}
			},
			// ============================================================================
			// Range/Sorted functions
			// ============================================================================
			rangeByKey : {
				type : "Unit a -> Unit a -> Set a -> Set a",
				func : function (startCell, endCell, cell) {
					var outputCell = makeCell();
					return rangeHelper(outputCell, outputCell.setKeyRange, startCell, endCell, cell);
				}
			},
			rangeByPos : {
				type : "Unit Number -> Unit Number -> Set a -> Set a",
				func : function (startCell, endCell, cell) {
					var outputCell = makeCell();
					return rangeHelper(outputCell, outputCell.setPosRange, startCell, endCell, cell);
				}
			},
			rangeMapByKey : {
				type : "Unit Number -> Unit Number -> Map a b -> Map a b",
				func : function (startCell, endCell, cell) {
					var outputCell = makeCellAssocInput();
					return rangeHelper(outputCell, outputCell.setKeyRange, startCell, endCell, cell);
				}
			},
			rangeMapByPos : {
				type : "Unit Number -> Unit Number -> Map a b -> Map a b",
				func : function (startCell, endCell, cell) {
					var outputCell = makeCellAssocInput();
					return rangeHelper(outputCell, outputCell.setPosRange, startCell, endCell, cell);
				}
			},
			takeLast : {
				type : "Set a -> Unit a",
				func : function (cell) {
					cell.makeSorted();
					var outputCell = makeCell();
					var cache;
					function update() {
						var state = cell.getState();
						var last = state[state.length-1];
						if(cache !== last) {
							if (cache !== undefined) outputCell.removeLine(cache);
							cache = last;
							outputCell.addLine(cache);
						}					
					}
					update();

					cell.inject(outputCell, function (val) {
						update();
						return update;
					});
					return outputCell;
				}
			}
		};
	}();






	forEach(primFuncs, function (primFunc, name) {
		addFun(name, primFunc.type, primFunc.func);
	});

	
	
})();