<script>
	// import Card from './Card.svelte'	
	import SVG from './SVG.svelte'	
	let x=0
	let y=0
	const N=3
	const points = []

const click = () => points.push({x,y})
const mousemove = (event) => [x,y] = [event.x,event.y]

</script>

<svg width=1200 height=1000>
	<rect x=0 y=0 width=1200 height=1000 style='fill:gray'/>
	<SVG x=0 y=0 viewBox="3104 -384 320 320"       width={320*N} height={320*N} {click} {mousemove}/>
	<SVG x=900 y=0 viewBox="{3054+25+x/N} {-434+25+y/N} 50 50" width={N*100} height= {N*100} /> 

	<line x1={900}      y1={N*50} x2={900+N*100} y2={N*50}  style = 'stroke:black; stroke-width:1'/>
	<line x1={900+N*50} y1={0}    x2={900+N*50}  y2={N*100} style = 'stroke:black; stroke-width:1'/>
</svg>
