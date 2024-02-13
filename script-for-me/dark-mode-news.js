//==========================================================
//name dark mode news
//matches https://www.jiji.com/*, https://www.47news.jp/*, https://www.yomiuri.co.jp/*, https://www.asahi.com/*, https://mainichi.jp/*, https://*.nhk.or.jp/*, https://www.nikkei.com/*, https://www.cnn.co.jp/*, https://www.bbc.com/*, https://www.afpbb.com/*, https://forbesjapan.com/*, https://news.yahoo.co.jp/*, https://www.bloomberg.co.jp/*
//option start
//js
(function(){
	function log(){
		console.log.apply(console,["[dark mode news]"].concat(Array.from(arguments)));
	}
	log("started");
	function darken(){
		if (window.matchMedia('(prefers-color-scheme: dark)').matches){
			const bc = getComputedStyle(document.body).backgroundColor;
			log("backgroundColor:", bc);
			let m = /rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d+))?\)/.exec(bc);
			if (! m){ throw Error("backgroundColor must be rgb(\d+,\d+\d+)"); }
			log("m:", m);
			if ([m[1], m[2], m[3]].some(n => n > 50) || m[4] === "0"){
				log("got light mode");
				const className = "yobukodori-dark-mode",
					id = className + "-style";
				let e = document.createElement("style");
				e.id = id;
				e.textContent = `
					 body.${className} {
						background-color: Canvas;
						color: CanvasText;
						color-scheme: dark;
					}
					.${className} * {
						background-color: Canvas !important;
						color: CanvasText !important;
					}
					.${className} a:link {
						color: LinkText !important;
					}
					.${className} a:visited {
						color: VisitedText !important;
					}
					`;
				document.getElementsByTagName("head")[0].append(e);
				document.body.classList.add(className);
				new MutationObserver((mutations, observer)=>{
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
				}).observe(document.body, {attributes: true});
				log("monitoring document.body attributes");
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
						document.body ? darken() : setTimeout(darken, 0);
					}
				});
			});
		}).observe(document.documentElement, {childList: true});
		log("monitoring mutation");
	}
})();
