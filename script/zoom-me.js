/*
 * title: Zoom Me!
 * name: zoom-me.js
 * author: yobukodori
*/

(function() {
    'use strict';
	var d = document, e, s, i, temp, sc = "";
	e = d.querySelector('meta[name="viewport"]');
	if (e){
		s = e.content;
		while (s.length > 0){
			if ((i = s.search(/[,;]/)) >= 0){
				temp = s.substr(0, i);
				s = s.substr(i+1);
			}
			else {
				temp = s;
				s = "";
			}
			if (! /^\s*(user-scalable|(max|min)imum-scale)\s*=/.test(temp)){
				sc += "," + temp;
			}
		}
		e.parentNode.removeChild(e);
	}
	sc += ", user-scalable=yes, minimum-scale=0, maximum-scale=10";
	e = d.createElement("meta");
	e.name = "viewport";
	e.content = sc.substr(1); // remove "," 
	d.getElementsByTagName("head")[0].appendChild(e);
})();
