<script>
	const SIZE = 200

	export let index // 0..11
	export let card // marker text url state	
	export let click

	let x = SIZE/2 + SIZE * (index % 4)
	let y = SIZE/2 + SIZE * Math.floor(index / 4)

</script>

<style>
	.middle {
 		fill : white;
		text-anchor : middle;
		alignment-baseline : middle;
		font-size : 50px;
	}
</style>

{#if card.state != 2}
	<rect 
		x = {x-SIZE/2}
		y = {y-SIZE/2}
		on:click={() => click(card)}
		width = {SIZE-1}
		height = {SIZE-1}
		style='fill:{card.state==0 ? 'red' : 'green'}' 
	/>
{/if}

{#if card.state==1} 
	{#if card.marker > 0}
		<text class=middle 
			x={x}
			y={y}
			on:click={() => click(card)}
		>{card.text}</text>
	{:else}
		<image 
			class=middle
			preserveAspectRatio 
			x = {x-SIZE/2}
			y = {y-SIZE/2}
			width={SIZE-1} 
			height={SIZE-1} 
			href={card.url}
			on:click={() => click(card)}
		></image>
	{/if}
{/if}
