const settings = {
	profiles: null,
	data: {
		ngChannel: {},
		titleFilter: "",
		ngYahooCategory: {},
		yahooGetSource: false,
		yahooMediaFilter: "",
		afpbbNgCategory: {},
		compareDatesOnSameUrl: false,
	},
	getActiveChannelCount(){
		return Object.keys(this.profiles).length - Object.keys(this.data.ngChannel).length;
	},
	needsToGetYahooSource(){
		return this.data.yahooGetSource;
	},
	needsToCompareDatesOnSameUrl(){
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
	isNgYahooCategory(id){
		return this.data.ngYahooCategory[id];
	},
	isActiveYahooCategory(id){
		return ! this.isNgYahooCategory(id);
	},
	isNgYahooMeida(title){
		return this.data.yahooMediaFilter ? new Filter(this.data.yahooMediaFilter).match(title) : false;
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
		<div><input type="checkbox" id="afpbb-exclude-sports">
			<label for="sy-get-source"><b>AFPBBのスポーツ記事を除外する</b></label></div>
	</div>
	<div>
		<div><input type="checkbox" id="compare-dates-on-same-url">
			<label for="sy-get-source"><b>記事URLが同じでも日付が新しければ新着とする</b></label></div>
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
</div>
`
		);
		const dlg = modal.querySelector('#settings-content');
		// チャンネル選択
		let e, c = dlg.querySelector('#settings-channels > .container'), yahoo;
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
		// AFPBBスポーツ記事除外
		e = dlg.querySelector("#afpbb-exclude-sports");
		this.data.afpbbNgCategory.sports && (e.checked = true);
		e.addEventListener("change", ev =>{
			this.data.afpbbNgCategory.sports = ev.target.checked ? true : false;
		});
		// 同一URLの場合日付を比較
		e = dlg.querySelector("#compare-dates-on-same-url");
		this.data.compareDatesOnSameUrl && (e.checked = true);
		e.addEventListener("change", ev =>{
			this.data.compareDatesOnSameUrl = ev.target.checked ? true : false;
		});
		// Yahoo カテゴリ選択
		c = dlg.querySelector('#settings-yahoo-categories > .container');
		yahoo.categories.forEach(ca =>{
			let id = ca.id, checked = this.isActiveYahooCategory(id) ? "checked" : "";
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
		const updateYahoFilter = function(){
			const v = yfilter.value.trim(), f = v && new Filter(v);
			if (f && f.error){
				alert("Yahooメディアフィルタが不正です。" + f.error);
				return false;
			}
			settings.data.yahooMediaFilter = v;
			return true;
		};
		yfilter.addEventListener("blur", ev =>{
			updateYahoFilter();
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
			let t = updateTitleFilter(), y = updateYahoFilter();
			if (! (t && y)){ return; }
			cleanup();
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
