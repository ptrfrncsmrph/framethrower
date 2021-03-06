template (height::Number, items::List (Range, a)) {

  padding = 2,

  width = round (multiply height aspectRatio),

  getUrl = function (frames::List a, width::Number, height::Number, id::String)::String {
    var times = [];
    forEach(frames.asArray, function (pair) {
      times.push(pair.asArray[0].asArray[0]);
    });
    var url = "url(http:/"+"/media.eversplosion.com/frames.php?id="+id+"&width="+width+"&height="+height+"&time=" + times.join(",") + ")";
    return url;
  },

  indexList = function (list::List a)::List (Number, a) {
    var ret = [];
    forEach(list.asArray, function (x, i) {
      ret.push(makeTuple2(i, x));
    });
    return arrayToList(ret);
  },
  getBackgroundPosition = function (index::Number, height::Number)::String {
    return "center -"+(index*height)+"px";
  },

  url = getUrl items width height movieId,

  <f:each indexList items as cut>
    index = fst cut,
    start = range_start (fst (snd cut)),
    duration = range_duration (fst (snd cut)),
    content = snd (snd cut),
    // myXMLP = template () {
    //   outString = function (s::a)::String {
    //     if (typeof s === "string") {
    //       return s;
    //     } else {
    //       return "";
    //     }
    //   },
    //   <div>
    //     <div style-height="{height}" style-background-image="{url}" style-background-repeat="no-repeat" style-background-position="{getBackgroundPosition index height}" />
    //     <div>
    //       {outString (snd (snd cut))}
    //     </div>
    //   </div>
    // },
    <div style-left="{makePercent (divide start movieDuration)}" style-width="{makePercent (divide duration movieDuration)}" style-position="absolute">
      // <f:on mouseover>
      //   set mouseOveredTimeS (start, duration),
      //   //showTooltip event.mouseX event.mouseY 300 100 false myXMLP
      // </f:on>
      // <f:on mouseout>
      //   unset mouseOveredTimeS,
      //   //hideTooltip
      // </f:on>
      // <f:on click>
      //   set selectedTimeStartS start,
      //   set selectedTimeDurationS duration
      // </f:on>
      <div style-padding="{padding}" class="chapter">
        <div class="chapter-inside" style-position="relative" style-max-width="{width}" style-overflow="hidden" style-height="{subtract height (multiply 2 padding)}" style-background-image="{url}" style-background-repeat="no-repeat" style-background-position="{getBackgroundPosition index height}">
          // <div style-position="absolute" style-bottom="0" style-z-index="4">
          //   <div style-background-color="#000" style-color="#fff" style-white-space="nowrap" style-text-overflow="ellipsis" style-padding-right="2" style-opacity="0.5">
          //     {content}
          //     <f:on click>
          //       set selectedTimeStartS start,
          //       set selectedTimeDurationS duration
          //     </f:on>
          //   </div>
          // </div>


        </div>
      </div>


    </div>
  </f:each>

}