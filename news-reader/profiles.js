const profiles = {
	"AP通信": {
		url: "https://news.yahoo.co.jp/rss/media/aptsushinv/all.xml",
		type: "rss",
		itemSelector: '#top-topstory li > a, #top-latest li > a',
		normarizeLink: function (url){
			return url.search = "", (new URL(url)).href;
		},
		isObsolete: function (item){
			return new Date() - new Date(item.date || item.pubDate) > 24 * 60 * 60 * 1000;
		},
	},
	"AFPBB総合新着 rss": {
		url: "http://feeds.afpbb.com/rss/afpbb/afpbbnews",
		type: "rss",
		max: 20,
	},
	"AFPBB総合アクセスランキング rss": {
		url: "http://feeds.afpbb.com/rss/afpbb/access_ranking",
		type: "rss",
		max: 5,
	},
	"CNN国際ニュース rss": {
		url: "http://feeds.cnn.co.jp/rss/cnn/cnn.rdf",
		type: "rss",
		max: 20,
	},
	"ブルームバーグトップニュース rss": {
		url: "https://assets.wor.jp/rss/rdf/bloomberg/top.rdf",
		type: "rss",
	},
	"NHK主要ニュース rss": {
		url: "https://www.nhk.or.jp/rss/news/cat0.xml",
		type: "rss",
	},
	/*
	"JIJI.COM": {
		url: "https://www.jiji.com/",
		type: "html",
		itemSelector: 'section.HomeTopics a',
	},
	"AFPBB": {
		url: "https://www.afpbb.com/",
		type: "html",
		itemSelector: '#top-topstory li > a, #top-latest li > a',
		normarizeLink: function (url){
			return url.search = "", (new URL(url)).href;
		},
	},
	"CNN": {
		url: "https://www.cnn.co.jp/",
		type: "html",
		itemSelector: '.pg-container:nth-child(1) > section:nth-child(1) a:not(h1 > a:nth-child(1), [href$="/"])',
	},
	*/
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
		itemSelector: '.ArticleListMain li a',
		selector: {
			item: '.ArticleListMain li > a, .ArticleHeadlineList li > a',
			title: 'p:nth-child(1), div + p',
			link: 'a',
			date: "span, div + p + p",
			description: "",
		},
		adjustDate: function (datestr){
			return /^\(.+\)$/.test(datestr) ? datestr.slice(1, -1) : datestr;
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
		adjustDate: function (datestr){
			return /^\(.+\)$/.test(datestr) ? datestr.slice(1, -1) : datestr;
		},
		max: 20,
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
	"ロイタートップニュース rss": {
		url: "https://assets.wor.jp/rss/rdf/reuters/top.rdf",
		type: "rss",
	},
	/*
	"ロイタートップ": {
		url: "https://jp.reuters.com/",
		type: "html",
		itemSelector: '#topStory .story-content a, .top-story-content a, #hp-top-news-top a, .top-news-module .article-header a',
	},
	*/
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
	},
};

Object.keys(profiles).forEach(k => profiles[k].name = k);

