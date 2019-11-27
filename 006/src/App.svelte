<script>
	import Card from './Card.svelte'	
</script>

<svg width=300 height=400>
	{#each [50,150,250] as x,i}
		{#each [50,150,250,350] as y,j}
			<Card x={x} y={y} value={4*i+j} />
		{/each}
	{/each}
</svg>

