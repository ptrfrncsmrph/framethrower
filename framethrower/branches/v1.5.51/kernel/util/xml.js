var xmlns = {
    f: "http://www.filmsfolded.com/xsl/ui",
    xsl: "http://www.w3.org/1999/XSL/Transform",
    html: "http://www.w3.org/1999/xhtml",
    svg: "http://www.w3.org/2000/svg"
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
    var req = new XMLHttpRequest();
	req.open("GET", url, false);
	req.send(null);
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
    
    var p = new XSLTProcessor();
    
    // Compile
    try {
        p.importStylesheet(xsl);
    } 
    catch (e) {
        console.log("Compilation Error", xsl, e);
    }
    
    return function(source, params){
        // Set parameters
        forEach(params, function(value, param){
            p.setParameter(null, param, value);
        });
        
        // Execute
        try {
			//XSLTProcessor doesn't do well with a node with no parent
			//so create a meaningless parent node and add source as a child
			if(!source.parentNode){
				var parent = document.createElementNS("","parent");
				parent.appendChild(source);
			}
            var result = p.transformToDocument(source);
        } 
        catch (e) {
            console.log("Execution Error", xsl, source, params, e);
        }
        
        // Clear parameters
        forEach(params, function(value, param){
            p.removeParameter(null, param);
        });
        
        return result.firstChild;
    };
}


//useful DOM function
function insertAfter (parent, newnode, insertafter) {
	if(insertAfter.nextSibling){
		parent.insertBefore(newnode, insertAfter.nextSibling);
	}else{
		parent.appendChild(newnode);
	}
}

function parseXML(s) {
	var firstTag = s.indexOf(">");
	var nsString = "";
	forEach(xmlns, function (ns, prefix) {
		nsString += ' xmlns:' + prefix + '="' + ns + '"';
	});
	s = s.substring(0, firstTag) + nsString + s.substring(firstTag);
	var parser = new DOMParser();
	return parser.parseFromString(s, "text/xml").firstChild;
}


