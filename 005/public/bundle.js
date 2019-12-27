
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
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
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

    /* src/App.svelte generated by Svelte v3.16.7 */

    const file = "src/App.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[10] = list[i];
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[13] = list[i];
    	return child_ctx;
    }

    // (80:0) {#each [par0,par1,par2] as par}
    function create_each_block_1(ctx) {
    	let div;
    	let t_value = Object.keys(/*par*/ ctx[13]).join(" ") + "";
    	let t;

    	const block = {
    		c: function create() {
    			div = element("div");
    			t = text(t_value);
    			attr_dev(div, "class", "svelte-1ev848y");
    			add_location(div, file, 80, 1, 2256);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*par0, par1, par2*/ 28 && t_value !== (t_value = Object.keys(/*par*/ ctx[13]).join(" ") + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(80:0) {#each [par0,par1,par2] as par}",
    		ctx
    	});

    	return block;
    }

    // (83:0) {#each stack as item}
    function create_each_block(ctx) {
    	let div;
    	let t_value = /*item*/ ctx[10] + "";
    	let t;

    	const block = {
    		c: function create() {
    			div = element("div");
    			t = text(t_value);
    			attr_dev(div, "class", "svelte-1ev848y");
    			add_location(div, file, 83, 1, 2327);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*stack*/ 1 && t_value !== (t_value = /*item*/ ctx[10] + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(83:0) {#each stack as item}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let div;
    	let t1;
    	let t2;
    	let t3;
    	let input;
    	let dispose;
    	let each_value_1 = [/*par0*/ ctx[2], /*par1*/ ctx[3], /*par2*/ ctx[4]];
    	let each_blocks_1 = [];

    	for (let i = 0; i < 3; i += 1) {
    		each_blocks_1[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	let each_value = /*stack*/ ctx[0];
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			div.textContent = `${document.title}`;
    			t1 = space();

    			for (let i = 0; i < 3; i += 1) {
    				each_blocks_1[i].c();
    			}

    			t2 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t3 = space();
    			input = element("input");
    			attr_dev(div, "class", "svelte-1ev848y");
    			add_location(div, file, 78, 0, 2195);
    			attr_dev(input, "type", "text");
    			attr_dev(input, "placeholder", "Enter commands separated with spaces");
    			attr_dev(input, "class", "svelte-1ev848y");
    			add_location(input, file, 85, 0, 2353);

    			dispose = [
    				listen_dev(input, "keyup", /*onkeyup*/ ctx[5], false, false, false),
    				listen_dev(input, "input", /*input_input_handler*/ ctx[9])
    			];
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			insert_dev(target, t1, anchor);

    			for (let i = 0; i < 3; i += 1) {
    				each_blocks_1[i].m(target, anchor);
    			}

    			insert_dev(target, t2, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, t3, anchor);
    			insert_dev(target, input, anchor);
    			set_input_value(input, /*commands*/ ctx[1]);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*Object, par0, par1, par2*/ 28) {
    				each_value_1 = [/*par0*/ ctx[2], /*par1*/ ctx[3], /*par2*/ ctx[4]];
    				let i;

    				for (i = 0; i < 3; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (each_blocks_1[i]) {
    						each_blocks_1[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_1[i] = create_each_block_1(child_ctx);
    						each_blocks_1[i].c();
    						each_blocks_1[i].m(t2.parentNode, t2);
    					}
    				}

    				for (; i < 3; i += 1) {
    					each_blocks_1[i].d(1);
    				}
    			}

    			if (dirty & /*stack*/ 1) {
    				each_value = /*stack*/ ctx[0];
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(t3.parentNode, t3);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			if (dirty & /*commands*/ 2 && input.value !== /*commands*/ ctx[1]) {
    				set_input_value(input, /*commands*/ ctx[1]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (detaching) detach_dev(t1);
    			destroy_each(each_blocks_1, detaching);
    			if (detaching) detach_dev(t2);
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(input);
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
    	document.title = "RPN Calculator";
    	let stack = [];
    	let history = [];
    	let commands = "";
    	const par0 = {};
    	const par1 = {};
    	const par2 = {};
    	par0["drop"] = () => stack.pop();
    	par0["pi"] = () => stack.push(Math.PI);
    	par0["e"] = () => stack.push(Math.E);
    	par0["swap"] = () => stack.push(stack.pop(), stack.pop());
    	par0["clr"] = () => $$invalidate(0, stack = []);
    	par1["x^2"] = x => x * x;
    	par1["sqrt"] = x => Math.sqrt(x);
    	par1["chs"] = x => -x;
    	par1["1/x"] = x => 1 / x;
    	par1["abs"] = x => Math.abs(x);
    	par1["10^x"] = x => 10 ** x;
    	par1["log"] = x => Math.log10(x);
    	par1["exp"] = x => Math.exp(x);
    	par1["ln"] = x => Math.log(x);
    	par1["sin"] = x => Math.sin(x / 180 * Math.PI);
    	par1["cos"] = x => Math.cos(x / 180 * Math.PI);
    	par1["tan"] = x => Math.tan(x / 180 * Math.PI);
    	par1["asin"] = x => Math.asin(x) * 180 / Math.PI;
    	par1["acos"] = x => Math.acos(x) * 180 / Math.PI;
    	par1["atan"] = x => Math.atan(x) * 180 / Math.PI;
    	par2["+"] = (x, y) => y + x;
    	par2["*"] = (x, y) => y * x;
    	par2["-"] = (x, y) => y - x;
    	par2["/"] = (x, y) => y / x;
    	par2["y^x"] = (x, y) => y ** x;
    	par2["atan2"] = (x, y) => Math.atan2(y, x) * 180 / Math.PI;
    	par2["hypot"] = (x, y) => Math.sqrt(x * x + y * y);
    	par2["s"] = (x, y) => y + x;
    	par2["p"] = (x, y) => x * y / (x + y);

    	const calc = cmd => {
    		if (cmd in par0) par0[cmd](); else if (cmd in par1) stack.push(par1[cmd](stack.pop())); else if (cmd in par2) stack.push(par2[cmd](stack.pop(), stack.pop())); else if (!isNaN(parseFloat(cmd))) stack.push(parseFloat(cmd));
    	};

    	function showHistory(delta) {
    		if (history.length == 0) return; else if (delta == -1) history.push(history.shift()); else history.unshift(history.pop());
    		$$invalidate(1, commands = history[0]);
    	}

    	function onkeyup(event) {
    		if (event.key == "Escape") $$invalidate(1, commands = ""); else if (event.key == "ArrowUp") showHistory(-1); else if (event.key == "ArrowDown") showHistory(1); else if (event.key == "Enter") {
    			commands.split(" ").map(cmd => {
    				calc(cmd);
    			});

    			if (!history.includes(commands)) history.push(commands);
    			$$invalidate(1, commands = "");
    			$$invalidate(0, stack);
    		}
    	}

    	function input_input_handler() {
    		commands = this.value;
    		$$invalidate(1, commands);
    	}

    	$$self.$capture_state = () => {
    		return {};
    	};

    	$$self.$inject_state = $$props => {
    		if ("stack" in $$props) $$invalidate(0, stack = $$props.stack);
    		if ("history" in $$props) history = $$props.history;
    		if ("commands" in $$props) $$invalidate(1, commands = $$props.commands);
    	};

    	return [
    		stack,
    		commands,
    		par0,
    		par1,
    		par2,
    		onkeyup,
    		history,
    		calc,
    		showHistory,
    		input_input_handler
    	];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
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
