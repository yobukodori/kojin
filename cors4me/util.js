function parseUrls(strUrls)
{
	var urls = [];
	if (typeof strUrls === "string" && strUrls){
		var ar = strUrls.split(",");
		for (var i = 0 ; i < ar.length ; i++){
			var url = ar[i].trim();
			if (url)
				urls.push(url);
		}
	}
	return urls;
}
