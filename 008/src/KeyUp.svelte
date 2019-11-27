<script>
	let key=''
	let keyCode=''
	const handleKey = (event) => {
		key=event.key
		keyCode=event.keyCode
	}
</script>

<div style="color:red">key: {key}</div>
<div style="color:yellow">keycode: {keyCode}</div>
<input on:keyup={handleKey}/>
