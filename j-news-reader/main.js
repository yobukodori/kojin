const jnr = {
	appVer: "1.0.a",
	updateInterval: 5 * 60 * 1000,
};

function alert(msg){
	const id = "alert-modal";
	let modal = document.getElementById(id);
	if (! modal){
		modal = document.createElement("div");
		modal.id = id;
		
		let onkeydown, cleanup;
		onkeydown = function(ev){
			if (document.elementFromPoint(0,0) === modal){
				ev.key === "Escape" && cleanup();
			}
		}; 
		document.addEventListener("keydown", onkeydown);
		cleanup = function(){
			document.removeEventListener("keydown", onkeydown);
			modal.remove();
		};
		modal.addEventListener("click", ev => cleanup());
		
		modal.append(document.createElement("div"));
		document.body.appendChild(modal);
	}
	let m = document.createElement("div");
	msg.split("\n").forEach((line,i) =>{
		if (i > 0){ m.appendChild(document.createElement("br")); }
		let span = document.createElement("span");
		span.appendChild(document.createTextNode(line));
		m.appendChild(span);
	});
	modal.firstElementChild.appendChild(m);
}

function notify(n){
	let r = /^(🆕\s)?(.+)/.exec(document.title);
	r && (document.title = (n.new ? "🆕 " : "") + r[2]);
}

function sortedIndex(array, value, opts) {
	opts = opts || {};
    var low = 0,
        high = array.length;
    while (low < high) {
        var mid = (low + high) >>> 1;
        if (opts.descending ? array[mid] > value :  value > array[mid]) low = mid + 1;
        else high = mid;
    }
    return low;
}

function showStatus(){
	let text = "";
	Array.from(arguments).forEach(e => text += " " + e);
	document.getElementById("status").textContent = text.substring(1);
}

function showStatistics(){
	let container = document.getElementById('items'), displaying = 0, news = 0, ng = 0;
	Array.from(container.children).forEach(e => {
		e.offsetParent && ++displaying;
		e.classList.contains("new") && ++news;
		e.classList.contains("x-settings-filter") && ++ng;
	});
	showStatus("記事総数:" + container.children.length, "新着:" + news, "除外:" + ng, "表示中:" + displaying );
}

function showUpdateTime(datetime){
	document.getElementById("update-time").textContent = new Date(datetime).toLocaleTimeString();
}

function canonicalizeMediaName(name){
	const table = {
		"時事通信 jiji.com": /jiji\.com|時事通信/,
		"共同通信 47NEWS": /47NEWS|共同通信/,
		"読売新聞": /読売新聞/,
		"朝日新聞": /朝日新聞/,
		"毎日新聞": /毎日新聞/,
		"NHK": /NHK/,
		"ロイター": /ロイター/,
		"CNN": /CNN/,
		"BBC": /BBC/,
		"AFPBB": /AFPBB|ＡＦＰ/,
		"ブルームバーグ": /ブルームバーグ|Bloomberg/,
		"フォーブス": /Forbes/,
		"AP通信": /AP通信/,
	};
	const ar = Object.keys(table);
	for (let i = 0 ; i < ar.length ; i++){
		let k = ar[i], rex = table[k];
		if (rex.test(name)){ return k; }
	}
	return name;
}

function getCanonicalizedMediaName(item){
	return canonicalizeMediaName((item.dataChannel.yahoo && item.dataItem.media) ? item.dataItem.media : item.dataChannel.title);
}

function updateItemClassByChannel(e){
	const chtitle = document.getElementById("channel-select").value;
	(e.classList.contains("x-settings-filter") ? chtitle === "!filtered" : (! chtitle || (chtitle === "!new" && e.classList.contains("new")) || chtitle === (chtitle.startsWith("Yahoo!") ? e.dataChannel.title : getCanonicalizedMediaName(e)))) ? (e.classList.add("show"), e.classList.remove("x-channel")) : (e.classList.remove("show"), e.classList.add("x-channel"));
}

function isNgItem(item){
	const title = item.dataItem.title;
	return settings.isNgTitle(title) || (item.dataChannel.yahoo && settings.isYahooNgMeida(item.dataItem.media)) || (item.dataProfile.id === "afpbb-latest" && settings.isAfpbbNgCategory(item.dataItem.category)) || (settings.needsToExcludePayedArticle() && item.dataItem.payed) || (item.dataProfile.id === "yomiuri" && settings.isYomiuriNgTag(item.dataItem.tags)); 
}

const sameTitle = function(){
	function han2zen(s){
		return s.replace(/[0-9A-Za-z]/g, c => String.fromCharCode(c.charCodeAt(0) + 0xfee0))
				.replace(/―/g, "　")
				;
	}
	return function(t1, t2){
		return han2zen(t1) === han2zen(t2);
	};
}();

function printRSS(rss, opts){
	opts = opts || {};
	const container = document.getElementById('items'), today = new Date();
	rss.item.forEach(d => {
		logd(d);
		let duplicated;
		if (rss.channel.yahoo){
			duplicated = Array.from(container.children).find(item => item.dataChannel.yahoo && item.dataItem.extra.id === d.extra.id && item.dataItem.link != d.link);
			if (duplicated){
				if (d.extra.articleUrl){ duplicated.remove(); }
				else { return; }
			}
			if (d.media){
				let media = canonicalizeMediaName(d.media);
				duplicated = Array.from(container.children).find(item => ! item.dataChannel.yahoo && sameTitle(item.dataItem.title, d.title) && getCanonicalizedMediaName(item) === media);
				if (duplicated){
					logd("# title duplicated:", d.title+"\n" + duplicated.dataChannel.title, "/ Yahoo", d.media);
					return;
				}
			}
		}
		else {
			let media = canonicalizeMediaName(rss.channel.title);
			duplicated = Array.from(container.children).find(item => item.dataChannel.yahoo && sameTitle(item.dataItem.title, d.title) && getCanonicalizedMediaName(item) === media);
			if (duplicated){
				logd("## replace title duplicated:", d.title+"\nYahoo", duplicated.dataItem.media, "/", rss.channel.title);
				duplicated.remove();
			}
		}
		let markNew = true;
		if ((duplicated = Array.from(container.children).find(item => item.dataItem.link === d.link))){
			if (! d.exact || ! duplicated.dataItem.exact){ return; }
			let datetime = duplicated.dataItem.datetime2 || duplicated.dataItem.datetime;
			if (d.datetime <= datetime){ return; }
			markNew = settings.needsToMarkNewOnSameUrl() || rss.profile.id === "nikkei-bar";
			duplicated.remove();
			logd("# replace url duplicated:", d.title, rss.channel.title + "\nexisting:", duplicated.dataItem.date, "/ new:", d.date, "/ mark new:", markNew);
		}
		const title = document.createElement("a"),
				description = document.createElement("span"),
				channel = document.createElement("a"),
				date = document.createElement("span"),
				item = document.createElement("div");
		title.textContent = (d.title || "(無題)"), title.className = "title";
		d.link && (title.href = d.link), title.target = "_blank";
		item.appendChild(title), item.className = "item";
		description.textContent = d.description || "", description.className = "description";
		channel.append(rss.channel.title + (d.media ? " " + d.media : "")), channel.href = rss.channel.link, channel.className = "channel", channel.target = "_blank";
		date.textContent = d.datetime ? (new Date(d.datetime)).toLocaleString() : (d.date  || ""), date.className = "date";
		item.className = "item", item.append(title, description, channel, date);
		item.dataItem = d, item.dataChannel = rss.channel, item.dataProfile = rss.profile;
		let datetime = item.dataItem.datetime;
		if (datetime === 0){
			let r = /^((\d+)年)?(\d+)月(\d+)日$/.exec(item.dataItem.date);
			r && (item.dataItem.datetime2 = datetime = Date.parse( (r[2] || today.getFullYear()) + "/" + r[3] + "/" +r [4] + " 00:00"));
		}
		isNgItem(item) && item.classList.add("x-settings-filter");
		opts.markNew && markNew && item.classList.add("new");
		updateItemClassByChannel(item);
		let ar = Array.from(container.children).map(item => item.dataItem.datetime2 || item.dataItem.datetime),  i = sortedIndex(ar, datetime, {descending:true});
		while (i < ar.length && datetime === ar[i]){ i++; }
		i < container.children.length ? container.children[i].before(item) : container.append(item);
	});
}

function update(){
	if (jnr.updating){
		alert("update() called when updating");
		return;
	}
	jnr.updating = true;
	const container = document.getElementById('items');
	//Array.from(container.children).forEach(item => item.classList.remove("new"));
	showUpdateTime(jnr.lastUpdateStart = Date.now());
	showStatus("読み込み中・・・");
	//Object.keys(profiles).length
	let total = settings.getActiveChannelCount(),  read = 0;
	jnr.tasks = [];
	Object.keys(profiles).forEach(k => {
		const prof = profiles[k];
		if (settings.isNgChannel(prof.id)){ return; }
		//if (! prof.name.startsWith("jiji.comトップ")){return;}
		logd("channel:", prof);
		let pr = getRSS(prof);
		jnr.tasks.push(pr);
		pr.then(rss => {
			rss.profile = prof, rss.channel.id = prof.id, rss.channel[prof.id] = true;
			if (rss.error){
				alert(`${prof.url} の読み込みに失敗しました：${rss.error}`);
				if (rss.error === "NetworkError when attempting to fetch resource."){
					alert("上記エラーは一般的にクロスドメインリクエストが拒否された場合に発生します。上記 URL へのクロスドメインリクエストが許可されているか確認してください");
				}
				logd("# Error: an error occurred while loading", prof.url, ":",  rss.error);
				return;
			}
			if (rss.itemCount === 0){
				alert(`${prof.url} のページ中に記事を見つけられませんでした`);
				logd("# Error: failed to detect articles in", prof.url);
				return;
			}
			logd("# got rss from", prof.url);
			printRSS(rss, {markNew: !!jnr.lastUpdateEnd});
			if (rss.channel.title){
				const container = document.getElementById('channel-select'),
					ar = Array.from(container.children).map(opt => opt.value.toLowerCase());
				let title = rss.channel.title;
				if (! rss.channel.yahoo){
					title = canonicalizeMediaName(title);
				}
				if (! ar.includes(title.toLowerCase())){
					let e = document.createElement("option");
					e.value = e.textContent = title;
					let i = sortedIndex(ar, e.value.toLowerCase());
					i < container.children.length ? container.children[i].before(e) : container.append(e);
					//container.append(container.querySelector('option[value="!filtered"]'));
				}
			}
			showStatus(++read === total ? "取得結果:" : read + "/" + total + " 読み込み中・・・", container.children.length, "件");
		});
	});
	Promise.allSettled(jnr.tasks).then(values => {
		showStatistics();
		notify({"new": container.querySelectorAll('.item.new').length});
		jnr.lastUpdateEnd = Date.now();
		jnr.updating = false;
		document.getElementById("auto-update").checked && setUpdateTimer();
	});
}

document.getElementById("channel-select").addEventListener("change", ()=>{
	Array.from(document.getElementById('items').children).forEach(e => {
		updateItemClassByChannel(e);
	});
	showStatistics();
});

document.getElementById("update").addEventListener("click", ()=>{
	clearUpdateTimer();
	update();
});

function onUpdateTimer(ev){
	--jnr.updateCounter;
	document.getElementById("update-counter").textContent = jnr.updateCounter;
	if (jnr.updateCounter === 0){
		clearInterval(jnr.updateTimer);
		jnr.updateTimer = null;
		update();
	}
}

function setUpdateTimer(){
	let au = document.getElementById("auto-update"),
		intr = parseInt(document.getElementById("update-interval").value);
	if (isNaN(intr)){
		alert("自動更新間隔分数が不正です。整数を指定してください");
		au.checked = false;
		return;
	}
	document.getElementById("update-counter").textContent = jnr.updateCounter = intr * 60;
	jnr.updateTimer = setInterval(onUpdateTimer, 1000);
}

function clearUpdateTimer(){
	jnr.updateTimer && (clearInterval(jnr.updateTimer), jnr.updateTimer = null, document.getElementById("update-counter").textContent = "∞");
}

document.getElementById("auto-update").addEventListener("change", ()=>{
	let e = document.getElementById("auto-update"), checked = e.checked, aui = document.getElementById("auto-update-info");
	checked ? (! jnr.updating && setUpdateTimer(), aui.classList.remove("hide")) : (clearUpdateTimer(), aui.classList.add("hide"));
});

document.getElementById("clear-new-mark").addEventListener("click", ()=>{
	document.querySelectorAll('.item.new').forEach(e => e.classList.remove("new"));
	const cs = document.getElementById("channel-select"), title = cs.value;
	title === "!new" && cs.dispatchEvent(new Event("change"));
	notify({"new": 0});
	showStatistics();
});

document.getElementById("clear-new-mark-then-upate").addEventListener("click", ()=>{
	document.getElementById("clear-new-mark").dispatchEvent(new MouseEvent("click"));
	document.getElementById("update").dispatchEvent(new MouseEvent("click"));
});

document.getElementById("filter-text").addEventListener("keydown", (ev)=>{
	ev.key === "Enter" ? document.getElementById("apply-filter").click() : ev.key === "Escape" ? document.getElementById("clear-filter").click() : 0;
});

document.getElementById("apply-filter").addEventListener("click", ()=>{
	let ft = document.getElementById("filter-text");
	let text = ft.value.trim();
	if (! text){
		alert("フィルタを指定してください");
		return;
	}
	logd("filter-text:", text);
	const filter = new Filter(text);
	if (filter.error){
		alert(filter.error);
		return;
	}
	Array.from(document.getElementById('items').children).forEach(e => {
		filter.match(e.dataItem.title) ? e.classList.remove("x-filter") : e.classList.add("x-filter");
	});
	showStatistics();
});

document.getElementById("clear-filter").addEventListener("click", ()=>{
	Array.from(document.getElementById('items').children).forEach(e => e.classList.remove("x-filter"));
	showStatistics();
});

document.getElementById("settings").addEventListener("click", ()=>{
	settings.open()
	.then(()=>{
		Array.from(document.getElementById('items').children).forEach(item =>{
			isNgItem(item) ? item.classList.add("x-settings-filter") : item.classList.remove("x-settings-filter");
			updateItemClassByChannel(item);
		});
		showStatistics();
	});
});

document.addEventListener("DOMContentLoaded", ()=>{
	let urls = "", channels = "", listed = new Set();
	Object.keys(profiles).forEach(k => {
		[profiles[k].url].concat(profiles[k].access || []).forEach(url =>{
			url = new URL(profiles[k].url).origin + "/*";
			if (! listed.has(url)){
				listed.add(url);
				urls += ", " + url;
			}
		});
		channels += ", " + profiles[k].name + (profiles[k].type === "rss" ? "(RSS)" : "");
	});
	document.getElementById("cors-urls").textContent = urls.substring(1);
	document.getElementById("collecting-channels").textContent = channels.substring(1);
	document.getElementById("app-ver").textContent = jnr.appVer;
	["auto-update", "channel-select"].forEach(id => document.getElementById(id).dispatchEvent(new Event("change")));
	let opts = {};
	location.search.substring(1).split("&").forEach(param=>{
		let i = param.indexOf("="), 
			name = (i !== -1 ? param.substring(0, i) : param), 
			val = (i !== -1 ? decodeURIComponent(param.substring(i+1)) : null);
		name && (opts[name] = val);
	});
	settings.init(profiles);
	! opts.hasOwnProperty("m") && update();
});
