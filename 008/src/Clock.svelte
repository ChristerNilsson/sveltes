<script>
	import range from 'lodash.range'
	import { onMount } from 'svelte'
	import CText from './CText.svelte'

	let time = new Date()

	$: hours = time.getHours()
	$: minutes = time.getMinutes()
	$: seconds = time.getSeconds()

	onMount(() => {
		const interval = setInterval(() => {time = new Date()}, 1000)
		return () => clearInterval(interval)
	})
</script>

<style>
	svg { width: 100%; height: 100%; }
	.clock-face { stroke: #333; fill: white; }
	.minor { stroke: #999; stroke-width: 0.5; }
	.major { stroke: #333; stroke-width: 1; }
	.hour { stroke: #333; }
	.minute { stroke: #666; }
	.second, .second-counterweight { stroke: rgb(180,0,0); }
	.second-counterweight { stroke-width: 3; }
	.fs {font-size:0.5em}
</style>

<svg viewBox='-50 -50 100 100'>
	<circle class='clock-face' r='48'/>

	<!-- markers -->
	{#each range(12) as i}
		<g transform = 'rotate({30 * i})'>
			<line class='major' y1=35 y2=45 />
			<g transform='translate({30}) rotate({-30*i})' class='fs' >
				<CText>{1+(i+2)%12}</CText>
			</g>

			{#each range(1,5) as offset}
				<line class='minor' y1=42 y2=45 transform='rotate({6 * offset})' />
			{/each}
		</g>
	{/each}

	<!-- hands -->
	<line class='hour' y1=2 y2=-20 transform='rotate({30 * hours + minutes / 2})' />
	<line class='minute' y1=4 y2=-30 transform='rotate({6 * minutes + seconds / 10})' />
	<g transform='rotate({6 * seconds})'>
		<line class='second' y1=10 y2=-38/>
		<line class='second-counterweight' y1=10 y2=2/>
	</g>
</svg>