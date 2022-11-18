function getRSS(prof, callback){
	let url = prof.url;
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
					data.title = title ? title.textContent.trim() : "";
					link = item.querySelector(prof.selector.link) || (item.matches(prof.selector.link) && item);
					if (link){
						const u = new URL(link.getAttribute("href"), prof.url);
						data.link = prof.normarizeLink ? prof.normarizeLink(u) : u.href;
						! rss.item.find(e => e.link === data.link) && rss.item.push(data);
					}
					data.datetime = 0;
					if (prof.selector.date){
						data.date = (date = item.querySelector(prof.selector.date)) ? date.textContent.trim() : "";
					}
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
			if (doc.tagName === "rdf:RDF"){
				rss.version = 1;
				Array.from(doc.children).forEach(e =>{
					if (e.tagName !== "item"){ return; }
					console.log(e);
					if (prof.max && rss.item.length === prof.max){ return; }
					let tag, data = {};
					[{tag: "title", name: "title"}, {tag: "link", name: "link"}, {tag: "dc:date", name: "date"}, {tag: "pubDate", name: "pubDate"}].forEach(d => {
						data[d.name] = (tag = e.getElementsByTagName(d.tag)).length > 0 && tag[0].textContent;
					});
					! data.date && data.pubDate && (data.date = data.pubDate);
					data.datetime = data.date ? (new Date(data.date)).getTime() : 0;
					! (prof.isObsolete && prof.isObsolete(data)) &&  rss.item.push(data);
				});
				delete rss.error;
			}
			else if (doc.tagName === "rss"){
				rss.version = 2;
				ch && Array.from(ch.children).forEach(e =>{
					if (e.tagName !== "item"){ return; }
					console.log(e);
					if (prof.max && rss.item.length === prof.max){ return; }
					let tag, data = {};
					[{tag: "title", name: "title"}, {tag: "link", name: "link"}, {tag: "dc:date", name: "date"}, {tag: "pubDate", name: "pubDate"}].forEach(d => {
						data[d.name] = (tag = e.getElementsByTagName(d.tag)).length > 0 && tag[0].textContent;
					});
					! data.date && data.pubDate && (data.date = data.pubDate);
					data.datetime = data.date ? (new Date(data.date)).getTime() : 0;
					! (prof.isObsolete && prof.isObsolete(data)) &&  rss.item.push(data);
				});
				delete rss.error, delete ch;
			}
		}
		callback(rss);
	});
}
