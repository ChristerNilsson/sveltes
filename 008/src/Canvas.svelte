<script>
	import {shapeRendering} from './store.js'
	export let click = () => {}
</script>

<style>
	svg {
		fill:#444; 
		stroke-width:1; 
		stroke:#fff;
	}
</style>

<svg class='col left s6' width=200 height=200 style="margin:2px 2px 0px" shape-rendering={$shapeRendering} >
	<rect width=200 height=200 style='stroke-width:0' on:click={click}/>
	<slot/>
</svg>
