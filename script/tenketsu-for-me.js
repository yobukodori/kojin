(function(){
	"use strict";
	let d = document;

	function corsAnywhere(url){
		// using CORS for Me
		return url;
		//return "https://cors-anywhere.herokuapp.com/" + url;
	}
	
	function str_find_block(str, sig1, sig2, from)
	{
		var ro = {error:"n/a", start:-1, first:-1, last:-1, next:from ? from:0};
		ro.start = str.indexOf(sig1, ro.next);
		if (ro.start === -1){
			ro.error = "str_find_block() can't find sig1 '" + sig1 + "'";
			return ro;
		}
		ro.first = ro.start + sig1.length;
		ro.last = str.indexOf(sig2, ro.first);
		if (ro.last === -1){
			ro.error = "str_find_block() can't find sig2 '" + sig2 + "'";
			return ro;
		}
		ro.next = ro.last + sig2.length;
		ro.error = "";
		return ro;
	}

	if (! window.tenki_dir){
		alert("tenki.jpの地域をwindow.tenki_dirに設定してください");
		return;
	}
	
	let wn = {}, tj = {forecast:{}};
	if (d.querySelector('div.weather-day__item')){
		wn.hour = true;
	}
	else if (d.querySelector('div.weather-10day__item')){
		wn.day = true;
	}
	else {
		alert("１時間毎の天気か週間天気(10日間)で実行してください");
		return;
	}
	
	if (wn.hour){ 
		fetch(corsAnywhere("https://tenki.jp/lite/forecast/"+window.tenki_dir+"/1hour.html"))
		.then(function(res){
			return res.text();
		})
		.then(function(html){
			// tenki.jp
			{
				let sig = 'class="forecast-point-1h">', bo, from = 0, r, day, days = [];
				for (;;){
					bo = str_find_block(html, sig, '</table>', from);
					if (bo.error){
						if (days.length < 2)
							console.log("tenki.jp: " + bo.error);
						break;
					}
					from = bo.next;
					if (r = html.substring(bo.first, bo.first+100).match(/<th class="date".+<br>(\d+)日/))
						day = parseInt(r[1]) + "日";
					else
						day = "0日";
					days.push(day);
					html.substring(bo.first, bo.last).split('</tr>').forEach(tr=>{
						if (r = tr.match(/"hour">(\d+):\d+<(.|\n)+src="(.+weather\/.+?)"/)){
							tj.forecast[day + parseInt(r[1]) + "時"] = r[3];
						}
					});
				}
				for (let i = 0 ; i < days.length - 2 ; i++){
					if (tj.forecast[days[i] + "24時"]){
						tj.forecast[days[i+1] + "0時"] = tj.forecast[days[i] + "24時"];
					}
				}
			}
			// weathernews
			{
				let dayList = d.querySelectorAll('div.weather-day'), r, day;
				for (let i = 0 ; i < dayList.length ; i++){
					if (r = dayList[i].firstElementChild.innerText.match(/(\d+)日/))
						day = parseInt(r[1]) + "日";
					else
						day = 0 + "日";
					let ee = dayList[i].querySelectorAll('div.weather-day__item');
					for (let i = 0 ; i < ee.length ; i++){
						let e = ee[i], index = day + parseInt(e.firstElementChild.innerText) + "時";
						let p = d.createElement("p");
						p.className = "weather-day__icon";
						if (tj.forecast[index])
							p.innerHTML = '<img src="' + tj.forecast[index] + '">';
						else
							p.innerText = "n/a";
						e.insertBefore(p, e.children[2]);
					}
				}
			}
		});
	}
	
	fetch(corsAnywhere("https://tenki.jp/lite/forecast/"+window.tenki_dir+"/10days.html"))
	.then(function(res){
		return res.text();
	})
	.then(function(html){
		let from = 0, bo, r, day;
		for (;;){
			bo = str_find_block(html, '<table class="forecast-point-10days"', '</table>', from);
			if (bo.error){
				break;
			}
			from = bo.next;
			html.substring(bo.first, bo.last).split('</tr>').forEach(tr=>{
				if (r = tr.match(/<th>(\d+)日\((.|\n)+src="(.+weather\/.+?)"/)){
					day = parseInt(r[1]);
					tj.forecast["d" + day] = r[3];
				}
			});
		}
		// weathernews
		[
			{selector: 'div.weather0-weekly__item', tagName: 'p', className: 'weather-weekly__thumb'},
			{selector: 'div.weather-10day__item', tagName: 'div', className: 'weather-10day__icon'},
		].forEach(item=>{
			let ee = d.querySelectorAll(item.selector);
			for (let i = 0 ; i < ee.length ; i++){
				let e = ee[i], day = parseInt(e.firstElementChild.innerText), index = "d" + day;
				let p = d.createElement(item.tagName);
				p.className = item.className;
				if (tj.forecast[index])
					p.innerHTML = '<img src="' + tj.forecast[index] + '">';
				else
					p.innerText = "n/a";
				e.insertBefore(p, e.children[2]);
			}
		});
	});
})();
