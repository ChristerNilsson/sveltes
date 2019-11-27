<script>
	import range from 'lodash.range'
	import random from 'lodash.random'
	import Grid from './Grid.svelte'
</script>

<Grid>
	{#each range(10) as i }
		<circle cx={random(1,200)} cy={random(1,200)} r={random(10,20)} style='fill:black;stroke:white;stroke-width:1' />
	{/each}
</Grid>