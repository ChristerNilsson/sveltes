
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.head.appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
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
    function validate_store(store, name) {
        if (!store || typeof store.subscribe !== 'function') {
            throw new Error(`'${name}' is not a store with a 'subscribe' method`);
        }
    }
    function subscribe(store, callback) {
        const unsub = store.subscribe(callback);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function component_subscribe(component, store, callback) {
        component.$$.on_destroy.push(subscribe(store, callback));
    }
    function null_to_empty(value) {
        return value == null ? '' : value;
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_style(node, key, value, important) {
        node.style.setProperty(key, value, important ? 'important' : '');
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
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
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
    function append_dev(target, node) {
        dispatch_dev("SvelteDOMInsert", { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev("SvelteDOMInsert", { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev("SvelteDOMRemove", { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ["capture"] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev("SvelteDOMAddEventListener", { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev("SvelteDOMRemoveEventListener", { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev("SvelteDOMRemoveAttribute", { node, attribute });
        else
            dispatch_dev("SvelteDOMSetAttribute", { node, attribute, value });
    }
    function prop_dev(node, property, value) {
        node[property] = value;
        dispatch_dev("SvelteDOMSetProperty", { node, property, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.data === data)
            return;
        dispatch_dev("SvelteDOMSetData", { node: text, data });
        text.data = data;
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

    const subscriber_queue = [];
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = [];
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (let i = 0; i < subscribers.length; i += 1) {
                        const s = subscribers[i];
                        s[1]();
                        subscriber_queue.push(s, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.push(subscriber);
            if (subscribers.length === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                const index = subscribers.indexOf(subscriber);
                if (index !== -1) {
                    subscribers.splice(index, 1);
                }
                if (subscribers.length === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }

    var store = writable({});

    /* src/Button.svelte generated by Svelte v3.16.7 */

    const file = "src/Button.svelte";

    function create_fragment(ctx) {
    	let button;
    	let t;
    	let button_class_value;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			t = text(/*title*/ ctx[3]);
    			attr_dev(button, "class", button_class_value = "" + (null_to_empty(/*klass*/ ctx[0]) + " svelte-ty7arr"));
    			button.disabled = /*disabled*/ ctx[2];
    			add_location(button, file, 15, 0, 237);
    			dispose = listen_dev(button, "click", /*click*/ ctx[1], false, false, false);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, t);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*title*/ 8) set_data_dev(t, /*title*/ ctx[3]);

    			if (dirty & /*klass*/ 1 && button_class_value !== (button_class_value = "" + (null_to_empty(/*klass*/ ctx[0]) + " svelte-ty7arr"))) {
    				attr_dev(button, "class", button_class_value);
    			}

    			if (dirty & /*disabled*/ 4) {
    				prop_dev(button, "disabled", /*disabled*/ ctx[2]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			dispose();
    		}
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
    	let { click } = $$props;
    	let { disabled } = $$props;
    	let { title } = $$props;
    	let { klass } = $$props;
    	if (window.innerWidth < 600) klass = "col1";
    	const writable_props = ["click", "disabled", "title", "klass"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Button> was created with unknown prop '${key}'`);
    	});

    	$$self.$set = $$props => {
    		if ("click" in $$props) $$invalidate(1, click = $$props.click);
    		if ("disabled" in $$props) $$invalidate(2, disabled = $$props.disabled);
    		if ("title" in $$props) $$invalidate(3, title = $$props.title);
    		if ("klass" in $$props) $$invalidate(0, klass = $$props.klass);
    	};

    	$$self.$capture_state = () => {
    		return { click, disabled, title, klass };
    	};

    	$$self.$inject_state = $$props => {
    		if ("click" in $$props) $$invalidate(1, click = $$props.click);
    		if ("disabled" in $$props) $$invalidate(2, disabled = $$props.disabled);
    		if ("title" in $$props) $$invalidate(3, title = $$props.title);
    		if ("klass" in $$props) $$invalidate(0, klass = $$props.klass);
    	};

    	return [klass, click, disabled, title];
    }

    class Button extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance, create_fragment, safe_not_equal, {
    			click: 1,
    			disabled: 2,
    			title: 3,
    			klass: 0
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Button",
    			options,
    			id: create_fragment.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || ({});

    		if (/*click*/ ctx[1] === undefined && !("click" in props)) {
    			console.warn("<Button> was created without expected prop 'click'");
    		}

    		if (/*disabled*/ ctx[2] === undefined && !("disabled" in props)) {
    			console.warn("<Button> was created without expected prop 'disabled'");
    		}

    		if (/*title*/ ctx[3] === undefined && !("title" in props)) {
    			console.warn("<Button> was created without expected prop 'title'");
    		}

    		if (/*klass*/ ctx[0] === undefined && !("klass" in props)) {
    			console.warn("<Button> was created without expected prop 'klass'");
    		}
    	}

    	get click() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set click(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get disabled() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set disabled(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get title() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set title(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get klass() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set klass(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/State.svelte generated by Svelte v3.16.7 */
    const file$1 = "src/State.svelte";

    function create_fragment$1(ctx) {
    	let button;
    	let t0_value = /*state*/ ctx[0].action + "";
    	let t0;
    	let t1;
    	let t2_value = /*state*/ ctx[0].store.a + "";
    	let t2;
    	let t3;
    	let t4_value = /*state*/ ctx[0].store.b + "";
    	let t4;
    	let t5;
    	let t6_value = /*state*/ ctx[0].store.hist + "";
    	let t6;
    	let t7;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			t0 = text(t0_value);
    			t1 = text(" a:");
    			t2 = text(t2_value);
    			t3 = text(" b:");
    			t4 = text(t4_value);
    			t5 = text(" hist:[");
    			t6 = text(t6_value);
    			t7 = text("]");
    			attr_dev(button, "class", "col1 svelte-1j92rx0");
    			add_location(button, file$1, 10, 0, 155);
    			dispose = listen_dev(button, "click", /*click_handler*/ ctx[1], false, false, false);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, t0);
    			append_dev(button, t1);
    			append_dev(button, t2);
    			append_dev(button, t3);
    			append_dev(button, t4);
    			append_dev(button, t5);
    			append_dev(button, t6);
    			append_dev(button, t7);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*state*/ 1 && t0_value !== (t0_value = /*state*/ ctx[0].action + "")) set_data_dev(t0, t0_value);
    			if (dirty & /*state*/ 1 && t2_value !== (t2_value = /*state*/ ctx[0].store.a + "")) set_data_dev(t2, t2_value);
    			if (dirty & /*state*/ 1 && t4_value !== (t4_value = /*state*/ ctx[0].store.b + "")) set_data_dev(t4, t4_value);
    			if (dirty & /*state*/ 1 && t6_value !== (t6_value = /*state*/ ctx[0].store.hist + "")) set_data_dev(t6, t6_value);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			dispose();
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

    function instance$1($$self, $$props, $$invalidate) {
    	let { state } = $$props;
    	const writable_props = ["state"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<State> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => store.set(state.store);

    	$$self.$set = $$props => {
    		if ("state" in $$props) $$invalidate(0, state = $$props.state);
    	};

    	$$self.$capture_state = () => {
    		return { state };
    	};

    	$$self.$inject_state = $$props => {
    		if ("state" in $$props) $$invalidate(0, state = $$props.state);
    	};

    	return [state, click_handler];
    }

    class State extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { state: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "State",
    			options,
    			id: create_fragment$1.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || ({});

    		if (/*state*/ ctx[0] === undefined && !("state" in props)) {
    			console.warn("<State> was created without expected prop 'state'");
    		}
    	}

    	get state() {
    		throw new Error("<State>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set state(value) {
    		throw new Error("<State>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/TimeMachine.svelte generated by Svelte v3.16.7 */
    const file$2 = "src/TimeMachine.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[1] = list[i];
    	return child_ctx;
    }

    // (7:1) {#each states as state}
    function create_each_block(ctx) {
    	let current;

    	const state = new State({
    			props: { state: /*state*/ ctx[1] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(state.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(state, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const state_changes = {};
    			if (dirty & /*states*/ 1) state_changes.state = /*state*/ ctx[1];
    			state.$set(state_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(state.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(state.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(state, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(7:1) {#each states as state}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let div;
    	let current;
    	let each_value = /*states*/ ctx[0];
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			add_location(div, file$2, 5, 0, 75);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*states*/ 1) {
    				each_value = /*states*/ ctx[0];
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(div, null);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { states } = $$props;
    	const writable_props = ["states"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<TimeMachine> was created with unknown prop '${key}'`);
    	});

    	$$self.$set = $$props => {
    		if ("states" in $$props) $$invalidate(0, states = $$props.states);
    	};

    	$$self.$capture_state = () => {
    		return { states };
    	};

    	$$self.$inject_state = $$props => {
    		if ("states" in $$props) $$invalidate(0, states = $$props.states);
    	};

    	return [states];
    }

    class TimeMachine extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { states: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "TimeMachine",
    			options,
    			id: create_fragment$2.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || ({});

    		if (/*states*/ ctx[0] === undefined && !("states" in props)) {
    			console.warn("<TimeMachine> was created without expected prop 'states'");
    		}
    	}

    	get states() {
    		throw new Error("<TimeMachine>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set states(value) {
    		throw new Error("<TimeMachine>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/App.svelte generated by Svelte v3.16.7 */
    const file$3 = "src/App.svelte";

    // (82:0) {#if USE_TIME_MACHINE}
    function create_if_block(ctx) {
    	let current;

    	const timemachine = new TimeMachine({
    			props: { states: /*states*/ ctx[0] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(timemachine.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(timemachine, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const timemachine_changes = {};
    			if (dirty & /*states*/ 1) timemachine_changes.states = /*states*/ ctx[0];
    			timemachine.$set(timemachine_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(timemachine.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(timemachine.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(timemachine, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(82:0) {#if USE_TIME_MACHINE}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let h10;
    	let t0_value = /*$store*/ ctx[2].a + "";
    	let t0;
    	let t1;
    	let h11;
    	let t2_value = /*$store*/ ctx[2].b + "";
    	let t2;
    	let t3;
    	let t4;
    	let t5;
    	let t6;
    	let t7;
    	let t8;
    	let hr;
    	let t9;
    	let if_block_anchor;
    	let current;

    	const button0 = new Button({
    			props: {
    				klass: "col3",
    				title: "+2",
    				click: /*func*/ ctx[6],
    				disabled: /*done*/ ctx[1]
    			},
    			$$inline: true
    		});

    	const button1 = new Button({
    			props: {
    				klass: "col3",
    				title: "*2",
    				click: /*func_1*/ ctx[7],
    				disabled: /*done*/ ctx[1]
    			},
    			$$inline: true
    		});

    	const button2 = new Button({
    			props: {
    				klass: "col3",
    				title: "/2",
    				click: /*func_2*/ ctx[8],
    				disabled: /*done*/ ctx[1]
    			},
    			$$inline: true
    		});

    	const button3 = new Button({
    			props: {
    				klass: "col2",
    				title: "New",
    				click: /*func_3*/ ctx[9],
    				disabled: !/*done*/ ctx[1]
    			},
    			$$inline: true
    		});

    	const button4 = new Button({
    			props: {
    				klass: "col2",
    				title: "Undo",
    				click: /*func_4*/ ctx[10],
    				disabled: /*$store*/ ctx[2].hist.length == 0
    			},
    			$$inline: true
    		});

    	let if_block =  create_if_block(ctx);

    	const block = {
    		c: function create() {
    			h10 = element("h1");
    			t0 = text(t0_value);
    			t1 = space();
    			h11 = element("h1");
    			t2 = text(t2_value);
    			t3 = space();
    			create_component(button0.$$.fragment);
    			t4 = space();
    			create_component(button1.$$.fragment);
    			t5 = space();
    			create_component(button2.$$.fragment);
    			t6 = space();
    			create_component(button3.$$.fragment);
    			t7 = space();
    			create_component(button4.$$.fragment);
    			t8 = space();
    			hr = element("hr");
    			t9 = space();
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    			attr_dev(h10, "class", "col2 svelte-1of37l2");
    			set_style(h10, "font-size", "60px");
    			set_style(h10, "color", "red");
    			add_location(h10, file$3, 73, 0, 1388);
    			attr_dev(h11, "class", "col2 svelte-1of37l2");
    			set_style(h11, "font-size", "60px");
    			set_style(h11, "color", "green");
    			add_location(h11, file$3, 74, 0, 1457);
    			add_location(hr, file$3, 80, 0, 1981);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h10, anchor);
    			append_dev(h10, t0);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, h11, anchor);
    			append_dev(h11, t2);
    			insert_dev(target, t3, anchor);
    			mount_component(button0, target, anchor);
    			insert_dev(target, t4, anchor);
    			mount_component(button1, target, anchor);
    			insert_dev(target, t5, anchor);
    			mount_component(button2, target, anchor);
    			insert_dev(target, t6, anchor);
    			mount_component(button3, target, anchor);
    			insert_dev(target, t7, anchor);
    			mount_component(button4, target, anchor);
    			insert_dev(target, t8, anchor);
    			insert_dev(target, hr, anchor);
    			insert_dev(target, t9, anchor);
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if ((!current || dirty & /*$store*/ 4) && t0_value !== (t0_value = /*$store*/ ctx[2].a + "")) set_data_dev(t0, t0_value);
    			if ((!current || dirty & /*$store*/ 4) && t2_value !== (t2_value = /*$store*/ ctx[2].b + "")) set_data_dev(t2, t2_value);
    			const button0_changes = {};
    			if (dirty & /*done*/ 2) button0_changes.disabled = /*done*/ ctx[1];
    			button0.$set(button0_changes);
    			const button1_changes = {};
    			if (dirty & /*done*/ 2) button1_changes.disabled = /*done*/ ctx[1];
    			button1.$set(button1_changes);
    			const button2_changes = {};
    			if (dirty & /*done*/ 2) button2_changes.disabled = /*done*/ ctx[1];
    			button2.$set(button2_changes);
    			const button3_changes = {};
    			if (dirty & /*done*/ 2) button3_changes.disabled = !/*done*/ ctx[1];
    			button3.$set(button3_changes);
    			const button4_changes = {};
    			if (dirty & /*$store*/ 4) button4_changes.disabled = /*$store*/ ctx[2].hist.length == 0;
    			button4.$set(button4_changes);
    			if_block.p(ctx, dirty);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(button0.$$.fragment, local);
    			transition_in(button1.$$.fragment, local);
    			transition_in(button2.$$.fragment, local);
    			transition_in(button3.$$.fragment, local);
    			transition_in(button4.$$.fragment, local);
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(button0.$$.fragment, local);
    			transition_out(button1.$$.fragment, local);
    			transition_out(button2.$$.fragment, local);
    			transition_out(button3.$$.fragment, local);
    			transition_out(button4.$$.fragment, local);
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h10);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(h11);
    			if (detaching) detach_dev(t3);
    			destroy_component(button0, detaching);
    			if (detaching) detach_dev(t4);
    			destroy_component(button1, detaching);
    			if (detaching) detach_dev(t5);
    			destroy_component(button2, detaching);
    			if (detaching) detach_dev(t6);
    			destroy_component(button3, detaching);
    			if (detaching) detach_dev(t7);
    			destroy_component(button4, detaching);
    			if (detaching) detach_dev(t8);
    			if (detaching) detach_dev(hr);
    			if (detaching) detach_dev(t9);
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }
    const ADD = "ADD";
    const MUL = "MUL";
    const DIV = "DIV";
    const NEW = "NEW";
    const UNDO = "UNDO";

    function instance$3($$self, $$props, $$invalidate) {
    	let $store;
    	validate_store(store, "store");
    	component_subscribe($$self, store, $$value => $$invalidate(2, $store = $$value));
    	let states = [];

    	const resetState = () => {
    		if ( states.length > 0) {
    			let state = states[states.length - 1];
    			let st = state.store;
    			store.set({ a: st.a, b: st.b, hist: st.hist.slice() });
    		}
    	};

    	const saveState = action => {
    		{
    			states.push({ action, store: $store });
    			$$invalidate(0, states);
    		}
    	};

    	const operation = action => {
    		resetState();
    		let a = $store.a;
    		let b = $store.b;
    		let hist = $store.hist;

    		if (action == ADD) {
    			hist.push(a);
    			a += 2;
    		} else if (action == MUL) {
    			hist.push(a);
    			a *= 2;
    		} else if (action == DIV) {
    			hist.push(a);
    			a /= 2;
    		} else if (action == NEW) {
    			const random = (a, b) => a + Math.floor((b - a + 1) * Math.random());
    			a = random(1, 20);
    			b = random(1, 20);
    			hist = [];
    		} else if (action == UNDO) {
    			a = hist.pop();
    		} else {
    			console.log("Missing action: " + action);
    		}

    		store.set({ a, b, hist: hist.slice() });
    		saveState(action);
    	};

    	operation(NEW);
    	const func = () => operation(ADD);
    	const func_1 = () => operation(MUL);
    	const func_2 = () => operation(DIV);
    	const func_3 = () => operation(NEW);
    	const func_4 = () => operation(UNDO);

    	$$self.$capture_state = () => {
    		return {};
    	};

    	$$self.$inject_state = $$props => {
    		if ("states" in $$props) $$invalidate(0, states = $$props.states);
    		if ("done" in $$props) $$invalidate(1, done = $$props.done);
    		if ("$store" in $$props) store.set($store = $$props.$store);
    	};

    	let done;

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*$store*/ 4) {
    			 $$invalidate(1, done = $store.a == $store.b);
    		}
    	};

    	return [
    		states,
    		done,
    		$store,
    		operation,
    		resetState,
    		saveState,
    		func,
    		func_1,
    		func_2,
    		func_3,
    		func_4
    	];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$3.name
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
