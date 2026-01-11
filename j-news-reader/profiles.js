function rss2json(text){
	//const logd = console.log;
	const domParser = new DOMParser();
	const rss = {error: "unexpected response text", channel: {}, itemCount:0, item: []};
	let d = domParser.parseFromString(text, "text/xml"), doc = d.documentElement;
	logd("xmldoc:", d);
	logd("xmldoc.documentElement:", doc);
	const ch = doc.firstElementChild;
	if (! (ch && ch.tagName === "channel")){
		console.log("RSS?:", text);
		throw Error("Channel tag not found in RSS document. Please look at the document output to the console.");
	}
	Array.from(ch.children).forEach(e => rss.channel[e.tagName] = e.textContent.trim());
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
			let data = {};
			[{tag: "title", name: "title"}, {tag: "link", name: "link"}, {tag: "dc:date", name: "date"}, {tag: "pubDate", name: "pubDate"}, {tag: "dc:author", name: "author"}, {tag: "media:thumbnail", name: "thumbnail", attr: "url"}].forEach(d => {
				let tags = item.getElementsByTagName(d.tag),
					tag = tags.length > 0 && tags[0];
				if (tag){
					if (d.attr){
						if (attr = tag.getAttribute(d.attr)){
							data[d.name] = attr;
						}
					}
					else {
						data[d.name] = tag.textContent;
					}
				}
			});
			if (data.link){
				const u = new URL(data.link);
				data.link = u.href;
			}
			! data.date && data.pubDate && (data.date = data.pubDate);
			data.date && (data.exact = true);
			data.datetime = data.date ? (new Date(data.date)).getTime() : 0;
			//logd("title:", data.title, "thumbnail:", data.thumbnail);
			//logd(rss.channel.title, "data:", data);
			rss.itemCount++;
			rss.item.push(data);
		});
		delete rss.error;
	}
	return rss;
}

const profiles = {
	"jiji.comトップ": {
		id: "jiji-top",
		url: "https://www.jiji.com/sp/", // pc版はタイトルが省略されている
		type: "html",
		access: ["https://www.jiji.com/jc/article?*", "https://www.jiji.com/sp/article?*"],
		selector: {
			item: '.HomeTopics .TopicsPhoto, .HomeTopics li, .top5new',
			title: '.TopicsPhoto > a > span, li > a, dd > p',
			link: 'a',
			date: "",
			description: "",
		},
		getTitle: function (title/* element */){
			return title.firstChild.textContent.trim();
		},
		normarizeLink: function (url){
			url.pathname.startsWith("/sp/") && (url.pathname = "/jc/" + url.pathname.substring(4));
			url.search.startsWith("?k=") && (url.search = url.search.split("&")[0]);
			return (new URL(url)).href;
		},
		getDataFromArticle: function(text){
			let data;
			text.split('<script type="application/ld+json">').forEach((e,i)=>{
				if (data && data["@type"] === "NewsArticle"){ return; }
				i > 0 && (data = JSON.parse(e.split('</script>')[0]));
			});
			data.title = data.headline;
			data.date = data.datePublished; // data.dateModified
			return data;
		},
	},
	"jiji.comアクセスランキング": {
		id: "jiji-rank",
		url: "https://www.jiji.com/rss/ranking.rdf",
		type: "rss",
		normarizeLink: function (url){
			url.pathname.startsWith("/sp/") && (url.pathname = "/jc/" + url.pathname.substring(4));
			url.search.startsWith("?k=") && (url.search = url.search.split("&")[0]);
			return (new URL(url)).href;
		},
	},
	"jiji.com新着": {
		id: "jiji-news",
		url: "https://www.jiji.com/jc/list?g=news",
		access: ["https://www.jiji.com/sp/list?g=news"],
		type: "html",
		selector: {
			item: '.ArticleListMain li > a, .ArticleHeadlineList li > a',
			title: 'p:nth-child(1), div + p',
			link: 'a',
			date: "span, .ArticleDate",
			description: "",
		},
		normarizeLink: function (url){
			url.pathname.startsWith("/sp/") && (url.pathname = "/jc/" + url.pathname.substring(4));
			url.search.startsWith("?k=") && (url.search = url.search.split("&")[0]);
			return (new URL(url)).href;
		},
		adjustDate: function (datestr){
			return /^\(.+\)$/.test(datestr) ? datestr.slice(1, -1) : datestr;
		},
		isObsolete: function (datetime){
			return Date.now() - datetime > 24 * 60 * 60 * 1000;
		},
	},
	"47NEWSトップ": {
		id: "47news",
		url: "https://www.47news.jp/",
		type: "html",
		selector: {
			item: 'main > div.page_layout:nth-child(2) .post_items > a.post_item',
			title: '.item_ttl',
			link: 'a.post_item',
			date: ".item_time",
			description: "",
		},
	},
	"読売新聞トップ": {
		id: "yomiuri",
		url: "https://www.yomiuri.co.jp/",
		type: "html",
		selector: {
			item: '.home-headline__contents .item',
			title: '.title',
			link: 'a',
			date: "time",
			description: "",
		},
		getPayed(item){
			let title = item.querySelector(this.selector.title);
			return title && title.parentElement.querySelector('[data-icon-type="key-locked"]');
		},
		excludeItem: function (item, data){
			return item.getElementsByTagName("time").length === 0;
		},
	},
	"朝日新聞トップ": {
		id: "asahi",
		url: "https://www.asahi.com/",
		access: ["https://www.asahi.com/sp/"],
		type: "html",
		selector: {
			item: '.p-topNews__firstNews, .p-topNews__listItem, .p-topNews2__listItem, .p-topNews .c-articleModule:nth-child(1)',
			title: '.c-articleModule__title',
			link: 'a.c-articleModule__link',
			date: "time",
			description: "",
		},
		onResponse(res){
			this.mobile = new URL(res.url).pathname.startsWith("/sp/");
		},
		getPayed(item){
			let title = item.querySelector(this.selector.title);
			return title && title.parentElement.querySelector('figure.c-icon--keyGold');
		},
		normarizeLink: function (url){
			if (this.mobile && url.pathname.startsWith("/articles/")){
				url.pathname = "/sp/" + url.pathname;
			}
			return url.search = "", url.href;
		},
		excludeItem: function (item, data){
			return item.getElementsByTagName("time").length === 0;
		},
	},
	"毎日新聞トップ": {
		id: "mainichi",
		url: "https://mainichi.jp/",
		type: "html",
		selector: {
			item: '[data-cx-area="top-selection"] .toppickup, [data-cx-area="top-selection"] li',
			title: '.toppickup-title, .toppickuplist-title, .articlelist-title',
			link: 'a',
			date: ".articletag-date",
			description: "",
		},
		getPayed(item){
			let title = item.querySelector(this.selector.title);
			return title && title.parentElement.querySelector('.is-limited');
		},
		getCategory(item){
			let link = item.querySelector(this.selector.link);
			return link.href.includes("/spp/") ? "sponichi" : "";
		},
	},
	/*
	"NHKニュース": {
		id: "nhk",
		url: "https://www.nhk.or.jp/rss/news/cat0.xml",
		type: "rss",
	},
	*/
	"日経新聞マーケットバー": {
		id: "nikkei-bar",
		url: "https://www.nikkei.com/",
		type: "html",
		selector: {
			item: 'k2-market-bar li[class^="index_"] a',
			title: 'a',
			link: 'a',
			date: '',
			description: '',
		},
		getTitle: function (title/* element */){
			return title.firstChild.textContent + " " + Array.from(title.querySelectorAll('span')).map(e => e.textContent).join(" ");
		},
		getDateFromItem: function (item){
			let datestr = item.getAttribute('title').split(" ").splice(0,2).join(" ");
			if (/NY(ダウ|原油)/.test(item.textContent)){
				let r = /(\d+月\d+日 )(\d+)(:\d+)/.exec(datestr);
				r && (datestr = r[1] + (r[2] * 1 + 13) + r[3]);
			}
			return datestr;
		},
	},
	"ロイター トップニュース": {
		id: "reuter",
		url: "https://jp.reuters.com/",
		type: "html",
		selector: {
			item: '[class^="home-page-grid-module__"][class*="story__"]',
			title: 'h3[data-testid="Heading"]',
			link: 'a[data-testid="Title"]',
			date: null, // "time" の textContent はスクリプトでセットしている
			description: "",
		},
		getDateFromItem(item){
			let time, datetime;
			if ((time = item.querySelector('time')) && (datetime = time.getAttribute("datetime"))){
				return datetime;
			}
		},
	},
	/*
	"CNN国際ニュース(RSS)": {
		// httpなので混在コンテンツでブロックされる。CORSプロキシで対応
		// api.allorigins.win経由だとpcでは最新のrssが取れるがモバイルだと古いrssを取ってしまう(firefox)
		url: "http://feeds.cnn.co.jp/rss/cnn/cnn.rdf",
		type: "rss",
		isObsolete: function (datetime){
			return Date.now() - datetime > 24 * 60 * 60 * 1000;
		},
	},
	*/
	"CNN全記事一覧": {
		id: "cnn",
		url: "https://www.cnn.co.jp/archives/",
		type: "html",
		selector: {
			item: '.pg-container-main > section:first-of-type .list-news-line > li',
			title: 'a + a[href$=".html"]',
			link: 'a',
			date: "span",
			description: "",
		},
	},
	"BBCトップ": {
		id: "bbc",
		url: "https://www.bbc.com/japanese",
		type: "json",
		fetch(url, init){
			return new Promise((resolve, reject)=>{
				let response;
				fetch(url, init)
				.then(res =>{
					response = res;
					if (! res.ok){ throw Error(res.status + " " + res.statusText); }
					return res.text();
				})
				.then(text =>{
					const domParser = new DOMParser();
					const doc = domParser.parseFromString(text, "text/html");
					const sig = 'script#__NEXT_DATA__[type="application/json"]';
					let e = doc.querySelector(sig);
					if (! e){ throw Error(sig + "が見つかりません"); }
					const data = JSON.parse(e.textContent);
					logd("__NEXT_DATA__:", data);
					response.json = function(){ return data; };
					resolve(response);
				})
				.catch(e => reject(e));
			});
		},
		getItems(data){
			const items = [];
			data.props.pageProps.pageData.curations.forEach(curation =>{
				if (curation.title === "トップ記事"){
					curation.summaries.forEach(s =>{
						let itemData = {title: s.title, link: s.link, date: s.firstPublished, summary: s.description};
						items.push(itemData);
					});
				}
			});
			return Promise.resolve(items);
		},
	},
	// ===========================================
	/*
	"AFPBB総合新着(RSS)": { 
		// httpなので混在コンテンツでブロックされる。CORSプロキシで対応
		// api.allorigins.win経由だとpcでは最新のrssが取れるがモバイルだと古いrssを取ってしまう(firefox)
		// 不要な中国タブ記事が含まれる
		url: "http://feeds.afpbb.com/rss/afpbb/afpbbnews",
		type: "rss",
		max: 20,
	},
	*/
	/*
	"AFPBB新着 json": {
		// 反応が遅いがほかは問題なし
		url: "https://www.afpbb.com/list/ajax/latest_articles_more.js?page=1&type=afp",
		type: "json",
		getItems: function(data){ return data; },
		get: {
			date: function(item){ return item.day; },
		},
		adjustDate: function (datestr){
			const r = /^(\d+)年\s(.+)\(.\)\s(.+)$/.exec(datestr);
			return r ?  r[1] + "/" + r[2] + " " + r[3] : datestr;
		},
	},
	*/
	"AFPBB新着": {
		id: "afpbb-latest",
		url: "https://www.afpbb.com/list/latest/",
		type: "html",
		selector: {
			item: '#tab-afpbb li',
			title: 'h3.title',
			link: 'a',
			date: ".day",
			description: "",
		},
		getTitle: function (e){
			return e.childNodes.length > 1 && e.childNodes[1].nodeType === 3 ? e.childNodes[1].textContent : e.textContent;
		},
		adjustDate: function (datestr){
			const r = /^(\d+)年\s(.+)\(.\)\s(.+)$/.exec(datestr);
			return r ?  r[1] + "/" + r[2] + " " + r[3] : datestr;
		},
		getCategory(item){
			let cat = ["news", "sports", "environment-science-it", "lifestyle"];
			for (let i = 0 ; i < cat.length ; i++){
				if (item.classList.contains(cat[i])){ return cat[i]; }
			}
		},
	},
	// ===========================================
	"ブルームバーグ トップニュース": {
		id: "bloomberg",
		url: "https://www.bloomberg.com/jp",
		type: "html",
		selector: {
			//item: 'div[class^="LineupContentLede_primaryStory_"], div[class^="LineupContentOpinion_primaryStory_"], div[class^="LineupContentBasic_container_"], div[class^="LineupContent2Up_story_"],  div[class^="LineupContent4Up_item_"], div[class^="LineupContentTopic_primaryStory_"]',
			// , a[data-link-type="Story"]
			// オピニオン div[class^="ItemsWithHeadshots_item_"]
			item: 'a[data-component="story-link"], a[data-link-type="Story"]',
			title: '[data-testid="headline"]',
			link: 'a',
			//date: ".date",
			description: "",
		},
		latestNews: new Map(),
		requesting: false,
		queue: [],
		fetchQueued(){
			let { url, init, resolve, reject, opts } = this.queue.shift();
			fetch(url, init)
			.then(res =>{
				resolve(res);
				if (this.queue.length > 0){
					const delay = opts.delay || 300;
					setTimeout(this.fetchQueued.bind(this), delay);
				}
				else {
					this.requesting = false;
				}
			})
			.catch(e => reject(e));
		},
		fetchSequential(url, init, opts){
			opts = opts || {};
			return new Promise((resolve, reject)=>{
				let data = {url, init, resolve, reject, opts};
				this.queue.push(data);
				if (! this.requesting){
					this.requesting = true;
					this.fetchQueued();
				}
			});
		},
		fetch(url, init){
			if (window.location.protocol === "file:"){
				const pages = this.latestNews.size > 0 ? 1 : 2,
					limit = this.latestNews.size > 0 ? 25 : 50; // 最大で50
				for (let i = 0 ; i < pages ; i++){
					let page = i + 1,
						apiUrl = `https://www.bloomberg.com/lineup-next/api/stories?types=ARTICLE,FEATURE,INTERACTIVE,LETTER,EXPLAINERS,VIDEO,GRAPHIC&locale=ja&limit=${limit}&pageNumber=${page}`;
					this.fetchSequential(apiUrl, {})
					.then(res =>{
						return res.json();
					})
					.then(data =>{
						data.forEach((d, i)=>{
							let u = new URL(d.url, this.url),
								key = u.href;
							logd((page - 1)*limit + i, d.headline, d.publishedAt, d.url, key, d);
							this.latestNews.set(key, d);
						});
					});
				}
			}
			return this.fetchSequential(url, init);
		},
		getDateFromItem: function (item/* element */){
			if (this.latestNews.size > 0){
				let title = item.querySelector(this.selector.title).textContent,
					a =  item.tagName === "A" ? item : item.querySelector('a'),
					u = new URL(a.getAttribute("href"), this.url),
					url = u.href,
					key = (u.search = "", u.href),
					d = this.latestNews.get(key);
					if (d){
						return d.publishedAt;
					}
			}
		},
	},
	"Forbes政治経済": {
		id: "forbes-economics",
		// 日付: PCあり モバイルなし
		url: "https://forbesjapan.com/category/economics",
		type: "html",
		selector: {
			item: '.section-articles-list .articles-list__list li',
			title: '.tit',
			link: 'a',
			date: ".date",
			description: "",
		},
		first: 5,   // 最初の <first> item だけ処理
		max: 10, // 最大 <max> item だけ取得
		getDataFromArticle: function(text){
			let sig = 'name="publishdatetime" value="', i = text.indexOf(sig), start = i > -1 && i + sig.length, end = start && text.indexOf('"', start), date = end ?  text.substring(start, end) : "";
			return {date};
		},
		isObsolete: function (datetime){
			let yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
			return yesterday.setHours(0, 0, 0, 0), datetime <  yesterday.getTime();
		},
	},
	"Forbesテクノロジー": {
		id: "forbes-technology",
		// 日付: PCあり モバイルなし
		url: "https://forbesjapan.com/category/technology",
		type: "html",
		selector: {
			item: '.section-articles-list .articles-list__list li',
			title: '.tit',
			link: 'a',
			date: ".date",
			description: "",
		},
		first: 5,   // 最初の <first> item だけ処理
		max: 10, // 最大 <max> item だけ取得
		getDataFromArticle: function(text){
			let sig = 'name="publishdatetime" value="', i = text.indexOf(sig), start = i > -1 && i + sig.length, end = start && text.indexOf('"', start), date = end ?  text.substring(start, end) : "";
			return {date};
		},
		isObsolete: function (datetime){
			let yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
			return yesterday.setHours(0, 0, 0, 0), datetime <  yesterday.getTime();
		},
	},
	"AP通信 - Yahoo!ニュース": {
		id: "ap-yahoo",
		url: "https://news.yahoo.co.jp/rss/media/aptsushinv/all.xml",
		type: "rss",
		normarizeLink: function (url){
			return url.search = "", (new URL(url)).href;
		},
		isObsolete: function (datetime){
			let yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
			return yesterday.setHours(0, 0, 0, 0), datetime <  yesterday.getTime();
		},
	},
	"Yahoo!ニュース": {
		id: "yahoo",
		url: "https://news.yahoo.co.jp/",
		type: "json",
		categories: [{name: "主要", id: "major"}, {name: "国内", id: "domestic"}, {name: "国際", id: "world"}, {name: "経済", id: "business"}, {name: "エンタメ", id: "entertainment"}, {name: "スポーツ", id: "sports"}, {name: "IT", id: "it"}, {name: "科学", id: "science"}, {name: "地域", id: "local"}],
		getItems(data){
			const domParser = new DOMParser();
			const items = [], tasks = [];
			return new Promise((resolve, reject)=>{
				data.topicsList.categories.forEach(c =>{
					c.topicsList.forEach(t =>{
						if (settings.isYahooNgCategory(c.categoryId)){ return; }
						let item = {title: t.title, link: t.url, pickupUrl: t.url, date: t.publishedTime_ISO8601, extra: t};
						items.push(item);
						if (settings.needsToGetYahooSource()){
							let task = new Promise((resolve, reject)=>{
								fetch(item.link)
								.then(res =>{
									if (! res.ok){ throw Error(res.status + " " + res.statusText); }
									return res.text();
								})
								.then(text =>{
									const doc = domParser.parseFromString(text, "text/html"),
										scr = doc.querySelector('script[type="application/ld+json"]'),
										ld = scr && JSON.parse(scr.textContent);
									let d = doc.querySelector('[data-ual-view-type="digest"]'),
										a = d && d.querySelector('a'),
										t = a && a.querySelector('p, h2'),
										m;
									if (t){
										if (t.tagName === "P"){ // pc
											m = a.querySelector('p + span')
												|| d.querySelector('span + div > div > a');
										}
										else { // if (t.tagName === "H2"){ // mobile
											m = d.querySelector('a + div > span')
												|| a.querySelector('h2 + span');
										}
									}
									if (a){ item.link = item.extra.articleUrl = a.href; }
									if (t && t.textContent.trim()){ item.title = t.textContent.trim(); }
									else if (ld?.headline){
										item.title = ld.headline.replace(/ - エキスパート - Yahoo!ニュース$/, "")
											.replace(/（Yahoo!ニュース.+?）$/, "")
											.replace(/#(エキスパートトピ)（.+?）/, "#$1");
									}
									if (m && m.textContent.trim()){ item.media = m.textContent.trim(); }
									else if (ld?.author?.name){ item.media = ld.author.name }
									resolve(true);
								})
								.catch(e => reject(e));
							});
							tasks.push(task);
						}
					});
				});
				Promise.allSettled(tasks).then(values => {
					resolve(items);
				});
			});
		},
		promisedFetch(url, init, resolve, reject, recur){
			let response;
			fetch(url, init)
			.then(res =>{
				response = res;
				if (! res.ok){ throw Error(res.status + " " + res.statusText); }
				return res.text();
			})
			.then(text =>{
				const domParser = new DOMParser();
				const doc = domParser.parseFromString(text, "text/html");
				let e = doc.querySelector('meta[name="viewport"][content^="width=device-width"]');
				if (! e){
					if (! recur){
						init = init ? Object.assign({headers:{}}, init) : {headers:{}};
						init.headers["User-Agent"] = "Mozilla/5.0 (Linux; Android 11; SAMSUNG SM-G973U) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/14.2 Chrome/87.0.4280.141 Mobile Safari/537.36";
						this.promisedFetch(url, init, resolve, reject, true);
						return;
					}
					throw Error("モバイルページを取得できません");
				}
				const sig = "window.__PRELOADED_STATE__ =";
				e = Array.from(doc.getElementsByTagName("script")).find(e => e.textContent.startsWith(sig));
				if (! e){ throw Error("window.__PRELOADED_STATE__が見つかりません"); }
				const data = JSON.parse(e.textContent.substring(sig.length));
				logd("__PRELOADED_STATE__:", data);
				response.json = function(){ return data; };
				resolve(response);
			})
			.catch(e => reject(e));
		},
		fetch(url, init){
			return new Promise((resolve, reject)=>{
				this.promisedFetch(url, init, resolve, reject);
			});
		},
	},
	"Wedge ONLINE 最新記事": {
		id: "wedge",
		url: "https://wedge.ismedia.jp/list/feed/rss",
		type: "rss",
		fixChannel: function (channel){
			channel.title = this.name;
		},
		isObsolete: function (datetime){
			let yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
			return yesterday.setHours(0, 0, 0, 0), datetime <  yesterday.getTime();
		},
	},
};

Object.keys(profiles).forEach(k =>{
	profiles[k].name = k;
	//! k.startsWith("Yahoo") && delete profiles[k];
});

