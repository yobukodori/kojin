/*
 * title: show body.innerHTML v.0.1.0
 * description: show document.body.innerHTML for mobile browser
 * author: yobukodori
*/
(function(){
	let d = document, e = d.createElement("textara");
	e.innerText = d.body.innerHTML;
	e.setAttribute("style","width:100%;height:100%");
	d.body.insertBefore(e, d.body.firstChild);
	for (let i = d.body.children.length - 1 ; i > 0 ; i--){
		 d.body.children[i].remove()
	}
})()
