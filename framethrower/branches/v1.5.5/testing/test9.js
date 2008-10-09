
var world = importWorld.importWorld(loadXMLNow(ROOTDIR + "xml/import/world2.xml"));

var PREDEF = world;

var rw = world.rw;


//make a corresponds anchor in ONT
var anchor = actions.makeIndividual(world.rw);
anchor.control.content.set('Test Anchor');

//make a corresponds infon between missRobinson and the anchor
var cor1 = actions.makeInfon(world.rw, world.corresponds, {corresponder:world.missRob, anchor:anchor});

//make a corresponds infon between crazyMissRobinson and the anchor
var cor2 = actions.makeInfon(world.rw, world.corresponds, {corresponder:world.crazyMissRob, anchor:anchor});


// Video Timeline
var embedVideo = layout.embedVideo.make();

var singin = layout.video.make();
singin.control.src.set(ROOTDIR + "images/videos/Singin%27%20in%20the%20Rain-Lowest.mp4");
singin.control.aspect.set(1.2958);
singin.control.duration.set(6163.96);

var videoTimeline = layout.videoTimeline.make();
videoTimeline.control.embedVideo.set(embedVideo);

videoTimeline.control.video.set(singin);

videoTimeline.control.zoomWidth.set(15000);



var panelLayer = layout.panelLayer.make();
panelLayer.control.properties.set(parseXML("<panelLayer addObject='0' addCorresponds='0' addInfon='0'/>"));
panelLayer.control.addFocus.set(rw);

panelLayer.control.videoTimelines.append(videoTimeline);

var addPanel = layout.addPanel.make();
addPanel.control.properties.set(parseXML("<addPanel newName='' newType=''/>"));
addPanel.control.expanded.set(false);
//addPanel.control.infonArgs.insert(rw, 0);
//addPanel.control.infonArgs.set(1, world.missRob);

var zui = layout.zui.make();
zui.control.focus.set(rw);
zui.control.properties.set(parseXML("<zui view='situation' childrenSidebar='1' correspondSidebar='0'/>"));
zui.control.leftChildInView.set(0);
zui.control.leftRailChild.set(0);

PREDEF["zui"] = zui;
PREDEF["panelLayer"] = panelLayer;
PREDEF["addPanel"] = addPanel;
mergeInto(PREDEF, uiStartCaps);

var mainAmbient = makeAmbient();

processAllThunks(mainAmbient, document.getElementById("html_mainscreen"), {
	rw: rw,
	zui: zui,
	panelLayer: panelLayer,
	addPanel: addPanel,
	"uiStartCaps.windowSizeWidth": uiStartCaps.windowSizeWidth,
	"uiStartCaps.windowSizeHeight": uiStartCaps.windowSizeHeight
}, "");


//var ec = makeSimpleEndCap(mainAmbient, endCaps.log.unit("mouse x"), uiStartCaps.mousePositionX);
//var ec = makeSimpleEndCap(mainAmbient, endCaps.log.unit("mouse y"), uiStartCaps.mousePositionY);

/*var test = deriveForEach(rw.get.childObjects(), function (o) {
	return o.get.parentSituation();
}, kernel.situation);*/

//var test = deriveNonEmpty(rw.get.childObjects());

//var test = deriveSort(rw.get.childObjects());
//var test2 = deriveLimit(test);

//var ec = makeSimpleEndCap(mainAmbient, endCaps.log.list("test output"), test2);