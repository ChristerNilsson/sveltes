<script>
	let a=17
	let b=1
	const op=(value) => a=value
</script>

<div style='color:white'> {a} to {b} </div>
<button on:click={()=>op(a+2)}>+2</button>
<button on:click={()=>op(a*2)}>*2</button>
<button on:click={()=>a%2==0 ? op(a/2):a}>/2</button>
