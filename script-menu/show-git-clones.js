//name レポジトリ毎のクローン回数
//matches https://github.com/, https://github.com/yobukodori, https://github.com/yobukodori/*
//js
(function(){
	if (! document.querySelector('meta[name="user-login"]').content){
		alert("ログインして実行してください");
		return;
	}
	const table = document.createElement("table"),
			thead = document.createElement("thead"),
			thr = document.createElement("tr"),
			tbody = document.createElement("tbody");
	table.style.cssText = "border-collapse: initial; border-spacing: .5em 0; margin: 1em;";
	thead.append(thr);
	table.append(thead, tbody);
	let rows = 0, tasks = [];
	["j-news-reader", "csp-for-me", "cors-for-me", "script-for-me", "script-menu"].forEach((repo, i) =>{
		tasks.push(new Promise((resolve, reject)=>{
			const url = "https://github.com/yobukodori/" + repo + "/graphs/clone-activity-data";
			const headers = { Accept: "application/json" }, opts = {headers};
			fetch(url, opts).then(res => res.json())
			.then(data =>{
				rows === 0 && thr.append(document.createElement("td"));
				const tr = document.createElement("tr"), th = document.createElement("th");
				th.textContent = repo, th.style.cssText = "white-space:nowrap;", tr.append(th), tr.i = i;
				let follower = Array.from(tbody.querySelectorAll('tr')).find(tr => tr.i > i);
				follower ? follower.before(tr) : tbody.append(tr);
				data.counts.reverse().forEach(d =>{
					let dateStr = new Date(d.bucket * 1000).toLocaleDateString().split("/").slice(1).join("/");
					let td = document.createElement("td");
					td.textContent = d.total + "/" + d.unique;
					tr.append(td);
					if (rows === 0){
						let th = document.createElement("th");
						th.scope = "col", th.textContent = dateStr;
						thr.append(th);
					}
				});
				rows++;
				resolve(true);
			})
			.catch(e => reject(e));
		}));
	});
	Promise.allSettled(tasks).then(values => {
		const div = document.createElement("div");
		div.style.cssText = "position:fixed; top:4em; left:50%; transform:translateX(-50%);"
			+ " background-color: bisque; z-index:10; max-width:85%; overflow-x:scroll;";
		document.addEventListener("click", function handler(ev){
			div.remove();
			document.removeEventListener("click", handler);
		});
		div.append(table);
		document.body.append(div);
	});
})();
