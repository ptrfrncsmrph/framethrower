var DEBUG = true;

var xmlns = {
    f: "http://www.filmsfolded.com/xsl/ui",
    xsl: "http://www.w3.org/1999/XSL/Transform",
    html: "http://www.w3.org/1999/xhtml",
    svg: "http://www.w3.org/2000/svg",
	exsl: "http://exslt.org/common"
};

/* Put these in your root xml element

xmlns:f="http://www.filmsfolded.com/xsl/ui"
xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
xmlns:html="http://www.w3.org/1999/xhtml"
xmlns:svg="http://www.w3.org/2000/svg"

*/

function xpath(expression, parentElement){
    function nsResolver(prefix){
        return xmlns[prefix] || null;
    }
    var results = [];
    var parentDocument = parentElement.ownerDocument || parentElement;
    
    //if (firefox2) parentDocument=document;
    
    var query = parentDocument.evaluate(expression, parentElement, nsResolver, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
    for (var i = 0, length = query.snapshotLength; i < length; i++) {
        results.push(query.snapshotItem(i));
    }
    return results;
}

var emptyXPathResult = document.evaluate("*[1=0]", document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);


// useful for testing...
function loadXMLNow(url) {
	try {
		var req = new XMLHttpRequest();
		req.open("GET", url, false);
		req.send(null);
	} catch (e) {
		console.log("loadXMLNow failed: " + url);
	}

    return req.responseXML.firstChild;
}


function createDocument() {
	return document.implementation.createDocument("", "", null);
}




// Node -> (Node, {Node | String | Number} -> Node)
function compileXSL(xsl){
    if (xsl.nodeType === 9) 
        xsl = xsl.firstChild;
    
    // this is required for xpath's within the xsl (that use namespaces) to work correctly
    function addxmlns(xml){
        forEach(xmlns, function(uri, prefix){
            xml.setAttributeNS("http://www.w3.org/2000/xmlns/", "xmlns:" + prefix, uri);
        });
    }
    addxmlns(xsl);
    
	//for Safari, change each xsl:param to xsl:variable to extract the parameters from the source document
	var paramNodes = xpath("xsl:param", xsl);
	var templateNodes = xpath("xsl:template", xsl);
	var templateNode = templateNodes[0];
	
	forEach(paramNodes, function(paramNode) {
		var variableNode = document.createElementNS(xmlns.xsl, "variable");
		variableNode.setAttribute("name", paramNode.getAttribute("name"));
		variableNode.setAttribute("select", paramNode.getAttribute("name") + "/*");
		templateNode.insertBefore(variableNode, templateNode.firstChild);
		
		paramNode.parentNode.removeChild(paramNode);
	});
	
	//xsl.firstChild.appendChild();
	//xsl.firstChild.insertBefore(newnode, xsl.firstChild.firstChild);

    var p = new XSLTProcessor();
    
    // Compile
    try {
        p.importStylesheet(xsl);
    } 
    catch (e) {
        console.log("Compilation Error", xsl, e);
    }
    
    return function(source, params){
		// For Safari, add parameters to source document
		// Leave source alone if there are no params
		if(!isEmpty(params)){
			source = document.createElementNS("", "parameters");
		}

		forEach(params, function(value, param){
			if (value !== emptyXPathResult) {
				var argNode = document.createElementNS("", param);
				if(typeOf(value) == 'string'){
					value = document.createTextNode(value);
					document.adoptNode(value);
					var stringNode = document.createElementNS("", "string");
					stringNode.appendChild(value);
					value = stringNode;
				}
			
				document.adoptNode(value);
			
				argNode.appendChild(value);
				source.appendChild(argNode);
			}
        });
	
        // Set parameters for Firefox
/*
        forEach(params, function(value, param){
            p.setParameter(null, param, value);
        });
*/
        // Execute
        try {
			//XSLTProcessor doesn't do well with a node with no parent
			//so create a meaningless parent node and add source as a child
			if(!source.parentNode){
				var parent = document.createElementNS("","parent");
				parent.appendChild(source);
			}
            //var result = p.transformToFragment(source, document);
			var result = p.transformToDocument(source);
			if(DEBUG){
				var logs = xpath(".//f:consolelog", result.firstChild);
				forEach(logs, function (log) {
					console.log("debug output from xsl: ");
					console.dirxml(log);
				});
			}
        } 
        catch (e) {
            console.log("Execution Error", xsl, source, params, e, p);
        }
        
        // Clear parameters
        forEach(params, function(value, param){
            p.removeParameter(null, param);
        });

		console.log("SOURCE");
		console.log(source);
		
		document.adoptNode(source);
		document.getElementById("test").appendChild(source);

		console.log("XSL");
		console.log(xsl);
		
		document.adoptNode(xsl);
		document.getElementById("test").appendChild(xsl);


		console.log("RESULT");
		console.log(result.firstChild.localName);

		
/*
		document.adoptNode(result.firstChild);
		document.getElementById("test").appendChild(result.firstChild);
*/

        return result.firstChild;
    };
}


var onLoad = function(){
	var xsl = loadXMLNow('test.xsl');
	var xsl2 = loadXMLNow('test2.xsl');
	
	var compiled = compileXSL(xsl);
	var compiled2 = compileXSL(xsl2);
	
	var xml = loadXMLNow('sourcexml.xml');
	
	//var result = compiled2(xml, {});
	var result = compiled(xml, {});
	
	//var firstResult = compiled2(xml, {});
	//var result = compiled(firstResult, {});
	
	document.adoptNode(result);
	document.getElementById("test").appendChild(result);
	
};

onLoad();