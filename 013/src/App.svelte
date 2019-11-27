<script>	
	import store from './store.js'
	import Button from './Button.svelte'
	
	const ADD = 'ADD'
	const MUL = 'MUL'
	const DIV = 'DIV'
	const NEW = 'NEW'
	const UNDO = 'UNDO'
	
	store.op(NEW)
	
	console.log(store)

</script> 
 
<style>
	h1 {
		font-size: 30px;
		text-align: center;
	}
</style>

<h1 class='col2' style='font-size: 60px; color:red;'>{$store.a}</h1>
<h1 class='col2' style='font-size: 60px; color:green;'>{$store.b}</h1>
<Button klass='col3' title='+2'   click = {() => store.op(ADD)}  disabled = {$store.a==$store.b} />
<Button klass='col3' title='*2'   click = {() => store.op(MUL)}  disabled = {$store.a==$store.b} />
<Button klass='col3' title='/2'   click = {() => store.op(DIV)}  disabled = {$store.a==$store.b} />
<Button klass='col2' title='New'  click = {() => store.op(NEW)}  disabled = {$store.a!=$store.b} />
<Button klass='col2' title='Undo' click = {() => store.op(UNDO)} disabled = {$store.hist.length==0} /> 
