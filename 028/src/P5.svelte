<script>
	import p5 from "./p5.min"
	import { onMount } from "svelte"
	export let sketch
	onMount(function() {new p5(sketch)})
</script>

