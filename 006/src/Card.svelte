<script>
	import { tweened } from 'svelte/motion'

	export let x
	export let y
	export let value
	const progress = tweened(1,{duration:1000})
	const click = () => progress.set($progress > 0.5 ? 0 : 1)
$: color = $progress > 0.5 ? 'red' : 'green'

</script>

<style>
	.text {
 		fill : white;
		text-anchor : middle;
		alignment-baseline : middle;
		font-size : 80px;
	}
</style>

<circle 
	on:click={()=>click()}
	r=49
	style='fill:{color}' 
	transform='translate({x},{y}) scale({2*Math.abs($progress-0.5)},1)'
/>
{#if color=='green'}
	<text class='text' 
		on:click={()=>click()}
		transform='translate({x},{7+y}) scale({2*Math.abs($progress-0.5)},1)'
	>{value}</text>
{/if}
