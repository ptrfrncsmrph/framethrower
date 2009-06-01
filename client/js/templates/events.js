(function () {
	
	// =========================================================
	// "Preferences"
	// =========================================================
	
	var longDownTime=600;
	var longHoverTime=2500;
	var longDraggingHoverTime=480;

	// http://developer.apple.com/documentation/UserExperience/Conceptual/OSXHIGuidelines/XHIGDragDrop/chapter_12_section_5.html
	var dragRadius=3;
	

	// =========================================================
	// Processing Events
	// =========================================================
	
	function processEvent(eventName, e, eventParams) {
		var target = e.target;
		
		// var fon = xpath("(ancestor-or-self::*/f:on[@event='" + eventName + "'])[last()]", target);
		// 
		// var test = xpath("(ancestor-or-self::*/f:on[@event='" + eventName + "'])", target);
		// if (test.length > 1) {
		// 	console.log("multiple targets", test);
		// }
		
		function addWrappers(xp, or) {
			return xp + " "+or+" f:wrapper/"+xp + " "+or+" svg:g/"+xp + " "+or+" f:wrapper/f:wrapper/"+xp + " "+or+" svg:g/svg:g/"+xp;
		}
		
		
		// note the hackery here
		var xpathExp = "*[" + addWrappers("f:on/@event='" + eventName + "'", "or") + "][1]";
		//if (eventName !== "mouseover" && eventName !== "mouseout") {
			xpathExp = "ancestor-or-self::"+xpathExp;
		//}
		// if (eventName === "mouseout") {
		// 	console.log("registered mouseout", target);
		// }
		
		var fon = xpath(xpathExp, target);
		
		if (fon.length > 0) {
			var fonEls = xpath(addWrappers("f:on[@event='" + eventName + "']", "|"), fon[0]);
			
			forEach(fonEls, function (fonEl) {
				var env = function (s) {
					if (s === "event.offsetX") {
						return mouseCurrentPos[0] - getPosition(fonEl.parentNode)[0];
					} else if (s === "event.offsetY") {
						return mouseCurrentPos[1] - getPosition(fonEl.parentNode)[1];
					} else if (s === "event.mouseX") {
						return mouseCurrentPos[0];
					} else if (s === "event.mouseY") {
						return mouseCurrentPos[1];
					} else {
						return fonEl.custom.env(s);
					}
				};
				
				var action = makeActionClosure(fonEl.custom.action, env);

				//console.log("about to execute an action!", action);

				executeAction(action);
				
			});
			

			
			
			// var browserParams = xpath("f:with-param-browser", fonEl);
			// var form;
			// forEach(browserParams, function (browserParam) {
			// 	var name = getAttr(browserParam, "name");
			// 	if (getAttr(browserParam, "form")) {
			// 		if (!form) {
			// 			form = xpath("ancestor-or-self::html:form[1]", fonEl);
			// 			if (form.length === 0) {
			// 				debug.error("f:on has a f:with-param-browser needing a form, but there's no form", fonEl);
			// 			}
			// 			form = form[0];
			// 		}
			// 		
			// 		var el = form.elements[getAttr(browserParam, "form")];
			// 		te.params[name] = "" + el.value;
			// 	} else if (getAttr(browserParam, "prop")) {
			// 		var prop = getAttr(browserParam, "prop");
			// 		if (prop === "mouseX") {
			// 			te.params[name] = mouseCurrentPos[0];
			// 		} else if (prop === "mouseY") {
			// 			te.params[name] = mouseCurrentPos[1];
			// 		} else if (prop === "relMouseX") {
			// 			//te.params[name] = mouseCurrentPos[0] - window.getComputedStyle(fon, null).getPropertyValue("left");
			// 			//console.log(getPosition(fonEl.parentNode));
			// 			te.params[name] = mouseCurrentPos[0] - getPosition(fonEl.parentNode)[0];
			// 		} else if (prop === "relMouseY") {
			// 			te.params[name] = mouseCurrentPos[1] - window.getComputedStyle(fon, null).getPropertyValue("top");
			// 		} else if (prop === "elemX") {
			// 			te.params[name] = getPosition(target)[0];
			// 		} else if (prop === "elemY") {
			// 			te.params[name] = getPosition(target)[1];
			// 		} else if (prop === "elemWidth") {
			// 			te.params[name] = target.offsetWidth;
			// 		} else if (prop === "elemHeight") {
			// 			te.params[name] = target.offsetHeight;
			// 		}
			// 		// TODO: add more here...
			// 	}
			// });
			

		}
	}
	
	// =========================================================
	// Copying Events
	// =========================================================
	
	var eventPropertiesToCopy = ["target", "clientX", "clientY", "button", "detail", "charCode", "keyCode", "altKey", "ctrlKey", "metaKey", "shiftKey"];
	function copyEvent(e) {
		var ret = {};
		forEach(eventPropertiesToCopy, function (prop) {
			ret[prop] = e[prop];
		});
		return ret;
	}
	
	// =========================================================
	// Event Logic
	// =========================================================
	
	var mouseIsDown = false;
	var mouseIsDragging = false;
	var mouseDownPos = [0,0];
	var mouseCurrentPos = [0,0];
	
	var mouseOverTarget = null;
	
	var currentFocus = null;
	
	function mousedown(e) {
		mouseIsDown = copyEvent(e);
		mouseDownPos = [e.clientX, e.clientY];
		processEvent("mousedown", e, {clientX: e.clientX, clientY: e.clientY});
		if (currentFocus && currentFocus.blur) {
			var tmp = currentFocus;
			currentFocus=false;
			tmp.blur();
		}		
		if (e.target.localName !== "input" && e.target.localName !== "button") {
			dont(e);
		}
	}
	function mouseup(e) {
		processEvent("mouseup", e);
		if (mouseIsDragging) {
			processEvent("dragend", e);
		} else {
			processEvent("click", mouseIsDown, {clientX: mouseIsDown.clientX, clientY: mouseIsDown.clientY});
		}
		mouseIsDown = false;
		mouseIsDragging = false;
	}
	function dblclick(e) {
		processEvent("dblclick", e); // TODO integrate this better?
	}
	function mousemove(e) {
		mouseCurrentPos[0] = e.clientX;
		mouseCurrentPos[1] = e.clientY;
		processEvent("mousemove", e, {clientX: e.clientX, clientY: e.clientY});
		if (mouseIsDown && !mouseIsDragging) {
			var xdiff=mouseDownPos[0]-e.clientX;
			var ydiff=mouseDownPos[1]-e.clientY;
			if (xdiff*xdiff + ydiff*ydiff >= dragRadius*dragRadius) {
				//console.log(mouseDownPos,e.clientX,e.clientY);
				mouseIsDragging = true;
				//console.log("doing dragstart");
				processEvent("dragstart", mouseIsDown);
			}
		}
		if (mouseIsDragging) {
			processEvent("mousedrag", e, {clientX: e.clientX, clientY: e.clientY});
		}
	}
	function mouseover(e) {
		//var oldTarget = mouseOverTarget;
		mouseOverTarget = e.target;
		// if (oldTarget) {
		// 	
		// }
		//console.log(mouseOverTarget, oldTarget);
		processEvent("mouseover", e);
	}
	function mouseout(e) {
		function isAncestor(child, grandparent) {
			if (!child) return false;
			else if (child === grandparent) return true;
			else return isAncestor(child.parentNode, grandparent);
		}
		if (!isAncestor(e.relatedTarget, e.target)) {
			processEvent("mouseout", e);
		}
	}
	function mousescroll(e) {
		
	}
	function focus(e) {
		currentFocus=e.target;
		processEvent("focus", e);
	}
	function blur(e) {
		processEvent("blur", e, {value:e.target.value});
		if (!currentFocus) processEvent("manualblur", e);
	}	
	function change(e) {
		processEvent("change", e, {value:e.target.value});
	}
	function submit(e) {
		var tmp = currentFocus;
		currentFocus=false;
		tmp.blur();
		dont(e);
	}
	
	function dont(e) {
		e.preventDefault();
	}
	
	document.addEventListener("mousedown", mousedown, true);
	document.addEventListener("mouseup", mouseup, true);
	document.addEventListener("dblclick", dblclick, true);
	document.addEventListener("mousemove", mousemove, true);
	document.addEventListener("mouseover", mouseover, true);
	document.addEventListener("mouseout", mouseout, true);
	document.addEventListener("DOMMouseScroll", mousescroll, true);
	document.addEventListener("blur", blur, true);
	document.addEventListener("focus", focus, true);
	document.addEventListener("change", change, true);
	document.addEventListener("submit", submit, true);
})();



// =========================================================
// Global UI Cells
// =========================================================

(function () {
	var ui = rootObjects["ui.ui"].prop;
	
	function resizeScreen(e) {
		//console.log("detected screen resize");
		var screenWidth = window.innerWidth;
		var screenHeight = window.innerHeight;
		ui["screenWidth"].control.add(screenWidth);
		ui["screenHeight"].control.add(screenHeight);
	}
	
	function mousemove(e) {
		ui["mouseX"].control.add(e.clientX);
		ui["mouseY"].control.add(e.clientY);
	}
	
	function mousedown(e) {
		ui["mouseDown"].control.add(nullObject);
	}
	function mouseup(e) {
		ui["mouseDown"].control.remove();
	}
	
	window.addEventListener("resize", resizeScreen, true);
	document.addEventListener("load", resizeScreen, true);
	
	document.addEventListener("mousemove", mousemove, true);
	document.addEventListener("mousedown", mousedown, true);
	document.addEventListener("mouseup", mouseup, true);
})();




























