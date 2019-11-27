<script>
	import {shapeRendering} from './store.js'
	import range from 'lodash.range'
	import Menu from './Menu.svelte'

	import Canvas from './Canvas.svelte'
	import Grid from './Grid.svelte'
	import Rect from './Rect.svelte'
	import Circle from './Circle.svelte'
	import Line from './Line.svelte'
	import Text from './Text.svelte' 
	import Each from './Each.svelte'
	import If from './If.svelte'
	import Range from './Range.svelte'
	import Chess from './Chess.svelte'
	import Random from './Random.svelte'
	import Button from './Button.svelte'
	import Click from './Click.svelte'
	import Shortcut from './Shortcut.svelte'
	import ColorPair from './ColorPair.svelte'
	import Bind from './Bind.svelte'
	import KeyUp from './KeyUp.svelte'
	import GuessMyNumber from './GuessMyNumber.svelte'
	import Translate from './Translate.svelte'
	import Rotate from './Rotate.svelte'
	import Scale from './Scale.svelte'
	import Clock from './Clock.svelte' 

	import {helpTexts} from './help.js'

	const help=(keyword) => keyword != '' ? window.open('https://github.com/ChristerNilsson/svelte-projects/wiki/'+keyword, '_blank') : 0
	const link=(link) => window.open(links[link], '_blank')
	
	const links = {}
	links['Svelte'] = 'https://github.com/ChristerNilsson/svelte-projects/wiki/Svelte'
	links['REPL'] = 'https://svelte.dev/repl/884dce5bfde14f7bb0903684aaac2f80?version=3.15.0'
	
	let selectedTree=''
	let hor = 'hor'
	let path = [""]
	const fs = 'font-size:30px'

	const children0 = 'L1|L2|L3|L4|L5|L6'.split('|')
	// const keywords = 'bind:|button|circle|$:|each|g|if|line|on:click|on:keyup|random|range|rect|rotate|scale|style|styles|svg|text|translate'.split('|')
	
	let selected0 = 'L1'
	$: if (selected0=='L1') children1 = 'rect|circle|line'.split('|')
	$: if (selected0=='L2') children1 = 'each|if|range|chess'.split('|')
	$: if (selected0=='L3') children1 = 'random|button|shortcut'.split('|')
	$: if (selected0=='L4') children1 = 'canvas|grid|colorPair'.split('|')
	$: if (selected0=='L5') children1 = 'bind:|on:keyup|guessMyNumber'.split('|')
	$: if (selected0=='L6') children1 = 'text|translate|rotate|scale|clock'.split('|')

	$: if (selected1=='rect') keywords = 'rect|import|style|stroke|stroke-width|fill|color'.split('|')
	$: if (selected1=='circle') keywords = 'circle'.split('|')
	$: if (selected1=='line') keywords = 'line'.split('|')
	$: if (selected1=='each') keywords = 'each|{}'.split('|')
	$: if (selected1=='if') keywords = 'if'.split('|')
	$: if (selected1=='range') keywords = 'range'.split('|')
	$: if (selected1=='chess') keywords = 'each|if|rect'.split('|')
	$: if (selected1=='random') keywords = 'random'.split('|')
	$: if (selected1=='button') keywords = 'button'.split('|')
	$: if (selected1=='shortcut') keywords = 'button|on:click'.split('|')
	$: if (selected1=='canvas') keywords = 'svg'.split('|')
	$: if (selected1=='grid') keywords = 'stroke|fill|each|range|line|slot|class'.split('|')
	$: if (selected1=='colorPair') keywords = 'on:click|g|each|filter'.split('|')
	$: if (selected1=='bind:') keywords = 'bind:|input'.split('|')
	$: if (selected1=='on:keyup') keywords = 'on:keyup|input'.split('|')
	$: if (selected1=='guessMyNumber') keywords = 'random|on:keyup|input|bind:|import'.split('|')
	$: if (selected1=='text') keywords = 'text|text-anchor|alignment-baseline'.split('|')
	$: if (selected1=='translate') keywords = 'translate'.split('|')
	$: if (selected1=='rotate') keywords = 'rotate'.split('|')
	$: if (selected1=='scale') keywords = 'scale'.split('|')
	$: if (selected1=='clock') keywords = 'range|onMount|Date|circle|line|stroke|stroke-width|fill|import|class|g|setInterval|clearInterval|transform|rgb|each|rotate|$:'.split('|')
	
	$: help(keyword)

	$: if (selected0) selected1 = ''
	$: if (selected0) keywords = []

	$:if (selected3 == 'render:auto') $shapeRendering='auto'
		else if (selected3 == 'render:crisp') $shapeRendering='crispEdges'
		else link(selected3)
	
	let children1 = ['']
	let children3 = 'Svelte|REPL|render:auto|render:crisp'.split('|')
	let keywords = []
		
	let selected1 = ''
	let keyword = ''
	let selected3 = ''

</script>

<style>
	:global(body) {background-color:#000}
	.left {float:left}
	.m {margin:0px}
	.s8 {width: 67%}
	textarea {font-size:20px}
</style>

<div >
	<Menu children={children3} bind:selected={selected3}/>
	<Menu children={children0} bind:selected={selected0}/>
	<Menu children={children1} bind:selected={selected1}/>
	<Menu children={keywords} bind:selected={keyword} color='yellow' bgcolor='black'/>
</div>

<div class='col left s2 m'>

	<!-- L1 -->
	{#if selected1 == 'svg'}<Canvas />{/if}
	{#if selected1 == 'canvas'}<Canvas />{/if}
	{#if selected1 == 'grid'}<Grid />{/if}
	{#if selected1 == 'rect'}<Rect />{/if}
	{#if selected1 == 'circle'}<Circle />{/if}
	{#if selected1 == 'line'}<Line />{/if}
	{#if selected1 == 'text'}<Text />{/if}

	<!-- L2 -->
	{#if selected1 == 'each'}<Each />{/if}
	{#if selected1 == 'if'}<If />{/if}
	{#if selected1 == 'range'}<Range />{/if}
	{#if selected1 == 'chess'}<Chess />{/if}

	<!-- L3 -->
	{#if selected1 == 'random'}<Random />{/if}
	{#if selected1 == 'button'}<Button />{/if}
	{#if selected1 == 'on:click'}<Click />{/if}
	{#if selected1 == 'shortcut'}<Shortcut />{/if}

	<!-- L4 -->
	{#if selected1 == 'colorPair'}<ColorPair />{/if}

	<!-- L5 -->
	{#if selected1 == 'bind:'}<Bind />{/if}
	{#if selected1 == 'on:keyup'}<KeyUp />{/if}
	{#if selected1 == 'guessMyNumber'}<GuessMyNumber />{/if}

	<!-- L6 -->
	{#if selected1 == 'translate'}<Translate />{/if}
	{#if selected1 == 'rotate'}<Rotate />{/if}
	{#if selected1 == 'scale'}<Scale />{/if}
	{#if selected1 == 'clock'}<Clock />{/if}

</div>

<div class='col left s8 m'>
	{#if helpTexts[selected0+selected1]}
		<textarea disabled style='width:500px; height:500px;'>{helpTexts[selected0+selected1]}</textarea>
	{/if}
</div>

