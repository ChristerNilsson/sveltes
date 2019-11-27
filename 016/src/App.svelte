<script>
	import SiteHeader from './SiteHeader.svelte'
	import Thumbnails from './Thumbnails.svelte'
	import Work from './Work.svelte'
	import About from './About.svelte'

	let page = 0

</script>

<div id="site-container">
	<SiteHeader bind:page={page}></SiteHeader>
	{#if page==0}
		<div class="top-thumbnails">
			<Thumbnails></Thumbnails>
		</div>
		<div class="works-content">
			<Work></Work>
		</div>
	{:else}
		<About></About>
	{/if}
</div>