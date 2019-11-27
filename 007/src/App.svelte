<script>
	import range from 'lodash.range'
	import shuffle from 'lodash.shuffle'

	const cards = shuffle(range(12).map( (i) => ({state:0, x:100*(i%3), y:100*Math.floor(i/3)})))
	for (const i in range(12)) cards[i].value = i%6

	const visible = []
	const click = (card) => {
		if (visible.length == 2) {
			const value = (visible[0].value == visible[1].value) ? 2 : 0
			visible.pop().state = value
			visible.pop().state = value
			cards = cards
		} 
		if (card.state == 2) return
		card.state = 1
		visible.push(card)
		cards = cards
	}
</script>

<style>
	.text {
 		fill : white;
		text-anchor : middle;
		alignment-baseline : middle;
		font-size : 80px;
	}
</style>

<svg width=300 height=400>
	{#each cards as card}
		<rect 
			x=0 
			y=0
			width=99 
			height=99 
			style='fill:{['red','black','white'][card.state]}' on:click={()=>click(card)}
			transform='translate({card.x},{card.y})'
		/>
		{#if card.state==1}
			<text x=0 y=0 class=text transform='translate({50+card.x},{55+card.y})'>{card.value}</text>
		{/if}
	{/each}
</svg>
