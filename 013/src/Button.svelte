<script>
	export let click
	export let disabled
	export let title
	export let klass

	if (window.innerWidth < 600) klass='col1'
		
</script>

<style>
	button {
		font-size: 30px;
	}
</style>

<button class={klass} on:click={click} disabled={disabled}>{title}</button>