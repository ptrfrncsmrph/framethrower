
// localIds.get() returns a unique Id
var localIds = function () {
	var count = 0;
	return {
		get: function () {
			count++;
			return "local" + count;
		}
	};
}();

// keeps a cache mapping serverIds to proxy processes,
// used to see if we already have a proxy process for a given serverId
var serverIds = {};



function genLinkQuery(from, type, to) {
	return {q: "links", from: from, type: type, to: to};
}

function stringify(query) {
	if (query.q === "content") {
		return "content" + query.of.getId();
	} else if (query.q === "links") {
		function maybeId(p) {
			if (p) {
				return p.getId();
			} else {
				return "";
			}
		}
		return "links," + maybeId(from) + "," + maybeId(type) + "," + maybeId(to);
	}
}


function locallyAnswerable(query) {
	if (query.q === "content") {
		if (query.of.local) {
			return true;
		} else {
			return false;
		}
	} else if(query.q === "links") {
		if (
				(query.from && query.from.isLocal()) ||
				(query.type && query.type.isLocal()) ||
				(query.to && query.to.isLocal()) ) {
			return true;
		} else {
			return false;
		}
	}
}



function makeProcess(initContent, serverId) {
	var process = {};
	
	
	var id, local;
	if (serverId) {
		if (serverIds[serverId]) {
			return serverIds[serverId];
		} else {
			serverIds[serverId] = process;
			id = serverId;
			local = false;
		}
	} else {
		id = localIds.get();
		local = true;
	}
	
	process.getId = function () {
		return id;
	};
	process.isLocal = function () {
		return local;
	};
	
	
	/*
	informs, hash, and serverHash take as keys query strings
	*/
	var informs = {};
	var hash = {};
	var serverHash = {};

	/*
	updates all listeners of a query to the new value of the query
	optionally takes a transform in which case only updates that transform
	*/
	function inform(query, transform) {
		var qs = stringify(query);
		var answer;
		if (query.q === "content") {
			answer = hash[qs];
		} else if (query.q === "links") {
			answer = merge(hash[qs], serverHash[qs]);
		}
		if (transform) {
			// inform the transform
		} else {
			forEach(informs[qs], function (transform) {
				// inform the transform
			});
		}
	}
	

	process.request = function (transform, query) {
		var qs = stringify(query);
		
		// add the transform to the informs record
		if (!informs[qs]) {
			informs[qs] = {};
		}
		informs[qs][transform.getId()] = transform;
		
		// determine if the query should be answered locally
		var answerLocally = locallyAnswerable(query);

		if (answerLocally) {
			if (!hash[qs]) {
				hash[qs] = {};
			}
		}
		
		
		if (answerLocally || serverHash[qs]) {
			// notify the transform immediately
			inform(query, transform);
		} else {
			// request the query from the server
			getQueryFromServer(query, function (answer) {
				serverHash[qs] = answer;
				inform(query);
			});
		}
	};
	
	
	// should only be used for queries that can be answered locally
	process.requestOnce = function(query) {
		var qs = stringify(query);
		if (!hash[qs]) {
			hash[qs] = {};
		}
		return hash[qs];
	};
	
	
	process.registerLink = function (query, link) {
		if (!hash[query]) {
			hash[query] = {};
		}
		hash[query][link.getId()] = link;
	};
	
	
	// debugging
	process.debug = function () {
		return {
			informs: informs,
			hash: hash,
			serverHash: serverHash
		};
	};
	
	return process;
}



// should only be called for making local links
function makeLink(from, type, to) {	
	// check if link already exists
	var existingLinks = values(from.requestOnce(genLinkQuery(from, type, to)));
	if (existingLinks.length > 0) {
		return existingLinks[0];
	}
	
	
	var link = makeProcess();
	link.getFrom = function () {
		return from;
	};
	link.getType = function () {
		return type;
	};
	link.getTo = function () {
		return to;
	};
	// overrides process's getContent..
	link.getContent = function () {
		// return XML..
	};
	
	
	// register the link where appropriate
	from.registerLink(genLinkQuery(from, null, null), link);
	from.registerLink(genLinkQuery(from, type, null), link);
	from.registerLink(genLinkQuery(from, null, to), link);
	from.registerLink(genLinkQuery(from, type, to), link);
	
	type.registerLink(genLinkQuery(null, type, null), link);
	
	to.registerLink(genLinkQuery(null, type, to), link);
	to.registerLink(genLinkQuery(null, null, to), link);
	
	return link;
}

function makeTransform() {
	var transform = makeLink();
	// ...
}
