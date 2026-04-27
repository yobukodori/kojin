const fetchHelper = {
  domainState: new Map(),
  cache: new Map(),

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  },

  getDomain(url) {
    return new URL(url).origin;
  },

  getCacheKey(url, init) {
    const method = init?.method ?? "GET";
    return `${method}:${url}`;
  },
  
	toHMSms(d){
		return `${String(d.getHours()).padStart(2,'0')}:` +
				`${String(d.getMinutes()).padStart(2,'0')}:` +
			  `${String(d.getSeconds()).padStart(2,'0')}:` +
			  `${String(d.getMilliseconds()).padStart(3,'0')}`;
	},
};

async function fetchSequential(url, init = {}, opts = {}) {
	//console.log(fetchHelper.toHMSms(new Date()), "fetchSequential", url);
	const delay = opts.delay ?? 1000;
	const cache = opts.cache ?? false;

	const method = init.method ?? "GET";
	const key = fetchHelper.getCacheKey(url, init);

	if (cache && method === "GET") {
		const cached = fetchHelper.cache.get(key);
		if (cached) {
			//console.log("cache hit", url);
			return cached.response.clone();
		}
	}

	const domain = fetchHelper.getDomain(url);

	if (!fetchHelper.domainState.has(domain)) {
		fetchHelper.domainState.set(domain, {
			lastTime: 0,
			chain: Promise.resolve()
		});
	}

	const state = fetchHelper.domainState.get(domain);

	const task = state.chain.then(async () => {
		const now = Date.now();
		const elapsed = now - state.lastTime;

		if (elapsed < delay) {
			await fetchHelper.sleep(delay - elapsed);
		}

		state.lastTime = Date.now();

		//console.log(fetchHelper.toHMSms(new Date()), "fetch", url);
		const res = await fetch(url, init);
		//console.log(fetchHelper.toHMSms(new Date()), "got", url);

		if (cache && method === "GET" && res.ok) {
			fetchHelper.cache.set(key, {
				time: Date.now(),
				response: res.clone() // ←ここも重要
			});
		}

		return res;
	});

	state.chain = task.catch(() => {});

	return task;
}