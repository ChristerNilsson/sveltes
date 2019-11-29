<script>
	import { onMount } from "svelte"
	export let sketch
	onMount(function() {new p5(sketch)})
</script>

