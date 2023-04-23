function corsAnyWhere(url){
	return "https://api.allorigins.win/raw?url=" + encodeURIComponent(url);
}

function parseDate(datestr){
	let datetime = Date.parse(datestr), exact = true;
	if (! isNaN(datetime)){ return {datetime, exact}; }
	let now = new Date(), r;
	if (r = /^(\d+)時(\d+)分$/.exec(datestr) || /^(\d+):(\d+)$/.exec(datestr)){
		datetime = Date.parse(now.toLocaleDateString() + " " + r[1] + ":" + r[2]);
		datetime > now && (datetime -= 24 * 60 * 60 * 1000);
		return {datetime, exact};
	}
	else if (r = /^(\d+\/\d+\s\d+:\d+)$/.exec(datestr)){ // jiji.com
		datetime = Date.parse(now.getFullYear() + "/" + r[1]);
		datetime > now && (datetime = Date.parse(now.getFullYear() - 1 + "/" + r[1]));
		return {datetime, exact};
	}
	else if (r = /^(\d+\/\d+)$/.exec(datestr)){ // cnn
		datestr += " 0:0";
		datetime = Date.parse(now.getFullYear() + "/" + datestr);
		datetime > now && (datetime = Date.parse(now.getFullYear() - 1 + "/" + datestr));
		return {datetime, exact};
	}
	else if (r = /^(\d+\/\d+\/\d+\s\d+:\d+)$/.exec(datestr)){ // forbes
		return {datetime: Date.parse(r[1]), exact};
	}
	else if (r = /^(\d+\.\d+\.\d+\s\d+:\d+)$/.exec(datestr)){ // forbes
		return {datetime: Date.parse(r[1].replace(/\./g, "/")), exact};
	}
	else if (r = /^(\d+)(時間|分)前$/.exec(datestr)){
		return {datetime: now - r[1] * (r[2] === "時間" ? 60 * 60 * 1000 : 60 * 1000), exact: false};
	}
	else if (r = /^(\d+)月(\d+)日\s(\d+:\d+)$/.exec(datestr)){
		datetime = Date.parse(now.getFullYear() + "/" + r[1] + "/" + r[2] + " " + r[3]);
		datetime > now && (datetime = Date.parse(now.getFullYear() - 1 + "/" + r[1] + "/" + r[2] + " " + r[3]));
		return {datetime, exact};
	}
	return {datetime: 0, exact: false};
}

function getRSS(prof){
	const url = (document.location.protocol === "https:" && (new URL(prof.url)).protocol === "http:") ? corsAnyWhere(prof.url) : prof.url;
	const rss = {error: "unexpected response text", channel: {title: prof.name, link: url}, itemCount:0, item: []};
	logd("# loading", prof.type, "from", url);
	return new Promise((resolve,reject)=>{
		(prof.fetch ? prof.fetch.bind(prof) : fetch)(url, {})
		.then(res => {
			logd("# got res:", res);
			if (! res.ok){
				throw Error(res.status + " " + res.statusText);
			}
			return prof.type === "json" ? res.json() : res.text();
		})
		.then((text)=> {
			const domParser = new DOMParser();
			let count = 0;
			logd("# got", prof.type, "from", url, ":\n" + ("" + text).substring(0,1000));
			if (prof.type === "html"){
				let d = domParser.parseFromString(text, "text/html");
				logd(d);
				if (prof.selector){
					d.querySelectorAll(prof.selector.item).forEach((item) => {
						logd(rss.channel.title, "item:", item);
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
						! data.date && prof.getDateFromItem && (data.date = prof.getDateFromItem(item));
						if (! data.date  && prof.getDataFromArticle){
							logd("# xhr article from", data.link);
							let xhr = new XMLHttpRequest();
							xhr.open("GET", data.link, false/*async*/);
							xhr.send();
							if (xhr.status === 200) {
								let { date, title } = prof.getDataFromArticle(xhr.responseText);
								data.date = date;
								logd("date from article:", data.date);
								if (title && title !== data.title){
									data.title = title;
									logd("title from article:", data.title);
								}
							}
							else {
								logd("# error status:", xhr.status);
							}
						}
						if (data.date){
							prof.adjustDate && (data.date = prof.adjustDate(data.date));
							let {datetime, exact} = parseDate(data.date);
							data.datetime = datetime, data.exact = exact;
						}
						logd(rss.channel.title, "data:", data);
						rss.itemCount++;
						if (data.datetime && prof.isObsolete && prof.isObsolete(data.datetime)){ return; }
						if (prof.excludeItem && prof.excludeItem(item, data)){ return; }
						rss.item.push(data);
					});
					delete rss.error;
				}
				resolve(rss);
			}
			else if (prof.type === "rss"){
				let d = domParser.parseFromString(text, "text/xml"), doc = d.documentElement;
				logd("xmldoc:", d);
				logd("xmldoc.documentElement:", doc);
				const ch = doc.firstElementChild;
				(ch && ch.tagName === "channel") ? Array.from(ch.children).forEach(e => rss.channel[e.tagName] = e.textContent.trim()) : (ch = null);
				logd("channel:", rss.channel);
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
						logd(rss.channel.title, "item:", item);
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
						logd(rss.channel.title, "data:", data);
						rss.itemCount++;
						if (data.datetime && prof.isObsolete && prof.isObsolete(data.datetime)){ return; }
						rss.item.push(data);
					});
					delete rss.error;
				}
				resolve(rss);
			}
			else if (prof.type === "json"){
				prof.getItems(text).then(items =>{
					items.forEach(item => {
						if (prof.first && count++ >= prof.first){ return; }
						if (prof.max && rss.item.length === prof.max){ return; }
						let data = {datetime: 0};
						["title", "link", "date", "media"].forEach(name => {
							data[name] = (prof.get && prof.get[name]) ? prof.get[name](item) : item[name];
						});
						if (data.link){
							const u = new URL(data.link, prof.url);
							data.link = prof.normarizeLink ? prof.normarizeLink(u) : u.href;
						}
						if (data.date){
							prof.adjustDate && (data.date = prof.adjustDate(data.date));
							data.datetime =  (new Date(data.date)).getTime();
						}
						logd(rss.channel.title, "data:", data);
						rss.itemCount++;
						if (data.datetime && prof.isObsolete && prof.isObsolete(data.datetime)){ return; }
						rss.item.push(data);
					});
					delete rss.error;
					resolve(rss);
				})
				.catch (e =>{ throw e; });
			}
			else {
				throw Error("bug! unexpected profile type: " + prof.type);
			}
		})
		.catch(err => {
			logd("error on fetching", url + ":" + err);
			rss.error = err.message;
			resolve(rss);
		});
	});
}
