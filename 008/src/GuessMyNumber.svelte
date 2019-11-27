<script>
	import random from 'lodash.random'
	let low = 1
	let high = 127
	let guess
	let msg =''
	let secret = random(low,high)
	const keyup = (event)=> {
		if (event.key!='Enter') return
		if (guess < secret) low=guess+1
		if (guess > secret) high=guess-1
		if (guess==secret) msg = 'Yes! The number was ' + secret
		// guess = ''
	}
</script>
<div style='color:white'>
	{low} to {high} {msg}
	<input on:keyup = {keyup} type="number" bind:value={guess}/>
</div>
