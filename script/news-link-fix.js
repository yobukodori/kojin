/*
 * title: news link fix v.0.1.12
 * name: news-link-fix.js
 * author: yobukodori
*/

(function(){
	'use strict';
	function str_find_block(str, sig1, sig2, from)
	{
		var ro = {error:"n/a", start:-1, first:-1, last:-1, next:from ? from:0};
		ro.start = str.indexOf(sig1, ro.next);
		if (ro.start === -1){
			ro.error = "str_find_block() can't find sig1 '" + sig1 + "'";
			return ro;
		}
		ro.first = ro.start + sig1.length;
		ro.last = str.indexOf(sig2, ro.first);
		if (ro.last === -1){
			ro.error = "str_find_block() can't find sig2 '" + sig2 + "'";
			return ro;
		}
		ro.next = ro.last + sig2.length;
		ro.error = "";
		return ro;
	}
	function str_find_block_r(str, sig1, sig2, from)
	{
		var ro = {error:"n/a", start:-1, first:-1, last:-1, next:from ? from:0};
		ro.last = str.indexOf(sig2, ro.next);
		if (ro.last === -1){
			ro.error = "str_find_block_r() can't find sig2 '" + sig2 + "'";
			return ro;
		}
		ro.next = ro.last + sig2.length;
		ro.start = str.lastIndexOf(sig1, ro.last);
		if (ro.start === -1){
			ro.error = "str_find_block_r() can't find sig1 '" + sig1 + "'";
			return ro;
		}
		ro.first = ro.start + sig1.length;
		ro.error = "";
		return ro;
	}
	let decodeEntities = (function() {
	  let element = document.createElement('div');
	  function decodeHTMLEntities (str) {
		if(str && typeof str === 'string') {
		  // strip script/html tags
		  str = str.replace(/<script[^>]*>([\S\s]*?)<\/script>/gmi, '');
		  str = str.replace(/<\/?\w(?:[^"'>]|"[^"]*"|'[^']*')*>/gmi, '');
		  element.innerHTML = str;
		  str = element.textContent;
		  element.textContent = '';
		}
		return str;
	  }
	  return decodeHTMLEntities;
	})();
	function newtab(e)
	{
		e.setAttribute("target", "_blank");
	}
	
	function underline(e)
	{
		e.style.textDecoration = "underline";
		let e2 = e.querySelector('dd') || e.querySelector('p');
		if (e2)
			e2.setAttribute("style", "text-decoration: underline;");
	}

	let siteData = {
		"www.jiji.com": {
			fixLink: function(e, href){
				'use strict';
				if (/\/sp\/(article|v\d|d\d|c|tokushu)\?/.test(href)){
					e.setAttribute("onclick", "");
				}
			},
			observee: '#Wrapper'
		},
		"mainichi.jp": {
		},
		"www.yomiuri.co.jp": {
		},
		"www.47news.jp": {
			fixLink: function(e, href){
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
			observee: "#NR-main",
			isTarget: function(e){
				'use strict';
				if (e.id.indexOf("lnav_") === 0){
					e.addEventListener("click", function(){
						event.preventDefault();
						fetch(e.href)
						.then(function(response) {
							return response.text();
						})
						.then(function(html) {
							let b, s, p, c;
							(b = str_find_block(html, '<div id="NR-main">', '<!-- main --></div>')) && !b.error && (s = html.substring(b.start,b.next)) && (p = d.getElementById("NR-main")) && (p.innerHTML = s);
						});
					});
					return false;
				}
				return true;
			},
			fixLink: function(e, href){
				'use strict';
				if (/\/topstories\/.+\.html/.test(e.href)){
					let im = e.querySelector('.news-list-item > .news-item-thumbs') || e.querySelector('a > .news-item-thumbs');
					im && im.parentElement.remove();
					fetch(e.href)
					.then(function(response) {
						return response.text();
					})
					.then(function(html) {
						let b, s, r, p, c, title;
						(b = str_find_block(html,'id="topics_1_title">','<')) && !b.error && (s = html.substring(b.first,b.last), title = s) && (p = e.querySelector('.list-title-topics')) && (p.innerText = decodeEntities(title).replace(/\u3000/g," "));
						p && (b = str_find_block(html,'<p class="topics-news-source','</p>')) && !b.error && (s = html.substring(b.first,b.last)) && (r = s.match(/<a .+>(.+)<\/a>\)(.+)/)) && (c = d.createElement("div")) && (c.innerText = r[1]+r[2]) && (c.style.fontSize = "small", c.style.marginTop = "-5px", c.style.paddingBottom = "2px") && (e.style.display = "block", p = e) && p.appendChild(c);
						(b = str_find_block_r(html,'<a ','id="topics_1_more"')) && !b.error && (s = html.substring(b.first,b.last)) && (r = s.match(/href="(.+?)"/)) && (e.href = r[1]);
					});			
				}
			}
		},
		"news.yahoo.co.jp": {
			fixLink: function(e, href){
				'use strict';
				if (/\/pickup\/\d+/.test(e.href)){
					fetch(e.href, {mode:"no-cors"})
					.then(function(response) {
						return response.text();
					})
					.then(function(html) {
						{
							let title = "n/a";
							let b, s, r, p, c;
							(b = str_find_block(html,'id="tpcTitle">','</a>')) && !b.error && (s = html.substring(b.first,b.last)) && (r = s.match(/>(.+)/)) && (title=r[1]) && (p = e.querySelector('.topics_item_title')) && (p.innerText = decodeEntities(title).replace(/\u3000/g," "));
						}
						let sig = /\/pickup\/\d+/.test(e.href) ? 'id="dtlBtn">' : 'class="tpcNews_detailLink">', i = html.indexOf(sig), r;
						i != -1 && (r = html.substring(i + sig.length, html.indexOf('>', i + sig.length)).match('href="(.+?)"')) && (e.href = r[1]);
						let parent = e.querySelector('div.topics_item_sub'), src, span;
						parent && (sig = '<span class="source">') && (i = html.indexOf(sig)) != -1 && (src = html.substring(i + sig.length, html.indexOf('<', i + sig.length))) && (span = d.createElement("span")) && (span.className = "newsFeed_item_media") && (span.setAttribute("style","vertical-align: bottom"),!0) && (span.innerText = src) && parent.appendChild(span);
					});			
				}
			},
			observee: '#contents'
		},
		"jp.mobile.reuters.com": {
			postprocess: function(){
				$("a").each(function(){$(this).off('click')});
			}
		},
		"news.infoseek.co.jp": {
			fixLink: function(e, href){
				'use strict';
				if (href.indexOf("/topics/") === 0 && /\/topics\/\w/.test(e.href)){
					fetch(e.href)
					.then(function(response) {
						return response.text();
					})
					.then(function(html) {
						let b, s, r, c, title;
						(b = str_find_block(html, '<h3 class="hdg_article">', '</a>')) && !b.error && (s = html.substring(b.first, b.last)) && (r = s.match(/>(.+)/), title = r[1]) && (e.firstElementChild.innerText = decodeEntities(title).replace(/\u3000/g," "));
						(b = str_find_block(html, '<p class="article_head">', '</p>')) && !b.error && (s = html.substring(b.first, b.last)) && (r = s.match(/">(.+?)</)) && (c = d.createElement("span")) && (c.innerText = r[1].trim()) && (c.style.fontSize = "1.1rem") && (c.style.marginLeft = "1rem") && e.firstElementChild.appendChild(c);
					});		
					e.setAttribute("href", "/article" + href.substring(7));
				}
			}
		},
		"news.livedoor.com": {
			fixLink: function(e, href){
				'use strict';
				if (e.onclick)
					e.onclick = null;
				let r = e.href.match(/^(https:\/\/news\.livedoor\.com\/lite\/)topics_detail(\/\d+\/)$/);
				if (r){
					e.href = r[1] + "article_detail" + r[2];
					fetch(e.href)
					.then(function(response) {
						return response.arrayBuffer();
					})
					.then(function(buffer) {
						let html = new TextDecoder("utf-8").decode(buffer);
						let src = "n/a", s, r, b = str_find_block(html, '<meta charset="', '"');
						if (! b.error){
							let charset = html.substring(b.first,b.last);
							if (charset.toLowerCase() !== "utf-8"){
								html = new TextDecoder(charset).decode(buffer);
							}
						}
						{
							let title = "n/a";
							let b, s, r, p, c;
							(b = str_find_block(html,'class="article-header-contents">','</div>')) && !b.error && (s = html.substring(b.first,b.last)) && (r = s.match(/>(.+?)</)) && (title = r[1]) && ((p = e.querySelector('.article-list-headline-title')) || (p = e.querySelector('.article-title'))) && (p.innerText = decodeEntities(title).replace(/\u3000/g," "));
						}
						if ((b = str_find_block(html, 'pubdate="pubdate">', '</time>')), !b.error){
							src = html.substring(b.first,b.last);
							if ((b = str_find_block(html, '<p class="venderLogo">', '</p>')), !b.error){
								if (r = html.substring(b.first,b.last).match(/alt="(.+)"/))
									src = r[1] + " " + src;
							}
							else if ((b = str_find_block(html, 'class="outer-link-vender">', '</span>')), !b.error){
								src = html.substring(b.first,b.last)+" "+src;
							}
						}
						if (src){
							let p, c = d.createElement("div");
							(c.innerText = " "+src) && (c.style.fontSize = "small") && ((p = e.querySelector('.article-list-headline-title')) || (p = e.querySelector('.article-title'))) && p.appendChild(c);
						}
					});
				}
			},
			preprocess: function(){
				'use strict';
				let ee = d.querySelectorAll('div.swiper-slide');
				for (let i = 0 ; i < ee.length ; i++){
					ee[i].style.height = "";
				}
			}
		},
		"www.excite.co.jp": {
			fixLink: function(e, href){
				'use strict';
				if (e.href.includes('/news/article/')){
					fetch(e.href)
					.then(function(response) {
						return response.text();
					})
					.then(function(html) {
						if (! e.querySelector('p.title')){
							let title = "n/a";
							let b, s, r, p, c;
							(b = str_find_block(html,'<h1 class="article-title">','</h1>')) && !b.error && (s = html.substring(b.first,b.last)) && (title = s) && (p = e.firstChild) && (p.data = decodeEntities(title).replace(/\u3000/g," "));
						}
						let src = "n/a", s, r, b = str_find_block(html, '"author":{', '}');
						!b.error && (s = html.substring(b.first, b.last)) && (r = s.match(/"name": "(.+)"/)) && (src = r[1]);
						let p, c;
						if (p = e.querySelector('p.on-photo-text')){
							(c = d.createElement("span")) && (c.innerText = src) && (c.style.fontSize = "small") && p.appendChild(d.createElement("br")) && p.appendChild(c);
						}
						else if (p = e.querySelector('p.title')){
							(c = d.createElement("span")) && (c.innerText = " "+src) && (c.style.fontSize = "small") && p.appendChild(c);
						}
						else {
							(p = e) && (c = d.createElement("div")) && (c.innerText = " "+src) && (c.style.fontSize = "small") && p.appendChild(c);
						}
					});	
				}
			}
		},
		"news.nifty.com": {
			preprocess: function(){
				let sliderSelector = "#sliderTop";
				$("li a").off("click");
				$(sliderSelector).off("touchmove touchend");
				let ee = d.querySelectorAll(".sp-mask");
				for (let i = 0 ; i < ee.length ; i++){
					ee[i].style.overflowY = "scroll";
				}
			},
			fixLink: function(e, href){
				'use strict';
				if (/^\/(topics|article)\/.+\/\d+(-\w+)?\/$/.test(href)){
					fetch(e.href)
					.then(function(response) {
						return response.text();
					})
					.then(function(html) {
						let s, r, b;
						if (href.indexOf("/topics/") === 0){
							(b = str_find_block_r(html, '<a ', 'class="article_btn">')) && !b.error && (s = html.substring(b.first, b.last)) && (r = s.match(/href="(.+)"/)) && (e.href = r[1]);
						}
						if (! e.querySelector('span.data')){
							{
								let title = "n/a";
								let b, s, r, p, c;
								(b = str_find_block(html,'<h1 class="ttl fs">','</h1>')) && !b.error && (s = html.substring(b.first,b.last)) && (title = s) && (p = e.querySelector('p.ttl_list')) && (p.innerText = decodeEntities(title).replace(/\u3000/g," "));
								p && (p.style.display = "initial", p.style.overflow = "initial", p.style.whiteSpace = "initial",p.style.fontSize = "14px",p.classList.remove("fs"), p.style.paddingLeft = "0", e.parentElement.style.padding = "3px 5px 3px 5px") && (e.style.height = "auto",e.style.display="initial") && e.parentElement.classList.contains("new") && (e.parentElement.classList.remove("new"), c = d.createElement("span"), c.innerText = "N", c.style.color = "red", p.appendChild(c));
							}
							let src = "n/a";
							(b = str_find_block(html, '<a href="/vender/', '</a></p>')) && !b.error && (s = html.substring(b.first, b.last)) && (r = s.match(/>(.+)/)) && (src = r[1]);
							let p = e, c = d.createElement("span");
							(c.innerText = " " + src, c.style.fontSize = "small") && (p.appendChild(c));
						}
					});
				}
				else {
					//console.log(e.innerText.replace(/\s+/g," "));
					//console.log(href);
				}
			}
		},
		"news.biglobe.ne.jp": {
			isTarget: function(e){
				return e.parentElement.tagName !== "H1";
			},
			fixLink: function(e, href){
				'use strict';
				if (e.querySelector('div.boxTxt'))
					e.style.padding = "5px";
				if (e.querySelector('p.boxTtl')){
					fetch(e.href,{mode:"no-cors"})
					.then(function(response) {
						return response.text();
					})
					.then(function(html) {
						let s, r, b = str_find_block_r(html, '<a ', '全文を読む');
						!b.error && (r = html.substring(b.first, b.last).match(/href="(.+?)"/)) && (e.href = r[1]);
						{
							let title = "n/a";
							let b, s, r, p, c, t="n/a";
							(b = str_find_block(html,'<h1 class="nTitle">','</h1>')) && !b.error && (s = html.substring(b.first,b.last)) && (title = s) && (t="nTitle");
							b.error && (b = str_find_block(html,"'topics_main','article_link'",'\n<div class="cpn">')) && !b.error && (s = html.substring(b.first,b.last)) && (r = s.match(/>(.+)/)) && (title = r[1]);
							(title = decodeEntities(title).replace(/\u3000/g," ")) && (p = e.querySelector('p.boxTtl')) && (p.innerText = title);
						}
					});
				}
			},
			observee: 'div.viewport02'
		},
		"template": {
			isTarget: function(e){
				return true;
			},
			fixLink: function(e, href){
				'use strict';
				console.log(e.innerText.replace(/\s+/g," "));
				console.log(e.href);
				if (true){
					fetch(e.href)
					.then(function(response) {
						return response.text();
					})
					.then(function(html) {
						if (! window.printed){
							window.printed = true;
							console.log(html);
						}
					});
				}
			}
		}
	};
	function fixLinks(ee, sd)
	{
		for (let i = 0 ; i < ee.length ; i++){
			let e = ee[i];
			if (! e.classList.contains(fixedSig)){
				e.classList.add(fixedSig);
				let href = e.getAttribute("href");
				if (href && href.charAt(0) !== "#"){
					if (! sd || ! sd.isTarget || sd.isTarget(e)){
						newtab(e);
						underline(e);
					}
					if (sd && sd.fixLink)
						sd.fixLink(e, href);
				}
			}
		}
	}
	let d = document, fixedSig = "ybkdr-link-fixed";
	let sd = siteData[d.location.hostname.toLowerCase()];
	if (sd && sd.preprocess)
		sd.preprocess();
	fixLinks(d.getElementsByTagName("a"), sd);
	if (sd && sd.postprocess)
		sd.postprocess();
	if (sd && sd.observee){
		let container = d.querySelector(sd.observee);
		if (container){
			(new MutationObserver(function(mutations, observer){
				mutations.forEach(m=>{
					if (m.type === "childList"){
						for (let i = 0 ; i < m.addedNodes.length ; i++){
							let n = m.addedNodes[i];
							if (n.querySelector)
								fixLinks(n.querySelectorAll('a'), sd);
						}
					}
				});
			})).observe(container, {childList:true, subtree:true});
		}
		else {
			console.log("observee '"+sd.observee+"' not found");
		}
	}
})()
