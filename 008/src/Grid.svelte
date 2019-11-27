<script>
	import range from 'lodash.range'
	import Canvas from './Canvas.svelte'
	export let click = () => {}
</script>

<style>
  .grid {
		stroke:#ccc; 
		fill:#888;
	}
  * {
		stroke:black;
		fill:white;
	}
</style>

<Canvas {click}>
	{#each range(0,200,20) as i}
    <line x1={i} y1={0} x2={i} y2={200} class=grid />
    <line y1={i} x1={0} y2={i} x2={200} class=grid />
	{/each}
	<slot/>
</Canvas>
