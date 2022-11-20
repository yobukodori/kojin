function corsAnyWhere(url){
	return "https://api.allorigins.win/raw?url=" + encodeURIComponent(url);
}

function parseDate(datestr){
	let now = new Date(), r;
	if (r = /^(\d+)時(\d+)分$/.exec(datestr) || /^(\d+):(\d+)$/.exec(datestr)){
		let datetime = Date.parse(now.toLocaleDateString() + " " + r[1] + ":" + r[2]);
		datetime > now && (datetime -= 24 * 60 * 60 * 1000);
		return datetime;
	}
	else if (r = /^(\d+\/\d+\s\d+:\d+)$/.exec(datestr)){ // jiji.com
		return Date.parse(now.getFullYear() + "/" + r[1]);
	}
	else if (r = /^(\d+\/\d+\/\d+\s\d+:\d+)$/.exec(datestr)){ // forbes
		return Date.parse(r[1]);
	}
	else if (r = /^(\d+)(時間|分)前$/.exec(datestr)){
		return now - r[1] * (r[2] === "時間" ? 60 * 60 * 1000 : 60 * 1000);
	}
	return 0;
}

function getRSS(prof, callback){
	let url = (document.location.protocol === "https:" && (new URL(prof.url)).protocol === "http:") ? corsAnyWhere(prof.url) : prof.url;
	console.log("# loading html from", url);
	fetch(url, {})
	.then(res => {
		console.log("# got res:", res);
		return res.text();
	})
	.then(text => {
		const domParser = new DOMParser();
		console.log("# got text:\n" + text.substring(0,1000));
		const rss = {error: "unexpected response text", channel: {title: prof.name, link: url}, item: []};
		if (prof.type === "html"){
			let d = domParser.parseFromString(text, "text/html");
			console.log(d);
			if (prof.selector){
				d.querySelectorAll(prof.selector.item).forEach(item => {
					if (prof.max && rss.item.length === prof.max){ return; }
					let data = {}, title, link, date;
					title = item.querySelector(prof.selector.title) || (item.matches(prof.selector.title) && item);
					data.title = title ? (prof.getTitle ? prof.getTitle(title) : title.textContent.trim()) : "";
					link = item.querySelector(prof.selector.link) || (item.matches(prof.selector.link) && item);
					if (link){
						const u = new URL(link.getAttribute("href"), prof.url);
						data.link = prof.normarizeLink ? prof.normarizeLink(u) : u.href;
						if (rss.item.find(e => e.link === data.link)){ return; }
					}
					data.datetime = 0;
					if (prof.selector.date){
						data.date = (date = item.querySelector(prof.selector.date)) ? date.textContent.trim() : "";
						data.date && prof.adjustDate && (data.date = prof.adjustDate(data.date));
						data.date && (data.datetime = parseDate(data.date));
					}
					if (prof.excludeItem && prof.excludeItem(item, data)){ return; }
					rss.item.push(data);
				});
				delete rss.error;
			}
			else if (prof.itemSelector){
				d.querySelectorAll(prof.itemSelector).forEach(a => {
					if (prof.max && rss.item.length === prof.max){ return; }
					const data = {title: a.textContent.trim()};
					if (data.title){
						const u = new URL(a.getAttribute("href"), prof.url);
						data.link = prof.normarizeLink ? prof.normarizeLink(u) : u.href;
						! rss.item.find(e => e.link === data.link) && rss.item.push(data);
					}
					data.datetime = 0;
				});
				delete rss.error;
			}
		}
		else if (prof.type === "rss"){
			let d = domParser.parseFromString(text, "text/xml"), doc = d.documentElement;
			console.log("xmldoc:", d);
			console.log("xmldoc.documentElement:", doc);
			const ch = doc.firstElementChild;
			(ch && ch.tagName === "channel") ? Array.from(ch.children).forEach(e => rss.channel[e.tagName] = e.textContent.trim()) : (ch = null);
			console.log("channel:", rss.channel);
			let container;
			if (doc.tagName === "rdf:RDF"){
				rss.version = 1;
				container = doc.children;
			}
			else if (doc.tagName === "rss"){
				rss.version = 2;
				container = ch.children;
			}
			if (container){
				Array.from(container).forEach(e =>{
					if (e.tagName !== "item"){ return; }
					console.log("item:", e);
					if (prof.max && rss.item.length === prof.max){ return; }
					let tag, data = {};
					[{tag: "title", name: "title"}, {tag: "link", name: "link"}, {tag: "dc:date", name: "date"}, {tag: "pubDate", name: "pubDate"}].forEach(d => {
						data[d.name] = (tag = e.getElementsByTagName(d.tag)).length > 0 && tag[0].textContent;
					});
					if (data.link){
						const u = new URL(data.link);
						data.link = prof.normarizeLink ? prof.normarizeLink(u) : u.href;
					}
					! data.date && data.pubDate && (data.date = data.pubDate);
					data.datetime = data.date ? (new Date(data.date)).getTime() : 0;
					console.log("data:", data);
					! (prof.isObsolete && prof.isObsolete(data)) &&  rss.item.push(data);
				});
				delete rss.error;
			}
		}
		callback(rss);
	})
	.catch(err => {
		console.log("error on fetching", url + ":" + err);
	});
}
