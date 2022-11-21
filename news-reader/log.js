function log(){
	let box = document.getElementById('log');
	if (! box){
		box = document.createElement("textarea");
		box.id = "log";
		box.style = "width:98%; height: 10em;";
		document.body.appendChild(box);
	}
	for (let i = 0 ; i < arguments.length ; i++){
		box.textContent += (i > 0 ? " " : "") + arguments[i];
	}
	box.textContent += "\r\n";
}
