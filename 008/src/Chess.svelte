<script>
	import range from 'lodash.range'
	import Canvas from './Canvas.svelte'
</script>

<Canvas>
	{#each range(8) as i}
		{#each range(8) as j}
			{#if (i+j)%2==0}
				<rect x={20+20*i} y={20+20*j} width=20 height=20 style='fill:white'/>
			{:else}
				<rect x={20+20*i} y={20+20*j} width=20 height=20 style='fill:black'/>
			{/if}
		{/each}
	{/each}
</Canvas>