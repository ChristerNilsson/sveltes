<script>
	import Grid from './Grid.svelte'
	let circles = []
	const r=50
	for (const x of [80,120]) {
		for (const y of [80,120]) {
			const color = circles.length%2==0 ? '#00f8' : '#ff08'
			circles.push({color:color,x:x,y:y})
		}
	}
	const click = (c) => circles = circles.filter((circle)=>circle!=c)
</script>

<Grid>
	<g stroke='#fff' stroke-width=1>
		{#each circles as c}
			<circle on:click={()=>click(c)} cx={c.x} cy={c.y} r={r} fill={c.color}/>
		{/each}
	</g>
</Grid>
