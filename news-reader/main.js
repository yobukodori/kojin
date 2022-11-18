function sortedIndex(array, value, descending) {
    var low = 0,
        high = array.length;

    while (low < high) {
        var mid = (low + high) >>> 1;
        if (descending ? array[mid] > value :  value> array[mid]) low = mid + 1;
        else high = mid;
    }
    return low;
}

function createRegExp(s){
	let m, flag = "";
	if (! s){ return /(?:)/; }
	if (m = s.match(/^\/(.*)\/(\w*)$/)){
		s = m[1], flag = m[2];
	}
	else {
		s = s.replace(/[|\\{}()[\]^$+*?.]/g, '\\$&');
	}
	if (s){
		try { s = new RegExp(s, flag); }
		catch (e){ log("RegExp error:", e.message, ":", s); return; }
	}
	return s;
}

function printRSS(rss){
	const container = document.getElementById('items');
	rss.item.forEach(d => {
		console.log(d);
		if (Array.from(container.children).find(item => item.dataItem.link === d.link)){
			console.log("duplicated link");
			return;
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
		channel.append(rss.channel.title), channel.href = rss.channel.link, channel.className = "channel", channel.target = "_blank";
		date.textContent = d.datetime ? (new Date(d.datetime)).toLocaleString() : (d.date  || ""), date.className = "date";
		item.className = "item", item.append(title, description, channel, date);
		item.dataItem = d, item.dataChannel = rss.channel;
		const i = sortedIndex(Array.from(container.children).map(item => item.dataItem.datetime), item.dataItem.datetime, true);
		i < container.children.length ? container.children[i].before(item) : container.append(item);
	});
}

document.getElementById("channel-select").addEventListener("change", ()=>{
	let title = document.getElementById("channel-select").value;
	console.log("channel-select on change. value:", title);
	Array.from(document.getElementById('items').children).forEach(e => {
		(! title || e.dataChannel.title === title) ? e.classList.remove("x-channel") : e.classList.add("x-channel");
	});
});

document.getElementById("search").addEventListener("click", ()=>{
	let text = document.getElementById("search-text").value.trim();
	console.log("search", text);
	if (! text){ return; }
	const rex = createRegExp(text);
	if (! rex){
		alert("invalid RegExp pattern");
		return;
	}
	Array.from(document.getElementById('items').children).forEach(e => {
		! e.classList.contains("x-search") && ! rex.exec(e.dataItem.title) && e.classList.add("x-search");
	});
	document.getElementById("status").textContent = "絞り込み結果:";
});

document.getElementById("reset-search-result").addEventListener("click", ()=>{
	console.log("reset search result");
	Array.from(document.getElementById('items').children).forEach(e => e.classList.remove("x-search"));
	document.getElementById("status").textContent = "";
});

document.addEventListener("DOMContentLoaded", ()=>{
	let urls = "";
	Object.keys(profiles).forEach(k => {
		urls += ", " + profiles[k].url;
	});
	document.getElementById("cors-urls").textContent = urls.substring(1);
	Object.keys(profiles).forEach(k => {
		const ch = profiles[k];
		console.log("channel:", ch);
		getRSS(ch, rss => {
			if (rss.error){
				console.log("# An error occurred while loading", url, ":",  rss.error);
				return;
			}
			console.log("# got rss from", ch.url);
			printRSS(rss);
			if (rss.channel.title){
				let e = document.createElement("option");
				e.value = e.textContent = rss.channel.title;
				const container = document.getElementById('channel-select'),
					i = sortedIndex(Array.from(container.children).map(opt => opt.value), e.value);
				i < container.children.length ? container.children[i].before(e) : container.append(e);
			}
			document.getElementById("status").textContent = document.getElementById('items').children.length + "件のニュース:";
		});
	});
});
