
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
    function set_input_value(input, value) {
        if (value != null || input.value) {
            input.value = value;
        }
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

    /* src/FindPage.svelte generated by Svelte v3.16.7 */

    const file = "src/FindPage.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[7] = list[i];
    	return child_ctx;
    }

    // (20:1) {#each showLines as line}
    function create_each_block(ctx) {
    	let li;
    	let t_value = /*line*/ ctx[7] + "";
    	let t;

    	const block = {
    		c: function create() {
    			li = element("li");
    			t = text(t_value);
    			add_location(li, file, 20, 2, 432);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    			append_dev(li, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*showLines*/ 8 && t_value !== (t_value = /*line*/ ctx[7] + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(20:1) {#each showLines as line}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let button;
    	let t1;
    	let input;
    	let t2;
    	let ul;
    	let dispose;
    	let each_value = /*showLines*/ ctx[3];
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			button = element("button");
    			button.textContent = "Edit";
    			t1 = space();
    			input = element("input");
    			t2 = space();
    			ul = element("ul");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(button, "class", "svelte-1jan5v1");
    			add_location(button, file, 16, 0, 267);
    			attr_dev(input, "type", "text");
    			attr_dev(input, "placeholder", "Search");
    			attr_dev(input, "class", "svelte-1jan5v1");
    			add_location(input, file, 17, 0, 306);
    			attr_dev(ul, "class", "svelte-1jan5v1");
    			add_location(ul, file, 18, 0, 398);

    			dispose = [
    				listen_dev(button, "click", /*click*/ ctx[1], false, false, false),
    				listen_dev(input, "keyup", /*keyup_handler*/ ctx[5], false, false, false),
    				listen_dev(input, "input", /*input_input_handler*/ ctx[6])
    			];
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, input, anchor);
    			set_input_value(input, /*pattern*/ ctx[0]);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, ul, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(ul, null);
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*pattern*/ 1 && input.value !== /*pattern*/ ctx[0]) {
    				set_input_value(input, /*pattern*/ ctx[0]);
    			}

    			if (dirty & /*showLines*/ 8) {
    				each_value = /*showLines*/ ctx[3];
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(ul, null);
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
    			if (detaching) detach_dev(button);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(input);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(ul);
    			destroy_each(each_blocks, detaching);
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
    	let { pattern } = $$props;
    	let { lines } = $$props;
    	let { click } = $$props;
    	let { keyup } = $$props;
    	const writable_props = ["pattern", "lines", "click", "keyup"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<FindPage> was created with unknown prop '${key}'`);
    	});

    	const keyup_handler = () => keyup(pattern);

    	function input_input_handler() {
    		pattern = this.value;
    		$$invalidate(0, pattern);
    	}

    	$$self.$set = $$props => {
    		if ("pattern" in $$props) $$invalidate(0, pattern = $$props.pattern);
    		if ("lines" in $$props) $$invalidate(4, lines = $$props.lines);
    		if ("click" in $$props) $$invalidate(1, click = $$props.click);
    		if ("keyup" in $$props) $$invalidate(2, keyup = $$props.keyup);
    	};

    	$$self.$capture_state = () => {
    		return { pattern, lines, click, keyup, showLines };
    	};

    	$$self.$inject_state = $$props => {
    		if ("pattern" in $$props) $$invalidate(0, pattern = $$props.pattern);
    		if ("lines" in $$props) $$invalidate(4, lines = $$props.lines);
    		if ("click" in $$props) $$invalidate(1, click = $$props.click);
    		if ("keyup" in $$props) $$invalidate(2, keyup = $$props.keyup);
    		if ("showLines" in $$props) $$invalidate(3, showLines = $$props.showLines);
    	};

    	let showLines;

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*lines, pattern*/ 17) {
    			 $$invalidate(3, showLines = lines.split("\n").filter(line => line.toLowerCase().includes(pattern)));
    		}
    	};

    	return [pattern, click, keyup, showLines, lines, keyup_handler, input_input_handler];
    }

    class FindPage extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, { pattern: 0, lines: 4, click: 1, keyup: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "FindPage",
    			options,
    			id: create_fragment.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || ({});

    		if (/*pattern*/ ctx[0] === undefined && !("pattern" in props)) {
    			console.warn("<FindPage> was created without expected prop 'pattern'");
    		}

    		if (/*lines*/ ctx[4] === undefined && !("lines" in props)) {
    			console.warn("<FindPage> was created without expected prop 'lines'");
    		}

    		if (/*click*/ ctx[1] === undefined && !("click" in props)) {
    			console.warn("<FindPage> was created without expected prop 'click'");
    		}

    		if (/*keyup*/ ctx[2] === undefined && !("keyup" in props)) {
    			console.warn("<FindPage> was created without expected prop 'keyup'");
    		}
    	}

    	get pattern() {
    		throw new Error("<FindPage>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set pattern(value) {
    		throw new Error("<FindPage>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get lines() {
    		throw new Error("<FindPage>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set lines(value) {
    		throw new Error("<FindPage>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get click() {
    		throw new Error("<FindPage>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set click(value) {
    		throw new Error("<FindPage>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get keyup() {
    		throw new Error("<FindPage>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set keyup(value) {
    		throw new Error("<FindPage>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/EditPage.svelte generated by Svelte v3.16.7 */

    const file$1 = "src/EditPage.svelte";

    function create_fragment$1(ctx) {
    	let button;
    	let t1;
    	let textarea;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			button.textContent = "Save";
    			t1 = space();
    			textarea = element("textarea");
    			attr_dev(button, "class", "svelte-1bjdzb6");
    			add_location(button, file$1, 12, 0, 135);
    			attr_dev(textarea, "rows", "70");
    			attr_dev(textarea, "class", "svelte-1bjdzb6");
    			add_location(textarea, file$1, 13, 0, 185);

    			dispose = [
    				listen_dev(button, "click", /*click_handler*/ ctx[2], false, false, false),
    				listen_dev(textarea, "input", /*textarea_input_handler*/ ctx[3])
    			];
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, textarea, anchor);
    			set_input_value(textarea, /*lines*/ ctx[0]);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*lines*/ 1) {
    				set_input_value(textarea, /*lines*/ ctx[0]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(textarea);
    			run_all(dispose);
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
    	let { lines } = $$props;
    	let { click } = $$props;
    	const writable_props = ["lines", "click"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<EditPage> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => click(lines);

    	function textarea_input_handler() {
    		lines = this.value;
    		$$invalidate(0, lines);
    	}

    	$$self.$set = $$props => {
    		if ("lines" in $$props) $$invalidate(0, lines = $$props.lines);
    		if ("click" in $$props) $$invalidate(1, click = $$props.click);
    	};

    	$$self.$capture_state = () => {
    		return { lines, click };
    	};

    	$$self.$inject_state = $$props => {
    		if ("lines" in $$props) $$invalidate(0, lines = $$props.lines);
    		if ("click" in $$props) $$invalidate(1, click = $$props.click);
    	};

    	return [lines, click, click_handler, textarea_input_handler];
    }

    class EditPage extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { lines: 0, click: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "EditPage",
    			options,
    			id: create_fragment$1.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || ({});

    		if (/*lines*/ ctx[0] === undefined && !("lines" in props)) {
    			console.warn("<EditPage> was created without expected prop 'lines'");
    		}

    		if (/*click*/ ctx[1] === undefined && !("click" in props)) {
    			console.warn("<EditPage> was created without expected prop 'click'");
    		}
    	}

    	get lines() {
    		throw new Error("<EditPage>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set lines(value) {
    		throw new Error("<EditPage>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get click() {
    		throw new Error("<EditPage>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set click(value) {
    		throw new Error("<EditPage>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/App.svelte generated by Svelte v3.16.7 */

    // (23:0) {:else}
    function create_else_block(ctx) {
    	let current;

    	const editpage = new EditPage({
    			props: {
    				click: /*save*/ ctx[3],
    				lines: /*lines*/ ctx[2]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(editpage.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(editpage, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const editpage_changes = {};
    			if (dirty & /*lines*/ 4) editpage_changes.lines = /*lines*/ ctx[2];
    			editpage.$set(editpage_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(editpage.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(editpage.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(editpage, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(23:0) {:else}",
    		ctx
    	});

    	return block;
    }

    // (21:0) {#if page==0}
    function create_if_block(ctx) {
    	let current;

    	const findpage = new FindPage({
    			props: {
    				keyup: /*keyup*/ ctx[4],
    				click: /*func*/ ctx[5],
    				lines: /*lines*/ ctx[2],
    				pattern: /*pattern*/ ctx[0]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(findpage.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(findpage, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const findpage_changes = {};
    			if (dirty & /*page*/ 2) findpage_changes.click = /*func*/ ctx[5];
    			if (dirty & /*lines*/ 4) findpage_changes.lines = /*lines*/ ctx[2];
    			if (dirty & /*pattern*/ 1) findpage_changes.pattern = /*pattern*/ ctx[0];
    			findpage.$set(findpage_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(findpage.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(findpage.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(findpage, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(21:0) {#if page==0}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block, create_else_block];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*page*/ ctx[1] == 0) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				}

    				transition_in(if_block, 1);
    				if_block.m(if_block_anchor.parentNode, if_block_anchor);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if_blocks[current_block_type_index].d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
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
    	let pattern = "";
    	let page = 0;
    	let lines;
    	lines = localStorage.Organizer;
    	if (!lines) lines = "12 Batteri\n65 Bensin \n64 Bestick\n43 Blöjor \n52 Brandlarm\n52 Chifonet\n41 Cykelgrejer\n42 Cykelgrejer\n22 Cykellampor\n22 Cykellås\n65 Cykelolja\n21 Dammsugarpåsar\n36 Dämpare\n61 Diverse\n12 Elmätare\n13 Elprylar, små\n32 Etiketter\n22 Ficklampor\n24 Fickplunta\n45 Fotvård\n32 Glasögonfodral\n14 Glödlampor\n16 Glödlampor\n15 Glödlampor, stora\n54 Glögglas\n11 Gruppschema\n21 Gummiband\n11 Häftapparat\n55 Handdukar\n44 Hårvård\n36 IKEA-delar\n63 Kåsor\n11 Klammer\n13 Klister\n12 Laddare\n33 Lås\n13 Märkpennor\n26 Möss\n33 Nycklar\n44 Ögonvård\n44 Öronvård\n21 Pappersnäsdukar\n13 Pennor\n63 Plastflaskor\n62 Plastpåsar\n35 Plugg\n13 Proppar\n65 Putsgrejer\n46 Rakgrejer\n51 Remmar\n56 Skovård\n31 Skruvar\n35 Skruvar\n51 Snören\n34 Specialverktyg\n26 Streckkodläsare\n66 Strykjärn\n52 Svinto\n53 Sygrejer\n32 Tändstickor\n46 Tandvård\n23 Tape\n11 Tätningslist\n25 Toagrejer\n21 Tvättklämmor\n26 USB-grejer\n26 Wattmätare";

    	const save = lines0 => {
    		$$invalidate(2, lines = lines0);
    		localStorage.Organizer = lines;
    		$$invalidate(1, page = 1 - page);
    	};

    	const keyup = pattern0 => $$invalidate(0, pattern = pattern0);
    	const func = () => $$invalidate(1, page = 1 - page);

    	$$self.$capture_state = () => {
    		return {};
    	};

    	$$self.$inject_state = $$props => {
    		if ("pattern" in $$props) $$invalidate(0, pattern = $$props.pattern);
    		if ("page" in $$props) $$invalidate(1, page = $$props.page);
    		if ("lines" in $$props) $$invalidate(2, lines = $$props.lines);
    	};

    	return [pattern, page, lines, save, keyup, func];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$2.name
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
