/*
 * title: news link fix v.0.1.4
 * name: news-link-fix.js
 * author: yobukodori
*/

(function(){
	'use strict';
	if (window.ybkdrNewsLinkFix)
		return;
	window.ybkdrNewsLinkFix = true;

	function newtab(e)
	{
		e.setAttribute("target", "_blank");
	}
	
	function underline(e)
	{
		e.setAttribute("style", "text-decoration: underline;");
		let e2 = e.querySelector('dd') || e.querySelector('p');
		if (e2)
			e2.setAttribute("style", "text-decoration: underline;");
	}

	let siteData = {
		"www.jiji.com": {
			isTarget: function(e){
				return true; // /\/sp\/(article|v\d|d\d|c|tokushu)\?/.test(e.href);
			},
			fixLink: function(e){
				'use strict';
				if (/\/sp\/(article|v\d|d\d|c|tokushu)\?/.test(e.href)){
					e.setAttribute("onclick", "");
				}
			}
		},
		"mainichi.jp": {
			isTarget: function(e){
				return true; // /\/articles\/\d{8}\//.test(e.href);
			}
		},
		"www.yomiuri.co.jp": {
			isTarget: function(e){
				return true; // /\/\d{8}-/.test(e.href);
			}
		},
		"www.47news.jp": {
			isTarget: function(e){
				return true; // /\/\d+\.html/.test(e.href);
			},
			fixLink: function(e){
				'use strict';
				let attr = e.getAttribute("style");
				attr = (attr ? attr + "; " : "") + "touch-action: initial";
				e.setAttribute("style", attr);
				if (/\/\d+\.html/.test(e.href)){
					fetch(e.href)
					.then(function(response) {
						return response.text();
					})
					.then(function(html) {
						let sig = '<a class="read-more-button"', i, r;
						(i = html.indexOf(sig)) !== -1 && (r = html.substring(i, html.indexOf(">", i + sig.length) + 1).match('href="(.+?)"')) && (e.href = r[1]);
					});			
				}
			}
		},
		"news.goo.ne.jp": {
			isTarget: function(e){
				return true; // /\/\d+\.html/.test(e.href);
			},
			fixLink: function(e){
				'use strict';
				if (/\/(article|topstories)\/.+\.html/.test(e.href)){
					fetch(e.href)
					.then(function(response) {
						return response.text();
					})
					.then(function(html) {
						let r, i = html.indexOf('id="topics_1_more"');
						i != -1 && (r = html.substring(html.lastIndexOf('<', i), i).match('href="(.+?)"')) && (e.href = r[1]);
					});			
				}
			}
		},
		"news.yahoo.co.jp": {
			isTarget: function(e){
				return true; // /\/\d+\.html/.test(e.href);
			},
			fixLink: function(e){
				'use strict';
				if (/\/pickup\/\d+/.test(e.href)){
					fetch(e.href, {mode:"no-cors"})
					.then(function(response) {
						return response.text();
					})
					.then(function(html) {
						let sig = /\/pickup\/\d+/.test(e.href) ? 'id="dtlBtn">' : 'class="tpcNews_detailLink">', i = html.indexOf(sig), r;
						i != -1 && (r = html.substring(i + sig.length, html.indexOf('>', i + sig.length)).match('href="(.+?)"')) && (e.href = r[1]);
						let parent = e.querySelector('div.topics_item_sub'), src, span;
						parent && (sig = '<span class="source">') && (i = html.indexOf(sig)) != -1 && (src = html.substring(i + sig.length, html.indexOf('<', i + sig.length))) && (span = d.createElement("span")) && (span.className = "newsFeed_item_media") && (span.setAttribute("style","vertical-align: bottom"),!0) && (span.innerText = src) && parent.appendChild(span);
					});			
				}
			},
			postprocess: function(){
				let fixLink = this.fixLink, ul = d.querySelector('ul.newsFeed_list');
				if (ul){
					(new MutationObserver(function(mutations, observer){
						mutations.forEach(m=>{
							if (m.type === "childList"){
								for (let i = 0 ; i < m.addedNodes.length ; i++){
									let e = m.addedNodes[i];
									e.querySelector && (e = e.querySelector('a')) && (newtab(e), underline(e), fixLink(e));
								}
							}
						});
					})).observe(ul, {childList:true});
				}
				else {
					console.log("ul not found");
				}
			}
		},
		"jp.mobile.reuters.com": {
			isTarget: function(e){
				return true;
			},
			postprocess: function(){
				$("a").each(function(){$(this).off('click')});
			}
		},
	};
	let d = document;
	let sd = siteData[d.location.hostname.toLowerCase()];
	let ee = d.getElementsByTagName("a");
	for (let i = 0 ; i < ee.length ; i++){
		let e = ee[i];
		if (! sd || ! sd.isTarget || sd.isTarget(e)){
			newtab(e);
			underline(e);
		}
		if (sd && sd.fixLink)
			sd.fixLink(e);
	}
	if (sd && sd.postprocess)
		sd.postprocess();
})()
