//==========================================================
//name Fix google search results link redirection
//matches https://*.google.com/search?*,https://*.google.co.jp/search?*
//option page, end
//js
(function(){
	function log(){
		console.log.apply(console,["[Fix google search result redirection]"].concat(Array.from(arguments)));
	}
	log("started");
	let footer = new Set(), fixed = 0;
	document.querySelectorAll('footer a[href^="/url?"]').forEach(a => footer.add(a));
	document.querySelectorAll('a[href^="/url?"]').forEach((a, i) =>{
		if (footer.has(a)){ return; }
		const params = new URLSearchParams(new URL(a.href).search);
		const href = params.get("q") || params.get("url");
		try { href && new URL(href) && (a.href = href, fixed++); } catch(e){}
	});
	fixed && log("fixed", fixed, "redirection");
	const obj = HTMLAnchorElement.prototype, prop = "href";
	const {get, set} = Object.getOwnPropertyDescriptor(obj, prop);
	if (get && set){
		Object.defineProperty(obj, prop, {
			get(){ return get.call(this); },
			set(v){ return v; }
		});
		log("protected HTMLAnchorElement.prototype.href");
	}
	EventTarget.prototype.addEventListener = new Proxy(EventTarget.prototype.addEventListener, {
        apply: function(target, thisArg, args ) {
			args[0] !== "click" && Reflect.apply(target, thisArg, args);
		}
	});
})();