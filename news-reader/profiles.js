const profiles = {
	"jiji.com rss": {
		url: "https://www.jiji.com/rss/ranking.rdf",
		type: "rss",
		normarizeLink: function (url){
			return url.search.endsWith("&m=rss") && (url.search = url.search.slice(0,-6)), (new URL(url)).href;
		},
	},
	"jiji.com新着": {
		url: "https://www.jiji.com/jc/list?g=news",
		mobile: "https://www.jiji.com/sp/list?g=news",
		type: "html",
		selector: {
			item: '.ArticleListMain li > a, .ArticleHeadlineList li > a',
			title: 'p:nth-child(1), div + p',
			link: 'a',
			date: "span, .ArticleDate",
			description: "",
		},
		normarizeLink: function (url){
			return url.pathname.startsWith("/sp/") && (url.pathname = "/jc/" + url.pathname.substring(4)), (new URL(url)).href;
		},
		adjustDate: function (datestr){
			return /^\(.+\)$/.test(datestr) ? datestr.slice(1, -1) : datestr;
		},
		isObsolete: function (datetime){
			return Date.now() - datetime > 24 * 60 * 60 * 1000;
		},
	},
	"jiji.comトップ": {
		url: "https://www.jiji.com/",
		type: "html",
		selector: {
			item: '.HomeTopics .TopicsPhoto, .HomeTopics li',
			title: 'a',
			link: 'a',
			date: "",
			description: "",
		},
		getTitle: function (title){
			return title.firstChild.textContent
		},
		getDatetime: function (item){
			return 0; // this.now ? this.now : (this.now = Date.now());
		},
	},
	"47NEWSトップ": {
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
	/*
	"読売新聞社会 rss": {
		url: "https://assets.wor.jp/rss/rdf/yomiuri/national.rdf",
		type: "rss",
		max: 5,
	},
	"読売新聞政治 rss": {
		url: "https://assets.wor.jp/rss/rdf/yomiuri/politics.rdf",
		type: "rss",
		max: 5,
	},
	"読売新聞経済 rss": {
		url: "https://assets.wor.jp/rss/rdf/yomiuri/economy.rdf",
		type: "rss",
		max: 5,
	},
	"読売新聞国際 rss": {
		url: "https://assets.wor.jp/rss/rdf/yomiuri/world.rdf",
		type: "rss",
		max: 10,
	},
	*/
	"読売新聞トップ": {
		url: "https://www.yomiuri.co.jp/",
		type: "html",
		selector: {
			item: '.headline article',
			title: '.title',
			link: 'a',
			date: "time",
			description: "",
		},
		excludeItem: function (item, data){
			return item.getElementsByTagName("time").length === 0;
		},
	},
	/*
	"朝日新聞社会 rss": {
		url: "https://www.asahi.com/rss/asahi/national.rdf",
		type: "rss",
		max: 5,
	},
	"朝日新聞政治 rss": {
		url: "https://www.asahi.com/rss/asahi/politics.rdf",
		type: "rss",
		max: 5,
	},
	"朝日新聞経済 rss": {
		url: "https://www.asahi.com/rss/asahi/business.rdf",
		type: "rss",
		max: 5,
	},
	"朝日新聞国際 rss": {
		url: "https://www.asahi.com/rss/asahi/international.rdf",
		type: "rss",
		max: 10,
	},
	"朝日新聞速報RSS": {
		url: "https://www.asahi.com/rss/asahi/newsheadlines.rdf",
		type: "rss",
	},
	*/
	"朝日新聞トップ": {
		url: "https://www.asahi.com/",
		mobile: "https://www.asahi.com/sp/",
		type: "html",
		selector: {
			item: '.p-topNews__firstNews, .p-topNews__listItem, .p-topNews2__listItem, .p-topNews .c-articleModule:nth-child(1)',
			title: '.c-articleModule__title',
			link: 'a.c-articleModule__link',
			date: "time",
			description: "",
		},
		excludeItem: function (item, data){
			return item.getElementsByTagName("time").length === 0;
		},
	},
	"NHK主要ニュース rss": {
		url: "https://www.nhk.or.jp/rss/news/cat0.xml",
		type: "rss",
	},
	"ロイタートップニュース rss": {
		url: "https://assets.wor.jp/rss/rdf/reuters/top.rdf",
		type: "rss",
	},
	"CNN国際ニュース rss": {
		url: "http://feeds.cnn.co.jp/rss/cnn/cnn.rdf",
		type: "rss",
		isObsolete: function (datetime){
			return Date.now() - datetime > 24 * 60 * 60 * 1000;
		},
	},
	"BBCトップ": {
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
	"AFPBB総合アクセスランキング rss": {
		url: "http://feeds.afpbb.com/rss/afpbb/access_ranking",
		type: "rss",
		isObsolete: function (datetime){
			let yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
			return yesterday.setHours(0, 0, 0, 0), datetime <  yesterday.getTime();
		},
	},
	/*
	"AFPBB人気": {
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
	"AFPBB総合新着 rss": {
		url: "http://feeds.afpbb.com/rss/afpbb/afpbbnews",
		type: "rss",
		max: 20,
	},
	/*
	"AFPBB新着": {
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
	*/
	"ブルームバーグトップニュース rss": {
		url: "https://assets.wor.jp/rss/rdf/bloomberg/top.rdf",
		type: "rss",
	},
	"Forbes政治経済": {
		url: "https://forbesjapan.com/category/lists/economics?internal=nav_cat_economics",
		type: "html",
		selector: {
			item: '.article-text .edittools-stream li',
			title: '.article-headline',
			link: 'a',
			date: ".article-time",
			description: "",
		},
		max: 10,
		isObsolete: function (datetime){
			let yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
			return yesterday.setHours(0, 0, 0, 0), datetime <  yesterday.getTime();
		},
	},
	"AP通信": {
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
};

Object.keys(profiles).forEach(k => profiles[k].name = k);
