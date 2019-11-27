
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
        if ($$.fragment) {
            $$.update($$.dirty);
            run_all($$.before_update);
            $$.fragment.p($$.dirty, $$.ctx);
            $$.dirty = null;
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

    const globals = (typeof window !== 'undefined' ? window : global);
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment.m(target, anchor);
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
        if (component.$$.fragment) {
            run_all(component.$$.on_destroy);
            component.$$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            component.$$.on_destroy = component.$$.fragment = null;
            component.$$.ctx = {};
        }
    }
    function make_dirty(component, key) {
        if (!component.$$.dirty) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty = blank_object();
        }
        component.$$.dirty[key] = true;
    }
    function init(component, options, instance, create_fragment, not_equal, prop_names) {
        const parent_component = current_component;
        set_current_component(component);
        const props = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props: prop_names,
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
            dirty: null
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, props, (key, ret, value = ret) => {
                if ($$.ctx && not_equal($$.ctx[key], $$.ctx[key] = value)) {
                    if ($$.bound[key])
                        $$.bound[key](value);
                    if (ready)
                        make_dirty(component, key);
                }
                return ret;
            })
            : props;
        $$.update();
        ready = true;
        run_all($$.before_update);
        $$.fragment = create_fragment($$.ctx);
        if (options.target) {
            if (options.hydrate) {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment.l(children(options.target));
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment.c();
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

    /* src\Product.svelte generated by Svelte v3.12.1 */

    const file = "src\\Product.svelte";

    function create_fragment(ctx) {
    	var div, button, t1, t2_value = ctx.product.price + "", t2, t3, b, t4_value = ctx.product.title + "", t4, dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			button = element("button");
    			button.textContent = "Add";
    			t1 = text("\r\n\t$");
    			t2 = text(t2_value);
    			t3 = space();
    			b = element("b");
    			t4 = text(t4_value);
    			add_location(button, file, 5, 1, 59);
    			add_location(b, file, 6, 18, 122);
    			add_location(div, file, 4, 0, 51);
    			dispose = listen_dev(button, "click", ctx.click_handler);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, button);
    			append_dev(div, t1);
    			append_dev(div, t2);
    			append_dev(div, t3);
    			append_dev(div, b);
    			append_dev(b, t4);
    		},

    		p: function update(changed, ctx) {
    			if ((changed.product) && t2_value !== (t2_value = ctx.product.price + "")) {
    				set_data_dev(t2, t2_value);
    			}

    			if ((changed.product) && t4_value !== (t4_value = ctx.product.title + "")) {
    				set_data_dev(t4, t4_value);
    			}
    		},

    		i: noop,
    		o: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(div);
    			}

    			dispose();
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment.name, type: "component", source: "", ctx });
    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { id, product, add } = $$props;

    	const writable_props = ['id', 'product', 'add'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<Product> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => add(id);

    	$$self.$set = $$props => {
    		if ('id' in $$props) $$invalidate('id', id = $$props.id);
    		if ('product' in $$props) $$invalidate('product', product = $$props.product);
    		if ('add' in $$props) $$invalidate('add', add = $$props.add);
    	};

    	$$self.$capture_state = () => {
    		return { id, product, add };
    	};

    	$$self.$inject_state = $$props => {
    		if ('id' in $$props) $$invalidate('id', id = $$props.id);
    		if ('product' in $$props) $$invalidate('product', product = $$props.product);
    		if ('add' in $$props) $$invalidate('add', add = $$props.add);
    	};

    	return { id, product, add, click_handler };
    }

    class Product extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, ["id", "product", "add"]);
    		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "Product", options, id: create_fragment.name });

    		const { ctx } = this.$$;
    		const props = options.props || {};
    		if (ctx.id === undefined && !('id' in props)) {
    			console.warn("<Product> was created without expected prop 'id'");
    		}
    		if (ctx.product === undefined && !('product' in props)) {
    			console.warn("<Product> was created without expected prop 'product'");
    		}
    		if (ctx.add === undefined && !('add' in props)) {
    			console.warn("<Product> was created without expected prop 'add'");
    		}
    	}

    	get id() {
    		throw new Error("<Product>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set id(value) {
    		throw new Error("<Product>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get product() {
    		throw new Error("<Product>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set product(value) {
    		throw new Error("<Product>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get add() {
    		throw new Error("<Product>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set add(value) {
    		throw new Error("<Product>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\Item.svelte generated by Svelte v3.12.1 */

    const file$1 = "src\\Item.svelte";

    function create_fragment$1(ctx) {
    	var div, button, t1, t2, t3, t4_value = ctx.product.price + "", t4, t5, b, t6_value = ctx.product.title + "", t6, dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			button = element("button");
    			button.textContent = "Remove";
    			t1 = space();
    			t2 = text(ctx.count);
    			t3 = text(" $");
    			t4 = text(t4_value);
    			t5 = space();
    			b = element("b");
    			t6 = text(t6_value);
    			add_location(button, file$1, 5, 1, 68);
    			add_location(b, file$1, 6, 26, 149);
    			add_location(div, file$1, 4, 0, 60);
    			dispose = listen_dev(button, "click", ctx.click_handler);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, button);
    			append_dev(div, t1);
    			append_dev(div, t2);
    			append_dev(div, t3);
    			append_dev(div, t4);
    			append_dev(div, t5);
    			append_dev(div, b);
    			append_dev(b, t6);
    		},

    		p: function update(changed, ctx) {
    			if (changed.count) {
    				set_data_dev(t2, ctx.count);
    			}

    			if ((changed.product) && t4_value !== (t4_value = ctx.product.price + "")) {
    				set_data_dev(t4, t4_value);
    			}

    			if ((changed.product) && t6_value !== (t6_value = ctx.product.title + "")) {
    				set_data_dev(t6, t6_value);
    			}
    		},

    		i: noop,
    		o: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(div);
    			}

    			dispose();
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment$1.name, type: "component", source: "", ctx });
    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { id, count, remove, product } = $$props;

    	const writable_props = ['id', 'count', 'remove', 'product'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<Item> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => remove(id);

    	$$self.$set = $$props => {
    		if ('id' in $$props) $$invalidate('id', id = $$props.id);
    		if ('count' in $$props) $$invalidate('count', count = $$props.count);
    		if ('remove' in $$props) $$invalidate('remove', remove = $$props.remove);
    		if ('product' in $$props) $$invalidate('product', product = $$props.product);
    	};

    	$$self.$capture_state = () => {
    		return { id, count, remove, product };
    	};

    	$$self.$inject_state = $$props => {
    		if ('id' in $$props) $$invalidate('id', id = $$props.id);
    		if ('count' in $$props) $$invalidate('count', count = $$props.count);
    		if ('remove' in $$props) $$invalidate('remove', remove = $$props.remove);
    		if ('product' in $$props) $$invalidate('product', product = $$props.product);
    	};

    	return {
    		id,
    		count,
    		remove,
    		product,
    		click_handler
    	};
    }

    class Item extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, ["id", "count", "remove", "product"]);
    		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "Item", options, id: create_fragment$1.name });

    		const { ctx } = this.$$;
    		const props = options.props || {};
    		if (ctx.id === undefined && !('id' in props)) {
    			console.warn("<Item> was created without expected prop 'id'");
    		}
    		if (ctx.count === undefined && !('count' in props)) {
    			console.warn("<Item> was created without expected prop 'count'");
    		}
    		if (ctx.remove === undefined && !('remove' in props)) {
    			console.warn("<Item> was created without expected prop 'remove'");
    		}
    		if (ctx.product === undefined && !('product' in props)) {
    			console.warn("<Item> was created without expected prop 'product'");
    		}
    	}

    	get id() {
    		throw new Error("<Item>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set id(value) {
    		throw new Error("<Item>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get count() {
    		throw new Error("<Item>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set count(value) {
    		throw new Error("<Item>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get remove() {
    		throw new Error("<Item>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set remove(value) {
    		throw new Error("<Item>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get product() {
    		throw new Error("<Item>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set product(value) {
    		throw new Error("<Item>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\App.svelte generated by Svelte v3.12.1 */
    const { Object: Object_1 } = globals;

    const file$2 = "src\\App.svelte";

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = Object_1.create(ctx);
    	child_ctx.id = list[i];
    	return child_ctx;
    }

    function get_each_context(ctx, list, i) {
    	const child_ctx = Object_1.create(ctx);
    	child_ctx.id = list[i];
    	return child_ctx;
    }

    // (31:0) {:else}
    function create_else_block(ctx) {
    	var each_1_anchor, current;

    	let each_value_1 = ctx.Object.keys(ctx.items);

    	let each_blocks = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    		},

    		m: function mount(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			if (changed.items || changed.Object || changed.remove || changed.products) {
    				each_value_1 = ctx.Object.keys(ctx.items);

    				let i;
    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(changed, child_ctx);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block_1(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				group_outros();
    				for (i = each_value_1.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}
    				check_outros();
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			for (let i = 0; i < each_value_1.length; i += 1) {
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
    			destroy_each(each_blocks, detaching);

    			if (detaching) {
    				detach_dev(each_1_anchor);
    			}
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_else_block.name, type: "else", source: "(31:0) {:else}", ctx });
    	return block;
    }

    // (27:0) {#if page==0}
    function create_if_block(ctx) {
    	var each_1_anchor, current;

    	let each_value = ctx.Object.keys(ctx.products);

    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    		},

    		m: function mount(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			if (changed.Object || changed.products || changed.add) {
    				each_value = ctx.Object.keys(ctx.products);

    				let i;
    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(changed, child_ctx);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
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
    			destroy_each(each_blocks, detaching);

    			if (detaching) {
    				detach_dev(each_1_anchor);
    			}
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_if_block.name, type: "if", source: "(27:0) {#if page==0}", ctx });
    	return block;
    }

    // (33:2) {#if items[id] > 0}
    function create_if_block_1(ctx) {
    	var current;

    	var item = new Item({
    		props: {
    		id: ctx.id,
    		count: ctx.items[ctx.id],
    		remove: ctx.remove,
    		product: ctx.products[ctx.id]
    	},
    		$$inline: true
    	});

    	const block = {
    		c: function create() {
    			item.$$.fragment.c();
    		},

    		m: function mount(target, anchor) {
    			mount_component(item, target, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var item_changes = {};
    			if (changed.items) item_changes.id = ctx.id;
    			if (changed.items) item_changes.count = ctx.items[ctx.id];
    			if (changed.products || changed.items) item_changes.product = ctx.products[ctx.id];
    			item.$set(item_changes);
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(item.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(item.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			destroy_component(item, detaching);
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_if_block_1.name, type: "if", source: "(33:2) {#if items[id] > 0}", ctx });
    	return block;
    }

    // (32:1) {#each Object.keys(items) as id}
    function create_each_block_1(ctx) {
    	var if_block_anchor, current;

    	var if_block = (ctx.items[ctx.id] > 0) && create_if_block_1(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},

    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			if (ctx.items[ctx.id] > 0) {
    				if (if_block) {
    					if_block.p(changed, ctx);
    					transition_in(if_block, 1);
    				} else {
    					if_block = create_if_block_1(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				group_outros();
    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});
    				check_outros();
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
    			if (if_block) if_block.d(detaching);

    			if (detaching) {
    				detach_dev(if_block_anchor);
    			}
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_each_block_1.name, type: "each", source: "(32:1) {#each Object.keys(items) as id}", ctx });
    	return block;
    }

    // (28:1) {#each Object.keys(products) as id}
    function create_each_block(ctx) {
    	var current;

    	var product = new Product({
    		props: {
    		id: ctx.id,
    		product: ctx.products[ctx.id],
    		add: ctx.add
    	},
    		$$inline: true
    	});

    	const block = {
    		c: function create() {
    			product.$$.fragment.c();
    		},

    		m: function mount(target, anchor) {
    			mount_component(product, target, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var product_changes = {};
    			if (changed.products) product_changes.id = ctx.id;
    			if (changed.products) product_changes.product = ctx.products[ctx.id];
    			product.$set(product_changes);
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(product.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(product.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			destroy_component(product, detaching);
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_each_block.name, type: "each", source: "(28:1) {#each Object.keys(products) as id}", ctx });
    	return block;
    }

    function create_fragment$2(ctx) {
    	var button0, t1, button1, t2, t3, t4, t5_value = Math.round(ctx.cost) + "", t5, t6, t7, current_block_type_index, if_block, if_block_anchor, current, dispose;

    	var if_block_creators = [
    		create_if_block,
    		create_else_block
    	];

    	var if_blocks = [];

    	function select_block_type(changed, ctx) {
    		if (ctx.page==0) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(null, ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			button0 = element("button");
    			button0.textContent = "Products";
    			t1 = space();
    			button1 = element("button");
    			t2 = text("Carts (");
    			t3 = text(ctx.count);
    			t4 = text(" $");
    			t5 = text(t5_value);
    			t6 = text(")");
    			t7 = space();
    			if_block.c();
    			if_block_anchor = empty();
    			add_location(button0, file$2, 23, 0, 691);
    			add_location(button1, file$2, 24, 0, 742);

    			dispose = [
    				listen_dev(button0, "click", ctx.click_handler),
    				listen_dev(button1, "click", ctx.click_handler_1)
    			];
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, button0, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, button1, anchor);
    			append_dev(button1, t2);
    			append_dev(button1, t3);
    			append_dev(button1, t4);
    			append_dev(button1, t5);
    			append_dev(button1, t6);
    			insert_dev(target, t7, anchor);
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			if (!current || changed.count) {
    				set_data_dev(t3, ctx.count);
    			}

    			if ((!current || changed.cost) && t5_value !== (t5_value = Math.round(ctx.cost) + "")) {
    				set_data_dev(t5, t5_value);
    			}

    			var previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(changed, ctx);
    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(changed, ctx);
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
    			if (detaching) {
    				detach_dev(button0);
    				detach_dev(t1);
    				detach_dev(button1);
    				detach_dev(t7);
    			}

    			if_blocks[current_block_type_index].d(detaching);

    			if (detaching) {
    				detach_dev(if_block_anchor);
    			}

    			run_all(dispose);
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment$2.name, type: "component", source: "", ctx });
    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	

    	let page = 0;
    	
    	const products = {};
    	$$invalidate('products', products['p1'] = {title: 'Gaming Mouse',        price: 29.99 }, products);
    	$$invalidate('products', products['p2'] = {title: 'Harry Potter 3',      price:  9.99 }, products);
    	$$invalidate('products', products['p3'] = {title: 'Used plastic bottle', price:  0.99 }, products);
    	$$invalidate('products', products['p4'] = {title: 'Half-dried plant',    price:  2.99 }, products);

    	const items = {};
    	$$invalidate('items', items['p1'] = 2, items);

    	const remove = (id) => $$invalidate('items', items[id]--, items);
    	const add = (id) => items[id] ?	$$invalidate('items', items[id]++, items) :	$$invalidate('items', items[id] = 1, items);

    	const click_handler = () => $$invalidate('page', page=0);

    	const click_handler_1 = () => $$invalidate('page', page=1);

    	$$self.$capture_state = () => {
    		return {};
    	};

    	$$self.$inject_state = $$props => {
    		if ('page' in $$props) $$invalidate('page', page = $$props.page);
    		if ('count' in $$props) $$invalidate('count', count = $$props.count);
    		if ('cost' in $$props) $$invalidate('cost', cost = $$props.cost);
    	};

    	let count, cost;

    	$$self.$$.update = ($$dirty = { items: 1, products: 1 }) => {
    		if ($$dirty.items) { $$invalidate('count', count = Object.values(items).reduce((a,b) => a+b)); }
    		if ($$dirty.items || $$dirty.products) { $$invalidate('cost', cost = Object.keys(items).reduce((a,key) => products[key].price * items[key] + a, 0)); }
    	};

    	return {
    		page,
    		products,
    		items,
    		remove,
    		add,
    		count,
    		Object,
    		cost,
    		click_handler,
    		click_handler_1
    	};
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, []);
    		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "App", options, id: create_fragment$2.name });
    	}
    }

    const app = new App({
    	target: document.body,
    	props: {}
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
