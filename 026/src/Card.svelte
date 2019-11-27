<script>
	import { tweened } from 'svelte/motion'

	export let index // 0..11
	export let state // HIDDEN VISIBLE DONE
	export let name

	export let flipped // []
	export let locked  // boolean
	export let compare // ()

	let progress = tweened(0,2000)
	$: if (state=='HIDDEN') progress.set(0)

	const SIZE = 100
	let x = SIZE*(index % 4)
	let y = SIZE*Math.floor(index / 4)

	const click = () => {
		if (locked) return
		if (index == flipped[0]) return
		if (state == 'DONE') return
		state = {HIDDEN:'VISIBLE', VISIBLE:'HIDDEN'}[state]
		flipped.push(index)
		if (flipped.length==2) compare()
		progress.set($progress < 0.5 ? 1: 0)
	}

</script>

{#if state != 'DONE'}
	<image {x} {y} width={SIZE} height={SIZE} 
		href='./img/{$progress < 0.5 ? 'js-badge' : name}.svg' 
		on:click={click}
		transform='rotate({$progress*360} {x+50},{y+50})'
	/>
{/if}
