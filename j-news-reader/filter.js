Lexer = class {
	static createRegExp(s){
		s = s || "";
		let pattern, flags, m = s.match(/^\/(.*)\/(\w*)$/);
		if (m){ 
			pattern = m[1], flags = m[2];
		}
		else {
			pattern = s.replace(/[|\\{}()[\]^$+*?.]/g, '\\$&'), flags = "";
		}
		try {
			return { rex: new RegExp(pattern, flags) };
		}
		catch (e){
			return { error: e.message };
		}
	}
	constructor(str){
		this.input = str;
		this.eof = { eof: true, pos: str.length, str: "<EOF>" };
		this.token = [];
		this.next = 0;
		let i = 0;
		while (i < str.length){
			let start = i, c = str[i++];
			if (/\s/.test(c)){
				// 空白はスキップ
			}
			else if (c === '-'){
				this.token.push({ope: c, pos: start, str: c});
			}
			else if (c === '(' || c === ')'){
				this.token.push({punc: c, pos: start, str: c});
			}
			else if (c === '/'){
				let closed;
				while (i < str.length){
					c = str[i++];
					if (c === "/"){
						closed = true;
						break;
					}
					else if (c === "\\"){
						if (i === str.length){ break; }
						c = str[i++];
					}
				}
				if (! closed){
					this.error = {message: "no closing '/'", pos: start, str: str.substring(start)};
					return;
				}
				let rexStr = str.substring(start, i);
				let {rex, error} = Lexer.createRegExp(rexStr);
				if (error){
					this.error = {message: "RegExp: " + error, pos: start, str: rexStr};
					return;
				}
				this.token.push({rex, pos: start, str: rexStr});
			}
			else {
				while (i < str.length && ! /[\s\-()]/.test(str[i])){ ++i; }
				let s = str.substring(start, i);
				if (s.toLowerCase() === "or"){
					this.token.push({ope: "or", pos: start, str: s});
				}
				else {
					let {rex, error} = Lexer.createRegExp(s);
					this.token.push({rex, pos: start, str: s});
				}
			}
		}
	}
	peek(){
		return this.next < this.token.length ? this.token[this.next] : this.eof;
	}
	read(){
		return this.next < this.token.length ? this.token[this.next++] : this.eof;
	}
};

Parser = class {
	constructor(lexer){
		this.lexer = lexer;
		try {
			this.node = this.expr();
		}
		catch(e){
			//this.error = e;
		}
	}
	fact(){
		let t = this.lexer.read();
		if (t.punc === '('){
			let n = this.expr(), t;
			if ((t = this.lexer.read()).punc !== ')'){
				this.error = {message: "')' required. unexpected " + (t.eof ? "EOF" : "token"), token: t};
				throw Error("unexpected token");
			}
			return n;
		}
		else if (t.rex){
			let n = {rex: t.rex};
			return n;
		}
		else {
			this.error = {message: "unexpected " + (t.eof ? "EOF" : "token"), token: t};
			throw Error("unexpected token");
		}
	}
	term(){
		let t = this.lexer.peek();
		if (t.ope === "-"){
			this.lexer.read();
			let n = {ope: "not", value: this.fact()};
			return n;
		}
		else {
			return this.fact();
		}
	}
	expr(){
		let n = this.term(), t;
		while (! (t = this.lexer.peek()).eof && t.punc !== ')'){
			t.ope === "or" && this.lexer.read();
			let right = this.term();
			n = {ope: t.ope === "or" ? "or" : "and", left: n, right};
		}
		return n;
	}
};

Filter = class {
	constructor(str){
		this.lexer = new Lexer(str);
		let e;
		if (e = this.lexer.error){
			this.error = "Lexer error(" + e.pos + "): '" + e.str + "' " + e.message;
			return;
		}
		this.parser = new Parser(this.lexer);
		if (e = this.parser.error){
			this.error = "Parser error(" + e.token.pos + "): " + e.message + (e.token.eof ? "" : " '"+e.token.str+"'");
			return;
		}
	}
	eval(n){
		let v;
		if (n.ope === "or"){
			return this.eval(n.left) || this.eval(n.right)
		}
		else if (n.ope === "and"){
			return this.eval(n.left) && this.eval(n.right)
		}
		else if (n.ope === "not"){
			return ! this.eval(n.value);
		}
		else if (n.rex){
			return n.rex.test(this.input);
		}
	}
	match(str){
		this.input = str;
		return this.eval(this.parser.node);
	}
};
