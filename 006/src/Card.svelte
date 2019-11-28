<script>

	// The best version! Uses style = transform:rotateY
	// As <s t y l e> can't handle $progress, style= has to do it.

	import { tweened } from 'svelte/motion'
	import * as easing from 'svelte/easing'

	export let x
	export let y
	export let value

	$: variant = Object.keys(easing)[3] // 0..30 are defined
	$: console.log(variant)

	// const progress = tweened(1,{duration:1000})
	$: progress = tweened(1, {duration:2000, easing:easing.elasticInOut})

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
	on:click = {()=>click()}
	r = 49
	style = 'fill:{color}; transform:translate({x}px,{y}px) rotateY({$progress*180}deg)'
/>
{#if color=='green'}
	<text class='text' 
		on:click = {()=>click()}
		style = 'transform:translate({x}px,{7+y}px) rotateY({$progress*180}deg)'
	>{value}</text>
{/if}
