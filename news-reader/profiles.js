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
	"AFPBP総合新着 rss": {
		url: "http://feeds.afpbb.com/rss/afpbb/afpbbnews",
		type: "rss",
		max: 20,
	},
	"AFPBP総合アクセスランキング rss": {
		url: "http://feeds.afpbb.com/rss/afpbb/access_ranking",
		type: "rss",
		max: 5,
	},
	"CNN国際ニュース rss": {
		url: "http://feeds.cnn.co.jp/rss/cnn/cnn.rdf",
		type: "rss",
	},
	"ブルームバーグトップニュース rss": {
		url: "https://assets.wor.jp/rss/rdf/bloomberg/top.rdf",
		type: "rss",
	},
	"jiji.com rss": {
		url: "https://www.jiji.com/rss/ranking.rdf",
		type: "rss",
	},
	"NHK主要ニュース rss": {
		url: "https://www.nhk.or.jp/rss/news/cat0.xml",
		type: "rss",
	},
	"読売新聞社会 rss": {
		url: "https://assets.wor.jp/rss/rdf/yomiuri/national.rdf",
		type: "rss",
	},
	"読売新聞政治 rss": {
		url: "https://assets.wor.jp/rss/rdf/yomiuri/politics.rdf",
		type: "rss",
	},
	"読売新聞経済 rss": {
		url: "https://assets.wor.jp/rss/rdf/yomiuri/economy.rdf",
		type: "rss",
	},
	"読売新聞国際 rss": {
		url: "https://assets.wor.jp/rss/rdf/yomiuri/world.rdf",
		type: "rss",
	},
	"朝日新聞社会 rss": {
		url: "https://www.asahi.com/rss/asahi/national.rdf",
		type: "rss",
		max: 20,
	},
	"朝日新聞政治 rss": {
		url: "https://www.asahi.com/rss/asahi/politics.rdf",
		type: "rss",
	},
	"朝日新聞経済 rss": {
		url: "https://www.asahi.com/rss/asahi/business.rdf",
		type: "rss",
		max: 20,
	},
	"朝日新聞国際 rss": {
		url: "https://www.asahi.com/rss/asahi/international.rdf",
		type: "rss",
	},
	/*
	"ロイタートップニュース rss": {
		url: "https://assets.wor.jp/rss/rdf/reuters/top.rdf",
		type: "rss",
	},
	"朝日新聞速報RSS": {
		url: "https://www.asahi.com/rss/asahi/newsheadlines.rdf",
		type: "rss",
	},
	*/
	/*
	"BBC": {
		url: "https://www.bbc.com/japanese",
		type: "html",
		itemSelector: '[aria-labelledby="Top-stories"] a',
		selector: {
			item: '[aria-labelledby="Top-stories"] li > div',
			title: 'a > span[id^="promo-"]',
			link: 'a',
			date: "h3 ~ time",
			description: "",
		},
		normarizeDate: function (datestr){
		},
	},
	"JIJI.COM": {
		url: "https://www.jiji.com/",
		type: "html",
		itemSelector: 'section.HomeTopics a',
	},
	"AFPBP": {
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
	"ロイター": {
		url: "https://jp.reuters.com/",
		type: "html",
		itemSelector: '#topStory .story-content a, .top-story-content a, #hp-top-news-top a, .top-news-module .article-header a',
	},
	"47NEWS": {
		url: "https://www.47news.jp/",
		type: "html",
		itemSelector: 'main > div.page_layout:nth-child(2) .post_items > a.post_item',
		selector: {
			item: 'main > div.page_layout:nth-child(2) .post_items > a.post_item',
			title: '.item_ttl',
			link: 'a.post_item',
			date: ".item_time",
			description: "",
		},
	},
	*/
};

Object.keys(profiles).forEach(k => profiles[k].name = k);

