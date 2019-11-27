<script>
	import range from 'lodash.range'
	import Grid from './Grid.svelte'
</script>

<style>
	rect,circle {
		stroke:yellow;
		stroke-width:1;
		fill:green;
	}
</style>

<Grid>
	{#each range(11) as i}
		{#if i%2==0}
			<circle cx={20*i} cy={20*i} r=10 />
		{:else}
			<rect x={20*i-10} y={20*i-10} width=20 height=20 />
		{/if}
	{/each}
</Grid>
