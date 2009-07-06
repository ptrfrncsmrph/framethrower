//ConSortedSet


var scount = 0;

function makeConSortedSet(compFunc) {
	var hash = makeOhash();
	var css = {};
	
	css.set = function (key, value) {
		hash.set(key, value);
	};
	css.get = function (key) {
		return hash.get(key);
	};
	css.remove = function (key) {
		hash.remove(key);
	};

	css.length = hash.length;
	css.forEach = function (f) {
		return hash.forEach(f);
	};
	
	css.toArray = function () {
		var retArray = [];
		hash.forEach(function(val, key) {
			retArray.push({k:key, v:val});
		});
		return retArray;
	};
	
	css.debug = function () {
		return hash;
	};

	var sorted = [];

	function lookup(start, end, key) {
		if (start === end) {
			return [false, start];
		} else {
			var halfway = start + Math.floor((end - start) / 2);
			var cmp = compFunc(sorted[halfway].k, key);
			if (cmp === 0) {
				return [true, halfway];
			} else if (cmp < 0) {
				return lookup(halfway + 1, end, key);
			} else {
				return lookup(start, halfway, key);
			}
		}
	}

	css.makeSorted = function() {
		css.forEach(function (val, key) {
			sorted.push({k:key, v:val});
		});
		sorted.sort(function(a, b) {
			return compFunc(a.k, b.k);
		});
		
		css.set = function(key, value) {
			var len = sorted.length;
			var l = lookup(0, len, key);
			var found = l[0];
			var index = l[1];
			if (found === true) {
				sorted[index].v = value;
			} else {
				var insert = {k:key, v:value};
				if (index === len) {
					sorted.push(insert);
				} else {
					sorted.splice(index, 0, insert);
				}
			}
			hash.set(key, value);
		};
		
		css.remove = function(key) {
			var l = lookup(0, sorted.length, key);
			if (l[0] === true) {
				sorted.splice(l[1], 1);
			}
			delete hash[key];
		};
		css.getIndex = function (key) {
			var len = sorted.length;
			var l = lookup(0, len, key);
			var found = l[0];
			var index = l[1];
			if (found) return index;
			else {
				return undefined;
			}
		};
		css.getByIndex = function (ind) {
			return sorted[ind].v;
		};
		css.getKeyByIndex = function (ind) {
			return sorted[ind].k;
		};
		css.forEach = function (f) {
			return sorted.forEach(function(keyVal, pos) {
				f(keyVal.v, keyVal.k);
			});
		};
		css.toArray = function () {
			return sorted;
		};
		css.debug = function () {
			return sorted;
		};
		css.makeSorted = function () {};
	};


	return css;
}

function makeConSortedSetNumbers() {
	return makeConSortedSet(function (a, b) {
		if (a < b) return -1;
		else if (a === b) return 0;
		else return 1;	
	});
}

// I've changed this so that it sorts numbers correctly also. Maybe we should remove the above function? -Toby
function makeConSortedSetStringify() {
	return makeConSortedSet(function (a, b) {
		var sa, sb;
		if (typeOf(a) === "number") {
			sa = a;
			sb = b;
		} else {
			sa = stringify(a);
			sb = stringify(b);
		}
		if (sa < sb) return -1;
		else if (sa === sb) return 0;
		else return 1;
	});
}