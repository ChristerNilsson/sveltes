<script>
	export let getChildren
	export let selected
	export let hor = 'hor'
	export let path = ['']

	console.log(hor)

	$: children = getChildren(path[path.length-1]).split('|')

	$: selected = path[path.length-1]

	const f = (i) => {
		path = path.slice(0,i)
		path = path
	}

	const g = (p) => {
		path.push(p)
		path = path
	}

</script>

<style>
	.hor {float:left}
	.nav {
		width:100%;
		background-color:grey;
	}
	.mnu {
		width:auto;
		margin:0.5%;
		color:white;
	}
	.red {color:red}
</style>

<div class='nav {hor}'>
	{#each path as p,i}
		{#if p!=''}
			<div class="mnu {hor} {selected==p ? 'red' : ''}" on:click = {() => f(i)} >{p}</div>
		{/if}
	{/each}

	{#each children as p}
		<div class='mnu {hor}' on:click = {() => g(p)}> {p}</div>
	{/each}
</div>
