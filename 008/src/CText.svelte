<script>
	export let x=0,y=0
	export let style=''
</script>

<text {x} {y} {style} text-anchor=middle alignment-baseline=middle >
	<slot/>
</text>