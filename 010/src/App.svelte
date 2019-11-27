<script>
	import range from 'lodash.range'
	import shuffle from 'lodash.shuffle'

	let cards = shuffle(range(12).map( (i) => ({state:0, value:i%6})))

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
	.card {
		margin:1px;
		font-size:120px;
		width:33%;
		float:left;
		text-align:center;
	}
	.state0 {background-color:red;  color:red;}
	.state1 {background-color:black;color:white;}
	.state2 {background-color:white;color:white;}
</style>

<div style='float:left; width:100%'>
	{#each cards as card}
		<div class='card {'state'+card.state}' on:click={()=>click(card)}>
			{card.state==1 ? card.value : '.'}
		</div>
	{/each}
</div>
