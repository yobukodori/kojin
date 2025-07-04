//name dark mode news
//; v.1.0.5 (2025/7/3 8:15)
//matches https://www.jiji.com/*, https://www.47news.jp/*, https://www.yomiuri.co.jp/*, https://www.asahi.com/*, https://mainichi.jp/*, https://*.nhk.or.jp/*, https://www.nikkei.com/*, https://jp.reuters.com/*, https://www.cnn.co.jp/*, https://www.bbc.com/*, https://www.afpbb.com/*, https://forbesjapan.com/*, https://news.yahoo.co.jp/*, https://www.bloomberg.co.jp/*, https://wedge.ismedia.jp/*
//option start
//js
(function(){
	function log(){
		console.log.apply(console,["[dark mode news]"].concat(Array.from(arguments)));
	}
	log("started");
	function detectColorScheme(e){
		const bc = getComputedStyle(e).backgroundColor;
		log("backgroundColor:", bc);
		const m = /rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d+))?\)/.exec(bc);
		if (! m){ throw Error("backgroundColor must be rgb(\d+,\d+\d+)"); }
		log("m:", m);
		return [m[1], m[2], m[3]].some(n => n > 50) || m[4] === "0" ? "light" : "dark";
	}
	function darken(){
		log("start darkening");
		const params = new URLSearchParams(location.search);
		let paramColorScheme = params.get("dmn-color-scheme");
		log("paramColorScheme:", paramColorScheme);
		const systemColorScheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? "dark" : "light";
		log("systemColorScheme:", systemColorScheme);
		const requiredColorScheme = (paramColorScheme === "dark" || paramColorScheme === "light") ? paramColorScheme : systemColorScheme;
		log("requiredColorScheme:", requiredColorScheme);
		const detectedColorScheme = detectColorScheme(document.body);
		log("detetedColorScheme:", detectedColorScheme);
		const availableColorScheme = getComputedStyle(document.body).colorScheme.split(" ").filter(e => e);
		log("availableColorScheme:", availableColorScheme);
		if (availableColorScheme.includes(requiredColorScheme)){
			log(`page support ${requiredColorScheme} mode.`, requiredColorScheme === detectedColorScheme ? "nothing to do" : `but detected ${detectedColorScheme} mode! I don't know what to do.`);
			return;
		}
		if (detectedColorScheme === requiredColorScheme){
			log("detected color scheme matches reqired color scheme. nothing to do.");
			return;
		}
		log("required:", requiredColorScheme, "/ detected:", detectedColorScheme);
		if (requiredColorScheme === "dark"){
			const className = "dark-mode-news-dark-mode",
				id = className + "-style",
				buttonId = "dark-mode-news-recovery-button";
			let ng = "img, svg", extraCss = "";
			if (location.hostname === "www.afpbb.com"){
				ng += ", .next-btn, .prev-btn, .num-main, .thumbtitle";
			}
			else if (location.hostname === "www.bloomberg.co.jp"){
				ng += ", .navi-search";
			}
			else if (/\breuters.com$/.test(location.hostname)){
				ng += ", #fusion-app *";
				extraCss = `
				.dark-mode-news-dark-mode #fusion-app, .dark-mode-news-dark-mode [class^="site-header__main-bar"], .dark-mode-news-dark-mode [class^="nav-dropdown__inner"]{
					background-color: Canvas;
					color: CanvasText;
					color-scheme: dark;
				}
				.dark-mode-news-dark-mode [class*="text-module__dark-grey"], .dark-mode-news-dark-mode [class*="text-module__inherit-color"], .dark-mode-news-dark-mode [class*="text-module__black"], .dark-mode-news-dark-mode [class*="text-module__light"] {
					color:CanvasText;
				}
				`;
			}
			let cssText = `
				 body.${className} {
					background-color: Canvas;
					color: CanvasText;
					color-scheme: ${requiredColorScheme};
				}
				.${className} *:not(${ng}) {
					background-color: Canvas !important;
					color: CanvasText !important;
				}
				.${className} img, .${className} svg {
					background-color: #808080;
				}
				.${className} a:link {
					color: LinkText !important;
				}
				.${className} a:visited {
					color: VisitedText !important;
				}
				#${buttonId} {
					border: solid 1px;
					width: 32px;
					height: 32px;
					background-image: url('data:image/svg+xml;charset=utf8,<svg xmlns="http://www.w3.org/2000/svg" width="32px" height="32px" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 500 500" preserveAspectRatio="xMinYMin meet" ><rect x="0" y="0" width="500" height="500" style="fill:none;stroke:none;"/><path d="M0,499l499,-499l0,499Z"  style="fill:black;stroke:black;stroke-width:1px"/><path d="M0,0l499,0l-499,499Z" style="fill:white;stroke:black;stroke-width:1px"/></svg>');
					padding: initial;
					position: fixed;
					bottom: 10px;
					right: 10px;
					z-index:2147483647;
				}` + extraCss;
			let e = document.createElement("style");
			e.id = id;
			e.textContent = cssText;
			document.getElementsByTagName("head")[0].append(e);
			document.body.classList.add(className);
			log("changed color scheme. okay?");
			e = document.createElement("div");
			e.id = buttonId;
			e.addEventListener("click", ev =>{
				document.body.classList.toggle(className);
			});
			document.body.append(e);
			// some page sets class attribute later.
			const observer = new MutationObserver((mutations, observer)=>{
				mutations.forEach((m,i)=>{
					if (m.type === "attributes"){
						if (m.attributeName === "class"){
							if (! document.body.classList.contains(className)){
								observer.disconnect();
								log("className removed. adding name again.");
								document.body.classList.add(className);
							}
						}
					};
				});
			});
			observer.observe(document.body, {attributes: true});
			setTimeout(function(){ observer.disconnect(); }, 1000);
			log("monitoring document.body attributes");
			if (paramColorScheme){
				const fixLink = function (a){
					const url = new URL(a.href);
					if ((url.hostname === location.hostname) || [url.hostname, location.hostname].every(e => /\.nhk\.or\.jp$/.test(e))){
						const params = new URLSearchParams(url.search), name = "dmn-color-scheme";
						if (! params.has(name)){
							params.append(name, paramColorScheme);
							url.search = params.toString();
							a.href = url.href;
						}
					}
				};
				const fixLinks = function(recured){
					if (! recured){
						// Some sites add links or change link parameters later
						if (/forbesjapan\.com|\.nhk\.or\.jp|jp\.reuters\.com|www\.yomiuri\.co\.jp/.test(location.hostname)){
							setTimeout(fixLinks, 1000, true);
							return;
						}
					}
					Array.from(document.links).forEach(a => fixLink(a));
					log("fixed links");
				};
				if (document.readyState === "loading"){
					document.addEventListener("DOMContentLoaded", ev => fixLinks());
					log("waiting DOMContentLoaded event");
				}
				else {
					fixLinks();
				}
			}
		}
	}
	if (document.body){ darken(); }
	else {
		new MutationObserver((mutations, observer)=>{
			mutations.forEach((m,i)=>{
				if (m.type !== "childList"){ return; }
				m.addedNodes.forEach(n =>{
					if (! (n && n.nodeType === Node.ELEMENT_NODE)){ return; }
					if (n.tagName === "BODY"){
						log("got body");
						observer.disconnect();
						(function checkBody(){
							document.body ? darken() : setTimeout(checkBody, 0);
						})();
					}
				});
			});
		}).observe(document.documentElement, {childList: true});
		log("monitoring mutation");
	}
})();
