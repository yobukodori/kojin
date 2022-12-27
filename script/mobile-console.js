(function(){
	const MobileConsole = class {
		constructor(){
			this.id = "ybkdr-mobile-console";
			this.elem = document.createElement("textarea");
			this.elem.id = this.id;
			this.elem.style = "width:98%; height: 10em;";
			let container = document.querySelector('div[data-testid="primaryColumn"]');
			(container || document.body || document.documentElement).appendChild(this.elem);
		}
		log(){
			for (let i = 0 ; i < arguments.length ; i++){
				this.elem.textContent += (i > 0 ? " " : "") + arguments[i];
			}
			this.elem.textContent += "\r\n";
		}
	};
	let mobile = navigator.userAgent.includes("Android");
	if (mobile){
		const consoleLog = console.log, mconsole = new MobileConsole();
		console.log = new Proxy(console.log, {
			apply: function(target, thisArg, args) {
				mconsole.log.apply(mconsole, args);
			},
		});
	}
})();
