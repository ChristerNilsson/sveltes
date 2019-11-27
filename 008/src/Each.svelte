<script>
	import Grid from './Grid.svelte'
</script>

<style>
	circle {stroke:yellow; stroke-width:1; fill:green}
</style>

<Grid>
	{#each [50,100,150] as i}
		<circle cx={i} cy={i} r=10 />
	{/each}
</Grid>
