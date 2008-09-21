console.log("iw", importWorld);

var world = importWorld.importWorld(loadXMLNow(ROOTDIR + "xml/import/world2.xml"));

var PREDEF = world;

var rw = world.rw;

var zui = layout.zui.make();
zui.control.focus.set(rw);
zui.control.properties.set(parseXML("<zui view='situation' childrenSidebar='1' />"));


var mainAmbient = makeAmbient();

processAllThunks(mainAmbient, document.getElementById("html_mainscreen"), {
	rw: rw,
	zui: zui,
	"uiStartCaps.windowSizeWidth": uiStartCaps.windowSizeWidth,
	"uiStartCaps.windowSizeHeight": uiStartCaps.windowSizeHeight
}, "");


/*var test = deriveForEach(rw.get.childObjects(), function (o) {
	return o.get.parentSituation();
}, kernel.situation);*/

//var test = deriveNonEmpty(rw.get.childObjects());

//var test = deriveSort(rw.get.childObjects());
//var test2 = deriveLimit(test);

//var ec = makeSimpleEndCap(mainAmbient, endCaps.log.list("test output"), test2);