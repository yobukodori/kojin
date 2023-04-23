const profiles = {
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
			data.date = data.dateModified || data.datePublished;
			return data;
		},
	},
	"47NEWSトップ": {
		id: "47news",
		url: "https://www.47news.jp/",
		type: "html",
		selector: {
			item: 'main > div.page_layout:nth-child(1) .post_items > a.post_item',
			title: '.item_ttl',
			link: 'a.post_item',
			date: ".item_time",
			description: "",
		},
	},
	/*
	"読売新聞社会(RSS)": {
		url: "https://assets.wor.jp/rss/rdf/yomiuri/national.rdf",
		type: "rss",
		max: 5,
	},
	"読売新聞政治(RSS)": {
		url: "https://assets.wor.jp/rss/rdf/yomiuri/politics.rdf",
		type: "rss",
		max: 5,
	},
	"読売新聞経済(RSS)": {
		url: "https://assets.wor.jp/rss/rdf/yomiuri/economy.rdf",
		type: "rss",
		max: 5,
	},
	"読売新聞国際(RSS)": {
		url: "https://assets.wor.jp/rss/rdf/yomiuri/world.rdf",
		type: "rss",
		max: 10,
	},
	*/
	"読売新聞トップ": {
		id: "yomiuri",
		url: "https://www.yomiuri.co.jp/",
		type: "html",
		selector: {
			item: '.headline article',
			title: '.title',
			link: 'a',
			date: "time",
			description: "",
		},
		getTitle: function (title/* element */){
			return title.textContent.trim() + (title.parentElement.querySelector('use') ? "🔒" : "");
		},
		excludeItem: function (item, data){
			return item.getElementsByTagName("time").length === 0;
		},
	},
	/*
	"朝日新聞社会(RSS)": {
		url: "https://www.asahi.com/rss/asahi/national.rdf",
		type: "rss",
		max: 5,
	},
	"朝日新聞政治(RSS)": {
		url: "https://www.asahi.com/rss/asahi/politics.rdf",
		type: "rss",
		max: 5,
	},
	"朝日新聞経済(RSS)": {
		url: "https://www.asahi.com/rss/asahi/business.rdf",
		type: "rss",
		max: 5,
	},
	"朝日新聞国際(RSS)": {
		url: "https://www.asahi.com/rss/asahi/international.rdf",
		type: "rss",
		max: 10,
	},
	"朝日新聞速報(RSS)": {
		url: "https://www.asahi.com/rss/asahi/newsheadlines.rdf",
		type: "rss",
	},
	*/
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
		getTitle: function (title/* element */){
			return title.textContent.trim() + (title.parentElement.querySelector('figure.c-icon--keyGold') ? "🔒" : "");
		},
		normarizeLink: function (url){
			return url.search = "", (new URL(url)).href;
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
		getTitle: function (title/* element */){
			return title.textContent.trim() + (title.parentElement.querySelector('.is-limited') ? "🔒" : "");
		},
	},
	"NHKニュース": {
		id: "nhk",
		url: "https://www.nhk.or.jp/rss/news/cat0.xml",
		type: "rss",
	},
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
				r && (datestr = r[1] + (r[2] * 1 + 14) + r[3]);
			}
			return datestr;
		},
	},
	"ロイター トップニュース": {
		id: "reuter",
		url: "https://assets.wor.jp/rss/rdf/reuters/top.rdf",
		type: "rss",
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
			item: '.list-news-line > li',
			title: 'a + a[href$=".html"]',
			link: 'a',
			date: "span",
			description: "",
		},
	},
	"BBCトップ": {
		id: "bbc",
		url: "https://www.bbc.com/japanese",
		type: "html",
		selector: {
			item: '[aria-labelledby="Top-stories"] li > div',
			title: 'a > span[id^="promo-"]',
			link: 'a',
			date: "h3 ~ time",
			description: "",
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
	},
	// ===========================================
	/*
	"AFPBB総合アクセスランキング(RSS)": {
		// ランキングされている記事は古いものが多い。
		// httpなので混在コンテンツでブロックされる。CORSプロキシで対応
		// api.allorigins.win経由だとpcでは最新のrssが取れるがモバイルだと古いrssを取ってしまう(firefox)
		url: "http://feeds.afpbb.com/rss/afpbb/access_ranking",
		type: "rss",
		isObsolete: function (datetime){
			let yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
			return yesterday.setHours(0, 0, 0, 0), datetime <  yesterday.getTime();
		},
	},
	"AFPBB人気": {
		// ランキングされている記事は古いものが多い。
		// モバイルでは日付がない。PCはある。
		url: "https://www.afpbb.com/list/ranking",
		type: "html",
		selector: {
			item: 'main li, #common-ranking li',
			title: 'h3.title',
			link: 'a',
			date: ".day",
			description: "",
		},
		adjustDate: function (datestr){
			const r = /^(.+)\(.\)\s(.+)$/.exec(datestr);
			return r ?  r[1] + " " + r[2] : datestr;
		},
		max: 10,
	},
	*/
	// ===========================================
	"ブルームバーグ トップニュース": {
		id: "bloomberg",
		url: "https://assets.wor.jp/rss/rdf/bloomberg/top.rdf",
		type: "rss",
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
			return Date.now() - datetime > 24 * 60 * 60 * 1000;
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
						if (settings.isNgYahooCategory(c.categoryId)){ return; }
						let item = {title: t.title, link: t.url, date: t.publishedTime_ISO8601};
						items.push(item);
						if (settings.needsToGetYahooSource()){
							let task = new Promise((resolve, reject)=>{
								fetch(item.link)
								.then(res =>{
									if (! res.ok){ throw Error(res.status + " " + res.statusText); }
									return res.text();
								})
								.then(text =>{
									const doc = domParser.parseFromString(text, "text/html");
									let d = doc.querySelector('[data-ual-view-type="digest"]'),
										a = d && d.querySelector('a'),
										t = a && a.querySelector('p, h2'),
										m = (a && a.querySelector('p + span > span'))
											|| (d && d.querySelector('a + div > span'));
									if (a){ item.link = a.href; }
									if (t && t.textContent.trim()){ item.title = t.textContent.trim(); };
									if (m && m.textContent.trim()){ item.media = m.textContent.trim(); }
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
	/*
	"Yahoo!ニュース・トピックス - 主要": {
		url: "https://news.yahoo.co.jp/rss/topics/top-picks.xml",
		type: "rss",
	},
	"Yahoo!ニュース・トピックス - 国内": {
		url: "https://news.yahoo.co.jp/rss/topics/domestic.xml",
		type: "rss",
	},
	"Yahoo!ニュース・トピックス - 国際": {
		url: "https://news.yahoo.co.jp/rss/topics/world.xml",
		type: "rss",
	},
	"Yahoo!ニュース・トピックス - 経済": {
		url: "https://news.yahoo.co.jp/rss/topics/business.xml",
		type: "rss",
	},
	"Yahoo!ニュース・トピックス - エンタメ": {
		url: "https://news.yahoo.co.jp/rss/topics/entertainment.xml",
		type: "rss",
	},
	"Yahoo!ニュース・トピックス - スポーツ": {
		url: "https://news.yahoo.co.jp/rss/topics/sports.xml",
		type: "rss",
	},
	"Yahoo!ニュース・トピックス - IT": {
		url: "https://news.yahoo.co.jp/rss/topics/it.xml",
		type: "rss",
	},
	"Yahoo!ニュース・トピックス - 科学": {
		url: "https://news.yahoo.co.jp/rss/topics/science.xml",
		type: "rss",
	},
	"Yahoo!ニュース・トピックス - 地域": {
		url: "https://news.yahoo.co.jp/rss/topics/local.xml",
		type: "rss",
	},
	*/
};

Object.keys(profiles).forEach(k =>{
	profiles[k].name = k;
	//! k.startsWith("Yahoo") && delete profiles[k];
});

