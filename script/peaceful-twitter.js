(function(){
	const log = console.log, appName = "peaceful twitter", appVer = "v.1.0.0";
	log("######## start", appName, appVer);
	window.ptdata = {
		arg:[],
		find: function(key){
			this.arg.forEach((jstr,i) =>{
				jstr && jstr.includes(key) && log("####", i + ":", jstr);
			});
		},
	};
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
	JSON.parse = new Proxy(JSON.parse, {
		apply: function(target, thisArg, args) {
			window.ptdata.arg.push(args[0]);
			let j = Reflect.apply(target, thisArg, args);
			log("JSON.parse returned:", j);
			// ホームタイムライン
			(j?.data?.home?.home_timeline_urt?.instructions || []).forEach(instruction =>{
				if (instruction.type === "TimelineAddEntries"){
					let entries = [], removed = 0;
					instruction.entries.forEach(entry =>{
						let ng;
						if (/^promoted(-tweet|Tweet)-\d/.test(entry.entryId)){
							log("#### removed promoted", entry), removed++, ng = true;
						}
						else if (/^tweet-\d/.test(entry.entryId)){
							if (entry.content.itemContent?.socialContext?.functionalityType === "Recommendation"){
								log("#### removed Recommendation", entry), removed++, ng = true;
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
							log("#### removed who to follow", entry), removed++, ng = true;
						}
						else if (/^promotedTweet-\d/.test(entry.entryId)){
							log("#### removed promoted tweet", entry), removed++, ng = true;
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
						user_id = tw.user_id_str,
						user = j.globalObjects.users[user_id],
						ng;
					if (user.advertiser_account_type === "promotable_user"){
						log("#### removed promotable_user's tweet:", user.name, "@" + user.screen_name, tw.full_text.replace(/\s+/g, " ").substring(0,80), "\ntweet:", tw, "\nuser:", user), removed++, ng = true;
					}
					if (! ng){
						log("#", user.name, "@" + user.screen_name, tw.full_text.replace(/\s+/g, " ").substring(0,80), "\ntweet:", tw, "\nuser:", user);
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
										log("#### removed promoted trend", item), removed++, ng = true;
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
				log("#### removed array of recommended uses", j);
				j = [];
			}
			return j;
		},
	});
	const observer = new MutationObserver((mutations, observer)=>{
		mutations.forEach((m,i)=>{
			if (m.type !== "childList"){ return; }
			m.addedNodes.forEach(n =>{
				if (n && n.textContent.includes("検索フィルター")){
					let e1 = n.querySelector('h2 > div > span'), e2 = n.querySelector('a[href^="/search-advanced"]');
					let container = getContainerOfNodes(e1, e2);
					container && (console.log("#### removed 検索フィルター:", container), container.remove());
				}
			});
			// m.removedNodes.forEach(n =>{});
		});
	});
	observer.observe(document.documentElement, {childList: true, subtree: true});
})();
