<script>
	import _ from 'lodash'
	let message = ''
	const assert = (a,b) => {
		message += _.isEqual(a,b) ? '.' : `\nAssert failure: ${a} ${b}\n`
	}

	// Write your code here!
	const nand = (a,b) => 2
	const not = (a,b) => 2
	const and = (a,b) => 2
	const or = (a,b) => 2
	const nor = (a,b) => 2
	const xor = (a,b) => 2

	assert(nand(0,0),1)
	assert(nand(0,1),1)
	assert(nand(1,0),1)
	assert(nand(1,1),0)

	assert(not(0),1)
	assert(not(1),0)
 
	assert(and(0,0),0)
	assert(and(0,1),0)
	assert(and(1,0),0)
	assert(and(1,1),1)

	assert(or(0,0),0)
	assert(or(0,1),1)
	assert(or(1,0),1)
	assert(or(1,1),1)

	assert(nor(0,0),1)
	assert(nor(0,1),0)
	assert(nor(1,0),0)
	assert(nor(1,1),0)

	assert(xor(0,0),0)
	assert(xor(0,1),1)
	assert(xor(1,0),1)
	assert(xor(1,1),0)

</script>
<pre>{message}</pre>
