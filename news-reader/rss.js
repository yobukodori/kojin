function corsAnyWhere(url){
	return "https://api.allorigins.win/raw?url=" + encodeURIComponent(url);
}

function parseDate(datestr){
	let datetime = Date.parse(datestr);
	if (! isNaN(datetime)){ return datetime; }
	let now = new Date(), r;
	if (r = /^(\d+)時(\d+)分$/.exec(datestr) || /^(\d+):(\d+)$/.exec(datestr)){
		datetime = Date.parse(now.toLocaleDateString() + " " + r[1] + ":" + r[2]);
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

function getRSS(prof){
	const url = (document.location.protocol === "https:" && (new URL(prof.url)).protocol === "http:") ? corsAnyWhere(prof.url) : prof.url;
	const rss = {error: "unexpected response text", channel: {title: prof.name, link: url}, item: []};
	console.log("# loading", prof.type, "from", url);
	return new Promise((resolve,reject)=>{
		fetch(url, {})
		.then(res => {
			console.log("# got res:", res);
			return prof.type === "json" ? res.json() : res.text();
		})
		.then((text)=> {
			const domParser = new DOMParser();
			let count = 0;
			console.log("# got", prof.type, "from", url, ":\n" + ("" + text).substring(0,1000));
			if (prof.type === "html"){
				let d = domParser.parseFromString(text, "text/html");
				console.log(d);
				if (prof.selector){
					d.querySelectorAll(prof.selector.item).forEach((item) => {
						console.log(rss.channel.title, "item:", item);
						if (prof.first && count++ >= prof.first){ return; }
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
						prof.selector.date && (date = item.querySelector(prof.selector.date)) && (data.date = date.textContent.trim());
						if (! data.date  && prof.getDateFromArticle){
							console.log("# xhr article from", data.link);
							let xhr = new XMLHttpRequest();
							xhr.open("GET", data.link, false/*async*/);
							xhr.send();
							if (xhr.status === 200) {
								let text = xhr.responseText;
								data.date = prof.getDateFromArticle(xhr.responseText);
								console.log("date from article:", data.date);
							}
							else {
								console.log("# error status:", xhr.status);
							}
						}
						if (data.date){
							prof.adjustDate && (data.date = prof.adjustDate(data.date));
							data.datetime = parseDate(data.date);
						}
						console.log(rss.channel.title, "data:", data);
						if (data.datetime && prof.isObsolete && prof.isObsolete(data.datetime)){ return; }
						if (prof.excludeItem && prof.excludeItem(item, data)){ return; }
						rss.item.push(data);
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
					Array.from(container).forEach(item =>{
						if (item.tagName !== "item"){ return; }
						console.log(rss.channel.title, "item:", item);
						if (prof.first && count++ >= prof.first){ return; }
						if (prof.max && rss.item.length === prof.max){ return; }
						let tag, data = {};
						[{tag: "title", name: "title"}, {tag: "link", name: "link"}, {tag: "dc:date", name: "date"}, {tag: "pubDate", name: "pubDate"}].forEach(d => {
							data[d.name] = (tag = item.getElementsByTagName(d.tag)).length > 0 && tag[0].textContent;
						});
						if (data.link){
							const u = new URL(data.link);
							data.link = prof.normarizeLink ? prof.normarizeLink(u) : u.href;
						}
						! data.date && data.pubDate && (data.date = data.pubDate);
						data.datetime = data.date ? (new Date(data.date)).getTime() : 0;
						console.log(rss.channel.title, "data:", data);
						if (data.datetime && prof.isObsolete && prof.isObsolete(data.datetime)){ return; }
						rss.item.push(data);
					});
					delete rss.error;
				}
			}
			else if (prof.type === "json"){
				let items = prof.getItems(text);
				items.forEach(item => {
					if (prof.first && count++ >= prof.first){ return; }
					if (prof.max && rss.item.length === prof.max){ return; }
					let data = {datetime: 0};
					["title", "link", "date"].forEach(name => {
						data[name] = prof.get[name] ? prof.get[name](item) : item[name];
					});
					if (data.link){
						const u = new URL(data.link, prof.url);
						data.link = prof.normarizeLink ? prof.normarizeLink(u) : u.href;
					}
					if (data.date){
						prof.adjustDate && (data.date = prof.adjustDate(data.date));
						data.datetime =  (new Date(data.date)).getTime();
					}
					console.log(rss.channel.title, "data:", data);
					if (data.datetime && prof.isObsolete && prof.isObsolete(data.datetime)){ return; }
					rss.item.push(data);
				});
				delete rss.error;
			}
			resolve(rss);
		})
		.catch(err => {
			console.log("error on fetching", url + ":" + err);
			rss.error = err.message;
			resolve(rss);
		});
	});
}
