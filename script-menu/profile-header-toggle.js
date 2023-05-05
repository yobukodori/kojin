//name プロフヘッダ表示トグル
//matches https://twitter.com/*, https://mobile.twitter.com/*
//js
(function(){
	let id = "profile-header-display-toggle", e;
	if (document.getElementById(id)){ return; }
	if (e = document.querySelector('nav[aria-label="プロフィールタイムライン"]')){
		let header = e.previousElementSibling;
		let btnPosition = document.querySelector('div[data-testid="primaryColumn"] h2 + div, div[data-testid="TopNavBar"] h2 + div');
		if (btnPosition){
			let btn = document.createElement("button");
			btn.id = id;
			btn.textContent = "ヘッダ表示";
			btn.addEventListener("click", ev =>{
				if (header.style.display === ""){
					header.style.display = "none";
					btn.textContent = "ヘッダ表示";
				}
				else {
					header.style.display = "";
					btn.textContent = "ヘッダ非表示";
				}
			});
			btnPosition.append(btn);
			header.style.display = "none";
		}
	}
})();
