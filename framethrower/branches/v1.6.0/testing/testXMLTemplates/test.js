var x;
var c;
var xsl;

/*documents.withDoc("testing/testXMLTemplates/xmlTemplate.xml", function (xt) {
	x = xt;
	xsl = makeXSLFromTemplate(x);
	debug.xml(xsl.ss);
	debug.log(xsl.varNames);
});*/


var cell = makeControlledCell("Map Number String");

cell.control.add(7, "hello");
cell.control.add(6, "goodbye");


/*
function init() {
	var thunks = xpath("//f:thunk", document.body);
	
	var t = thunks[0];
	console.log(t);
	//console.log(getThunkEssence(t));
	
	evalThunk(t, {baseUrl: "", ids: {testCell: cell}, tunnelEnv: emptyEnv});
	
}
*/

function init() {
	var thunkNode = xpath("//f:thunk", document.body)[0];
	
	var te = getThunkEssence(thunkNode, "", {testCell: cell});
	console.log("thunk essence", te);
	console.log("compare", compareThunkEssences(te, te));
	
	/*makeTemplateFunFromUrl("testing/testXMLTemplates/xmlTemplate.xml", function (fun) {
		var e = makeApply(makeApply(fun.fun, 6), 222);
		
		evaluateAndInject(e, function (xmlids) {
			thunkNode.parentNode.replaceChild(xmlids.xml, thunkNode);
			thunkNode = xmlids.xml;
		});
		
	});*/
	
	evalThunk(thunkNode, "", {testCell: cell});
}


function test1() {
	cell.control.remove(6);
	refreshScreen();
}
function test2() {
	cell.control.add(2,"new");
	refreshScreen();
}