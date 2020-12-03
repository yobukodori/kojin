/*
 * title: iconic menu v.0.1.3
 * name: iconic.menu.js
 * author: yobukodori
*/

(function(){
	"use strict";
	let d = document;
	let pp = "", iv = "";
	location.search.substring(1).split("&").forEach(param=>{
		let i = param.indexOf("="), 
			name = (i !== -1 ? param.substring(0, i) : ""), 
			val = (i !== -1 ? decodeURIComponent(param.substring(i+1)) : null);
		if (name === "pp")
			pp = val;
		else if (name === "iv")
			iv = val;
	});
	if (pp && iv && window.CryptoJS){
		let passphrase = CryptoJS.enc.Utf8.parse(pp);
		let option = {iv: CryptoJS.enc.Utf8.parse(iv), mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7};
		iconicMenu.items.forEach(item=>{
				["name", "url", "icon"].forEach(prop=>{
					if (! item[prop] && item["aes-"+prop]){
						let decrypted = CryptoJS.AES.decrypt(item["aes-"+prop], passphrase, option);
						item[prop] = decrypted.toString(CryptoJS.enc.Utf8);
					}
				});
		});
	}
	if (location.search){
		let m = {};
		iconicMenu.items.forEach(item=>{
			m[item.name.toLowerCase()] = item;
		});
		location.search.substring(1).split("&").forEach(param=>{
			let i = param.indexOf("="), 
				name = (i !== -1 ? decodeURIComponent(param.substring(0, i)) : ""), 
				val = (i !== -1 ? decodeURIComponent(param.substring(i+1)) : null);
				if (name === "title"){
					d.title = val;
				}
				else if (name === "favicon"){
					let i = val.lastIndexOf("."), type = (i !== -1 ? val.substring(i+1) : "");
					if (type){
						let e = d.createElement("link");
						e.setAttribute("rel", "icon");
						if (type != "ico")
							e.setAttribute("type", "image/"+type);
						e.setAttribute("href", val);
						d.getElementsByTagName("head")[0].appendChild(e);
					}
				}
				else if (name === "item"){
					try {
						let item = JSON.parse(val);
						if (item.name)
							iconicMenu.items.push(item);
					}
					catch(e){console.log("catch:"+e)}
				}
				else if ((i = name.indexOf(".")) !== -1){
					let itemName = name.substring(0,i).toLowerCase(),
						propName = name.substring(i+1);
					if (itemName && propName){
						if (m[itemName])
							m[itemName][propName] = val;
					}
				}
		});
	}
	let targetBlank = iconicMenu.options && iconicMenu.options.targetBlank;
	iconicMenu.items.forEach(item=>{
			if (item.hide)
				return;
			let e = d.createElement("div");
			e.innerHTML = '<a class="item-url" href="' + (item.url ? item.url : '') + '" '+((targetBlank || item.targetBlank) ? 'target="_blank"':'') + '><div><img class="item-icon" src="' + (item.icon ? item.icon : 'icon/na.png') + '"><div class="item-name">' + item.name + '</div></div></a>';
			e.className = "item";
			d.getElementById("iconic-menu-container").appendChild(e);
	});
	if (pp && iv){
		let qs = "?pp=" + encodeURIComponent(pp) + "&iv=" + encodeURIComponent(iv);
		let ee = d.querySelectorAll("a.item-url");
		for (let i = 0 ; i < ee.length ; i++){
			let a = ee[i], href = a.getAttribute("href");
			if (/^[\w\-]+\.html$/.test(href))
				a.setAttribute("href", href + qs)
		}
	}
})();
