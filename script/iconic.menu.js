/*
 * title: iconic menu v.0.1.0
 * name: iconic.menu.js
 * author: yobukodori
*/

(function(){
	"use strict";
	let d = document;
	iconicMenu.items.forEach(item=>{
			let e = d.createElement("div"), targetBlank = iconicMenu.options && iconicMenu.options.targetBlank;
			e.innerHTML = '<a href="' + item.url + '" '+(targetBlank ? 'target="_blank"':'')+'><div><img class="item-icon" src="' + item.icon + '"><div class="item-name">' + item.name + '</div></div></a>';
			e.className = "item";
			d.getElementById("iconic-menu-container").appendChild(e);
	});
})();
