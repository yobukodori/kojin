//==========================================================
//name 翻訳
//js
(function(){
	let url, src = getSelection().toString();
	if (src){
		url = "https://translate.google.co.jp/?sl=auto&tl=ja&op=translate" + "&text=" + encodeURIComponent(src);
	}
	else {
		url = "https://translate.google.com/translate?sl=auto&tl=ja&u=" + encodeURIComponent(location.href);
	}
	let a = document.createElement("a");
	a.textContent = (src ? "テキスト":"ページ") + "翻訳";
	a.href = url;
	a.target = "_blank";
	let is_pc = ! navigator.userAgent.includes("Android"),
		position = is_pc ? " top:0; right:0;" : " top:50%; left:50%; transform: translate(-50%,-50%);";
	a.style.cssText = "position:fixed;" + position + " padding:0.5em 1em; font-size:large; background-color:#ffff88; border:solid; z-index:2147483647;";
	a.addEventListener("click", ev=> a.remove());
	document.addEventListener("click", ev => a.remove());
	document.body.appendChild(a);
})();
//==========================================================
//name ダーク／ライト モード切替
//js
(function(){
	"use strict";
	const html = document.documentElement, elem = document.body, dark = "ex-dark-mode";
	if (! html.classList.contains("toggle-dark-mode-ready")){
		html.classList.add("toggle-dark-mode-ready");
		elem.style.backgroundColor = "Canvas";
		elem.style.color = "CanvasText";
		let e = document.createElement("style");
		e.textContent = `body.ex-dark-mode *{
				background-color: Canvas !important;
				color: CanvasText !important;
			}`;
		document.getElementsByTagName("head")[0].append(e);
		const bc = getComputedStyle(document.body).backgroundColor;
		let m = /rgb\((\d+),\s*(\d+),\s*(\d+)\)/.exec(bc);
		const darkMode = m && [m[1], m[2], m[3]].every(n => n*1 < 50);
		// window.matchMedia('(prefers-color-scheme: dark)').matches){
		if (darkMode){
			elem.style.colorScheme = "dark";
			elem.classList.add(dark);
		}
		else {
			elem.style.colorScheme = "light";
		}
	}
	elem.classList.toggle(dark)
	elem.style.colorScheme = elem.classList.contains(dark) ? "dark" : "light";
})();
//==========================================================
//name 自由を！
//js
https://yobukodori.github.io/freedom/enable_disabled.user.js
//==========================================================
//name リンクは新しいタブで開く
//js
(function(){
    function underline(e){
        e.style.textDecoration = "underline";
        let e2 = e.querySelector('dd') || e.querySelector('p');
        e2 && e2.setAttribute("style", "text-decoration: underline;");
    }
    Array.from(document.links).forEach(a=>{
        let href = a.getAttribute("href");
        if (href && ! /^(javascript|blob|data):/.test(href) && href.charAt(0) !== "#"){
            if (a.target !== "_blank"){
                a.target = "_blank";
                underline(a);
            }
        }
    });
})();
//==========================================================
//name outerHTMLを表示
//js
builtin:view-outerhtml
//==========================================================
