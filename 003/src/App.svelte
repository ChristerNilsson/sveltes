<script>

	import Menu from './Menu.svelte'
	let children = 'Play|Setup'
	let selectedMenu
	let path=['']

	let a=17
	let b=1

	let ADD = 2
	let MUL = 3
	let DIV = 4
	let SUB = 5
	let M = 10
	let N = 12
	let MAX = 20
	let SHUFFLE = 0

	// import Tree from './Tree.svelte'
	const getChildren = (curr) => {
		if (curr=='') return 'Play|Setup'
		return ''
	}
	let selectedTree='Setup'
	let hor = 'hor'
	const fs = 'font-size:30px'

	// if (curr=='') return 'File|Edit|Selection'
	// if (curr=='File') return 'New File|New Window|Open File|Open Folder|Open Workspace|Open Recent'
	// if (curr=='Edit') return 'Undo|Redo|Cut|Copy|Paste|Find|Replace|Find in Files|Replace in Files|Toggle Line Comment|Toggle Block Comment'
	// if (curr=='Selection') return 'Select All|Expand Selection|Shrink Selection|Copy Line Up|Copy Line Down|Move Line Up|Move Line Down|Duplicate Selection'

</script>

<style>
	.fs {font-size:30px;}
	.marg {margin: 0px}
</style>

<Menu {children}    bind:selected={selectedMenu} />
<!-- <div>{selectedMenu}</div> -->
<!-- <Tree {getChildren} bind:selected={selectedTree} {hor} bind:path={path}/> -->

{#if selectedMenu == 'Play'}
	<div class='col s6 fs center-align' >
		{a} to {b}
	</div>
	<div class="col s6 fs marg center-align">
		<button>+{ADD}</button>
		<button>*{MUL}</button>
		<button>+{DIV}</button>
	</div>
{/if}

{#if selectedMenu=='Setup'}

	<div class='row fs'>
		<div class='col s3'>ADD    <input style={fs} type=number bind:value={ADD} min=0 max=100></div>
		<div class='col s3'>MUL    <input style={fs} type=number bind:value={MUL} min=0 max=100></div>
		<div class='col s3'>DIV    <input style={fs} type=number bind:value={DIV} min=0 max=100></div>
		<div class='col s3'>SUB    <input style={fs} type=number bind:value={SUB} min=0 max=100></div>

		<div class='col s3'>M      <input style={fs} type=number bind:value={M} min=1 max=12></div>
		<div class='col s3'>N      <input style={fs} type=number bind:value={N} min=1 max=24></div>
		<div class='col s3'>MAX    <input style={fs} type=number bind:value={MAX} min=10 max=1000></div>
		<div class='col s3'>SHUFFLE<input style={fs} type=number bind:value={SHUFFLE} min=0 max=1></div>
	</div>

{/if}