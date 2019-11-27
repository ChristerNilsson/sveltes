<script>
	export let page
</script>

<header class="site-header">
	<h1>M.C. Desplat</h1>
	<nav>
		<ul>
			<li>
				<button on:click={()=>page=0}>My work</button>
			</li>
			<li>
				<button on:click={()=>page=1}>About me</button>
			</li>
		</ul>
	</nav>
</header>
