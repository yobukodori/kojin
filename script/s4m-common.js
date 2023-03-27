//==========================================================
//name Fix google search result redirection
//matches https://*.google.com/search?*,https://*.google.co.jp/search?*
//options
{ "wrapCodeInScriptTag":true, "runAt":"document_start" }
//js
(function() {
	function log(){
		console.log.apply(console,["[Fix google search result redirection]"].concat(Array.from(arguments)));
	}
	log("running on", location.origin + location.pathname);
	const obj = HTMLAnchorElement.prototype, prop = "href";
	const {get, set} = Object.getOwnPropertyDescriptor(obj, prop);
	if (get && set){
		Object.defineProperty(obj, prop, {
			get(){ return get.call(this); },
			set(v){ return v; }
		});
		log("protected HTMLAnchorElement.prototype.href");
	}
})();
