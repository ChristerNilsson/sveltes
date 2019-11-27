<script>
	export let id,count,remove,product
</script>

<div>
	<button on:click={() => remove(id)}> Remove </button>
	{count} ${product.price} <b>{product.title}</b>
</div>
