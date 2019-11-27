<script>
	import Grid from './Grid.svelte'
	import range from 'lodash.range'
</script>

<style>
	circle {stroke:yellow; stroke-width:1; fill:green}
</style>

<Grid>
	{#each range(11) as i}
		<circle cx={20*i} cy={20*i} r={2*i} />
	{/each}
</Grid>
