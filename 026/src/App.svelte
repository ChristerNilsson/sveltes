<script>
	import Card from './Card.svelte'

	const names = 'angular svelte backbone ember react vue angular svelte backbone ember react vue'.split(' ')
	let states = names.map(()=>'HIDDEN')
	let locked = false
	let flipped = []

	const compare = () => names[flipped[0]] == names[flipped[1]] ? setStates('DONE') : setStates('HIDDEN')

	const setStates = state => {
		locked = true
		setTimeout(() => resetBoard(state), 1000)
	}

	const resetBoard = state => {
		states[flipped[0]] = state
		states[flipped[1]] = state
		states = states
		locked = false
		flipped = []
	}

</script>

<svg height=500 width=500>
	{#each names as name,index}
		<Card {index} bind:state = {states[index]} {name} {compare} {flipped} {locked} />
	{/each}
</svg>
