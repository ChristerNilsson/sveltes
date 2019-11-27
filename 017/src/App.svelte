<script>
	import Shortcut from './Shortcut.svelte'
	import range from 'lodash.range'
	import random from 'lodash.random'
	import sample from 'lodash.sample'
	import shuffle from 'lodash.shuffle'
	import {solve} from './solve.js'

	const url = new URL(window.location.href)
	const getParam = (name,value) => parseInt(url.searchParams.get(name) || value)

	let data = {}
	let index = 0
	let curr = null

	data.M = getParam('M',3) // MAX level
	data.N = getParam('N',24) // exercises
	data.MAX = getParam('MAX',20) // MAX number
	data.SHUFFLE = getParam('SHUFFLE',0) // 1
	data.ADD = getParam('ADD',2)
	data.MUL = getParam('MUL',2)
	data.DIV = getParam('DIV',2)
	data.SUB = getParam('SUB',0)

	if (data.N % data.M !=0) data.M = data.N

	data.score = 0
	data.undos = 0

	data.start = new Date()
	data.stopp = new Date()

	data.optimum = 0

	$: curr = data.cand[index]

	const createCandidates = (n) => {
		let a = random(0,data.MAX)

		let cands0 = [a]
		const visited = {}
		const memory = {}
		visited[a.toString()] = 0
		memory[a.toString()] = a

		for (const lvl of range(n)) {
			const cands1 = []
			const op = (p) => {
				if (-data.MUL*data.MAX <= p && p <= data.MUL*data.MAX) {
					const key = p.toString()
					if (!(key in memory)) {
						cands1.push(p)
						visited[key] = lvl+1
						memory[key] = p
					}
				}
			}
			for (const cand of cands0) {
				if (data.ADD != 0) op(cand + data.ADD)
				if (data.SUB == 0) op(cand - data.SUB)
				if (data.MUL > 1) op(cand * data.MUL)
				if (data.DIV > 1 && cand % data.DIV==0) op(cand / data.DIV)
			}
			cands0 = cands1
		}
		if (cands0.length > 0) {
			const target = sample(cands0)
			const key = target.toString()
			data.optimum += visited[key]
			return {a:a, b:target, hist:[], orig:a}
		} else {
			const key = sample(Object.keys(visited))
			data.optimum += visited[key]
			return {a:a, b:memory[key], hist:[], orig:a}
		}
	}

	let candidates = []
	for (const level of range(data.M)) {
		for (const j of range(data.N/data.M)) {
			candidates.push(createCandidates(level+1))
		}
	}

	data.cand = data.SHUFFLE==1 ? shuffle(candidates) : candidates

	data.op = (value) => {
		if (curr.a==value) return
		curr.hist.push(curr.a)
		curr.a = value
		data.score++
		data.stopp = new Date()
	}

	data.undo = () => {
		data.score--
		data.undos++
		curr.a = curr.hist.pop()
	}

	data.reset = () => {
		data.start = new Date()
		data.stopp = new Date()
		data.score = 0
		data.undos = 0
		index = 0

		for (const c of data.cand) {
			c.a = c.orig
			c.hist = []
		}
	}

	data.click = (i) => index = i
	data.incr = (delta) => index += delta

	const handleKeyDown = (event) => {
		event.preventDefault()
		if (event.key=='ArrowLeft' && index > 0) index--
		if (event.key=='ArrowRight' && index < data.N-1) index++
		if (event.key==' ') index = (index+1) % data.N
		if (event.key=='Home') index = 0
		if (event.key=='End') index=(data.N-1)
		if (event.key=='a' && curr.a!=curr.b) data.op(curr.a + data.ADD)
		if (event.key=='s' && curr.a!=curr.b) data.op(curr.a - data.SUB)
		if ((event.key=='m' || event.key=='w') && curr.a!=curr.b) data.op(curr.a * data.MUL)
		if (event.key=='d' && curr.a!=curr.b && curr.a % data.DIV==0) data.op(curr.a / data.DIV)
		if (event.key=='z' && curr.hist.length > 0) data.undo()
		if (event.key=='r') data.reset()
	}

	let message = ''

	data.mm = (name,detail='') => {
		if (name=='info') message = 'click title for info about how to use and customize Shortcut'
		if (name=='score') message = 'number of steps you have used'
		if (name=='optimum') message = 'minimum number of steps needed'
		if (name=='undos') message = 'number of undos. Minimize'
		if (name=='time') message = 'number of seconds you have used. Minimize'
		if (name=='left') message = 'make this number equal to the target number'
		if (name=='right') message = 'this is the target number'
		if (name=='prev') message = 'goto previous exercise. Key=leftArrow'
		if (name=='next') message = 'goto next exercise. Key=rightArrow or space'
		if (name=='add') message = 'add to left number. Key=a'
		if (name=='mul') message = 'multiply left number. Key=w or m'
		if (name=='sub') message = 'subtract from left number. Key=s'
		if (name=='div') message = 'divide left number. Key=d'
		if (name=='undo') message = 'undo last operation. Key=z'
		if (name=='circle') message = 'jump to exercise #' + detail
	}

</script>

<style>
	.w {width:100%}
	a {text-decoration: none;color: #000}
	.fs {font-size:1.5em}
</style>

<svelte:window on:keydown={handleKeyDown} />
<a href="https://github.com/ChristerNilsson/svelte-projects/wiki/017"
	class='center-align'
	on:mousemove={() => data.mm('info')}
	target="_blank"><h1>Shortcut</h1></a>
<div style="width:90%; margin:auto">
	<Shortcut {data} {index} {curr}/>
</div>
<div class='w fs center-align'>{message}</div>
