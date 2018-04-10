const ArgumentParser = require('argparse').ArgumentParser;

let parser = new ArgumentParser({addHelp: true});
parser.addArgument(['loops'], {help: 'Number of iterations in the loop'});
parser.addArgument(['body'], {help: 'Length of the loop body'});
let args = parser.parseArgs();

args['loops'] = Number(args['loops']);
args['body'] = Number(args['body']);

let debug = false;

for (let body = 5; body <= args['body']; body+=5) {
    for (let loops = 10; loops <= args['loops']; loops+=10) {
	let asteps = 0;
	for (let i = 0; i < 20; i++) {
	    let init = {
		step: 0,
		alive: true,
		lo: -1,
		hi: loops
	    };

	    let threads = {
		"0.0": init
	    };

	    function thStr(th) {
		let base = `[${th.lo},${th.hi})@${args['body']-th.step+1}/${args['body']} (${th.alive})`;
		return base;
	    }

	    function step(th, id) {
		if (debug) console.log("STEP thread " + id);

		if (debug) var prev = thStr(th);
		
		if (th['step'] <= 0) {
		    th['step'] = body;
		    th['lo']++;
		} else {
		    th['step']--;
		}

		if (th['lo'] >= th['hi'])
		    th['alive'] = false;

		if (debug) var next = thStr(th);
		if (debug) console.log('\t' + prev + " --> " + next);

		return th['alive'];
	    }

	    function steal(th, id) {
		if (debug) console.log("STEAL thread " + id);

		if (debug) var prev = thStr(th);
		
		let mid = Math.floor((th['lo'] + th['hi']) / 2);

		if (!th['alive'] || mid <= th['lo'] || th['hi'] <= mid) {
		    if (debug) console.log("\tFAIL " + mid + " from " + prev);
		    return null;
		}

		let nth = {
		    step: 0,
		    alive: true,
		    lo: mid - 1,
		    hi: th['hi']
		};

		if (debug) var stole = thStr(nth);
		if (debug) console.log('\tSTOLE ' + stole);
		
		th['hi'] = mid;

		if (debug) var next = thStr(th);
		if (debug) console.log('\t' + prev + " --> " + next);

		return nth;
	    }

	    function randomBit(max) {
		return Math.floor(Math.random() * 2);
	    }

	    let steps = 0;

	    while (true) {
		if (Object.keys(threads).length == 0) {
		    break;
		}

		steps++;
		
		if (debug) console.log('-----STEP ' + steps);
		
		let nthreads = [];
		let dthreads = [];
		
		for (id in threads) {
		    let th = threads[id];
		    let bit = randomBit();
		    
		    if (bit == 0) {
			if (!step(th, id))
			    dthreads[dthreads.length] = id;
		    }

		    let nth = steal(th, id);
		    if (nth)
			nthreads[nthreads.length] = nth;
		    
		    if (bit == 1) {
			if (!step(th, id))
			    dthreads[dthreads.length] = id;
		    }
		}

		for (n in dthreads)
		    delete threads[dthreads[n]];

		for (n in nthreads)
		    threads[steps + '.' + n] = nthreads[n];
	    }

	    asteps += steps / 20;
	}

	console.log(body + ';' + loops + ';' + asteps.toFixed(3) + ';' + (asteps / Math.log(loops)).toFixed(3));

    }
}
