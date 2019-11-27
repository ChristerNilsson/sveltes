<script>
	export let id,product,add
</script>

<div>
	<button on:click={()=>add(id)}>Add</button>
	${product.price} <b>{product.title}</b>
</div>
