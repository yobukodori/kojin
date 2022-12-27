(function(){
	const log = console.log, appName = "peaceful twitter", appVer = "v.1.0.0";
	log("######## start", appName, appVer);
	JSON.parse = new Proxy(JSON.parse, {
		apply: function(target, thisArg, args) {
			let j = Reflect.apply(target, thisArg, args);
			log("JSON.parse returned:", j);
			if (j?.data?.home?.home_timeline_urt?.instructions){ // home timeline
				j.data.home.home_timeline_urt.instructions.forEach(instruction =>{
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
			}
			else if (j?.timeline?.instructions){
				// guide.json secondaryColumn いまどうしてる？
				j.timeline.instructions.forEach(instruction =>{
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
			}
			else if (Array.isArray(j) && j.every(e => e.token && e.user && e.user_id)){ 
				// users/recommendations.json secondaryColumn おすすめユーザー
				log("#### removed array of recommended uses", j);
				j = [];
			}
			return j;
		},
	});
})();
