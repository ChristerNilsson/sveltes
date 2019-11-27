<script>
	export let index // 0..11
	export let state // 0..2
	export let name

	export let flipped // []
	export let locked    // boolean
	export let compare // ()

	const SIZE = 200
	$: href = state == 0 ? 'js-badge' : name
	let x = SIZE*(index % 4)
	let y = SIZE*Math.floor(index / 4)

	const flip = () => {
		if (locked) return
		if (index == flipped[0]) return
		if (state == 2) return
		state = 1 - state
		flipped.push(index)
		if (flipped.length==2) compare()
	}

</script>

{#if state < 2}
	<image {x} {y} width={SIZE-10} height={SIZE-10} href='./img/{href}.svg' on:click={flip}/>
{/if}
