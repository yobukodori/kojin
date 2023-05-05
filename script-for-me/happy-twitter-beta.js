//==========================================================
//name happy twitter beta
//matches https://twitter.com/*, https://mobile.twitter.com/*
//option nonce, start
//js
(function(){
	const appName = "happy twitter", appVer = "v.1.0.1";
	function log(){
		console.log.apply(console,["["+appName+"]"].concat(Array.from(arguments)));
	}
	log("start");
	window.ht = {
		jsonData:[],
		find: function(key){
			this.jsonData.forEach((jstr,i) =>{
				jstr && jstr.includes(key) && log("####", i + ":", jstr);
			});
		},
	};
	function logv(){
		ht.verbose && log.apply(null, arguments);
	}
	function logd(){
		ht.debug && log.apply(null, arguments);
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
			if (ht.debug){
				ht.jsonData.push(args[0]);
				log((ht.jsonData.length - 1) + ":", "JSON.parse returned:", j);
			}
			// ホームタイムライン
			(j?.data?.home?.home_timeline_urt?.instructions || []).forEach(instruction =>{
				if (instruction.type === "TimelineAddEntries"){
					let entries = [], removed = 0;
					instruction.entries.forEach(entry =>{
						let ng;
						if (/^promoted(-tweet|Tweet)-\d/.test(entry.entryId)){
							logd("## removed promoted", entry), removed++, ng = true;
						}
						else if (/^who-to-follow-\d/.test(entry.entryId)){
							logd("## removed who-to-follow", entry), removed++, ng = true;
						}
						else if (/^tweet-\d/.test(entry.entryId)){
							if (entry.content.itemContent?.socialContext?.functionalityType === "Recommendation"){
								logd("## removed Recommendation", entry), removed++, ng = true;
							}
						}
						if (! ng){
							logd("# entry", entry.entryId, entry);
							entries.push(entry);
						}
					});
					removed > 0 && (instruction.entries = entries);
				}
			});
			// プロフページ /UserTweets, primariColumn おすすめユーザー
			(j?.data?.user?.result?.timeline_v2?.timeline?.instructions || []).forEach(instruction =>{
				if (instruction.type === "TimelineAddEntries"){
					let entries = [], removed = 0;
					instruction.entries.forEach(entry =>{
						let ng;
						if (/^(whoToFollow|who-to-follow)-\d/.test(entry.entryId)){
							logd("## removed who to follow", entry), removed++, ng = true;
						}
						else if (/^promotedTweet-\d/.test(entry.entryId)){
							logd("## removed promoted tweet", entry), removed++, ng = true;
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
							logd("# entry", entry.entryId, entry);
							entries.push(entry);
						}
					});
					removed > 0 && (instruction.entries = entries);
				}
			});
			// リストページ primaryColumn
			(j?.data?.viewer?.list_management_timeline?.timeline?.instructions || []).forEach(instruction =>{
				if (instruction.type === "TimelineAddEntries"){
					let entries = [], removed = 0;
					instruction.entries.forEach(entry =>{
						let ng = entry.entryId.startsWith("listToFollowModule-");
						ng && logd("## removed listToFollowModule-", entry), removed++;
						if (! ng){
							logd("# entry", entry.entryId, entry);
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
							logd("#### ",  user.advertiser_account_type + "'s tweet:", summary, "\ntweet:", tw, "\nuser:", user);
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
							logd("# Guide-", entry);
							if (entry?.content?.timelineModule?.items){
								logd("# items", entry.content.timelineModule.items);
								let items = [], removed = 0;
								entry.content.timelineModule.items.forEach(item =>{
									let ng;
									if (item.entryId.startsWith("trends-") && item.item.clientEventInfo.element === "promoted_trend"){
										logd("## removed promoted trend", item), removed++, ng = true;
									}
									if (! ng){
										logd("# item", item.entryId, item);
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
				logd("## removed array of recommended uses", j);
				j = [];
			}
			// ログインしたユーザーのIDを使って latestTweetFirst を呼び出す
			! getCookies().twid && j?.subtasks && j.subtasks.forEach(task =>{
				logd("# task", task);
				if (task.check_logged_in_account){
				logd("# task.check_logged_in_account", task.check_logged_in_account);
					if (task.check_logged_in_account.user_id){
						logd("# check_logged_in_account.user_id:", task.check_logged_in_account.user_id);
						logd("document.cookie",document.cookie);
						setTimeout(latestTweetFirst, 0, task.check_logged_in_account.user_id, true/*reload*/);
						let timer = setInterval(function(){
							if (getCookies().twid){
								clearInterval(timer);
								readyToReload = true;
								logd("# ready to reload");
								//debugger;location.reload();
							}
							else {
								logd("# reload interval");
							}
						}, 100);
					}
				}
			});
			if (readyToReload && j.timeline){
				setTimeout(()=>{
					logd("#### reloading");
					debugger;
					location.reload();
				}, 0);
			}
			return j;
		},
	});
	if ("monitor transition"){
		function shorten(url){
			if (typeof url !== "string" || ! url instanceof String){ return "" + url; }
			let u = decodeURIComponent(url);
			return u.length > 30 ? u.substring(0, 20) + "..." : u;
		}
		function state2str(state){
			if (! state){ return typeof state; }
			let s = "";
			Object.keys(state).forEach(k =>{
				let v = state[k];
				if (k === "previousPath"){ v = shorten(v); }
				else if (k === "state" && typeof v === "object"){ v = state2str(v); }
				s += ", " + k + ":" + v;
			});
			return "{" + s.substring(2) + "}";
		}
		function onPageTrasition(method, state, title, url){
			log("## transition ##", method, "state:"+  state2str(state), "title:", title, "url:", shorten(url));
			listener.forEach(fn => fn(method, state, title, url));
		}
		["pushState", "replaceState"].forEach(prop =>{
			history[prop] = new Proxy(history[prop], {
				apply: function(target, thisArg, args) {
					const state = args[0], title = args[1], url = args[2];
					onPageTrasition(prop, state, title, url);
					return Reflect.apply(target, thisArg, args);
				},
			});
		});
		window.addEventListener("popstate", ev =>{
			let url = location.pathname+location.search;
			onPageTrasition("popstate", ev.state, null, url);
		});
		const listener = new Set();
		window.twitterPageTransitionMonitor = {
			addListener(callback){
				listener.add(callback);
				return function(){
					listener.delete(callback);
				};
			},
			removeListener(handle){
				handle();
			}
		};
	}
	if ("monitor mutation"){
		function removeLoginGoogle(){
			let e;
			if (e = document.querySelector('body > #react-root ~ div > iframe[src^="https://accounts.google.com/"]')){
				logd("## removed [Googleでログイン]ダイアログ", e);
				e.parentElement.remove();
			}
		}
		function focusUserNameInput(){
			let e = document.querySelector('[data-testid="apple_sign_in_button"] + div + div input');
			e && e.focus();
		}
		function removeSearchFilter(){
			let e;
			if (e = document.querySelector('[data-testid="sidebarColumn"] a[href^="/search-advanced"]')){
				while (e = e.parentElement){
					if (e.textContent.includes("検索フィルター")){
						e.remove();
						break;
					}
				}
			}
		}
		function hideListHeader(){
			function getHeader(){
				let e = document.querySelector('section h1 + div a[href^="/i/lists/"][href$="/info"]');
				if (e){
					while (e = e.parentElement){
						if (e.dataset.testid === "cellInnerDiv"){ return e; }
					}
				}
			}
			const header = getHeader();
			if (! header){ return; }
			let id = "list-header-display-toggle";
			if (document.getElementById(id)){ return; }
			let shareButton = document.querySelector('[data-testid="share-button"');
			if (! shareButton){ return; }
			let btn = document.createElement("button");
			btn.id = id;
			btn.textContent = "ヘッダ表示";
			btn.addEventListener("click", ev =>{
				const header = getHeader();
				if (header.style.display === ""){
					header.style.display = "none";
					btn.textContent = "ヘッダ表示";
				}
				else {
					header.style.display = "";
					btn.textContent = "ヘッダ非表示";
				}
			});
			shareButton.parentElement.insertBefore(btn, shareButton);
			header.style.display = "none";
		}
		new MutationObserver((mutations, observer)=>{
			removeLoginGoogle();
			if (location.pathname === "/i/flow/login"){
				focusUserNameInput();
			}
			else if (location.pathname === "/search"){
				removeSearchFilter();
			}
			else if (location.pathname.startsWith("/i/lists/")){
				hideListHeader();
			}
			0 && mutations.forEach((m,i)=>{
				if (m.type !== "childList"){ return; }
				m.addedNodes.forEach(n =>{
					if (! (n && n.nodeType === Node.ELEMENT_NODE)){ return; }
				});
				// m.removedNodes.forEach(n =>{});
			});
		}).observe(document.documentElement, {childList: true, subtree: true});
	}
	if ("block xhr"){
		let rex = new RegExp([
			"/live_pipeline/update_subscriptions$",
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
