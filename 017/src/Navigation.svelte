<script>
	export let data,curr,index
</script>

<style>
	.fs {font-size:1.5em}
	.br {border-radius:5px}
</style>

<div class='col s3 fs left-align' >
	<button on:mousemove={() => data.mm('prev')} class=br on:click={() => data.incr(-1)} disabled={index==0}>prev</button>
</div>

<div class='col s6 fs center-align' >
	{#if curr.a == curr.b}
		{curr.orig} to {curr.b}
	{:else}
		<span on:mousemove={() => data.mm('left')}>{curr.a}</span>
		to 
		<span on:mousemove={() => data.mm('right')}>{curr.b}</span>
	{/if}
</div>

<div class='col s3 fs right-align' >
	<button on:mousemove={() => data.mm('next')} class=br on:click={() => data.incr(+1)} disabled={index==data.N-1}>next</button>
</div>
