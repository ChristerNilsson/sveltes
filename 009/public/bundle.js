
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.head.appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    function flush() {
        const seen_callbacks = new Set();
        do {
            // first, call beforeUpdate functions
            // and update components
            while (dirty_components.length) {
                const component = dirty_components.shift();
                set_current_component(component);
                update(component.$$);
            }
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    callback();
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }

    const globals = (typeof window !== 'undefined' ? window : global);
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const prop_values = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (i, ret, value = ret) => {
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if ($$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(children(options.target));
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set() {
            // overridden by instance, if it has props
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, detail));
    }
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error(`'target' is a required option`);
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn(`Component was already destroyed`); // eslint-disable-line no-console
            };
        }
    }

    /* src/TestReducer.svelte generated by Svelte v3.16.7 */

    const { Object: Object_1 } = globals;

    function create_fragment(ctx) {
    	const block = {
    		c: noop,
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: noop,
    		p: noop,
    		i: noop,
    		o: noop,
    		d: noop
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { script } = $$props;
    	let { reducers } = $$props;
    	let { stack } = $$props;
    	const assert = chai.assert.deepEqual;

    	const testReducer = (reducers, stack) => {
    		let states = [];
    		let errors = [];

    		const run = script => {
    			const arr = script.split("\n");
    			errors = [];

    			for (let nr = 0; nr < arr.length; nr++) {
    				let line = arr[nr];
    				const pos = line.lastIndexOf("#");
    				if (pos >= 0) line = line.slice(0, pos);

    				try {
    					if (line.trim().length != 0) runTest(line, nr);
    				} catch(err) {
    					errors.push(err);
    					break;
    				}
    			}

    			return errors;
    		};

    		const runTest = (line, nr) => {
    			const index = countTabs(line);
    			line = line.trim();
    			if (index === 0) return states = [JSON.parse(line)];
    			stack.length = 0;
    			let state = states[index - 1];

    			for (const cmd of line.split(" ")) {
    				state = rpn(cmd, state, nr);
    			}

    			states[index] = state;

    			while (stack.length >= 2) {
    				rpn("==", state, nr);
    			}

    			if (stack.length === 1) {
    				errors.push(`Orphan in line ${nr + 1}`);
    				return;
    			}
    		};

    		const rpn = (cmd, state, nr) => {
    			if (cmd === "@") {
    				stack.push(state);
    				return state;
    			}

    			const key = cmd.slice(1);

    			if (Object.keys(state).includes(key)) {
    				stack.push(state[key]);
    				return state;
    			}

    			if (Object.keys(reducers).includes(cmd)) {
    				return state = reducers[cmd](state);
    			}

    			if (cmd === "==") {
    				let x;
    				let y;

    				try {
    					x = stack.pop();
    					y = stack.pop();
    					assert(x, y);
    				} catch(error) {
    					errors.push("Assert failure in line " + (nr + 1));
    					errors.push("  Actual " + JSON.stringify(y));
    					errors.push("  Expect " + JSON.stringify(x));
    				}

    				return state;
    			}

    			try {
    				if (cmd == "") return state;
    				stack.push(JSON.parse(cmd));
    			} catch(error) {
    				errors.push("JSON.parse failure in line " + (nr + 1) + " " + cmd);
    				errors.push("\t" + cmd);
    			}

    			return state;
    		};

    		const countTabs = line => {
    			let result = 0;

    			for (let i = 0; i < line.length; i++) {
    				const ch = line[i];
    				if (ch !== "\t") return result;
    				result++;
    			}

    			return result;
    		};

    		return { run };
    	};

    	const editor = CodeMirror(document.body, {
    		lineNumbers: true,
    		tabSize: 2,
    		indentWithTabs: true,
    		theme: "dracula"
    	});

    	editor.setValue(script.trim());

    	editor.on("change", () => {
    		viewer.setValue(reducer.run(editor.getValue()).join("\n"));
    	});

    	const viewer = CodeMirror(document.body, { readOnly: true, tabSize: 2 });
    	const reducer = testReducer(reducers, stack);
    	viewer.setValue(reducer.run(editor.getValue()).join("\n"));

    	const resize = () => {
    		editor.setSize(innerWidth, 0.75 * innerHeight);
    		viewer.setSize(innerWidth, 0.25 * innerHeight);
    	};

    	resize();
    	window.addEventListener("resize", resize);
    	const writable_props = ["script", "reducers", "stack"];

    	Object_1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<TestReducer> was created with unknown prop '${key}'`);
    	});

    	$$self.$set = $$props => {
    		if ("script" in $$props) $$invalidate(0, script = $$props.script);
    		if ("reducers" in $$props) $$invalidate(1, reducers = $$props.reducers);
    		if ("stack" in $$props) $$invalidate(2, stack = $$props.stack);
    	};

    	$$self.$capture_state = () => {
    		return { script, reducers, stack };
    	};

    	$$self.$inject_state = $$props => {
    		if ("script" in $$props) $$invalidate(0, script = $$props.script);
    		if ("reducers" in $$props) $$invalidate(1, reducers = $$props.reducers);
    		if ("stack" in $$props) $$invalidate(2, stack = $$props.stack);
    	};

    	return [script, reducers, stack];
    }

    class TestReducer extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, { script: 0, reducers: 1, stack: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "TestReducer",
    			options,
    			id: create_fragment.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || ({});

    		if (/*script*/ ctx[0] === undefined && !("script" in props)) {
    			console.warn("<TestReducer> was created without expected prop 'script'");
    		}

    		if (/*reducers*/ ctx[1] === undefined && !("reducers" in props)) {
    			console.warn("<TestReducer> was created without expected prop 'reducers'");
    		}

    		if (/*stack*/ ctx[2] === undefined && !("stack" in props)) {
    			console.warn("<TestReducer> was created without expected prop 'stack'");
    		}
    	}

    	get script() {
    		throw new Error("<TestReducer>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set script(value) {
    		throw new Error("<TestReducer>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get reducers() {
    		throw new Error("<TestReducer>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set reducers(value) {
    		throw new Error("<TestReducer>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get stack() {
    		throw new Error("<TestReducer>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set stack(value) {
    		throw new Error("<TestReducer>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/App.svelte generated by Svelte v3.16.7 */

    function create_fragment$1(ctx) {
    	let current;

    	const testreducer = new TestReducer({
    			props: {
    				stack: /*stack*/ ctx[0],
    				script: /*script*/ ctx[2],
    				reducers: /*reducers*/ ctx[1]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(testreducer.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(testreducer, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(testreducer.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(testreducer.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(testreducer, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self) {
    	const stack = [];

    	const op = (state, value) => {
    		if (Math.round(value) != value) return state;
    		const hist = [...state.hist, state.a];
    		return { ...state, a: value, hist };
    	};

    	const reducers = {
    		ADD: state => op(state, state.a + 2),
    		MUL: state => op(state, state.a * 2),
    		DIV: state => op(state, state.a / 2),
    		NEW: state => ({ b: stack.pop(), a: stack.pop(), hist: [] }),
    		UNDO: state => {
    			const hist = state.hist.slice();
    			const a = hist.pop();
    			const b = state.b;
    			return { a, b, hist };
    		}
    	};

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
`;

    	$$self.$capture_state = () => {
    		return {};
    	};

    	$$self.$inject_state = $$props => {
    		if ("script" in $$props) $$invalidate(2, script = $$props.script);
    	};

    	return [stack, reducers, script];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    const app = new App({
    	target: document.body,
    	props: {}
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
