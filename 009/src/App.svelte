<script>
import TestReducer from './TestReducer.svelte'

const stack = []

const op = (state,value) => {
	if (Math.round(value) != value) return state
	const hist = [...state.hist, state.a]
	return {...state, a:value, hist}
}

const reducers = {
	ADD: (state) => op(state,state.a+2),
	MUL: (state) => op(state,state.a*2),
	DIV: (state) => op(state,state.a/2),
	NEW: (state) => ({b:stack.pop(), a:stack.pop(), hist:[]}),
	UNDO: (state) => {
		const hist = state.hist.slice()
		const a = hist.pop()
		const b = state.b
		return {a,b,hist}
	}
}

let script = `
{"a":18,"b":17,"hist":[]}                            # initial state
	@ {"a":18,"b":17,"hist":[]} ==                     # assert deep state
	@a 18                                              # implicit assert @a == 18
	ADD @a 20                                          # based on line 1
	MUL @a 36 @hist [18]                               # also based on line 1
	DIV @ {"a":9,"b":17,"hist":[18]}                   # @ is the state
		DIV @ {"a":9,"b":17,"hist":[18]}                 # DIV odd is not possible
	3 4 NEW @a 3 @b 4 @hist []                         # NEW takes two parameters
{"a":17,"b":1,"hist":[]}                             # another initial state
	MUL ADD DIV @ {"a":18,"b":1,"hist":[17,34,36]}     # based on line 9
		UNDO @ {"a":36,"b":1,"hist":[17,34]}             # based on line 10
			UNDO @ {"a":34,"b":1,"hist":[17]}              # based on line 11
				UNDO @ {"a":17,"b":1,"hist":[]}              # based on line 12
	MUL ADD DIV ADD DIV ADD DIV ADD DIV DIV DIV @a @b  # from 17 to 1 in 11 steps
`

// INC and DEC
// const reducers = {
// }

// let script = `
// `

// Complex Numbers
// const reducers = {
// }

// let script = `
// {"re":1,"im":2}
// 	TRANS @re 2 @im 2
// 	SCALE @re 2 @im 4
// 	ROTATE @re -2 @im 1
// 	MIRROR @re 2 @im 1
// `

</script>

<TestReducer {stack} {script} {reducers} />
