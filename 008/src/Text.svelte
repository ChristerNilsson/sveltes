<script>
	import Grid from './Grid.svelte'
	import { onMount } from 'svelte'
	import CRect from './CRect.svelte'
	import CText from './CText.svelte'
	let angle = 0
</script> 

<style>
	.fn {fill:none}
	.red {stroke:	red}
	.yellow {stroke:yellow}
	.f-yellow {fill:yellow}
	.sw0 {stroke-width:0}
	.fs40 {font: italic 40px serif}
</style>

<Grid click={() => angle=angle+10}>
	<g transform='translate(100,100) rotate({angle})' >
		<g class='fn red'>
			<CRect w=144 h=45 />
		</g>
		<g class='sw0 fs40 f-yellow'>
			<CText>Grumpy!</CText>
		</g>
	</g>
</Grid>
