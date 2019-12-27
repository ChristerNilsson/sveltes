
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
    function svg_element(name) {
        return document.createElementNS('http://www.w3.org/2000/svg', name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
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
    function add_flush_callback(fn) {
        flush_callbacks.push(fn);
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

    function bind(component, name, callback) {
        const index = component.$$.props[name];
        if (index !== undefined) {
            component.$$.bound[index] = callback;
            callback(component.$$.ctx[index]);
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

    /* src/Navigation.svelte generated by Svelte v3.16.7 */

    const file = "src/Navigation.svelte";

    // (17:1) {:else}
    function create_else_block(ctx) {
    	let span0;
    	let t0_value = /*curr*/ ctx[1].a + "";
    	let t0;
    	let t1;
    	let span1;
    	let t2_value = /*curr*/ ctx[1].b + "";
    	let t2;
    	let dispose;

    	const block = {
    		c: function create() {
    			span0 = element("span");
    			t0 = text(t0_value);
    			t1 = text("\n\t\tto \n\t\t");
    			span1 = element("span");
    			t2 = text(t2_value);
    			add_location(span0, file, 17, 2, 377);
    			add_location(span1, file, 19, 2, 444);

    			dispose = [
    				listen_dev(span0, "mousemove", /*mousemove_handler_1*/ ctx[5], false, false, false),
    				listen_dev(span1, "mousemove", /*mousemove_handler_2*/ ctx[6], false, false, false)
    			];
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span0, anchor);
    			append_dev(span0, t0);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, span1, anchor);
    			append_dev(span1, t2);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*curr*/ 2 && t0_value !== (t0_value = /*curr*/ ctx[1].a + "")) set_data_dev(t0, t0_value);
    			if (dirty & /*curr*/ 2 && t2_value !== (t2_value = /*curr*/ ctx[1].b + "")) set_data_dev(t2, t2_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span0);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(span1);
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(17:1) {:else}",
    		ctx
    	});

    	return block;
    }

    // (15:1) {#if curr.a == curr.b}
    function create_if_block(ctx) {
    	let t0_value = /*curr*/ ctx[1].orig + "";
    	let t0;
    	let t1;
    	let t2_value = /*curr*/ ctx[1].b + "";
    	let t2;

    	const block = {
    		c: function create() {
    			t0 = text(t0_value);
    			t1 = text(" to ");
    			t2 = text(t2_value);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t0, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, t2, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*curr*/ 2 && t0_value !== (t0_value = /*curr*/ ctx[1].orig + "")) set_data_dev(t0, t0_value);
    			if (dirty & /*curr*/ 2 && t2_value !== (t2_value = /*curr*/ ctx[1].b + "")) set_data_dev(t2, t2_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(t2);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(15:1) {#if curr.a == curr.b}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let div0;
    	let button0;
    	let t0;
    	let button0_disabled_value;
    	let t1;
    	let div1;
    	let t2;
    	let div2;
    	let button1;
    	let t3;
    	let button1_disabled_value;
    	let dispose;

    	function select_block_type(ctx, dirty) {
    		if (/*curr*/ ctx[1].a == /*curr*/ ctx[1].b) return create_if_block;
    		return create_else_block;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			div0 = element("div");
    			button0 = element("button");
    			t0 = text("prev");
    			t1 = space();
    			div1 = element("div");
    			if_block.c();
    			t2 = space();
    			div2 = element("div");
    			button1 = element("button");
    			t3 = text("next");
    			attr_dev(button0, "class", "br svelte-15l3d4f");
    			button0.disabled = button0_disabled_value = /*index*/ ctx[2] == 0;
    			add_location(button0, file, 10, 1, 151);
    			attr_dev(div0, "class", "col s3 fs left-align svelte-15l3d4f");
    			add_location(div0, file, 9, 0, 114);
    			attr_dev(div1, "class", "col s6 fs center-align svelte-15l3d4f");
    			add_location(div1, file, 13, 0, 278);
    			attr_dev(button1, "class", "br svelte-15l3d4f");
    			button1.disabled = button1_disabled_value = /*index*/ ctx[2] == /*data*/ ctx[0].N - 1;
    			add_location(button1, file, 24, 1, 557);
    			attr_dev(div2, "class", "col s3 fs right-align svelte-15l3d4f");
    			add_location(div2, file, 23, 0, 519);

    			dispose = [
    				listen_dev(button0, "mousemove", /*mousemove_handler*/ ctx[3], false, false, false),
    				listen_dev(button0, "click", /*click_handler*/ ctx[4], false, false, false),
    				listen_dev(button1, "mousemove", /*mousemove_handler_3*/ ctx[7], false, false, false),
    				listen_dev(button1, "click", /*click_handler_1*/ ctx[8], false, false, false)
    			];
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div0, anchor);
    			append_dev(div0, button0);
    			append_dev(button0, t0);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, div1, anchor);
    			if_block.m(div1, null);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, div2, anchor);
    			append_dev(div2, button1);
    			append_dev(button1, t3);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*index*/ 4 && button0_disabled_value !== (button0_disabled_value = /*index*/ ctx[2] == 0)) {
    				prop_dev(button0, "disabled", button0_disabled_value);
    			}

    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(div1, null);
    				}
    			}

    			if (dirty & /*index, data*/ 5 && button1_disabled_value !== (button1_disabled_value = /*index*/ ctx[2] == /*data*/ ctx[0].N - 1)) {
    				prop_dev(button1, "disabled", button1_disabled_value);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div0);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(div1);
    			if_block.d();
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(div2);
    			run_all(dispose);
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
    	let { data } = $$props, { curr } = $$props, { index } = $$props;
    	const writable_props = ["data", "curr", "index"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Navigation> was created with unknown prop '${key}'`);
    	});

    	const mousemove_handler = () => data.mm("prev");
    	const click_handler = () => data.incr(-1);
    	const mousemove_handler_1 = () => data.mm("left");
    	const mousemove_handler_2 = () => data.mm("right");
    	const mousemove_handler_3 = () => data.mm("next");
    	const click_handler_1 = () => data.incr(+1);

    	$$self.$set = $$props => {
    		if ("data" in $$props) $$invalidate(0, data = $$props.data);
    		if ("curr" in $$props) $$invalidate(1, curr = $$props.curr);
    		if ("index" in $$props) $$invalidate(2, index = $$props.index);
    	};

    	$$self.$capture_state = () => {
    		return { data, curr, index };
    	};

    	$$self.$inject_state = $$props => {
    		if ("data" in $$props) $$invalidate(0, data = $$props.data);
    		if ("curr" in $$props) $$invalidate(1, curr = $$props.curr);
    		if ("index" in $$props) $$invalidate(2, index = $$props.index);
    	};

    	return [
    		data,
    		curr,
    		index,
    		mousemove_handler,
    		click_handler,
    		mousemove_handler_1,
    		mousemove_handler_2,
    		mousemove_handler_3,
    		click_handler_1
    	];
    }

    class Navigation extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, { data: 0, curr: 1, index: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Navigation",
    			options,
    			id: create_fragment.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || ({});

    		if (/*data*/ ctx[0] === undefined && !("data" in props)) {
    			console.warn("<Navigation> was created without expected prop 'data'");
    		}

    		if (/*curr*/ ctx[1] === undefined && !("curr" in props)) {
    			console.warn("<Navigation> was created without expected prop 'curr'");
    		}

    		if (/*index*/ ctx[2] === undefined && !("index" in props)) {
    			console.warn("<Navigation> was created without expected prop 'index'");
    		}
    	}

    	get data() {
    		throw new Error("<Navigation>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set data(value) {
    		throw new Error("<Navigation>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get curr() {
    		throw new Error("<Navigation>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set curr(value) {
    		throw new Error("<Navigation>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get index() {
    		throw new Error("<Navigation>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set index(value) {
    		throw new Error("<Navigation>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/Commands.svelte generated by Svelte v3.16.7 */

    const file$1 = "src/Commands.svelte";

    // (16:1) {:else}
    function create_else_block$1(ctx) {
    	let div0;
    	let t0;
    	let div1;
    	let t1;
    	let t2;
    	let t3;
    	let t4;
    	let div2;
    	let button;
    	let t5;
    	let button_disabled_value;
    	let dispose;
    	let if_block0 = /*data*/ ctx[0].ADD != 0 && create_if_block_4(ctx);
    	let if_block1 = /*data*/ ctx[0].SUB != 0 && create_if_block_3(ctx);
    	let if_block2 = /*data*/ ctx[0].MUL != 1 && create_if_block_2(ctx);
    	let if_block3 = /*data*/ ctx[0].DIV != 1 && create_if_block_1(ctx);

    	const block = {
    		c: function create() {
    			div0 = element("div");
    			t0 = space();
    			div1 = element("div");
    			if (if_block0) if_block0.c();
    			t1 = space();
    			if (if_block1) if_block1.c();
    			t2 = space();
    			if (if_block2) if_block2.c();
    			t3 = space();
    			if (if_block3) if_block3.c();
    			t4 = space();
    			div2 = element("div");
    			button = element("button");
    			t5 = text("Undo");
    			attr_dev(div0, "class", "left col s3 fs marg center-align svelte-1ey8shx");
    			add_location(div0, file$1, 16, 2, 279);
    			attr_dev(div1, "class", "left col s6 fs marg center-align svelte-1ey8shx");
    			add_location(div1, file$1, 17, 2, 334);
    			attr_dev(button, "class", "br svelte-1ey8shx");
    			button.disabled = button_disabled_value = /*curr*/ ctx[1].hist.length == 0;
    			add_location(button, file$1, 32, 3, 1164);
    			attr_dev(div2, "class", "left col s3 fs marg right-align svelte-1ey8shx");
    			add_location(div2, file$1, 31, 2, 1115);

    			dispose = [
    				listen_dev(button, "mousemove", /*mousemove_handler_4*/ ctx[11], false, false, false),
    				listen_dev(
    					button,
    					"click",
    					function () {
    						if (is_function(/*data*/ ctx[0].undo)) /*data*/ ctx[0].undo.apply(this, arguments);
    					},
    					false,
    					false,
    					false
    				)
    			];
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div0, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, div1, anchor);
    			if (if_block0) if_block0.m(div1, null);
    			append_dev(div1, t1);
    			if (if_block1) if_block1.m(div1, null);
    			append_dev(div1, t2);
    			if (if_block2) if_block2.m(div1, null);
    			append_dev(div1, t3);
    			if (if_block3) if_block3.m(div1, null);
    			insert_dev(target, t4, anchor);
    			insert_dev(target, div2, anchor);
    			append_dev(div2, button);
    			append_dev(button, t5);
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (/*data*/ ctx[0].ADD != 0) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);
    				} else {
    					if_block0 = create_if_block_4(ctx);
    					if_block0.c();
    					if_block0.m(div1, t1);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (/*data*/ ctx[0].SUB != 0) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);
    				} else {
    					if_block1 = create_if_block_3(ctx);
    					if_block1.c();
    					if_block1.m(div1, t2);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}

    			if (/*data*/ ctx[0].MUL != 1) {
    				if (if_block2) {
    					if_block2.p(ctx, dirty);
    				} else {
    					if_block2 = create_if_block_2(ctx);
    					if_block2.c();
    					if_block2.m(div1, t3);
    				}
    			} else if (if_block2) {
    				if_block2.d(1);
    				if_block2 = null;
    			}

    			if (/*data*/ ctx[0].DIV != 1) {
    				if (if_block3) {
    					if_block3.p(ctx, dirty);
    				} else {
    					if_block3 = create_if_block_1(ctx);
    					if_block3.c();
    					if_block3.m(div1, null);
    				}
    			} else if (if_block3) {
    				if_block3.d(1);
    				if_block3 = null;
    			}

    			if (dirty & /*curr*/ 2 && button_disabled_value !== (button_disabled_value = /*curr*/ ctx[1].hist.length == 0)) {
    				prop_dev(button, "disabled", button_disabled_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div0);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(div1);
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    			if (if_block2) if_block2.d();
    			if (if_block3) if_block3.d();
    			if (detaching) detach_dev(t4);
    			if (detaching) detach_dev(div2);
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$1.name,
    		type: "else",
    		source: "(16:1) {:else}",
    		ctx
    	});

    	return block;
    }

    // (14:1) {#if done}
    function create_if_block$1(ctx) {
    	let div;
    	let t0_value = /*curr*/ ctx[1].hist.length + "";
    	let t0;
    	let t1;

    	const block = {
    		c: function create() {
    			div = element("div");
    			t0 = text(t0_value);
    			t1 = text(" steps");
    			attr_dev(div, "class", "left col s12 fs marg center-align svelte-1ey8shx");
    			add_location(div, file$1, 14, 2, 190);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t0);
    			append_dev(div, t1);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*curr*/ 2 && t0_value !== (t0_value = /*curr*/ ctx[1].hist.length + "")) set_data_dev(t0, t0_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(14:1) {#if done}",
    		ctx
    	});

    	return block;
    }

    // (19:3) {#if (data.ADD!=0)}
    function create_if_block_4(ctx) {
    	let button;
    	let t0;
    	let t1_value = /*data*/ ctx[0].ADD + "";
    	let t1;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			t0 = text("add ");
    			t1 = text(t1_value);
    			attr_dev(button, "class", "br svelte-1ey8shx");
    			button.disabled = /*done*/ ctx[2];
    			add_location(button, file$1, 19, 4, 408);

    			dispose = [
    				listen_dev(button, "mousemove", /*mousemove_handler*/ ctx[3], false, false, false),
    				listen_dev(button, "click", /*click_handler*/ ctx[4], false, false, false)
    			];
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, t0);
    			append_dev(button, t1);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*data*/ 1 && t1_value !== (t1_value = /*data*/ ctx[0].ADD + "")) set_data_dev(t1, t1_value);

    			if (dirty & /*done*/ 4) {
    				prop_dev(button, "disabled", /*done*/ ctx[2]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_4.name,
    		type: "if",
    		source: "(19:3) {#if (data.ADD!=0)}",
    		ctx
    	});

    	return block;
    }

    // (22:3) {#if (data.SUB!=0)}
    function create_if_block_3(ctx) {
    	let button;
    	let t0;
    	let t1_value = /*data*/ ctx[0].SUB + "";
    	let t1;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			t0 = text("sub ");
    			t1 = text(t1_value);
    			attr_dev(button, "class", "br svelte-1ey8shx");
    			button.disabled = /*done*/ ctx[2];
    			add_location(button, file$1, 22, 4, 582);

    			dispose = [
    				listen_dev(button, "mousemove", /*mousemove_handler_1*/ ctx[5], false, false, false),
    				listen_dev(button, "click", /*click_handler_1*/ ctx[6], false, false, false)
    			];
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, t0);
    			append_dev(button, t1);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*data*/ 1 && t1_value !== (t1_value = /*data*/ ctx[0].SUB + "")) set_data_dev(t1, t1_value);

    			if (dirty & /*done*/ 4) {
    				prop_dev(button, "disabled", /*done*/ ctx[2]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3.name,
    		type: "if",
    		source: "(22:3) {#if (data.SUB!=0)}",
    		ctx
    	});

    	return block;
    }

    // (25:3) {#if (data.MUL!=1)}
    function create_if_block_2(ctx) {
    	let button;
    	let t0;
    	let t1_value = /*data*/ ctx[0].MUL + "";
    	let t1;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			t0 = text("mul ");
    			t1 = text(t1_value);
    			attr_dev(button, "class", "br svelte-1ey8shx");
    			button.disabled = /*done*/ ctx[2];
    			add_location(button, file$1, 25, 4, 756);

    			dispose = [
    				listen_dev(button, "mousemove", /*mousemove_handler_2*/ ctx[7], false, false, false),
    				listen_dev(button, "click", /*click_handler_2*/ ctx[8], false, false, false)
    			];
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, t0);
    			append_dev(button, t1);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*data*/ 1 && t1_value !== (t1_value = /*data*/ ctx[0].MUL + "")) set_data_dev(t1, t1_value);

    			if (dirty & /*done*/ 4) {
    				prop_dev(button, "disabled", /*done*/ ctx[2]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(25:3) {#if (data.MUL!=1)}",
    		ctx
    	});

    	return block;
    }

    // (28:3) {#if (data.DIV!=1)}
    function create_if_block_1(ctx) {
    	let button;
    	let t0;
    	let t1_value = /*data*/ ctx[0].DIV + "";
    	let t1;
    	let button_disabled_value;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			t0 = text("div ");
    			t1 = text(t1_value);
    			attr_dev(button, "class", "br svelte-1ey8shx");
    			button.disabled = button_disabled_value = /*done*/ ctx[2] || /*curr*/ ctx[1].a % /*data*/ ctx[0].DIV != 0;
    			add_location(button, file$1, 28, 4, 930);

    			dispose = [
    				listen_dev(button, "mousemove", /*mousemove_handler_3*/ ctx[9], false, false, false),
    				listen_dev(button, "click", /*click_handler_3*/ ctx[10], false, false, false)
    			];
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, t0);
    			append_dev(button, t1);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*data*/ 1 && t1_value !== (t1_value = /*data*/ ctx[0].DIV + "")) set_data_dev(t1, t1_value);

    			if (dirty & /*done, curr, data*/ 7 && button_disabled_value !== (button_disabled_value = /*done*/ ctx[2] || /*curr*/ ctx[1].a % /*data*/ ctx[0].DIV != 0)) {
    				prop_dev(button, "disabled", button_disabled_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(28:3) {#if (data.DIV!=1)}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let div;

    	function select_block_type(ctx, dirty) {
    		if (/*done*/ ctx[2]) return create_if_block$1;
    		return create_else_block$1;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if_block.c();
    			attr_dev(div, "class", "row");
    			add_location(div, file$1, 11, 0, 157);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			if_block.m(div, null);
    		},
    		p: function update(ctx, [dirty]) {
    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(div, null);
    				}
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if_block.d();
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
    	let { data } = $$props, { curr } = $$props;
    	const writable_props = ["data", "curr"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Commands> was created with unknown prop '${key}'`);
    	});

    	const mousemove_handler = evt => data.mm("add");
    	const click_handler = () => data.op(curr.a + data.ADD);
    	const mousemove_handler_1 = evt => data.mm("sub");
    	const click_handler_1 = () => data.op(curr.a - data.SUB);
    	const mousemove_handler_2 = evt => data.mm("mul");
    	const click_handler_2 = () => data.op(curr.a * data.MUL);
    	const mousemove_handler_3 = evt => data.mm("div");
    	const click_handler_3 = () => data.op(curr.a / data.DIV);
    	const mousemove_handler_4 = evt => data.mm("undo");

    	$$self.$set = $$props => {
    		if ("data" in $$props) $$invalidate(0, data = $$props.data);
    		if ("curr" in $$props) $$invalidate(1, curr = $$props.curr);
    	};

    	$$self.$capture_state = () => {
    		return { data, curr, done };
    	};

    	$$self.$inject_state = $$props => {
    		if ("data" in $$props) $$invalidate(0, data = $$props.data);
    		if ("curr" in $$props) $$invalidate(1, curr = $$props.curr);
    		if ("done" in $$props) $$invalidate(2, done = $$props.done);
    	};

    	let done;

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*curr*/ 2) {
    			 $$invalidate(2, done = curr.a == curr.b);
    		}
    	};

    	return [
    		data,
    		curr,
    		done,
    		mousemove_handler,
    		click_handler,
    		mousemove_handler_1,
    		click_handler_1,
    		mousemove_handler_2,
    		click_handler_2,
    		mousemove_handler_3,
    		click_handler_3,
    		mousemove_handler_4
    	];
    }

    class Commands extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { data: 0, curr: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Commands",
    			options,
    			id: create_fragment$1.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || ({});

    		if (/*data*/ ctx[0] === undefined && !("data" in props)) {
    			console.warn("<Commands> was created without expected prop 'data'");
    		}

    		if (/*curr*/ ctx[1] === undefined && !("curr" in props)) {
    			console.warn("<Commands> was created without expected prop 'curr'");
    		}
    	}

    	get data() {
    		throw new Error("<Commands>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set data(value) {
    		throw new Error("<Commands>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get curr() {
    		throw new Error("<Commands>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set curr(value) {
    		throw new Error("<Commands>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/Statistics.svelte generated by Svelte v3.16.7 */

    const file$2 = "src/Statistics.svelte";

    function create_fragment$2(ctx) {
    	let div4;
    	let div0;
    	let t0_value = /*data*/ ctx[0].score + "";
    	let t0;
    	let t1;
    	let div1;
    	let t2_value = /*data*/ ctx[0].undos + "";
    	let t2;
    	let t3;
    	let t4;
    	let div2;
    	let t5_value = /*data*/ ctx[0].optimum + "";
    	let t5;
    	let t6;
    	let div3;
    	let t7_value = (/*data*/ ctx[0].stopp - /*data*/ ctx[0].start) / 1000 + "";
    	let t7;
    	let dispose;

    	const block = {
    		c: function create() {
    			div4 = element("div");
    			div0 = element("div");
    			t0 = text(t0_value);
    			t1 = space();
    			div1 = element("div");
    			t2 = text(t2_value);
    			t3 = text(" undos");
    			t4 = space();
    			div2 = element("div");
    			t5 = text(t5_value);
    			t6 = space();
    			div3 = element("div");
    			t7 = text(t7_value);
    			attr_dev(div0, "class", "left col s6 fs marg green yellow-text left-align svelte-e7mr2s");
    			add_location(div0, file$2, 10, 1, 123);
    			attr_dev(div1, "class", "left col s6 fs marg green right-align svelte-e7mr2s");
    			add_location(div1, file$2, 11, 1, 243);
    			attr_dev(div2, "class", "left col s6 fs marg green left-align svelte-e7mr2s");
    			add_location(div2, file$2, 13, 1, 359);
    			attr_dev(div3, "class", "left col s6 fs marg green right-align svelte-e7mr2s");
    			add_location(div3, file$2, 14, 1, 471);
    			attr_dev(div4, "class", "row s12");
    			add_location(div4, file$2, 9, 0, 99);

    			dispose = [
    				listen_dev(div0, "mousemove", /*mousemove_handler*/ ctx[1], false, false, false),
    				listen_dev(div1, "mousemove", /*mousemove_handler_1*/ ctx[2], false, false, false),
    				listen_dev(div2, "mousemove", /*mousemove_handler_2*/ ctx[3], false, false, false),
    				listen_dev(div3, "mousemove", /*mousemove_handler_3*/ ctx[4], false, false, false)
    			];
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div4, anchor);
    			append_dev(div4, div0);
    			append_dev(div0, t0);
    			append_dev(div4, t1);
    			append_dev(div4, div1);
    			append_dev(div1, t2);
    			append_dev(div1, t3);
    			append_dev(div4, t4);
    			append_dev(div4, div2);
    			append_dev(div2, t5);
    			append_dev(div4, t6);
    			append_dev(div4, div3);
    			append_dev(div3, t7);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*data*/ 1 && t0_value !== (t0_value = /*data*/ ctx[0].score + "")) set_data_dev(t0, t0_value);
    			if (dirty & /*data*/ 1 && t2_value !== (t2_value = /*data*/ ctx[0].undos + "")) set_data_dev(t2, t2_value);
    			if (dirty & /*data*/ 1 && t5_value !== (t5_value = /*data*/ ctx[0].optimum + "")) set_data_dev(t5, t5_value);
    			if (dirty & /*data*/ 1 && t7_value !== (t7_value = (/*data*/ ctx[0].stopp - /*data*/ ctx[0].start) / 1000 + "")) set_data_dev(t7, t7_value);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div4);
    			run_all(dispose);
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
    	let { data } = $$props;
    	const writable_props = ["data"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Statistics> was created with unknown prop '${key}'`);
    	});

    	const mousemove_handler = () => data.mm("score");
    	const mousemove_handler_1 = () => data.mm("undos");
    	const mousemove_handler_2 = () => data.mm("optimum");
    	const mousemove_handler_3 = () => data.mm("time");

    	$$self.$set = $$props => {
    		if ("data" in $$props) $$invalidate(0, data = $$props.data);
    	};

    	$$self.$capture_state = () => {
    		return { data };
    	};

    	$$self.$inject_state = $$props => {
    		if ("data" in $$props) $$invalidate(0, data = $$props.data);
    	};

    	return [
    		data,
    		mousemove_handler,
    		mousemove_handler_1,
    		mousemove_handler_2,
    		mousemove_handler_3
    	];
    }

    class Statistics extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { data: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Statistics",
    			options,
    			id: create_fragment$2.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || ({});

    		if (/*data*/ ctx[0] === undefined && !("data" in props)) {
    			console.warn("<Statistics> was created without expected prop 'data'");
    		}
    	}

    	get data() {
    		throw new Error("<Statistics>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set data(value) {
    		throw new Error("<Statistics>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /**
     * lodash (Custom Build) <https://lodash.com/>
     * Build: `lodash modularize exports="npm" -o ./`
     * Copyright jQuery Foundation and other contributors <https://jquery.org/>
     * Released under MIT license <https://lodash.com/license>
     * Based on Underscore.js 1.8.3 <http://underscorejs.org/LICENSE>
     * Copyright Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
     */

    /** Used as references for various `Number` constants. */
    var INFINITY = 1 / 0,
        MAX_SAFE_INTEGER = 9007199254740991,
        MAX_INTEGER = 1.7976931348623157e+308,
        NAN = 0 / 0;

    /** `Object#toString` result references. */
    var funcTag = '[object Function]',
        genTag = '[object GeneratorFunction]',
        symbolTag = '[object Symbol]';

    /** Used to match leading and trailing whitespace. */
    var reTrim = /^\s+|\s+$/g;

    /** Used to detect bad signed hexadecimal string values. */
    var reIsBadHex = /^[-+]0x[0-9a-f]+$/i;

    /** Used to detect binary string values. */
    var reIsBinary = /^0b[01]+$/i;

    /** Used to detect octal string values. */
    var reIsOctal = /^0o[0-7]+$/i;

    /** Used to detect unsigned integer values. */
    var reIsUint = /^(?:0|[1-9]\d*)$/;

    /** Built-in method references without a dependency on `root`. */
    var freeParseInt = parseInt;

    /** Used for built-in method references. */
    var objectProto = Object.prototype;

    /**
     * Used to resolve the
     * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
     * of values.
     */
    var objectToString = objectProto.toString;

    /* Built-in method references for those with the same name as other `lodash` methods. */
    var nativeCeil = Math.ceil,
        nativeMax = Math.max;

    /**
     * The base implementation of `_.range` and `_.rangeRight` which doesn't
     * coerce arguments.
     *
     * @private
     * @param {number} start The start of the range.
     * @param {number} end The end of the range.
     * @param {number} step The value to increment or decrement by.
     * @param {boolean} [fromRight] Specify iterating from right to left.
     * @returns {Array} Returns the range of numbers.
     */
    function baseRange(start, end, step, fromRight) {
      var index = -1,
          length = nativeMax(nativeCeil((end - start) / (step || 1)), 0),
          result = Array(length);

      while (length--) {
        result[fromRight ? length : ++index] = start;
        start += step;
      }
      return result;
    }

    /**
     * Creates a `_.range` or `_.rangeRight` function.
     *
     * @private
     * @param {boolean} [fromRight] Specify iterating from right to left.
     * @returns {Function} Returns the new range function.
     */
    function createRange(fromRight) {
      return function(start, end, step) {
        if (step && typeof step != 'number' && isIterateeCall(start, end, step)) {
          end = step = undefined;
        }
        // Ensure the sign of `-0` is preserved.
        start = toFinite(start);
        if (end === undefined) {
          end = start;
          start = 0;
        } else {
          end = toFinite(end);
        }
        step = step === undefined ? (start < end ? 1 : -1) : toFinite(step);
        return baseRange(start, end, step, fromRight);
      };
    }

    /**
     * Checks if `value` is a valid array-like index.
     *
     * @private
     * @param {*} value The value to check.
     * @param {number} [length=MAX_SAFE_INTEGER] The upper bounds of a valid index.
     * @returns {boolean} Returns `true` if `value` is a valid index, else `false`.
     */
    function isIndex(value, length) {
      length = length == null ? MAX_SAFE_INTEGER : length;
      return !!length &&
        (typeof value == 'number' || reIsUint.test(value)) &&
        (value > -1 && value % 1 == 0 && value < length);
    }

    /**
     * Checks if the given arguments are from an iteratee call.
     *
     * @private
     * @param {*} value The potential iteratee value argument.
     * @param {*} index The potential iteratee index or key argument.
     * @param {*} object The potential iteratee object argument.
     * @returns {boolean} Returns `true` if the arguments are from an iteratee call,
     *  else `false`.
     */
    function isIterateeCall(value, index, object) {
      if (!isObject(object)) {
        return false;
      }
      var type = typeof index;
      if (type == 'number'
            ? (isArrayLike(object) && isIndex(index, object.length))
            : (type == 'string' && index in object)
          ) {
        return eq(object[index], value);
      }
      return false;
    }

    /**
     * Performs a
     * [`SameValueZero`](http://ecma-international.org/ecma-262/7.0/#sec-samevaluezero)
     * comparison between two values to determine if they are equivalent.
     *
     * @static
     * @memberOf _
     * @since 4.0.0
     * @category Lang
     * @param {*} value The value to compare.
     * @param {*} other The other value to compare.
     * @returns {boolean} Returns `true` if the values are equivalent, else `false`.
     * @example
     *
     * var object = { 'a': 1 };
     * var other = { 'a': 1 };
     *
     * _.eq(object, object);
     * // => true
     *
     * _.eq(object, other);
     * // => false
     *
     * _.eq('a', 'a');
     * // => true
     *
     * _.eq('a', Object('a'));
     * // => false
     *
     * _.eq(NaN, NaN);
     * // => true
     */
    function eq(value, other) {
      return value === other || (value !== value && other !== other);
    }

    /**
     * Checks if `value` is array-like. A value is considered array-like if it's
     * not a function and has a `value.length` that's an integer greater than or
     * equal to `0` and less than or equal to `Number.MAX_SAFE_INTEGER`.
     *
     * @static
     * @memberOf _
     * @since 4.0.0
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is array-like, else `false`.
     * @example
     *
     * _.isArrayLike([1, 2, 3]);
     * // => true
     *
     * _.isArrayLike(document.body.children);
     * // => true
     *
     * _.isArrayLike('abc');
     * // => true
     *
     * _.isArrayLike(_.noop);
     * // => false
     */
    function isArrayLike(value) {
      return value != null && isLength(value.length) && !isFunction(value);
    }

    /**
     * Checks if `value` is classified as a `Function` object.
     *
     * @static
     * @memberOf _
     * @since 0.1.0
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is a function, else `false`.
     * @example
     *
     * _.isFunction(_);
     * // => true
     *
     * _.isFunction(/abc/);
     * // => false
     */
    function isFunction(value) {
      // The use of `Object#toString` avoids issues with the `typeof` operator
      // in Safari 8-9 which returns 'object' for typed array and other constructors.
      var tag = isObject(value) ? objectToString.call(value) : '';
      return tag == funcTag || tag == genTag;
    }

    /**
     * Checks if `value` is a valid array-like length.
     *
     * **Note:** This method is loosely based on
     * [`ToLength`](http://ecma-international.org/ecma-262/7.0/#sec-tolength).
     *
     * @static
     * @memberOf _
     * @since 4.0.0
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is a valid length, else `false`.
     * @example
     *
     * _.isLength(3);
     * // => true
     *
     * _.isLength(Number.MIN_VALUE);
     * // => false
     *
     * _.isLength(Infinity);
     * // => false
     *
     * _.isLength('3');
     * // => false
     */
    function isLength(value) {
      return typeof value == 'number' &&
        value > -1 && value % 1 == 0 && value <= MAX_SAFE_INTEGER;
    }

    /**
     * Checks if `value` is the
     * [language type](http://www.ecma-international.org/ecma-262/7.0/#sec-ecmascript-language-types)
     * of `Object`. (e.g. arrays, functions, objects, regexes, `new Number(0)`, and `new String('')`)
     *
     * @static
     * @memberOf _
     * @since 0.1.0
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is an object, else `false`.
     * @example
     *
     * _.isObject({});
     * // => true
     *
     * _.isObject([1, 2, 3]);
     * // => true
     *
     * _.isObject(_.noop);
     * // => true
     *
     * _.isObject(null);
     * // => false
     */
    function isObject(value) {
      var type = typeof value;
      return !!value && (type == 'object' || type == 'function');
    }

    /**
     * Checks if `value` is object-like. A value is object-like if it's not `null`
     * and has a `typeof` result of "object".
     *
     * @static
     * @memberOf _
     * @since 4.0.0
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is object-like, else `false`.
     * @example
     *
     * _.isObjectLike({});
     * // => true
     *
     * _.isObjectLike([1, 2, 3]);
     * // => true
     *
     * _.isObjectLike(_.noop);
     * // => false
     *
     * _.isObjectLike(null);
     * // => false
     */
    function isObjectLike(value) {
      return !!value && typeof value == 'object';
    }

    /**
     * Checks if `value` is classified as a `Symbol` primitive or object.
     *
     * @static
     * @memberOf _
     * @since 4.0.0
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is a symbol, else `false`.
     * @example
     *
     * _.isSymbol(Symbol.iterator);
     * // => true
     *
     * _.isSymbol('abc');
     * // => false
     */
    function isSymbol(value) {
      return typeof value == 'symbol' ||
        (isObjectLike(value) && objectToString.call(value) == symbolTag);
    }

    /**
     * Converts `value` to a finite number.
     *
     * @static
     * @memberOf _
     * @since 4.12.0
     * @category Lang
     * @param {*} value The value to convert.
     * @returns {number} Returns the converted number.
     * @example
     *
     * _.toFinite(3.2);
     * // => 3.2
     *
     * _.toFinite(Number.MIN_VALUE);
     * // => 5e-324
     *
     * _.toFinite(Infinity);
     * // => 1.7976931348623157e+308
     *
     * _.toFinite('3.2');
     * // => 3.2
     */
    function toFinite(value) {
      if (!value) {
        return value === 0 ? value : 0;
      }
      value = toNumber(value);
      if (value === INFINITY || value === -INFINITY) {
        var sign = (value < 0 ? -1 : 1);
        return sign * MAX_INTEGER;
      }
      return value === value ? value : 0;
    }

    /**
     * Converts `value` to a number.
     *
     * @static
     * @memberOf _
     * @since 4.0.0
     * @category Lang
     * @param {*} value The value to process.
     * @returns {number} Returns the number.
     * @example
     *
     * _.toNumber(3.2);
     * // => 3.2
     *
     * _.toNumber(Number.MIN_VALUE);
     * // => 5e-324
     *
     * _.toNumber(Infinity);
     * // => Infinity
     *
     * _.toNumber('3.2');
     * // => 3.2
     */
    function toNumber(value) {
      if (typeof value == 'number') {
        return value;
      }
      if (isSymbol(value)) {
        return NAN;
      }
      if (isObject(value)) {
        var other = typeof value.valueOf == 'function' ? value.valueOf() : value;
        value = isObject(other) ? (other + '') : other;
      }
      if (typeof value != 'string') {
        return value === 0 ? value : +value;
      }
      value = value.replace(reTrim, '');
      var isBinary = reIsBinary.test(value);
      return (isBinary || reIsOctal.test(value))
        ? freeParseInt(value.slice(2), isBinary ? 2 : 8)
        : (reIsBadHex.test(value) ? NAN : +value);
    }

    /**
     * Creates an array of numbers (positive and/or negative) progressing from
     * `start` up to, but not including, `end`. A step of `-1` is used if a negative
     * `start` is specified without an `end` or `step`. If `end` is not specified,
     * it's set to `start` with `start` then set to `0`.
     *
     * **Note:** JavaScript follows the IEEE-754 standard for resolving
     * floating-point values which can produce unexpected results.
     *
     * @static
     * @since 0.1.0
     * @memberOf _
     * @category Util
     * @param {number} [start=0] The start of the range.
     * @param {number} end The end of the range.
     * @param {number} [step=1] The value to increment or decrement by.
     * @returns {Array} Returns the range of numbers.
     * @see _.inRange, _.rangeRight
     * @example
     *
     * _.range(4);
     * // => [0, 1, 2, 3]
     *
     * _.range(-4);
     * // => [0, -1, -2, -3]
     *
     * _.range(1, 5);
     * // => [1, 2, 3, 4]
     *
     * _.range(0, 20, 5);
     * // => [0, 5, 10, 15]
     *
     * _.range(0, -4, -1);
     * // => [0, -1, -2, -3]
     *
     * _.range(1, 4, 0);
     * // => [1, 1, 1]
     *
     * _.range(0);
     * // => []
     */
    var range = createRange();

    var lodash_range = range;

    /* src/Indicator.svelte generated by Svelte v3.16.7 */
    const file$3 = "src/Indicator.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[4] = list[i];
    	return child_ctx;
    }

    // (7:1) {#each range(data.N) as i}
    function create_each_block(ctx) {
    	let circle;
    	let circle_cx_value;
    	let circle_fill_value;
    	let dispose;

    	function mousemove_handler(...args) {
    		return /*mousemove_handler*/ ctx[2](/*i*/ ctx[4], ...args);
    	}

    	function click_handler(...args) {
    		return /*click_handler*/ ctx[3](/*i*/ ctx[4], ...args);
    	}

    	const block = {
    		c: function create() {
    			circle = svg_element("circle");
    			attr_dev(circle, "cx", circle_cx_value = 100 / /*data*/ ctx[0].N * (/*i*/ ctx[4] - /*data*/ ctx[0].N / 2 + 0.5));
    			attr_dev(circle, "cy", "0");
    			attr_dev(circle, "r", "1.5");

    			attr_dev(circle, "fill", circle_fill_value = /*i*/ ctx[4] == /*index*/ ctx[1]
    			? "white"
    			: /*data*/ ctx[0].cand[/*i*/ ctx[4]].a == /*data*/ ctx[0].cand[/*i*/ ctx[4]].b
    				? "green"
    				: "black");

    			add_location(circle, file$3, 7, 2, 174);

    			dispose = [
    				listen_dev(circle, "mousemove", mousemove_handler, false, false, false),
    				listen_dev(circle, "click", click_handler, false, false, false)
    			];
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, circle, anchor);
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty & /*data*/ 1 && circle_cx_value !== (circle_cx_value = 100 / /*data*/ ctx[0].N * (/*i*/ ctx[4] - /*data*/ ctx[0].N / 2 + 0.5))) {
    				attr_dev(circle, "cx", circle_cx_value);
    			}

    			if (dirty & /*data, index*/ 3 && circle_fill_value !== (circle_fill_value = /*i*/ ctx[4] == /*index*/ ctx[1]
    			? "white"
    			: /*data*/ ctx[0].cand[/*i*/ ctx[4]].a == /*data*/ ctx[0].cand[/*i*/ ctx[4]].b
    				? "green"
    				: "black")) {
    				attr_dev(circle, "fill", circle_fill_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(circle);
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(7:1) {#each range(data.N) as i}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let svg;
    	let each_value = lodash_range(/*data*/ ctx[0].N);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(svg, "viewBox", "-50 -2 100 4");
    			set_style(svg, "width", 100 + "%");
    			set_style(svg, "height", 100 + "%");
    			add_location(svg, file$3, 5, 0, 77);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svg, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(svg, null);
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*data, range, index*/ 3) {
    				each_value = lodash_range(/*data*/ ctx[0].N);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(svg, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(svg);
    			destroy_each(each_blocks, detaching);
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

    function instance$3($$self, $$props, $$invalidate) {
    	let { data } = $$props, { index } = $$props;
    	const writable_props = ["data", "index"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Indicator> was created with unknown prop '${key}'`);
    	});

    	const mousemove_handler = (i, evt) => data.mm("circle", i);
    	const click_handler = i => data.click(i);

    	$$self.$set = $$props => {
    		if ("data" in $$props) $$invalidate(0, data = $$props.data);
    		if ("index" in $$props) $$invalidate(1, index = $$props.index);
    	};

    	$$self.$capture_state = () => {
    		return { data, index };
    	};

    	$$self.$inject_state = $$props => {
    		if ("data" in $$props) $$invalidate(0, data = $$props.data);
    		if ("index" in $$props) $$invalidate(1, index = $$props.index);
    	};

    	return [data, index, mousemove_handler, click_handler];
    }

    class Indicator extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, { data: 0, index: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Indicator",
    			options,
    			id: create_fragment$3.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || ({});

    		if (/*data*/ ctx[0] === undefined && !("data" in props)) {
    			console.warn("<Indicator> was created without expected prop 'data'");
    		}

    		if (/*index*/ ctx[1] === undefined && !("index" in props)) {
    			console.warn("<Indicator> was created without expected prop 'index'");
    		}
    	}

    	get data() {
    		throw new Error("<Indicator>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set data(value) {
    		throw new Error("<Indicator>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get index() {
    		throw new Error("<Indicator>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set index(value) {
    		throw new Error("<Indicator>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/Shortcut.svelte generated by Svelte v3.16.7 */
    const file$4 = "src/Shortcut.svelte";

    function create_fragment$4(ctx) {
    	let div;
    	let updating_data;
    	let updating_curr;
    	let updating_index;
    	let t0;
    	let updating_data_1;
    	let updating_curr_1;
    	let t1;
    	let updating_data_2;
    	let t2;
    	let updating_data_3;
    	let updating_index_1;
    	let div_class_value;
    	let current;

    	function navigation_data_binding(value) {
    		/*navigation_data_binding*/ ctx[4].call(null, value);
    	}

    	function navigation_curr_binding(value_1) {
    		/*navigation_curr_binding*/ ctx[5].call(null, value_1);
    	}

    	function navigation_index_binding(value_2) {
    		/*navigation_index_binding*/ ctx[6].call(null, value_2);
    	}

    	let navigation_props = {};

    	if (/*data*/ ctx[0] !== void 0) {
    		navigation_props.data = /*data*/ ctx[0];
    	}

    	if (/*curr*/ ctx[1] !== void 0) {
    		navigation_props.curr = /*curr*/ ctx[1];
    	}

    	if (/*index*/ ctx[2] !== void 0) {
    		navigation_props.index = /*index*/ ctx[2];
    	}

    	const navigation = new Navigation({ props: navigation_props, $$inline: true });
    	binding_callbacks.push(() => bind(navigation, "data", navigation_data_binding));
    	binding_callbacks.push(() => bind(navigation, "curr", navigation_curr_binding));
    	binding_callbacks.push(() => bind(navigation, "index", navigation_index_binding));

    	function commands_data_binding(value_3) {
    		/*commands_data_binding*/ ctx[7].call(null, value_3);
    	}

    	function commands_curr_binding(value_4) {
    		/*commands_curr_binding*/ ctx[8].call(null, value_4);
    	}

    	let commands_props = {};

    	if (/*data*/ ctx[0] !== void 0) {
    		commands_props.data = /*data*/ ctx[0];
    	}

    	if (/*curr*/ ctx[1] !== void 0) {
    		commands_props.curr = /*curr*/ ctx[1];
    	}

    	const commands = new Commands({ props: commands_props, $$inline: true });
    	binding_callbacks.push(() => bind(commands, "data", commands_data_binding));
    	binding_callbacks.push(() => bind(commands, "curr", commands_curr_binding));

    	function statistics_data_binding(value_5) {
    		/*statistics_data_binding*/ ctx[9].call(null, value_5);
    	}

    	let statistics_props = {};

    	if (/*data*/ ctx[0] !== void 0) {
    		statistics_props.data = /*data*/ ctx[0];
    	}

    	const statistics = new Statistics({ props: statistics_props, $$inline: true });
    	binding_callbacks.push(() => bind(statistics, "data", statistics_data_binding));

    	function indicator_data_binding(value_6) {
    		/*indicator_data_binding*/ ctx[10].call(null, value_6);
    	}

    	function indicator_index_binding(value_7) {
    		/*indicator_index_binding*/ ctx[11].call(null, value_7);
    	}

    	let indicator_props = {};

    	if (/*data*/ ctx[0] !== void 0) {
    		indicator_props.data = /*data*/ ctx[0];
    	}

    	if (/*index*/ ctx[2] !== void 0) {
    		indicator_props.index = /*index*/ ctx[2];
    	}

    	const indicator = new Indicator({ props: indicator_props, $$inline: true });
    	binding_callbacks.push(() => bind(indicator, "data", indicator_data_binding));
    	binding_callbacks.push(() => bind(indicator, "index", indicator_index_binding));

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(navigation.$$.fragment);
    			t0 = space();
    			create_component(commands.$$.fragment);
    			t1 = space();
    			create_component(statistics.$$.fragment);
    			t2 = space();
    			create_component(indicator.$$.fragment);
    			attr_dev(div, "class", div_class_value = "w row s12 br fs marg " + /*bgcolor*/ ctx[3] + " lighten-1 black-text center-align" + " svelte-1lrfqle");
    			add_location(div, file$4, 20, 0, 407);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(navigation, div, null);
    			append_dev(div, t0);
    			mount_component(commands, div, null);
    			append_dev(div, t1);
    			mount_component(statistics, div, null);
    			append_dev(div, t2);
    			mount_component(indicator, div, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const navigation_changes = {};

    			if (!updating_data && dirty & /*data*/ 1) {
    				updating_data = true;
    				navigation_changes.data = /*data*/ ctx[0];
    				add_flush_callback(() => updating_data = false);
    			}

    			if (!updating_curr && dirty & /*curr*/ 2) {
    				updating_curr = true;
    				navigation_changes.curr = /*curr*/ ctx[1];
    				add_flush_callback(() => updating_curr = false);
    			}

    			if (!updating_index && dirty & /*index*/ 4) {
    				updating_index = true;
    				navigation_changes.index = /*index*/ ctx[2];
    				add_flush_callback(() => updating_index = false);
    			}

    			navigation.$set(navigation_changes);
    			const commands_changes = {};

    			if (!updating_data_1 && dirty & /*data*/ 1) {
    				updating_data_1 = true;
    				commands_changes.data = /*data*/ ctx[0];
    				add_flush_callback(() => updating_data_1 = false);
    			}

    			if (!updating_curr_1 && dirty & /*curr*/ 2) {
    				updating_curr_1 = true;
    				commands_changes.curr = /*curr*/ ctx[1];
    				add_flush_callback(() => updating_curr_1 = false);
    			}

    			commands.$set(commands_changes);
    			const statistics_changes = {};

    			if (!updating_data_2 && dirty & /*data*/ 1) {
    				updating_data_2 = true;
    				statistics_changes.data = /*data*/ ctx[0];
    				add_flush_callback(() => updating_data_2 = false);
    			}

    			statistics.$set(statistics_changes);
    			const indicator_changes = {};

    			if (!updating_data_3 && dirty & /*data*/ 1) {
    				updating_data_3 = true;
    				indicator_changes.data = /*data*/ ctx[0];
    				add_flush_callback(() => updating_data_3 = false);
    			}

    			if (!updating_index_1 && dirty & /*index*/ 4) {
    				updating_index_1 = true;
    				indicator_changes.index = /*index*/ ctx[2];
    				add_flush_callback(() => updating_index_1 = false);
    			}

    			indicator.$set(indicator_changes);

    			if (!current || dirty & /*bgcolor*/ 8 && div_class_value !== (div_class_value = "w row s12 br fs marg " + /*bgcolor*/ ctx[3] + " lighten-1 black-text center-align" + " svelte-1lrfqle")) {
    				attr_dev(div, "class", div_class_value);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(navigation.$$.fragment, local);
    			transition_in(commands.$$.fragment, local);
    			transition_in(statistics.$$.fragment, local);
    			transition_in(indicator.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(navigation.$$.fragment, local);
    			transition_out(commands.$$.fragment, local);
    			transition_out(statistics.$$.fragment, local);
    			transition_out(indicator.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(navigation);
    			destroy_component(commands);
    			destroy_component(statistics);
    			destroy_component(indicator);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let { data } = $$props, { curr } = $$props, { index } = $$props;
    	const writable_props = ["data", "curr", "index"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Shortcut> was created with unknown prop '${key}'`);
    	});

    	function navigation_data_binding(value) {
    		data = value;
    		$$invalidate(0, data);
    	}

    	function navigation_curr_binding(value_1) {
    		curr = value_1;
    		$$invalidate(1, curr);
    	}

    	function navigation_index_binding(value_2) {
    		index = value_2;
    		$$invalidate(2, index);
    	}

    	function commands_data_binding(value_3) {
    		data = value_3;
    		$$invalidate(0, data);
    	}

    	function commands_curr_binding(value_4) {
    		curr = value_4;
    		$$invalidate(1, curr);
    	}

    	function statistics_data_binding(value_5) {
    		data = value_5;
    		$$invalidate(0, data);
    	}

    	function indicator_data_binding(value_6) {
    		data = value_6;
    		$$invalidate(0, data);
    	}

    	function indicator_index_binding(value_7) {
    		index = value_7;
    		$$invalidate(2, index);
    	}

    	$$self.$set = $$props => {
    		if ("data" in $$props) $$invalidate(0, data = $$props.data);
    		if ("curr" in $$props) $$invalidate(1, curr = $$props.curr);
    		if ("index" in $$props) $$invalidate(2, index = $$props.index);
    	};

    	$$self.$capture_state = () => {
    		return { data, curr, index, bgcolor };
    	};

    	$$self.$inject_state = $$props => {
    		if ("data" in $$props) $$invalidate(0, data = $$props.data);
    		if ("curr" in $$props) $$invalidate(1, curr = $$props.curr);
    		if ("index" in $$props) $$invalidate(2, index = $$props.index);
    		if ("bgcolor" in $$props) $$invalidate(3, bgcolor = $$props.bgcolor);
    	};

    	let bgcolor;

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*curr*/ 2) {
    			 $$invalidate(3, bgcolor = curr.a == curr.b ? "green" : "grey");
    		}
    	};

    	return [
    		data,
    		curr,
    		index,
    		bgcolor,
    		navigation_data_binding,
    		navigation_curr_binding,
    		navigation_index_binding,
    		commands_data_binding,
    		commands_curr_binding,
    		statistics_data_binding,
    		indicator_data_binding,
    		indicator_index_binding
    	];
    }

    class Shortcut extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, { data: 0, curr: 1, index: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Shortcut",
    			options,
    			id: create_fragment$4.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || ({});

    		if (/*data*/ ctx[0] === undefined && !("data" in props)) {
    			console.warn("<Shortcut> was created without expected prop 'data'");
    		}

    		if (/*curr*/ ctx[1] === undefined && !("curr" in props)) {
    			console.warn("<Shortcut> was created without expected prop 'curr'");
    		}

    		if (/*index*/ ctx[2] === undefined && !("index" in props)) {
    			console.warn("<Shortcut> was created without expected prop 'index'");
    		}
    	}

    	get data() {
    		throw new Error("<Shortcut>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set data(value) {
    		throw new Error("<Shortcut>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get curr() {
    		throw new Error("<Shortcut>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set curr(value) {
    		throw new Error("<Shortcut>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get index() {
    		throw new Error("<Shortcut>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set index(value) {
    		throw new Error("<Shortcut>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /**
     * lodash (Custom Build) <https://lodash.com/>
     * Build: `lodash modularize exports="npm" -o ./`
     * Copyright jQuery Foundation and other contributors <https://jquery.org/>
     * Released under MIT license <https://lodash.com/license>
     * Based on Underscore.js 1.8.3 <http://underscorejs.org/LICENSE>
     * Copyright Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
     */

    /** Used as references for various `Number` constants. */
    var INFINITY$1 = 1 / 0,
        MAX_SAFE_INTEGER$1 = 9007199254740991,
        MAX_INTEGER$1 = 1.7976931348623157e+308,
        NAN$1 = 0 / 0;

    /** `Object#toString` result references. */
    var funcTag$1 = '[object Function]',
        genTag$1 = '[object GeneratorFunction]',
        symbolTag$1 = '[object Symbol]';

    /** Used to match leading and trailing whitespace. */
    var reTrim$1 = /^\s+|\s+$/g;

    /** Used to detect bad signed hexadecimal string values. */
    var reIsBadHex$1 = /^[-+]0x[0-9a-f]+$/i;

    /** Used to detect binary string values. */
    var reIsBinary$1 = /^0b[01]+$/i;

    /** Used to detect octal string values. */
    var reIsOctal$1 = /^0o[0-7]+$/i;

    /** Used to detect unsigned integer values. */
    var reIsUint$1 = /^(?:0|[1-9]\d*)$/;

    /** Built-in method references without a dependency on `root`. */
    var freeParseFloat = parseFloat,
        freeParseInt$1 = parseInt;

    /** Used for built-in method references. */
    var objectProto$1 = Object.prototype;

    /**
     * Used to resolve the
     * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
     * of values.
     */
    var objectToString$1 = objectProto$1.toString;

    /* Built-in method references for those with the same name as other `lodash` methods. */
    var nativeFloor = Math.floor,
        nativeMin = Math.min,
        nativeRandom = Math.random;

    /**
     * The base implementation of `_.random` without support for returning
     * floating-point numbers.
     *
     * @private
     * @param {number} lower The lower bound.
     * @param {number} upper The upper bound.
     * @returns {number} Returns the random number.
     */
    function baseRandom(lower, upper) {
      return lower + nativeFloor(nativeRandom() * (upper - lower + 1));
    }

    /**
     * Checks if `value` is a valid array-like index.
     *
     * @private
     * @param {*} value The value to check.
     * @param {number} [length=MAX_SAFE_INTEGER] The upper bounds of a valid index.
     * @returns {boolean} Returns `true` if `value` is a valid index, else `false`.
     */
    function isIndex$1(value, length) {
      length = length == null ? MAX_SAFE_INTEGER$1 : length;
      return !!length &&
        (typeof value == 'number' || reIsUint$1.test(value)) &&
        (value > -1 && value % 1 == 0 && value < length);
    }

    /**
     * Checks if the given arguments are from an iteratee call.
     *
     * @private
     * @param {*} value The potential iteratee value argument.
     * @param {*} index The potential iteratee index or key argument.
     * @param {*} object The potential iteratee object argument.
     * @returns {boolean} Returns `true` if the arguments are from an iteratee call,
     *  else `false`.
     */
    function isIterateeCall$1(value, index, object) {
      if (!isObject$1(object)) {
        return false;
      }
      var type = typeof index;
      if (type == 'number'
            ? (isArrayLike$1(object) && isIndex$1(index, object.length))
            : (type == 'string' && index in object)
          ) {
        return eq$1(object[index], value);
      }
      return false;
    }

    /**
     * Performs a
     * [`SameValueZero`](http://ecma-international.org/ecma-262/7.0/#sec-samevaluezero)
     * comparison between two values to determine if they are equivalent.
     *
     * @static
     * @memberOf _
     * @since 4.0.0
     * @category Lang
     * @param {*} value The value to compare.
     * @param {*} other The other value to compare.
     * @returns {boolean} Returns `true` if the values are equivalent, else `false`.
     * @example
     *
     * var object = { 'a': 1 };
     * var other = { 'a': 1 };
     *
     * _.eq(object, object);
     * // => true
     *
     * _.eq(object, other);
     * // => false
     *
     * _.eq('a', 'a');
     * // => true
     *
     * _.eq('a', Object('a'));
     * // => false
     *
     * _.eq(NaN, NaN);
     * // => true
     */
    function eq$1(value, other) {
      return value === other || (value !== value && other !== other);
    }

    /**
     * Checks if `value` is array-like. A value is considered array-like if it's
     * not a function and has a `value.length` that's an integer greater than or
     * equal to `0` and less than or equal to `Number.MAX_SAFE_INTEGER`.
     *
     * @static
     * @memberOf _
     * @since 4.0.0
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is array-like, else `false`.
     * @example
     *
     * _.isArrayLike([1, 2, 3]);
     * // => true
     *
     * _.isArrayLike(document.body.children);
     * // => true
     *
     * _.isArrayLike('abc');
     * // => true
     *
     * _.isArrayLike(_.noop);
     * // => false
     */
    function isArrayLike$1(value) {
      return value != null && isLength$1(value.length) && !isFunction$1(value);
    }

    /**
     * Checks if `value` is classified as a `Function` object.
     *
     * @static
     * @memberOf _
     * @since 0.1.0
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is a function, else `false`.
     * @example
     *
     * _.isFunction(_);
     * // => true
     *
     * _.isFunction(/abc/);
     * // => false
     */
    function isFunction$1(value) {
      // The use of `Object#toString` avoids issues with the `typeof` operator
      // in Safari 8-9 which returns 'object' for typed array and other constructors.
      var tag = isObject$1(value) ? objectToString$1.call(value) : '';
      return tag == funcTag$1 || tag == genTag$1;
    }

    /**
     * Checks if `value` is a valid array-like length.
     *
     * **Note:** This method is loosely based on
     * [`ToLength`](http://ecma-international.org/ecma-262/7.0/#sec-tolength).
     *
     * @static
     * @memberOf _
     * @since 4.0.0
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is a valid length, else `false`.
     * @example
     *
     * _.isLength(3);
     * // => true
     *
     * _.isLength(Number.MIN_VALUE);
     * // => false
     *
     * _.isLength(Infinity);
     * // => false
     *
     * _.isLength('3');
     * // => false
     */
    function isLength$1(value) {
      return typeof value == 'number' &&
        value > -1 && value % 1 == 0 && value <= MAX_SAFE_INTEGER$1;
    }

    /**
     * Checks if `value` is the
     * [language type](http://www.ecma-international.org/ecma-262/7.0/#sec-ecmascript-language-types)
     * of `Object`. (e.g. arrays, functions, objects, regexes, `new Number(0)`, and `new String('')`)
     *
     * @static
     * @memberOf _
     * @since 0.1.0
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is an object, else `false`.
     * @example
     *
     * _.isObject({});
     * // => true
     *
     * _.isObject([1, 2, 3]);
     * // => true
     *
     * _.isObject(_.noop);
     * // => true
     *
     * _.isObject(null);
     * // => false
     */
    function isObject$1(value) {
      var type = typeof value;
      return !!value && (type == 'object' || type == 'function');
    }

    /**
     * Checks if `value` is object-like. A value is object-like if it's not `null`
     * and has a `typeof` result of "object".
     *
     * @static
     * @memberOf _
     * @since 4.0.0
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is object-like, else `false`.
     * @example
     *
     * _.isObjectLike({});
     * // => true
     *
     * _.isObjectLike([1, 2, 3]);
     * // => true
     *
     * _.isObjectLike(_.noop);
     * // => false
     *
     * _.isObjectLike(null);
     * // => false
     */
    function isObjectLike$1(value) {
      return !!value && typeof value == 'object';
    }

    /**
     * Checks if `value` is classified as a `Symbol` primitive or object.
     *
     * @static
     * @memberOf _
     * @since 4.0.0
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is a symbol, else `false`.
     * @example
     *
     * _.isSymbol(Symbol.iterator);
     * // => true
     *
     * _.isSymbol('abc');
     * // => false
     */
    function isSymbol$1(value) {
      return typeof value == 'symbol' ||
        (isObjectLike$1(value) && objectToString$1.call(value) == symbolTag$1);
    }

    /**
     * Converts `value` to a finite number.
     *
     * @static
     * @memberOf _
     * @since 4.12.0
     * @category Lang
     * @param {*} value The value to convert.
     * @returns {number} Returns the converted number.
     * @example
     *
     * _.toFinite(3.2);
     * // => 3.2
     *
     * _.toFinite(Number.MIN_VALUE);
     * // => 5e-324
     *
     * _.toFinite(Infinity);
     * // => 1.7976931348623157e+308
     *
     * _.toFinite('3.2');
     * // => 3.2
     */
    function toFinite$1(value) {
      if (!value) {
        return value === 0 ? value : 0;
      }
      value = toNumber$1(value);
      if (value === INFINITY$1 || value === -INFINITY$1) {
        var sign = (value < 0 ? -1 : 1);
        return sign * MAX_INTEGER$1;
      }
      return value === value ? value : 0;
    }

    /**
     * Converts `value` to a number.
     *
     * @static
     * @memberOf _
     * @since 4.0.0
     * @category Lang
     * @param {*} value The value to process.
     * @returns {number} Returns the number.
     * @example
     *
     * _.toNumber(3.2);
     * // => 3.2
     *
     * _.toNumber(Number.MIN_VALUE);
     * // => 5e-324
     *
     * _.toNumber(Infinity);
     * // => Infinity
     *
     * _.toNumber('3.2');
     * // => 3.2
     */
    function toNumber$1(value) {
      if (typeof value == 'number') {
        return value;
      }
      if (isSymbol$1(value)) {
        return NAN$1;
      }
      if (isObject$1(value)) {
        var other = typeof value.valueOf == 'function' ? value.valueOf() : value;
        value = isObject$1(other) ? (other + '') : other;
      }
      if (typeof value != 'string') {
        return value === 0 ? value : +value;
      }
      value = value.replace(reTrim$1, '');
      var isBinary = reIsBinary$1.test(value);
      return (isBinary || reIsOctal$1.test(value))
        ? freeParseInt$1(value.slice(2), isBinary ? 2 : 8)
        : (reIsBadHex$1.test(value) ? NAN$1 : +value);
    }

    /**
     * Produces a random number between the inclusive `lower` and `upper` bounds.
     * If only one argument is provided a number between `0` and the given number
     * is returned. If `floating` is `true`, or either `lower` or `upper` are
     * floats, a floating-point number is returned instead of an integer.
     *
     * **Note:** JavaScript follows the IEEE-754 standard for resolving
     * floating-point values which can produce unexpected results.
     *
     * @static
     * @memberOf _
     * @since 0.7.0
     * @category Number
     * @param {number} [lower=0] The lower bound.
     * @param {number} [upper=1] The upper bound.
     * @param {boolean} [floating] Specify returning a floating-point number.
     * @returns {number} Returns the random number.
     * @example
     *
     * _.random(0, 5);
     * // => an integer between 0 and 5
     *
     * _.random(5);
     * // => also an integer between 0 and 5
     *
     * _.random(5, true);
     * // => a floating-point number between 0 and 5
     *
     * _.random(1.2, 5.2);
     * // => a floating-point number between 1.2 and 5.2
     */
    function random(lower, upper, floating) {
      if (floating && typeof floating != 'boolean' && isIterateeCall$1(lower, upper, floating)) {
        upper = floating = undefined;
      }
      if (floating === undefined) {
        if (typeof upper == 'boolean') {
          floating = upper;
          upper = undefined;
        }
        else if (typeof lower == 'boolean') {
          floating = lower;
          lower = undefined;
        }
      }
      if (lower === undefined && upper === undefined) {
        lower = 0;
        upper = 1;
      }
      else {
        lower = toFinite$1(lower);
        if (upper === undefined) {
          upper = lower;
          lower = 0;
        } else {
          upper = toFinite$1(upper);
        }
      }
      if (lower > upper) {
        var temp = lower;
        lower = upper;
        upper = temp;
      }
      if (floating || lower % 1 || upper % 1) {
        var rand = nativeRandom();
        return nativeMin(lower + (rand * (upper - lower + freeParseFloat('1e-' + ((rand + '').length - 1)))), upper);
      }
      return baseRandom(lower, upper);
    }

    var lodash_random = random;

    /**
     * lodash (Custom Build) <https://lodash.com/>
     * Build: `lodash modularize exports="npm" -o ./`
     * Copyright jQuery Foundation and other contributors <https://jquery.org/>
     * Released under MIT license <https://lodash.com/license>
     * Based on Underscore.js 1.8.3 <http://underscorejs.org/LICENSE>
     * Copyright Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
     */

    /** Used as references for various `Number` constants. */
    var MAX_SAFE_INTEGER$2 = 9007199254740991;

    /** `Object#toString` result references. */
    var argsTag = '[object Arguments]',
        funcTag$2 = '[object Function]',
        genTag$2 = '[object GeneratorFunction]';

    /** Used to detect unsigned integer values. */
    var reIsUint$2 = /^(?:0|[1-9]\d*)$/;

    /**
     * A specialized version of `_.map` for arrays without support for iteratee
     * shorthands.
     *
     * @private
     * @param {Array} [array] The array to iterate over.
     * @param {Function} iteratee The function invoked per iteration.
     * @returns {Array} Returns the new mapped array.
     */
    function arrayMap(array, iteratee) {
      var index = -1,
          length = array ? array.length : 0,
          result = Array(length);

      while (++index < length) {
        result[index] = iteratee(array[index], index, array);
      }
      return result;
    }

    /**
     * The base implementation of `_.times` without support for iteratee shorthands
     * or max array length checks.
     *
     * @private
     * @param {number} n The number of times to invoke `iteratee`.
     * @param {Function} iteratee The function invoked per iteration.
     * @returns {Array} Returns the array of results.
     */
    function baseTimes(n, iteratee) {
      var index = -1,
          result = Array(n);

      while (++index < n) {
        result[index] = iteratee(index);
      }
      return result;
    }

    /**
     * The base implementation of `_.values` and `_.valuesIn` which creates an
     * array of `object` property values corresponding to the property names
     * of `props`.
     *
     * @private
     * @param {Object} object The object to query.
     * @param {Array} props The property names to get values for.
     * @returns {Object} Returns the array of property values.
     */
    function baseValues(object, props) {
      return arrayMap(props, function(key) {
        return object[key];
      });
    }

    /**
     * Creates a unary function that invokes `func` with its argument transformed.
     *
     * @private
     * @param {Function} func The function to wrap.
     * @param {Function} transform The argument transform.
     * @returns {Function} Returns the new function.
     */
    function overArg(func, transform) {
      return function(arg) {
        return func(transform(arg));
      };
    }

    /** Used for built-in method references. */
    var objectProto$2 = Object.prototype;

    /** Used to check objects for own properties. */
    var hasOwnProperty = objectProto$2.hasOwnProperty;

    /**
     * Used to resolve the
     * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
     * of values.
     */
    var objectToString$2 = objectProto$2.toString;

    /** Built-in value references. */
    var propertyIsEnumerable = objectProto$2.propertyIsEnumerable;

    /* Built-in method references for those with the same name as other `lodash` methods. */
    var nativeFloor$1 = Math.floor,
        nativeKeys = overArg(Object.keys, Object),
        nativeRandom$1 = Math.random;

    /**
     * Creates an array of the enumerable property names of the array-like `value`.
     *
     * @private
     * @param {*} value The value to query.
     * @param {boolean} inherited Specify returning inherited property names.
     * @returns {Array} Returns the array of property names.
     */
    function arrayLikeKeys(value, inherited) {
      // Safari 8.1 makes `arguments.callee` enumerable in strict mode.
      // Safari 9 makes `arguments.length` enumerable in strict mode.
      var result = (isArray(value) || isArguments(value))
        ? baseTimes(value.length, String)
        : [];

      var length = result.length,
          skipIndexes = !!length;

      for (var key in value) {
        if ((inherited || hasOwnProperty.call(value, key)) &&
            !(skipIndexes && (key == 'length' || isIndex$2(key, length)))) {
          result.push(key);
        }
      }
      return result;
    }

    /**
     * The base implementation of `_.keys` which doesn't treat sparse arrays as dense.
     *
     * @private
     * @param {Object} object The object to query.
     * @returns {Array} Returns the array of property names.
     */
    function baseKeys(object) {
      if (!isPrototype(object)) {
        return nativeKeys(object);
      }
      var result = [];
      for (var key in Object(object)) {
        if (hasOwnProperty.call(object, key) && key != 'constructor') {
          result.push(key);
        }
      }
      return result;
    }

    /**
     * The base implementation of `_.random` without support for returning
     * floating-point numbers.
     *
     * @private
     * @param {number} lower The lower bound.
     * @param {number} upper The upper bound.
     * @returns {number} Returns the random number.
     */
    function baseRandom$1(lower, upper) {
      return lower + nativeFloor$1(nativeRandom$1() * (upper - lower + 1));
    }

    /**
     * Checks if `value` is a valid array-like index.
     *
     * @private
     * @param {*} value The value to check.
     * @param {number} [length=MAX_SAFE_INTEGER] The upper bounds of a valid index.
     * @returns {boolean} Returns `true` if `value` is a valid index, else `false`.
     */
    function isIndex$2(value, length) {
      length = length == null ? MAX_SAFE_INTEGER$2 : length;
      return !!length &&
        (typeof value == 'number' || reIsUint$2.test(value)) &&
        (value > -1 && value % 1 == 0 && value < length);
    }

    /**
     * Checks if `value` is likely a prototype object.
     *
     * @private
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is a prototype, else `false`.
     */
    function isPrototype(value) {
      var Ctor = value && value.constructor,
          proto = (typeof Ctor == 'function' && Ctor.prototype) || objectProto$2;

      return value === proto;
    }

    /**
     * Gets a random element from `collection`.
     *
     * @static
     * @memberOf _
     * @since 2.0.0
     * @category Collection
     * @param {Array|Object} collection The collection to sample.
     * @returns {*} Returns the random element.
     * @example
     *
     * _.sample([1, 2, 3, 4]);
     * // => 2
     */
    function sample(collection) {
      var array = isArrayLike$2(collection) ? collection : values(collection),
          length = array.length;

      return length > 0 ? array[baseRandom$1(0, length - 1)] : undefined;
    }

    /**
     * Checks if `value` is likely an `arguments` object.
     *
     * @static
     * @memberOf _
     * @since 0.1.0
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is an `arguments` object,
     *  else `false`.
     * @example
     *
     * _.isArguments(function() { return arguments; }());
     * // => true
     *
     * _.isArguments([1, 2, 3]);
     * // => false
     */
    function isArguments(value) {
      // Safari 8.1 makes `arguments.callee` enumerable in strict mode.
      return isArrayLikeObject(value) && hasOwnProperty.call(value, 'callee') &&
        (!propertyIsEnumerable.call(value, 'callee') || objectToString$2.call(value) == argsTag);
    }

    /**
     * Checks if `value` is classified as an `Array` object.
     *
     * @static
     * @memberOf _
     * @since 0.1.0
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is an array, else `false`.
     * @example
     *
     * _.isArray([1, 2, 3]);
     * // => true
     *
     * _.isArray(document.body.children);
     * // => false
     *
     * _.isArray('abc');
     * // => false
     *
     * _.isArray(_.noop);
     * // => false
     */
    var isArray = Array.isArray;

    /**
     * Checks if `value` is array-like. A value is considered array-like if it's
     * not a function and has a `value.length` that's an integer greater than or
     * equal to `0` and less than or equal to `Number.MAX_SAFE_INTEGER`.
     *
     * @static
     * @memberOf _
     * @since 4.0.0
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is array-like, else `false`.
     * @example
     *
     * _.isArrayLike([1, 2, 3]);
     * // => true
     *
     * _.isArrayLike(document.body.children);
     * // => true
     *
     * _.isArrayLike('abc');
     * // => true
     *
     * _.isArrayLike(_.noop);
     * // => false
     */
    function isArrayLike$2(value) {
      return value != null && isLength$2(value.length) && !isFunction$2(value);
    }

    /**
     * This method is like `_.isArrayLike` except that it also checks if `value`
     * is an object.
     *
     * @static
     * @memberOf _
     * @since 4.0.0
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is an array-like object,
     *  else `false`.
     * @example
     *
     * _.isArrayLikeObject([1, 2, 3]);
     * // => true
     *
     * _.isArrayLikeObject(document.body.children);
     * // => true
     *
     * _.isArrayLikeObject('abc');
     * // => false
     *
     * _.isArrayLikeObject(_.noop);
     * // => false
     */
    function isArrayLikeObject(value) {
      return isObjectLike$2(value) && isArrayLike$2(value);
    }

    /**
     * Checks if `value` is classified as a `Function` object.
     *
     * @static
     * @memberOf _
     * @since 0.1.0
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is a function, else `false`.
     * @example
     *
     * _.isFunction(_);
     * // => true
     *
     * _.isFunction(/abc/);
     * // => false
     */
    function isFunction$2(value) {
      // The use of `Object#toString` avoids issues with the `typeof` operator
      // in Safari 8-9 which returns 'object' for typed array and other constructors.
      var tag = isObject$2(value) ? objectToString$2.call(value) : '';
      return tag == funcTag$2 || tag == genTag$2;
    }

    /**
     * Checks if `value` is a valid array-like length.
     *
     * **Note:** This method is loosely based on
     * [`ToLength`](http://ecma-international.org/ecma-262/7.0/#sec-tolength).
     *
     * @static
     * @memberOf _
     * @since 4.0.0
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is a valid length, else `false`.
     * @example
     *
     * _.isLength(3);
     * // => true
     *
     * _.isLength(Number.MIN_VALUE);
     * // => false
     *
     * _.isLength(Infinity);
     * // => false
     *
     * _.isLength('3');
     * // => false
     */
    function isLength$2(value) {
      return typeof value == 'number' &&
        value > -1 && value % 1 == 0 && value <= MAX_SAFE_INTEGER$2;
    }

    /**
     * Checks if `value` is the
     * [language type](http://www.ecma-international.org/ecma-262/7.0/#sec-ecmascript-language-types)
     * of `Object`. (e.g. arrays, functions, objects, regexes, `new Number(0)`, and `new String('')`)
     *
     * @static
     * @memberOf _
     * @since 0.1.0
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is an object, else `false`.
     * @example
     *
     * _.isObject({});
     * // => true
     *
     * _.isObject([1, 2, 3]);
     * // => true
     *
     * _.isObject(_.noop);
     * // => true
     *
     * _.isObject(null);
     * // => false
     */
    function isObject$2(value) {
      var type = typeof value;
      return !!value && (type == 'object' || type == 'function');
    }

    /**
     * Checks if `value` is object-like. A value is object-like if it's not `null`
     * and has a `typeof` result of "object".
     *
     * @static
     * @memberOf _
     * @since 4.0.0
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is object-like, else `false`.
     * @example
     *
     * _.isObjectLike({});
     * // => true
     *
     * _.isObjectLike([1, 2, 3]);
     * // => true
     *
     * _.isObjectLike(_.noop);
     * // => false
     *
     * _.isObjectLike(null);
     * // => false
     */
    function isObjectLike$2(value) {
      return !!value && typeof value == 'object';
    }

    /**
     * Creates an array of the own enumerable property names of `object`.
     *
     * **Note:** Non-object values are coerced to objects. See the
     * [ES spec](http://ecma-international.org/ecma-262/7.0/#sec-object.keys)
     * for more details.
     *
     * @static
     * @since 0.1.0
     * @memberOf _
     * @category Object
     * @param {Object} object The object to query.
     * @returns {Array} Returns the array of property names.
     * @example
     *
     * function Foo() {
     *   this.a = 1;
     *   this.b = 2;
     * }
     *
     * Foo.prototype.c = 3;
     *
     * _.keys(new Foo);
     * // => ['a', 'b'] (iteration order is not guaranteed)
     *
     * _.keys('hi');
     * // => ['0', '1']
     */
    function keys(object) {
      return isArrayLike$2(object) ? arrayLikeKeys(object) : baseKeys(object);
    }

    /**
     * Creates an array of the own enumerable string keyed property values of `object`.
     *
     * **Note:** Non-object values are coerced to objects.
     *
     * @static
     * @since 0.1.0
     * @memberOf _
     * @category Object
     * @param {Object} object The object to query.
     * @returns {Array} Returns the array of property values.
     * @example
     *
     * function Foo() {
     *   this.a = 1;
     *   this.b = 2;
     * }
     *
     * Foo.prototype.c = 3;
     *
     * _.values(new Foo);
     * // => [1, 2] (iteration order is not guaranteed)
     *
     * _.values('hi');
     * // => ['h', 'i']
     */
    function values(object) {
      return object ? baseValues(object, keys(object)) : [];
    }

    var lodash_sample = sample;

    var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

    /**
     * lodash (Custom Build) <https://lodash.com/>
     * Build: `lodash modularize exports="npm" -o ./`
     * Copyright jQuery Foundation and other contributors <https://jquery.org/>
     * Released under MIT license <https://lodash.com/license>
     * Based on Underscore.js 1.8.3 <http://underscorejs.org/LICENSE>
     * Copyright Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
     */

    /** Used as references for various `Number` constants. */
    var INFINITY$2 = 1 / 0,
        MAX_SAFE_INTEGER$3 = 9007199254740991,
        MAX_INTEGER$2 = 1.7976931348623157e+308,
        NAN$2 = 0 / 0;

    /** Used as references for the maximum length and index of an array. */
    var MAX_ARRAY_LENGTH = 4294967295;

    /** `Object#toString` result references. */
    var argsTag$1 = '[object Arguments]',
        funcTag$3 = '[object Function]',
        genTag$3 = '[object GeneratorFunction]',
        mapTag = '[object Map]',
        objectTag = '[object Object]',
        promiseTag = '[object Promise]',
        setTag = '[object Set]',
        stringTag = '[object String]',
        symbolTag$2 = '[object Symbol]',
        weakMapTag = '[object WeakMap]';

    var dataViewTag = '[object DataView]';

    /**
     * Used to match `RegExp`
     * [syntax characters](http://ecma-international.org/ecma-262/7.0/#sec-patterns).
     */
    var reRegExpChar = /[\\^$.*+?()[\]{}|]/g;

    /** Used to match leading and trailing whitespace. */
    var reTrim$2 = /^\s+|\s+$/g;

    /** Used to detect bad signed hexadecimal string values. */
    var reIsBadHex$2 = /^[-+]0x[0-9a-f]+$/i;

    /** Used to detect binary string values. */
    var reIsBinary$2 = /^0b[01]+$/i;

    /** Used to detect host constructors (Safari). */
    var reIsHostCtor = /^\[object .+?Constructor\]$/;

    /** Used to detect octal string values. */
    var reIsOctal$2 = /^0o[0-7]+$/i;

    /** Used to detect unsigned integer values. */
    var reIsUint$3 = /^(?:0|[1-9]\d*)$/;

    /** Used to compose unicode character classes. */
    var rsAstralRange = '\\ud800-\\udfff',
        rsComboMarksRange = '\\u0300-\\u036f\\ufe20-\\ufe23',
        rsComboSymbolsRange = '\\u20d0-\\u20f0',
        rsVarRange = '\\ufe0e\\ufe0f';

    /** Used to compose unicode capture groups. */
    var rsAstral = '[' + rsAstralRange + ']',
        rsCombo = '[' + rsComboMarksRange + rsComboSymbolsRange + ']',
        rsFitz = '\\ud83c[\\udffb-\\udfff]',
        rsModifier = '(?:' + rsCombo + '|' + rsFitz + ')',
        rsNonAstral = '[^' + rsAstralRange + ']',
        rsRegional = '(?:\\ud83c[\\udde6-\\uddff]){2}',
        rsSurrPair = '[\\ud800-\\udbff][\\udc00-\\udfff]',
        rsZWJ = '\\u200d';

    /** Used to compose unicode regexes. */
    var reOptMod = rsModifier + '?',
        rsOptVar = '[' + rsVarRange + ']?',
        rsOptJoin = '(?:' + rsZWJ + '(?:' + [rsNonAstral, rsRegional, rsSurrPair].join('|') + ')' + rsOptVar + reOptMod + ')*',
        rsSeq = rsOptVar + reOptMod + rsOptJoin,
        rsSymbol = '(?:' + [rsNonAstral + rsCombo + '?', rsCombo, rsRegional, rsSurrPair, rsAstral].join('|') + ')';

    /** Used to match [string symbols](https://mathiasbynens.be/notes/javascript-unicode). */
    var reUnicode = RegExp(rsFitz + '(?=' + rsFitz + ')|' + rsSymbol + rsSeq, 'g');

    /** Used to detect strings with [zero-width joiners or code points from the astral planes](http://eev.ee/blog/2015/09/12/dark-corners-of-unicode/). */
    var reHasUnicode = RegExp('[' + rsZWJ + rsAstralRange  + rsComboMarksRange + rsComboSymbolsRange + rsVarRange + ']');

    /** Built-in method references without a dependency on `root`. */
    var freeParseInt$2 = parseInt;

    /** Detect free variable `global` from Node.js. */
    var freeGlobal = typeof commonjsGlobal == 'object' && commonjsGlobal && commonjsGlobal.Object === Object && commonjsGlobal;

    /** Detect free variable `self`. */
    var freeSelf = typeof self == 'object' && self && self.Object === Object && self;

    /** Used as a reference to the global object. */
    var root = freeGlobal || freeSelf || Function('return this')();

    /**
     * A specialized version of `_.map` for arrays without support for iteratee
     * shorthands.
     *
     * @private
     * @param {Array} [array] The array to iterate over.
     * @param {Function} iteratee The function invoked per iteration.
     * @returns {Array} Returns the new mapped array.
     */
    function arrayMap$1(array, iteratee) {
      var index = -1,
          length = array ? array.length : 0,
          result = Array(length);

      while (++index < length) {
        result[index] = iteratee(array[index], index, array);
      }
      return result;
    }

    /**
     * Converts an ASCII `string` to an array.
     *
     * @private
     * @param {string} string The string to convert.
     * @returns {Array} Returns the converted array.
     */
    function asciiToArray(string) {
      return string.split('');
    }

    /**
     * The base implementation of `_.times` without support for iteratee shorthands
     * or max array length checks.
     *
     * @private
     * @param {number} n The number of times to invoke `iteratee`.
     * @param {Function} iteratee The function invoked per iteration.
     * @returns {Array} Returns the array of results.
     */
    function baseTimes$1(n, iteratee) {
      var index = -1,
          result = Array(n);

      while (++index < n) {
        result[index] = iteratee(index);
      }
      return result;
    }

    /**
     * The base implementation of `_.values` and `_.valuesIn` which creates an
     * array of `object` property values corresponding to the property names
     * of `props`.
     *
     * @private
     * @param {Object} object The object to query.
     * @param {Array} props The property names to get values for.
     * @returns {Object} Returns the array of property values.
     */
    function baseValues$1(object, props) {
      return arrayMap$1(props, function(key) {
        return object[key];
      });
    }

    /**
     * Gets the value at `key` of `object`.
     *
     * @private
     * @param {Object} [object] The object to query.
     * @param {string} key The key of the property to get.
     * @returns {*} Returns the property value.
     */
    function getValue(object, key) {
      return object == null ? undefined : object[key];
    }

    /**
     * Checks if `string` contains Unicode symbols.
     *
     * @private
     * @param {string} string The string to inspect.
     * @returns {boolean} Returns `true` if a symbol is found, else `false`.
     */
    function hasUnicode(string) {
      return reHasUnicode.test(string);
    }

    /**
     * Checks if `value` is a host object in IE < 9.
     *
     * @private
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is a host object, else `false`.
     */
    function isHostObject(value) {
      // Many host objects are `Object` objects that can coerce to strings
      // despite having improperly defined `toString` methods.
      var result = false;
      if (value != null && typeof value.toString != 'function') {
        try {
          result = !!(value + '');
        } catch (e) {}
      }
      return result;
    }

    /**
     * Converts `iterator` to an array.
     *
     * @private
     * @param {Object} iterator The iterator to convert.
     * @returns {Array} Returns the converted array.
     */
    function iteratorToArray(iterator) {
      var data,
          result = [];

      while (!(data = iterator.next()).done) {
        result.push(data.value);
      }
      return result;
    }

    /**
     * Converts `map` to its key-value pairs.
     *
     * @private
     * @param {Object} map The map to convert.
     * @returns {Array} Returns the key-value pairs.
     */
    function mapToArray(map) {
      var index = -1,
          result = Array(map.size);

      map.forEach(function(value, key) {
        result[++index] = [key, value];
      });
      return result;
    }

    /**
     * Creates a unary function that invokes `func` with its argument transformed.
     *
     * @private
     * @param {Function} func The function to wrap.
     * @param {Function} transform The argument transform.
     * @returns {Function} Returns the new function.
     */
    function overArg$1(func, transform) {
      return function(arg) {
        return func(transform(arg));
      };
    }

    /**
     * Converts `set` to an array of its values.
     *
     * @private
     * @param {Object} set The set to convert.
     * @returns {Array} Returns the values.
     */
    function setToArray(set) {
      var index = -1,
          result = Array(set.size);

      set.forEach(function(value) {
        result[++index] = value;
      });
      return result;
    }

    /**
     * Converts `string` to an array.
     *
     * @private
     * @param {string} string The string to convert.
     * @returns {Array} Returns the converted array.
     */
    function stringToArray(string) {
      return hasUnicode(string)
        ? unicodeToArray(string)
        : asciiToArray(string);
    }

    /**
     * Converts a Unicode `string` to an array.
     *
     * @private
     * @param {string} string The string to convert.
     * @returns {Array} Returns the converted array.
     */
    function unicodeToArray(string) {
      return string.match(reUnicode) || [];
    }

    /** Used for built-in method references. */
    var funcProto = Function.prototype,
        objectProto$3 = Object.prototype;

    /** Used to detect overreaching core-js shims. */
    var coreJsData = root['__core-js_shared__'];

    /** Used to detect methods masquerading as native. */
    var maskSrcKey = (function() {
      var uid = /[^.]+$/.exec(coreJsData && coreJsData.keys && coreJsData.keys.IE_PROTO || '');
      return uid ? ('Symbol(src)_1.' + uid) : '';
    }());

    /** Used to resolve the decompiled source of functions. */
    var funcToString = funcProto.toString;

    /** Used to check objects for own properties. */
    var hasOwnProperty$1 = objectProto$3.hasOwnProperty;

    /**
     * Used to resolve the
     * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
     * of values.
     */
    var objectToString$3 = objectProto$3.toString;

    /** Used to detect if a method is native. */
    var reIsNative = RegExp('^' +
      funcToString.call(hasOwnProperty$1).replace(reRegExpChar, '\\$&')
      .replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g, '$1.*?') + '$'
    );

    /** Built-in value references. */
    var Symbol = root.Symbol,
        iteratorSymbol = Symbol ? Symbol.iterator : undefined,
        propertyIsEnumerable$1 = objectProto$3.propertyIsEnumerable;

    /* Built-in method references for those with the same name as other `lodash` methods. */
    var nativeFloor$2 = Math.floor,
        nativeKeys$1 = overArg$1(Object.keys, Object),
        nativeRandom$2 = Math.random;

    /* Built-in method references that are verified to be native. */
    var DataView = getNative(root, 'DataView'),
        Map$1 = getNative(root, 'Map'),
        Promise$1 = getNative(root, 'Promise'),
        Set$1 = getNative(root, 'Set'),
        WeakMap = getNative(root, 'WeakMap');

    /** Used to detect maps, sets, and weakmaps. */
    var dataViewCtorString = toSource(DataView),
        mapCtorString = toSource(Map$1),
        promiseCtorString = toSource(Promise$1),
        setCtorString = toSource(Set$1),
        weakMapCtorString = toSource(WeakMap);

    /**
     * Creates an array of the enumerable property names of the array-like `value`.
     *
     * @private
     * @param {*} value The value to query.
     * @param {boolean} inherited Specify returning inherited property names.
     * @returns {Array} Returns the array of property names.
     */
    function arrayLikeKeys$1(value, inherited) {
      // Safari 8.1 makes `arguments.callee` enumerable in strict mode.
      // Safari 9 makes `arguments.length` enumerable in strict mode.
      var result = (isArray$1(value) || isArguments$1(value))
        ? baseTimes$1(value.length, String)
        : [];

      var length = result.length,
          skipIndexes = !!length;

      for (var key in value) {
        if ((inherited || hasOwnProperty$1.call(value, key)) &&
            !(skipIndexes && (key == 'length' || isIndex$3(key, length)))) {
          result.push(key);
        }
      }
      return result;
    }

    /**
     * The base implementation of `_.clamp` which doesn't coerce arguments.
     *
     * @private
     * @param {number} number The number to clamp.
     * @param {number} [lower] The lower bound.
     * @param {number} upper The upper bound.
     * @returns {number} Returns the clamped number.
     */
    function baseClamp(number, lower, upper) {
      if (number === number) {
        if (upper !== undefined) {
          number = number <= upper ? number : upper;
        }
        if (lower !== undefined) {
          number = number >= lower ? number : lower;
        }
      }
      return number;
    }

    /**
     * The base implementation of `getTag`.
     *
     * @private
     * @param {*} value The value to query.
     * @returns {string} Returns the `toStringTag`.
     */
    function baseGetTag(value) {
      return objectToString$3.call(value);
    }

    /**
     * The base implementation of `_.isNative` without bad shim checks.
     *
     * @private
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is a native function,
     *  else `false`.
     */
    function baseIsNative(value) {
      if (!isObject$3(value) || isMasked(value)) {
        return false;
      }
      var pattern = (isFunction$3(value) || isHostObject(value)) ? reIsNative : reIsHostCtor;
      return pattern.test(toSource(value));
    }

    /**
     * The base implementation of `_.keys` which doesn't treat sparse arrays as dense.
     *
     * @private
     * @param {Object} object The object to query.
     * @returns {Array} Returns the array of property names.
     */
    function baseKeys$1(object) {
      if (!isPrototype$1(object)) {
        return nativeKeys$1(object);
      }
      var result = [];
      for (var key in Object(object)) {
        if (hasOwnProperty$1.call(object, key) && key != 'constructor') {
          result.push(key);
        }
      }
      return result;
    }

    /**
     * The base implementation of `_.random` without support for returning
     * floating-point numbers.
     *
     * @private
     * @param {number} lower The lower bound.
     * @param {number} upper The upper bound.
     * @returns {number} Returns the random number.
     */
    function baseRandom$2(lower, upper) {
      return lower + nativeFloor$2(nativeRandom$2() * (upper - lower + 1));
    }

    /**
     * Copies the values of `source` to `array`.
     *
     * @private
     * @param {Array} source The array to copy values from.
     * @param {Array} [array=[]] The array to copy values to.
     * @returns {Array} Returns `array`.
     */
    function copyArray(source, array) {
      var index = -1,
          length = source.length;

      array || (array = Array(length));
      while (++index < length) {
        array[index] = source[index];
      }
      return array;
    }

    /**
     * Gets the native function at `key` of `object`.
     *
     * @private
     * @param {Object} object The object to query.
     * @param {string} key The key of the method to get.
     * @returns {*} Returns the function if it's native, else `undefined`.
     */
    function getNative(object, key) {
      var value = getValue(object, key);
      return baseIsNative(value) ? value : undefined;
    }

    /**
     * Gets the `toStringTag` of `value`.
     *
     * @private
     * @param {*} value The value to query.
     * @returns {string} Returns the `toStringTag`.
     */
    var getTag = baseGetTag;

    // Fallback for data views, maps, sets, and weak maps in IE 11,
    // for data views in Edge < 14, and promises in Node.js.
    if ((DataView && getTag(new DataView(new ArrayBuffer(1))) != dataViewTag) ||
        (Map$1 && getTag(new Map$1) != mapTag) ||
        (Promise$1 && getTag(Promise$1.resolve()) != promiseTag) ||
        (Set$1 && getTag(new Set$1) != setTag) ||
        (WeakMap && getTag(new WeakMap) != weakMapTag)) {
      getTag = function(value) {
        var result = objectToString$3.call(value),
            Ctor = result == objectTag ? value.constructor : undefined,
            ctorString = Ctor ? toSource(Ctor) : undefined;

        if (ctorString) {
          switch (ctorString) {
            case dataViewCtorString: return dataViewTag;
            case mapCtorString: return mapTag;
            case promiseCtorString: return promiseTag;
            case setCtorString: return setTag;
            case weakMapCtorString: return weakMapTag;
          }
        }
        return result;
      };
    }

    /**
     * Checks if `value` is a valid array-like index.
     *
     * @private
     * @param {*} value The value to check.
     * @param {number} [length=MAX_SAFE_INTEGER] The upper bounds of a valid index.
     * @returns {boolean} Returns `true` if `value` is a valid index, else `false`.
     */
    function isIndex$3(value, length) {
      length = length == null ? MAX_SAFE_INTEGER$3 : length;
      return !!length &&
        (typeof value == 'number' || reIsUint$3.test(value)) &&
        (value > -1 && value % 1 == 0 && value < length);
    }

    /**
     * Checks if the given arguments are from an iteratee call.
     *
     * @private
     * @param {*} value The potential iteratee value argument.
     * @param {*} index The potential iteratee index or key argument.
     * @param {*} object The potential iteratee object argument.
     * @returns {boolean} Returns `true` if the arguments are from an iteratee call,
     *  else `false`.
     */
    function isIterateeCall$2(value, index, object) {
      if (!isObject$3(object)) {
        return false;
      }
      var type = typeof index;
      if (type == 'number'
            ? (isArrayLike$3(object) && isIndex$3(index, object.length))
            : (type == 'string' && index in object)
          ) {
        return eq$2(object[index], value);
      }
      return false;
    }

    /**
     * Checks if `func` has its source masked.
     *
     * @private
     * @param {Function} func The function to check.
     * @returns {boolean} Returns `true` if `func` is masked, else `false`.
     */
    function isMasked(func) {
      return !!maskSrcKey && (maskSrcKey in func);
    }

    /**
     * Checks if `value` is likely a prototype object.
     *
     * @private
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is a prototype, else `false`.
     */
    function isPrototype$1(value) {
      var Ctor = value && value.constructor,
          proto = (typeof Ctor == 'function' && Ctor.prototype) || objectProto$3;

      return value === proto;
    }

    /**
     * Converts `func` to its source code.
     *
     * @private
     * @param {Function} func The function to process.
     * @returns {string} Returns the source code.
     */
    function toSource(func) {
      if (func != null) {
        try {
          return funcToString.call(func);
        } catch (e) {}
        try {
          return (func + '');
        } catch (e) {}
      }
      return '';
    }

    /**
     * Gets `n` random elements at unique keys from `collection` up to the
     * size of `collection`.
     *
     * @static
     * @memberOf _
     * @since 4.0.0
     * @category Collection
     * @param {Array|Object} collection The collection to sample.
     * @param {number} [n=1] The number of elements to sample.
     * @param- {Object} [guard] Enables use as an iteratee for methods like `_.map`.
     * @returns {Array} Returns the random elements.
     * @example
     *
     * _.sampleSize([1, 2, 3], 2);
     * // => [3, 1]
     *
     * _.sampleSize([1, 2, 3], 4);
     * // => [2, 3, 1]
     */
    function sampleSize(collection, n, guard) {
      var index = -1,
          result = toArray(collection),
          length = result.length,
          lastIndex = length - 1;

      if ((guard ? isIterateeCall$2(collection, n, guard) : n === undefined)) {
        n = 1;
      } else {
        n = baseClamp(toInteger(n), 0, length);
      }
      while (++index < n) {
        var rand = baseRandom$2(index, lastIndex),
            value = result[rand];

        result[rand] = result[index];
        result[index] = value;
      }
      result.length = n;
      return result;
    }

    /**
     * Creates an array of shuffled values, using a version of the
     * [Fisher-Yates shuffle](https://en.wikipedia.org/wiki/Fisher-Yates_shuffle).
     *
     * @static
     * @memberOf _
     * @since 0.1.0
     * @category Collection
     * @param {Array|Object} collection The collection to shuffle.
     * @returns {Array} Returns the new shuffled array.
     * @example
     *
     * _.shuffle([1, 2, 3, 4]);
     * // => [4, 1, 3, 2]
     */
    function shuffle(collection) {
      return sampleSize(collection, MAX_ARRAY_LENGTH);
    }

    /**
     * Performs a
     * [`SameValueZero`](http://ecma-international.org/ecma-262/7.0/#sec-samevaluezero)
     * comparison between two values to determine if they are equivalent.
     *
     * @static
     * @memberOf _
     * @since 4.0.0
     * @category Lang
     * @param {*} value The value to compare.
     * @param {*} other The other value to compare.
     * @returns {boolean} Returns `true` if the values are equivalent, else `false`.
     * @example
     *
     * var object = { 'a': 1 };
     * var other = { 'a': 1 };
     *
     * _.eq(object, object);
     * // => true
     *
     * _.eq(object, other);
     * // => false
     *
     * _.eq('a', 'a');
     * // => true
     *
     * _.eq('a', Object('a'));
     * // => false
     *
     * _.eq(NaN, NaN);
     * // => true
     */
    function eq$2(value, other) {
      return value === other || (value !== value && other !== other);
    }

    /**
     * Checks if `value` is likely an `arguments` object.
     *
     * @static
     * @memberOf _
     * @since 0.1.0
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is an `arguments` object,
     *  else `false`.
     * @example
     *
     * _.isArguments(function() { return arguments; }());
     * // => true
     *
     * _.isArguments([1, 2, 3]);
     * // => false
     */
    function isArguments$1(value) {
      // Safari 8.1 makes `arguments.callee` enumerable in strict mode.
      return isArrayLikeObject$1(value) && hasOwnProperty$1.call(value, 'callee') &&
        (!propertyIsEnumerable$1.call(value, 'callee') || objectToString$3.call(value) == argsTag$1);
    }

    /**
     * Checks if `value` is classified as an `Array` object.
     *
     * @static
     * @memberOf _
     * @since 0.1.0
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is an array, else `false`.
     * @example
     *
     * _.isArray([1, 2, 3]);
     * // => true
     *
     * _.isArray(document.body.children);
     * // => false
     *
     * _.isArray('abc');
     * // => false
     *
     * _.isArray(_.noop);
     * // => false
     */
    var isArray$1 = Array.isArray;

    /**
     * Checks if `value` is array-like. A value is considered array-like if it's
     * not a function and has a `value.length` that's an integer greater than or
     * equal to `0` and less than or equal to `Number.MAX_SAFE_INTEGER`.
     *
     * @static
     * @memberOf _
     * @since 4.0.0
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is array-like, else `false`.
     * @example
     *
     * _.isArrayLike([1, 2, 3]);
     * // => true
     *
     * _.isArrayLike(document.body.children);
     * // => true
     *
     * _.isArrayLike('abc');
     * // => true
     *
     * _.isArrayLike(_.noop);
     * // => false
     */
    function isArrayLike$3(value) {
      return value != null && isLength$3(value.length) && !isFunction$3(value);
    }

    /**
     * This method is like `_.isArrayLike` except that it also checks if `value`
     * is an object.
     *
     * @static
     * @memberOf _
     * @since 4.0.0
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is an array-like object,
     *  else `false`.
     * @example
     *
     * _.isArrayLikeObject([1, 2, 3]);
     * // => true
     *
     * _.isArrayLikeObject(document.body.children);
     * // => true
     *
     * _.isArrayLikeObject('abc');
     * // => false
     *
     * _.isArrayLikeObject(_.noop);
     * // => false
     */
    function isArrayLikeObject$1(value) {
      return isObjectLike$3(value) && isArrayLike$3(value);
    }

    /**
     * Checks if `value` is classified as a `Function` object.
     *
     * @static
     * @memberOf _
     * @since 0.1.0
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is a function, else `false`.
     * @example
     *
     * _.isFunction(_);
     * // => true
     *
     * _.isFunction(/abc/);
     * // => false
     */
    function isFunction$3(value) {
      // The use of `Object#toString` avoids issues with the `typeof` operator
      // in Safari 8-9 which returns 'object' for typed array and other constructors.
      var tag = isObject$3(value) ? objectToString$3.call(value) : '';
      return tag == funcTag$3 || tag == genTag$3;
    }

    /**
     * Checks if `value` is a valid array-like length.
     *
     * **Note:** This method is loosely based on
     * [`ToLength`](http://ecma-international.org/ecma-262/7.0/#sec-tolength).
     *
     * @static
     * @memberOf _
     * @since 4.0.0
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is a valid length, else `false`.
     * @example
     *
     * _.isLength(3);
     * // => true
     *
     * _.isLength(Number.MIN_VALUE);
     * // => false
     *
     * _.isLength(Infinity);
     * // => false
     *
     * _.isLength('3');
     * // => false
     */
    function isLength$3(value) {
      return typeof value == 'number' &&
        value > -1 && value % 1 == 0 && value <= MAX_SAFE_INTEGER$3;
    }

    /**
     * Checks if `value` is the
     * [language type](http://www.ecma-international.org/ecma-262/7.0/#sec-ecmascript-language-types)
     * of `Object`. (e.g. arrays, functions, objects, regexes, `new Number(0)`, and `new String('')`)
     *
     * @static
     * @memberOf _
     * @since 0.1.0
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is an object, else `false`.
     * @example
     *
     * _.isObject({});
     * // => true
     *
     * _.isObject([1, 2, 3]);
     * // => true
     *
     * _.isObject(_.noop);
     * // => true
     *
     * _.isObject(null);
     * // => false
     */
    function isObject$3(value) {
      var type = typeof value;
      return !!value && (type == 'object' || type == 'function');
    }

    /**
     * Checks if `value` is object-like. A value is object-like if it's not `null`
     * and has a `typeof` result of "object".
     *
     * @static
     * @memberOf _
     * @since 4.0.0
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is object-like, else `false`.
     * @example
     *
     * _.isObjectLike({});
     * // => true
     *
     * _.isObjectLike([1, 2, 3]);
     * // => true
     *
     * _.isObjectLike(_.noop);
     * // => false
     *
     * _.isObjectLike(null);
     * // => false
     */
    function isObjectLike$3(value) {
      return !!value && typeof value == 'object';
    }

    /**
     * Checks if `value` is classified as a `String` primitive or object.
     *
     * @static
     * @since 0.1.0
     * @memberOf _
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is a string, else `false`.
     * @example
     *
     * _.isString('abc');
     * // => true
     *
     * _.isString(1);
     * // => false
     */
    function isString(value) {
      return typeof value == 'string' ||
        (!isArray$1(value) && isObjectLike$3(value) && objectToString$3.call(value) == stringTag);
    }

    /**
     * Checks if `value` is classified as a `Symbol` primitive or object.
     *
     * @static
     * @memberOf _
     * @since 4.0.0
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is a symbol, else `false`.
     * @example
     *
     * _.isSymbol(Symbol.iterator);
     * // => true
     *
     * _.isSymbol('abc');
     * // => false
     */
    function isSymbol$2(value) {
      return typeof value == 'symbol' ||
        (isObjectLike$3(value) && objectToString$3.call(value) == symbolTag$2);
    }

    /**
     * Converts `value` to an array.
     *
     * @static
     * @since 0.1.0
     * @memberOf _
     * @category Lang
     * @param {*} value The value to convert.
     * @returns {Array} Returns the converted array.
     * @example
     *
     * _.toArray({ 'a': 1, 'b': 2 });
     * // => [1, 2]
     *
     * _.toArray('abc');
     * // => ['a', 'b', 'c']
     *
     * _.toArray(1);
     * // => []
     *
     * _.toArray(null);
     * // => []
     */
    function toArray(value) {
      if (!value) {
        return [];
      }
      if (isArrayLike$3(value)) {
        return isString(value) ? stringToArray(value) : copyArray(value);
      }
      if (iteratorSymbol && value[iteratorSymbol]) {
        return iteratorToArray(value[iteratorSymbol]());
      }
      var tag = getTag(value),
          func = tag == mapTag ? mapToArray : (tag == setTag ? setToArray : values$1);

      return func(value);
    }

    /**
     * Converts `value` to a finite number.
     *
     * @static
     * @memberOf _
     * @since 4.12.0
     * @category Lang
     * @param {*} value The value to convert.
     * @returns {number} Returns the converted number.
     * @example
     *
     * _.toFinite(3.2);
     * // => 3.2
     *
     * _.toFinite(Number.MIN_VALUE);
     * // => 5e-324
     *
     * _.toFinite(Infinity);
     * // => 1.7976931348623157e+308
     *
     * _.toFinite('3.2');
     * // => 3.2
     */
    function toFinite$2(value) {
      if (!value) {
        return value === 0 ? value : 0;
      }
      value = toNumber$2(value);
      if (value === INFINITY$2 || value === -INFINITY$2) {
        var sign = (value < 0 ? -1 : 1);
        return sign * MAX_INTEGER$2;
      }
      return value === value ? value : 0;
    }

    /**
     * Converts `value` to an integer.
     *
     * **Note:** This method is loosely based on
     * [`ToInteger`](http://www.ecma-international.org/ecma-262/7.0/#sec-tointeger).
     *
     * @static
     * @memberOf _
     * @since 4.0.0
     * @category Lang
     * @param {*} value The value to convert.
     * @returns {number} Returns the converted integer.
     * @example
     *
     * _.toInteger(3.2);
     * // => 3
     *
     * _.toInteger(Number.MIN_VALUE);
     * // => 0
     *
     * _.toInteger(Infinity);
     * // => 1.7976931348623157e+308
     *
     * _.toInteger('3.2');
     * // => 3
     */
    function toInteger(value) {
      var result = toFinite$2(value),
          remainder = result % 1;

      return result === result ? (remainder ? result - remainder : result) : 0;
    }

    /**
     * Converts `value` to a number.
     *
     * @static
     * @memberOf _
     * @since 4.0.0
     * @category Lang
     * @param {*} value The value to process.
     * @returns {number} Returns the number.
     * @example
     *
     * _.toNumber(3.2);
     * // => 3.2
     *
     * _.toNumber(Number.MIN_VALUE);
     * // => 5e-324
     *
     * _.toNumber(Infinity);
     * // => Infinity
     *
     * _.toNumber('3.2');
     * // => 3.2
     */
    function toNumber$2(value) {
      if (typeof value == 'number') {
        return value;
      }
      if (isSymbol$2(value)) {
        return NAN$2;
      }
      if (isObject$3(value)) {
        var other = typeof value.valueOf == 'function' ? value.valueOf() : value;
        value = isObject$3(other) ? (other + '') : other;
      }
      if (typeof value != 'string') {
        return value === 0 ? value : +value;
      }
      value = value.replace(reTrim$2, '');
      var isBinary = reIsBinary$2.test(value);
      return (isBinary || reIsOctal$2.test(value))
        ? freeParseInt$2(value.slice(2), isBinary ? 2 : 8)
        : (reIsBadHex$2.test(value) ? NAN$2 : +value);
    }

    /**
     * Creates an array of the own enumerable property names of `object`.
     *
     * **Note:** Non-object values are coerced to objects. See the
     * [ES spec](http://ecma-international.org/ecma-262/7.0/#sec-object.keys)
     * for more details.
     *
     * @static
     * @since 0.1.0
     * @memberOf _
     * @category Object
     * @param {Object} object The object to query.
     * @returns {Array} Returns the array of property names.
     * @example
     *
     * function Foo() {
     *   this.a = 1;
     *   this.b = 2;
     * }
     *
     * Foo.prototype.c = 3;
     *
     * _.keys(new Foo);
     * // => ['a', 'b'] (iteration order is not guaranteed)
     *
     * _.keys('hi');
     * // => ['0', '1']
     */
    function keys$1(object) {
      return isArrayLike$3(object) ? arrayLikeKeys$1(object) : baseKeys$1(object);
    }

    /**
     * Creates an array of the own enumerable string keyed property values of `object`.
     *
     * **Note:** Non-object values are coerced to objects.
     *
     * @static
     * @since 0.1.0
     * @memberOf _
     * @category Object
     * @param {Object} object The object to query.
     * @returns {Array} Returns the array of property values.
     * @example
     *
     * function Foo() {
     *   this.a = 1;
     *   this.b = 2;
     * }
     *
     * Foo.prototype.c = 3;
     *
     * _.values(new Foo);
     * // => [1, 2] (iteration order is not guaranteed)
     *
     * _.values('hi');
     * // => ['h', 'i']
     */
    function values$1(object) {
      return object ? baseValues$1(object, keys$1(object)) : [];
    }

    var lodash_shuffle = shuffle;

    /* src/App.svelte generated by Svelte v3.16.7 */

    const { window: window_1 } = globals;
    const file$5 = "src/App.svelte";

    function create_fragment$5(ctx) {
    	let a;
    	let h1;
    	let t1;
    	let div0;
    	let t2;
    	let div1;
    	let t3;
    	let current;
    	let dispose;

    	const shortcut = new Shortcut({
    			props: {
    				data: /*data*/ ctx[0],
    				index: /*index*/ ctx[1],
    				curr: /*curr*/ ctx[2]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			a = element("a");
    			h1 = element("h1");
    			h1.textContent = "Shortcut";
    			t1 = space();
    			div0 = element("div");
    			create_component(shortcut.$$.fragment);
    			t2 = space();
    			div1 = element("div");
    			t3 = text(/*message*/ ctx[3]);
    			add_location(h1, file$5, 163, 17, 4656);
    			attr_dev(a, "href", "https://github.com/ChristerNilsson/svelte-projects/wiki/017");
    			attr_dev(a, "class", "center-align svelte-1yxvpcj");
    			attr_dev(a, "target", "_blank");
    			add_location(a, file$5, 160, 0, 4509);
    			set_style(div0, "width", "90%");
    			set_style(div0, "margin", "auto");
    			add_location(div0, file$5, 164, 0, 4678);
    			attr_dev(div1, "class", "w fs center-align svelte-1yxvpcj");
    			add_location(div1, file$5, 167, 0, 4757);

    			dispose = [
    				listen_dev(window_1, "keydown", /*handleKeyDown*/ ctx[4], false, false, false),
    				listen_dev(a, "mousemove", /*mousemove_handler*/ ctx[9], false, false, false)
    			];
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, a, anchor);
    			append_dev(a, h1);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, div0, anchor);
    			mount_component(shortcut, div0, null);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, div1, anchor);
    			append_dev(div1, t3);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const shortcut_changes = {};
    			if (dirty & /*data*/ 1) shortcut_changes.data = /*data*/ ctx[0];
    			if (dirty & /*index*/ 2) shortcut_changes.index = /*index*/ ctx[1];
    			if (dirty & /*curr*/ 4) shortcut_changes.curr = /*curr*/ ctx[2];
    			shortcut.$set(shortcut_changes);
    			if (!current || dirty & /*message*/ 8) set_data_dev(t3, /*message*/ ctx[3]);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(shortcut.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(shortcut.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(a);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(div0);
    			destroy_component(shortcut);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(div1);
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
    	const url = new URL(window.location.href);
    	const getParam = (name, value) => parseInt(url.searchParams.get(name) || value);
    	let data = {};
    	let index = 0;
    	let curr = null;
    	data.M = getParam("M", 3);
    	data.N = getParam("N", 24);
    	data.MAX = getParam("MAX", 20);
    	data.SHUFFLE = getParam("SHUFFLE", 0);
    	data.ADD = getParam("ADD", 2);
    	data.MUL = getParam("MUL", 2);
    	data.DIV = getParam("DIV", 2);
    	data.SUB = getParam("SUB", 0);
    	if (data.N % data.M != 0) data.M = data.N;
    	data.score = 0;
    	data.undos = 0;
    	data.start = new Date();
    	data.stopp = new Date();
    	data.optimum = 0;

    	const createCandidates = n => {
    		let a = lodash_random(0, data.MAX);
    		let cands0 = [a];
    		const visited = {};
    		const memory = {};
    		visited[a.toString()] = 0;
    		memory[a.toString()] = a;

    		for (const lvl of lodash_range(n)) {
    			const cands1 = [];

    			const op = p => {
    				if (-data.MUL * data.MAX <= p && p <= data.MUL * data.MAX) {
    					const key = p.toString();

    					if (!(key in memory)) {
    						cands1.push(p);
    						visited[key] = lvl + 1;
    						memory[key] = p;
    					}
    				}
    			};

    			for (const cand of cands0) {
    				if (data.ADD != 0) op(cand + data.ADD);
    				if (data.SUB == 0) op(cand - data.SUB);
    				if (data.MUL > 1) op(cand * data.MUL);
    				if (data.DIV > 1 && cand % data.DIV == 0) op(cand / data.DIV);
    			}

    			cands0 = cands1;
    		}

    		if (cands0.length > 0) {
    			const target = lodash_sample(cands0);
    			const key = target.toString();
    			$$invalidate(0, data.optimum += visited[key], data);
    			return { a, b: target, hist: [], orig: a };
    		} else {
    			const key = lodash_sample(Object.keys(visited));
    			$$invalidate(0, data.optimum += visited[key], data);
    			return { a, b: memory[key], hist: [], orig: a };
    		}
    	};

    	let candidates = [];

    	for (const level of lodash_range(data.M)) {
    		for (const j of lodash_range(data.N / data.M)) {
    			candidates.push(createCandidates(level + 1));
    		}
    	}

    	data.cand = data.SHUFFLE == 1 ? lodash_shuffle(candidates) : candidates;

    	data.op = value => {
    		if (curr.a == value) return;
    		curr.hist.push(curr.a);
    		$$invalidate(2, curr.a = value, curr);
    		$$invalidate(0, data.score++, data);
    		$$invalidate(0, data.stopp = new Date(), data);
    	};

    	data.undo = () => {
    		$$invalidate(0, data.score--, data);
    		$$invalidate(0, data.undos++, data);
    		$$invalidate(2, curr.a = curr.hist.pop(), curr);
    	};

    	data.reset = () => {
    		$$invalidate(0, data.start = new Date(), data);
    		$$invalidate(0, data.stopp = new Date(), data);
    		$$invalidate(0, data.score = 0, data);
    		$$invalidate(0, data.undos = 0, data);
    		$$invalidate(1, index = 0);

    		for (const c of data.cand) {
    			c.a = c.orig;
    			c.hist = [];
    		}
    	};

    	data.click = i => $$invalidate(1, index = i);
    	data.incr = delta => $$invalidate(1, index += delta);

    	const handleKeyDown = event => {
    		event.preventDefault();
    		if (event.key == "ArrowLeft" && index > 0) $$invalidate(1, index--, index);
    		if (event.key == "ArrowRight" && index < data.N - 1) $$invalidate(1, index++, index);
    		if (event.key == " ") $$invalidate(1, index = (index + 1) % data.N);
    		if (event.key == "Home") $$invalidate(1, index = 0);
    		if (event.key == "End") $$invalidate(1, index = data.N - 1);
    		if (event.key == "a" && curr.a != curr.b) data.op(curr.a + data.ADD);
    		if (event.key == "s" && curr.a != curr.b) data.op(curr.a - data.SUB);
    		if ((event.key == "m" || event.key == "w") && curr.a != curr.b) data.op(curr.a * data.MUL);
    		if (event.key == "d" && curr.a != curr.b && curr.a % data.DIV == 0) data.op(curr.a / data.DIV);
    		if (event.key == "z" && curr.hist.length > 0) data.undo();
    		if (event.key == "r") data.reset();
    	};

    	let message = "";

    	data.mm = (name, detail = "") => {
    		if (name == "info") $$invalidate(3, message = "click title for info about how to use and customize Shortcut");
    		if (name == "score") $$invalidate(3, message = "number of steps you have used");
    		if (name == "optimum") $$invalidate(3, message = "minimum number of steps needed");
    		if (name == "undos") $$invalidate(3, message = "number of undos. Minimize");
    		if (name == "time") $$invalidate(3, message = "number of seconds you have used. Minimize");
    		if (name == "left") $$invalidate(3, message = "make this number equal to the target number");
    		if (name == "right") $$invalidate(3, message = "this is the target number");
    		if (name == "prev") $$invalidate(3, message = "goto previous exercise. Key=leftArrow");
    		if (name == "next") $$invalidate(3, message = "goto next exercise. Key=rightArrow or space");
    		if (name == "add") $$invalidate(3, message = "add to left number. Key=a");
    		if (name == "mul") $$invalidate(3, message = "multiply left number. Key=w or m");
    		if (name == "sub") $$invalidate(3, message = "subtract from left number. Key=s");
    		if (name == "div") $$invalidate(3, message = "divide left number. Key=d");
    		if (name == "undo") $$invalidate(3, message = "undo last operation. Key=z");
    		if (name == "circle") $$invalidate(3, message = "jump to exercise #" + detail);
    	};

    	const mousemove_handler = () => data.mm("info");

    	$$self.$capture_state = () => {
    		return {};
    	};

    	$$self.$inject_state = $$props => {
    		if ("data" in $$props) $$invalidate(0, data = $$props.data);
    		if ("index" in $$props) $$invalidate(1, index = $$props.index);
    		if ("curr" in $$props) $$invalidate(2, curr = $$props.curr);
    		if ("candidates" in $$props) candidates = $$props.candidates;
    		if ("message" in $$props) $$invalidate(3, message = $$props.message);
    	};

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*data, index*/ 3) {
    			 $$invalidate(2, curr = data.cand[index]);
    		}
    	};

    	return [
    		data,
    		index,
    		curr,
    		message,
    		handleKeyDown,
    		url,
    		getParam,
    		createCandidates,
    		candidates,
    		mousemove_handler
    	];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$5.name
    		});
    	}
    }

    var app = new App({
    	target: document.body
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
