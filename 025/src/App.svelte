<script>
	import Card from './Card.svelte'
	import range from 'lodash.range'
	import shuffle from 'lodash.shuffle'

	const names = shuffle('angular aurelia backbone ember react vue angular aurelia backbone ember react vue'.split(' '))
	let states = names.map(() => 0)
	let flipped = []
	let locked = false

	const compare = () => names[flipped[0]] == names[flipped[1]] ? setStates(2) : setStates(0)

	const setStates = state => {
		locked = true
		setTimeout(() => resetBoard(state), 500)
	}

	const resetBoard = state => {
		states[flipped[0]] = state
		states[flipped[1]] = state
		locked = false
		flipped = []
	}

</script>

<svg width=800 height=600>
	{#each names as name,index}
		<Card {index} {name} {flipped} {locked} {compare} bind:state = {states[index]} />
	{/each}
</svg>
