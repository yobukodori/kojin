//name happy twitter
//matches https://twitter.com/*, https://mobile.twitter.com/*
//options
0,{ "wrapCodeInScriptTag":true }
//js
(function(){
	const log = console.log, appName = "happy twitter", appVer = "v.1.0.1";
	log("######## start", appName, appVer);
	window.ptdata = {
		verbose: false,
		arg:[],
		find: function(key){
			this.arg.forEach((jstr,i) =>{
				jstr && jstr.includes(key) && log("####", i + ":", jstr);
			});
		},
	};
	function logv(){
		ptdata.verbose && log.apply(null, arguments);
	}
	function logd(){
		ptdata.debug && log.apply(null, arguments);
	}
	function optionalChaining(obj, chain){
		try { return  chain.split(".").reduce((v, e)=> v[e], obj); }
		catch (e){}
	}
	const oc = optionalChaining;
	function getCookies(){
		let cookie = {};
		document.cookie.split(";").forEach(param=>{
			let i = param.indexOf("="),
				name = param.substring(0, i).trim(),
				//val = decodeURIComponent(param.substring(i+1).trim());
				val = param.substring(i+1).trim();
			cookie[name] = val;
		});
		return cookie;
	}
	function latestTweetFirst(twid){
		log("# latestTweetFirst twid:", twid);
		const dbName = "localforage", dbVersion = 2, storeName = "keyvaluepairs";
		let req = indexedDB.open(dbName, dbVersion);
		req.addEventListener("error", ev=>{
			log("# error on indexedDB.open:", ev);
		});
		req.addEventListener("success", ev=>{
			let db = ev.target.result, now = Date.now();
			[{	key: "user:" + twid + ":rweb.homeTimelineBehavior",
				item: { selectedTimeline:{ type:"home_latest" }, useLatest: true, _lastPersisted: now}
				},
			].forEach(rec=>{
				let key = rec.key, item = rec.item;
				log("# store.put", item, key);
				let req = db.transaction([storeName], "readwrite").objectStore(storeName).put(item, key);
				req.onerror = function(ev){
					log("# error on store.put:", key, "error", ev);
				};
				req.onsuccess = function(ev){
					log("# store.put", key, "success");
				}
			});
		});
	}
	function e2str(e)	{
		if (! e){ return "undefined"; }
		if (typeof jQuery === "function" && e instanceof jQuery){
			let s = e.selector ? "'" + e.selector + "'" : e[0] ? e2str(e[0]) : "n/a";
			return "jQuery(" + s + ")";
		}
		if (! e.tagName){
			return e.nodeName ? e.nodeName : (e.constructor && e.constructor.name) ? e.constructor.name : "unknown";
		}
		var s = e.tagName+(e.id?("#"+e.id):"");
		if (e.className){
			var className = e.className.baseVal != null ? e.className.baseVal : e.className;
			if (className = className.trim().replace(/\s+/g, " ")){
				className.split(" ").forEach(name => s += "." + name);
			}
		}
		return s;
	}
	function getContainerOfNodes(n1, n2){
		for (let n = n1 ; n ; n = n.parentNode){
			if (n.contains(n2)){ return n; }
		}
	}
	let readyToReload;
	JSON.parse = new Proxy(JSON.parse, {
		apply: function(target, thisArg, args) {
			let j = Reflect.apply(target, thisArg, args), d = {};
			if (! j){ return; }
			window.ptdata.arg.push(args[0]);
			log((ptdata.arg.length - 1) + ":", "JSON.parse returned:", j);
			// ホームタイムライン
			(j?.data?.home?.home_timeline_urt?.instructions || []).forEach(instruction =>{
				if (instruction.type === "TimelineAddEntries"){
					let entries = [], removed = 0;
					instruction.entries.forEach(entry =>{
						let ng;
						if (/^promoted(-tweet|Tweet)-\d/.test(entry.entryId)){
							log("## removed promoted", entry), removed++, ng = true;
						}
						else if (/^who-to-follow-\d/.test(entry.entryId)){
							log("## removed who-to-follow", entry), removed++, ng = true;
						}
						else if (/^tweet-\d/.test(entry.entryId)){
							if (entry.content.itemContent?.socialContext?.functionalityType === "Recommendation"){
								log("## removed Recommendation", entry), removed++, ng = true;
							}
						}
						if (! ng){
							log("# entry", entry.entryId, entry);
							entries.push(entry);
						}
					});
					removed > 0 && (instruction.entries = entries);
				}
			});
			// プロフページ /UserTweets primariColumn おすすめユーザー
			(j?.data?.user?.result?.timeline_v2?.timeline?.instructions || []).forEach(instruction =>{
				if (instruction.type === "TimelineAddEntries"){
					let entries = [], removed = 0;
					instruction.entries.forEach(entry =>{
						let ng;
						if (/^whoToFollow-\d/.test(entry.entryId)){
							log("## removed who to follow", entry), removed++, ng = true;
						}
						else if (/^promotedTweet-\d/.test(entry.entryId)){
							log("## removed promoted tweet", entry), removed++, ng = true;
						}
						else if (/^tweet-\d/.test(entry.entryId)){
							let result = oc(entry, "content.itemContent.tweet_results.result");
							if (result && result.__typename === "Tweet"){
								let user = result.core.user_results.result.legacy,
									tw = result.legacy;
								if (tw.source){
									let source = tw.source.split(/<|>/)[2];
									tw.full_text += " 【" + source + "】";
								}
							}
						}
						if (! ng){
							log("# entry", entry.entryId, entry);
							entries.push(entry);
						}
					});
					removed > 0 && (instruction.entries = entries);
				}
			});
			// 検索結果 primaryColumn
			if (j?.globalObjects?.tweets && j?.globalObjects?.users){
				let tweets = {}, removed = 0;
				Object.keys(j.globalObjects.tweets).forEach(tw_id =>{
					let tw = j.globalObjects.tweets[tw_id],
						source = tw.source.split(/<|>/)[2],
						user_id = tw.user_id_str,
						user = j.globalObjects.users[user_id],
						summary = user.name+"@"+user.screen_name + " " + tw.full_text.replace(/\s+/g, " ").substring(0,60),
						ng;
					tw.full_text += " 【" + source + "】";
					if (user.advertiser_account_type && user.advertiser_account_type !== "none"){
						const levels = user.advertiser_account_service_levels;
						tw.full_text += "【"+user.advertiser_account_type+": " + levels.join(",") + "】";
						if (! (levels.length === 1 && levels[0] === "analytics")){
							// removed++, ng = true;
							log("#### ",  user.advertiser_account_type + "'s tweet:", summary, "\ntweet:", tw, "\nuser:", user);
						}
					}
					if (! ng){
						tweets[tw_id] = tw;
					}
				});
				if (removed > 0){
					j.globalObjects.tweets = tweets;
				}
			}
			// guide.json secondaryColumn いまどうしてる？
			(j?.timeline?.instructions || []).forEach(instruction =>{
				if (instruction.addEntries){
					instruction.addEntries.entries.forEach(entry =>{
						if (entry.entryId.startsWith("Guide-")){
							log("# Guide-", entry);
							if (entry?.content?.timelineModule?.items){
								log("# items", entry.content.timelineModule.items);
								let items = [], removed = 0;
								entry.content.timelineModule.items.forEach(item =>{
									let ng;
									if (item.entryId.startsWith("trends-") && item.item.clientEventInfo.element === "promoted_trend"){
										log("## removed promoted trend", item), removed++, ng = true;
									}
									if (! ng){
										log("# item", item.entryId, item);
										items.push(item);
									}
								});
								removed > 0 && (entry.content.timelineModule.items = items);
							}
						}
					});
				}
			});
			// users/recommendations.json secondaryColumn おすすめユーザー
			if (Array.isArray(j) && j.every(e => e.token && e.user && e.user_id)){ 
				log("## removed array of recommended uses", j);
				j = [];
			}
			// ログインしたユーザーのIDを使って latestTweetFirst を呼び出す
			! getCookies().twid && j?.subtasks && j.subtasks.forEach(task =>{
				log("# task", task);
				if (task.check_logged_in_account){
				log("# task.check_logged_in_account", task.check_logged_in_account);
					if (task.check_logged_in_account.user_id){
						log("# check_logged_in_account.user_id:", task.check_logged_in_account.user_id);
						log("document.cookie",document.cookie);
						setTimeout(latestTweetFirst, 0, task.check_logged_in_account.user_id, true/*reload*/);
						let timer = setInterval(function(){
							if (getCookies().twid){
								clearInterval(timer);
								readyToReload = true;
								log("# ready to reload");
								//debugger;location.reload();
							}
							else {
								log("# reload interval");
							}
						}, 100);
					}
				}
			});
			if (readyToReload && j.timeline){
				setTimeout(()=>{
					log("#### reloading");
					debugger;
					location.reload();
				}, 0);
			}
			return j;
		},
	});
	function removeSearchFilterBlock(e){
		e = e || document.querySelector('[data-testid="sidebarColumn"] a[href^="/search-advanced"]');
		while (e = e.parentElement){
			if (e.textContent.includes("検索フィルター")){
				e.remove();
				break;
			}
		}
	}
	const observer = new MutationObserver((mutations, observer)=>{
		mutations.forEach((m,i)=>{
			if (m.type !== "childList"){ return; }
			m.addedNodes.forEach(n =>{
				if (! (n && n.nodeType === Node.ELEMENT_NODE)){ return; }
				let e, d = {};
				if (e = n.querySelector('a[href^="/search-advanced"]')){
					removeSearchFilterBlock(e);
				}
				else if (e = n.querySelector('iframe[title="[Googleでログイン]ダイアログ"]')){
					log("## removed [Googleでログイン]ダイアログ", e);
					e.parentElement.remove();
				}
			});
			// m.removedNodes.forEach(n =>{});
		});
	});
	observer.observe(document.documentElement, {childList: true, subtree: true});
	if ("block xhr"){
		let rex = new RegExp([
			"/live_pipeline/update_subscriptions$",
			/* EasyList block /1.1/jot */
			"/jot/client_event.json",
			"/jot/error_log.json",
			"/jot/ces/p2",
			"/search/typeahead.json?",
			"/csp_report?",
			"/promoted_content/log.json",
			"/videoads/",
			"/attribution/event.json",
			].map(e=>e.replace(/([\.\?])/g, "\\$1")).join("|")
		);	
		XMLHttpRequest.prototype.open = new Proxy(XMLHttpRequest.prototype.open, {
			apply: function(target, thisArg, args ) {
				let method = args [0], url = args [1], async = args [2], u = new URL(url);
				if (u.hostname.startsWith("ads-api.") || rex.test(url)){
					args [1] = "unknown://";
					//console.log("# blocked xhr", url);
				}
				return Reflect.apply(target, thisArg, args);
			}
		});
	}
})();
