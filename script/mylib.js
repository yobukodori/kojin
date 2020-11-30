function str_find_block(str, sig1, sig2, from){
	"use strict";
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
};

 function str_find_block_r(str, sig1, sig2, from){
	"use strict";
	var ro = {error:"n/a", start:-1, first:-1, last:-1, next:from ? from:0};
	ro.last = str.indexOf(sig2, ro.next);
	if (ro.last === -1){
		ro.error = "str_find_block_r() can't find sig2 '" + sig2 + "'";
		return ro;
	}
	ro.next = ro.last + sig2.length;
	ro.start = str.lastIndexOf(sig1, ro.last);
	if (ro.start === -1){
		ro.error = "str_find_block_r() can't find sig1 '" + sig1 + "'";
		return ro;
	}
	ro.first = ro.start + sig1.length;
	ro.error = "";
	return ro;
};

function corsAnywhere(url){
	return "https://cors-anywhere.herokuapp.com/" + url;
}
