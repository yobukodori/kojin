//name dark mode every
//; v.1.0.0 beta
//matches https://*/*, http://*/*
//exclude https://www.jiji.com/*, https://www.47news.jp/*, https://www.yomiuri.co.jp/*, https://www.asahi.com/*, https://mainichi.jp/*, https://*.nhk.or.jp/*, https://www.nikkei.com/*, https://jp.reuters.com/*, https://www.cnn.co.jp/*, https://www.bbc.com/*, https://www.afpbb.com/*, https://forbesjapan.com/*, https://news.yahoo.co.jp/*, https://www.bloomberg.co.jp/*, https://wedge.ismedia.jp/*, https://github.com/*, https://yobukodori.github.io/kojin/j-news-reader/*, https://twitter.com/*, https://www.jma.go.jp/bosai/*
//option start
//js
(function(){
	function log(){
		console.log.apply(console,["[dark mode every]"].concat(Array.from(arguments)));
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
		const appId = "dark-mode-every", paramName = appId + "-color-scheme";
		const params = new URLSearchParams(location.search);
		let paramColorScheme = params.get("dmn-color-scheme");
		paramColorScheme = "auto";
		log("paramColorScheme:", paramColorScheme);
		const systemColorScheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? "dark" : "light";
		log("systemColorScheme:", systemColorScheme);
		const requiredColorScheme = (paramColorScheme === "dark" || paramColorScheme === "light") ? paramColorScheme : systemColorScheme;
		log("requiredColorScheme:", requiredColorScheme);
		const detectedColorScheme = detectColorScheme(document.body);
		log("detetedColorScheme:", detectedColorScheme);
		const availableColorScheme = getComputedStyle(document.body).colorScheme.split(" ").filter(e => e);
		log("availableColorScheme:", availableColorScheme);
		const darkClassName = appId + "-dark-mode",
			buttonId = appId + "-toggle-button";
		const injectDarkModeCSS = function(){
			let e = document.createElement("style");
			e.id = darkClassName + "-style";
			e.textContent = `
				 body.${darkClassName} {
					background-color: Canvas;
					color: CanvasText;
					color-scheme: ${requiredColorScheme};
				}
				.${darkClassName} *:not(img, svg) {
					background-color: Canvas !important;
					color: CanvasText !important;
				}
				.${darkClassName} img, .${darkClassName} svg {
					background-color: #808080;
				}
				.${darkClassName} a:link {
					color: LinkText !important;
				}
				.${darkClassName} a:visited {
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
				}
				`;
			document.getElementsByTagName("head")[0].append(e);
		};
		const pageSupportDarkMode = availableColorScheme.includes("dark");
		const toggleColorScheme = function(){
			if (pageSupportDarkMode){
				const another = availableColorScheme.include("light") ? "light" : availableColorScheme.find(e => e !== "dark") || "";
				document.body.style.colorScheme = detectColorScheme(document.body) !== "dark" ? "dark" : another;
				log("body color-scheme:", document.body.style.colorScheme);
			}
			else {
				if (detectColorScheme(document.body) === "dark"){
					document.body.classList.remove(darkClassName);
					log("body.classList.remove", darkClassName);
				}
				else {
					if (/\b5ch\.net$/.test(location.hostname) && /android/i.test(navigator.userAgent)){
						setTimeout(function(){ document.body.classList.add(darkClassName); }, 0);
					}
					else {
						document.body.classList.add(darkClassName);
					}
					log("body.classList.add", darkClassName);
				}
			}
		};
		const injectToggleButton = function(){
 			let e = document.createElement("div");
			e.id = buttonId;
			e.addEventListener("click", ev => toggleColorScheme());
			document.body.append(e);
			log("added toggle button");
		};
		if (detectedColorScheme === requiredColorScheme){
			log("detected color scheme matches reqired color scheme. nothing to do.");
			return;
		}
		log("required:", requiredColorScheme, "/ detected:", detectedColorScheme);
		if (pageSupportDarkMode){
			log("page support dark mode");
			//, requiredColorScheme === detectedColorScheme ? "nothing to do" : `but detected ${detectedColorScheme} mode! I don't know what to do.`);
		}
		else {
			injectDarkModeCSS();
			log("injected dark mode css");
		}
		injectToggleButton();
		if (requiredColorScheme === "dark"){
			toggleColorScheme();
			// some page sets class attribute later.
			const observer = new MutationObserver((mutations, observer)=>{
				mutations.forEach((m,i)=>{
					if (m.type === "attributes"){
						if (m.attributeName === "class"){
							if (! document.body.classList.contains(darkClassName)){
								observer.disconnect();
								log("darkClassName removed. adding name again.");
								document.body.classList.add(darkClassName);
							}
						}
					};
				});
			});
			observer.observe(document.body, {attributes: true});
			setTimeout(function(){ observer.disconnect(); }, 1000);
			log("monitoring document.body attributes");
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
