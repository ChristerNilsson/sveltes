<script>
	import State from './State.svelte'
	export let states
</script>
 
<div>
	{#each states as state}
		<State on:fixstate state={state}/>
	{/each}
</div>
