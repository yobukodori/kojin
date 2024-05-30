const settings = {
	profiles: null,
	data: {
		colorScheme: "auto",
		displayUnvisitedArticleTitlesInCanvasTextInLightMode: false,
		displayUnvisitedArticleTitlesInCanvasTextInDarkMode: false,
		workWithDarkModeNews: false,
		ngChannel: {},
		titleFilter: "",
		ngYahooCategory: {},
		yahooGetSource: false,
		yahooMediaFilter: "",
		afpbbNgCategory: {},
		mainichiExcludeSponichi: false,
		compareDatesOnSameUrl: false,
		excludePayedArticle: false,
		yomiuriUrlFilter: "",
		wedgeAuthorFilter: "",
	},
	getActiveChannelCount(){
		return Object.keys(this.profiles).length - Object.keys(this.data.ngChannel).length;
	},
	get colorScheme(){
		return this.data.colorScheme;
	},
	get displayUnvisitedArticleTitlesInCanvasTextInLightMode(){
		return this.data.displayUnvisitedArticleTitlesInCanvasTextInLightMode;
	},
	get displayUnvisitedArticleTitlesInCanvasTextInDarkMode(){
		return this.data.displayUnvisitedArticleTitlesInCanvasTextInDarkMode;
	},
	get workWithDarkModeNews(){
		return this.data.workWithDarkModeNews;
	},
	get mainichiExcludeSponichi(){
		return this.data.mainichiExcludeSponichi;
	},
	needsToExcludePayedArticle(){
		return this.data.excludePayedArticle;
	},
	needsToGetYahooSource(){
		return this.data.yahooGetSource;
	},
	needsToMarkNewOnSameUrl(){
		return this.data.compareDatesOnSameUrl;
	},
	load(){
		let v = localStorage.getItem("settings");
		if (v){
			this.data = Object.assign(this.data, JSON.parse(v));
		}
	},
	save(){
		localStorage.setItem("settings", JSON.stringify(this.data));
	},
	isNgChannel(id){
		return this.data.ngChannel[id];
	},
	isActiveChannel(id){
		return ! this.isNgChannel(id);
	},
	isNgTitle(title){
		return this.data.titleFilter ? new Filter(this.data.titleFilter).match(title) : false;
	},
	isAfpbbNgCategory(name){
		return this.data.afpbbNgCategory[name];
	},
	isYomiuriNgUrl(url){
		if (this.data.yomiuriUrlFilter){
			return new Filter(this.data.yomiuriUrlFilter).match(url);
		}
	},
	isYahooNgCategory(id){
		return this.data.ngYahooCategory[id];
	},
	isYahooNgMeida(title){
		return this.data.yahooMediaFilter ? new Filter(this.data.yahooMediaFilter).match(title) : false;
	},
	isWedgeNgAuthor(author){
		return this.data.wedgeAuthorFilter ? new Filter(this.data.wedgeAuthorFilter).match(author||"") : false;
	},
	init(profiles){
		this.profiles = profiles;
		this.load();
		window.addEventListener("beforeunload", ev => this.save());
	},
	open(){
		const id = "settings-modal";
		if (document.getElementById(id)){ throw Error("settings.open already opened"); }
		const modal = document.createElement("div");
		modal.id = id;
		modal.insertAdjacentHTML("beforeend", 
`
<div id="settings-content">
	<div id="settings-bar">
	<button class="settings-close">閉じる</button>
	</div>
	<div id="settings-color-scheme">
		<label for="color-scheme">カラースキーム:</label>
		<select id="color-scheme">
		<option value="auto">システム設定に従う</option>
		<option value="light">ライトモード</option>
		<option value="dark">ダークモード</option>
		</select>
		<div><input type="checkbox" id="display-unvisited-article-titles-in-canvas-text-in-light-mode">
			<label for="display-unvisited-article-titles-in-canvas-text-in-light-mode"><b>ライトモード時未訪問の記事タイトルを通常の文字色（黒）で表示する</b></label></div>
		<div><input type="checkbox" id="display-unvisited-article-titles-in-canvas-text-in-dark-mode">
			<label for="display-unvisited-article-titles-in-canvas-text-in-dark-mode"><b>ダークモード時未訪問の記事タイトルを通常の文字色（白）で表示する</b></label></div>
		<div><input type="checkbox" id="work-with-dark-mode-news">
			<label for="work-with-dark-mode-news"><b>URL に dark mode news 用パラメータを付加する</b></label></div>
	</div>
	<div id="settings-channels">
		<b>チャンネル選択</b><button class="set-all">すべて選択</button><button class="clear-all">すべて解除</button>
		<div class="container checkbox">
		</div>
	</div>
	<div id="settings-title-filter">
		<b>タイトルが次のフィルタに一致する記事を除外する</b>
		<div><textarea rows="5" spellcheck="false"></textarea></div>
	</div>
	<div>
		<div><input type="checkbox" id="exclude-payed-article">
			<label for="exclude-payed-article"><b>有料記事を除外する</b></label></div>
	</div>
	<div>
		<div><input type="checkbox" id="afpbb-exclude-sports">
			<label for="afpbb-exclude-sports"><b>AFPBBのスポーツ記事を除外する</b></label></div>
	</div>
	<div>
		<div><input type="checkbox" id="mainichi-exclude-sponichi">
			<label for="mainichi-exclude-sponichi"><b>毎日新聞のスポニチ提供記事を除外する</b></label></div>
	</div>
	<div>
		<div><input type="checkbox" id="compare-dates-on-same-url">
			<label for="compare-dates-on-same-url"><b>記事URLが同じでも日付が新しければ新着とする</b></label></div>
	</div>
	<div class="channel yomiuri">
		<b>読売新聞設定</b>
		<div class="filter url">
			<b>記事 URL が次のフィルタに一致する記事を除外する</b>
			<div><textarea rows="1" spellcheck="false"></textarea></div>
		</div>
	</div>
	<div id="settings-yahoo">
		<b>Yahoo!ニュース設定</b>
		<div id="settings-yahoo-categories">
			<b>カテゴリー選択</b>
			<div class="container checkbox">
			</div>
		</div>
		<div>
			<div><input type="checkbox" id="sy-get-source">
				<label for="sy-get-source"><b>元記事のタイトルとメディア名を取得する</b></label></div>
		</div>
		<div id="settings-yahoo-media-filter">
			<b>メディア名が次のフィルタに一致する記事を除外する</b>
			<div><textarea rows="5" spellcheck="false"></textarea></div>
		</div>
	</div>
	<div class="channel wedge">
		<b>Wedge ONLINE 設定</b>
		<div class="filter author">
			<b>執筆者が次のフィルタに一致する記事を除外する</b>
			<div><textarea rows="1" spellcheck="false"></textarea></div>
		</div>
	</div>
</div>
`
		);
		const dlg = modal.querySelector('#settings-content');
		// カラースキーム
		let e = dlg.querySelector("#color-scheme"), colorScheme = e;
		for (let i = 0 ; i < e.options.length ; i++){
			if (e.options[i].value === this.data.colorScheme){
				e.options[i].selected = true;
				break;
			}
		}
		e.addEventListener("change", ev =>{
			// ng: = e.value 呼ばれるときには e には別の値が入っている
			this.data.colorScheme = colorScheme.value;
		});
		// ライトモード時未訪問の記事タイトルをリンクを表す文字色ではなく通常の文字色で表示
		e = dlg.querySelector("#display-unvisited-article-titles-in-canvas-text-in-light-mode");
		this.data.displayUnvisitedArticleTitlesInCanvasTextInLightMode && (e.checked = true);
		e.addEventListener("change", ev =>{
			this.data.displayUnvisitedArticleTitlesInCanvasTextInLightMode = ev.target.checked ? true : false;
		});
		// ダークモード時未訪問の記事タイトルをリンクを表す文字色ではなく通常の文字色で表示
		e = dlg.querySelector("#display-unvisited-article-titles-in-canvas-text-in-dark-mode");
		this.data.displayUnvisitedArticleTitlesInCanvasTextInDarkMode && (e.checked = true);
		e.addEventListener("change", ev =>{
			this.data.displayUnvisitedArticleTitlesInCanvasTextInDarkMode = ev.target.checked ? true : false;
		});
		// URL に dark mode new 用パラメータを付加
		e = dlg.querySelector("#work-with-dark-mode-news");
		this.data.workWithDarkModeNews && (e.checked = true);
		e.addEventListener("change", ev =>{
			this.data.workWithDarkModeNews = ev.target.checked ? true : false;
		});
		// チャンネル選択
		let c = dlg.querySelector('#settings-channels > .container'), yahoo;
		Object.keys(this.profiles).forEach(k =>{
			const prof = this.profiles[k], id = prof.id;
			if (id === "yahoo"){ yahoo = prof; }
			let checked = this.isActiveChannel(id) ? "checked" : "";
			c.insertAdjacentHTML("beforeend", 
			`<div><input type="checkbox" id="ch-${id}" ${checked}><label for="ch-${id}">${prof.name}</label></div>`);
			c.querySelector("#ch-" + id).addEventListener("change", ev =>{
				ev.target.checked ? delete this.data.ngChannel[id] : this.data.ngChannel[id] = true;
			});
		});
		dlg.querySelector('#settings-channels button.set-all').addEventListener("click", ev =>{
			dlg.querySelectorAll('#settings-channels > .container input').forEach(e =>{
				! e.checked && e.click();
			});
		});
		dlg.querySelector('#settings-channels button.clear-all').addEventListener("click", ev =>{
			dlg.querySelectorAll('#settings-channels > .container input').forEach(e =>{
				e.checked && e.click();
			});
		});
		// タイトルフィルタ
		let tfilter = dlg.querySelector("#settings-title-filter textarea");
		tfilter.value = this.data.titleFilter || "";
		const updateTitleFilter = function(){
			const v = tfilter.value.trim(), f = v && new Filter(v);
			if (f && f.error){
				alert("タイトルフィルタが不正です。" + f.error);
				return false;
			}
			settings.data.titleFilter = v;
			return true;
		};
		tfilter.addEventListener("blur", ev =>{
			updateTitleFilter();
		});
		// 有料記事を除外
		e = dlg.querySelector("#exclude-payed-article");
		this.data.excludePayedArticle && (e.checked = true);
		e.addEventListener("change", ev =>{
			this.data.excludePayedArticle = ev.target.checked ? true : false;
		});
		// AFPBBスポーツ記事除外
		e = dlg.querySelector("#afpbb-exclude-sports");
		this.data.afpbbNgCategory.sports && (e.checked = true);
		e.addEventListener("change", ev =>{
			this.data.afpbbNgCategory.sports = ev.target.checked ? true : false;
		});
		// 毎日のスポニチ提供記事除外
		e = dlg.querySelector("#mainichi-exclude-sponichi");
		this.data.mainichiExcludeSponichi && (e.checked = true);
		e.addEventListener("change", ev =>{
			this.data.mainichiExcludeSponichi = ev.target.checked ? true : false;
		});
		// 同一URLの場合日付を比較
		e = dlg.querySelector("#compare-dates-on-same-url");
		this.data.compareDatesOnSameUrl && (e.checked = true);
		e.addEventListener("change", ev =>{
			this.data.compareDatesOnSameUrl = ev.target.checked ? true : false;
		});
		// 読売新聞記事URLフィルター
		let ymfilter = dlg.querySelector(".channel.yomiuri .filter.url textarea");
		ymfilter.value = this.data.yomiuriUrlFilter || "";
		const updateYomiuriUrlFilter = function(){
			const v = ymfilter.value.trim(), f = v && new Filter(v);
			if (f && f.error){
				alert("読売記事 URL フィルタが不正です。" + f.error);
				return false;
			}
			settings.data.yomiuriUrlFilter = v;
			return true;
		};
		ymfilter.addEventListener("blur", ev =>{
			updateYomiuriUrlFilter();
		});
		// Yahoo カテゴリ選択
		c = dlg.querySelector('#settings-yahoo-categories > .container');
		yahoo.categories.forEach(ca =>{
			let id = ca.id, checked = this.isYahooNgCategory(id) ? "" : "checked";
			c.insertAdjacentHTML("beforeend", 
			`<div><input type="checkbox" id="yca-${id}" ${checked}><label for="yca-${id}">${ca.name}</label></div>`);
			c.querySelector("#yca-" + id).addEventListener("change", ev =>{
				ev.target.checked ? delete this.data.ngYahooCategory[id] : this.data.ngYahooCategory[id] = true;
			});
		});
		// Yahoo ソース取得
		e = dlg.querySelector("#sy-get-source");
		this.data.yahooGetSource && (e.checked = true);
		e.addEventListener("change", ev =>{
			this.data.yahooGetSource = ev.target.checked ? true : false;
		});
		// Yahoo メディアフィルタ
		let yfilter = dlg.querySelector("#settings-yahoo-media-filter textarea");
		yfilter.value = this.data.yahooMediaFilter || "";
		const updateYahooMediaFilter = function(){
			const v = yfilter.value.trim(), f = v && new Filter(v);
			if (f && f.error){
				alert("Yahooメディアフィルタが不正です。" + f.error);
				return false;
			}
			settings.data.yahooMediaFilter = v;
			return true;
		};
		yfilter.addEventListener("blur", ev =>{
			updateYahooMediaFilter();
		});
		// Wedge執筆者フィルタ
		let wdFilter = dlg.querySelector(".channel.wedge .filter.author textarea");
		wdFilter.value = this.data.wedgeAuthorFilter || "";
		const updateWedgeAuthorFilter = function(){
			const v = wdFilter.value.trim(), f = v && new Filter(v);
			if (f && f.error){
				alert("Wedge 執筆者フィルタが不正です。" + f.error);
				return false;
			}
			settings.data.wedgeAuthorFilter = v;
			return true;
		};
		wdFilter.addEventListener("blur", ev =>{
			updateWedgeAuthorFilter();
		});
		
		let onkeydown, cleanup, close, resolve;
		onkeydown = function(ev){
			if (document.elementFromPoint(0,0) === modal){
				ev.key === "Escape" && cleanup();
			}
		}; 
		document.addEventListener("keydown", onkeydown);
		cleanup = function(){
			document.removeEventListener("keydown", onkeydown);
			modal.remove();
			setTimeout(resolve, 0, true);
		};
		close = function(){
			let error = 0;
			[updateTitleFilter, updateYomiuriUrlFilter, updateYahooMediaFilter, updateWedgeAuthorFilter].forEach(update =>{
				! update() && error++;
			});
			if (error){ return; }
			cleanup();
			settings.save();
		};
		modal.querySelector('button.settings-close').addEventListener("click", ev => close());
		modal.addEventListener("click", ev => close());
		dlg.addEventListener("click", ev => ev.stopPropagation());

		document.body.appendChild(modal);
		
		return new Promise((_resolve, reject)=>{
			resolve = _resolve;
		});
	},
};
