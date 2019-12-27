
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
    function select_option(select, value) {
        for (let i = 0; i < select.options.length; i += 1) {
            const option = select.options[i];
            if (option.__value === value) {
                option.selected = true;
                return;
            }
        }
    }
    function select_value(select) {
        const selected_option = select.querySelector(':checked') || select.options[0];
        return selected_option && selected_option.__value;
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
    	child_ctx[5] = list[i];
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[4] = list[i];
    	return child_ctx;
    }

    function get_each_context_2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[5] = list[i];
    	return child_ctx;
    }

    function get_each_context_3(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[4] = list[i];
    	return child_ctx;
    }

    // (39:3) {#each colors as color}
    function create_each_block_3(ctx) {
    	let option;
    	let t_value = /*color*/ ctx[4] + "";
    	let t;
    	let option_value_value;

    	const block = {
    		c: function create() {
    			option = element("option");
    			t = text(t_value);
    			option.__value = option_value_value = /*color*/ ctx[4];
    			option.value = option.__value;
    			add_location(option, file, 39, 4, 1185);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, option, anchor);
    			append_dev(option, t);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(option);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_3.name,
    		type: "each",
    		source: "(39:3) {#each colors as color}",
    		ctx
    	});

    	return block;
    }

    // (47:3) {#each palettes as palette}
    function create_each_block_2(ctx) {
    	let option;
    	let t_value = /*palette*/ ctx[5] + "";
    	let t;
    	let option_value_value;

    	const block = {
    		c: function create() {
    			option = element("option");
    			t = text(t_value);
    			option.__value = option_value_value = /*palette*/ ctx[5];
    			option.value = option.__value;
    			add_location(option, file, 47, 4, 1357);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, option, anchor);
    			append_dev(option, t);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(option);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_2.name,
    		type: "each",
    		source: "(47:3) {#each palettes as palette}",
    		ctx
    	});

    	return block;
    }

    // (55:3) {#each colors as color}
    function create_each_block_1(ctx) {
    	let option;
    	let t0_value = /*color*/ ctx[4] + "";
    	let t0;
    	let t1;
    	let option_value_value;

    	const block = {
    		c: function create() {
    			option = element("option");
    			t0 = text(t0_value);
    			t1 = text("-text");
    			option.__value = option_value_value = "" + (/*color*/ ctx[4] + "-text");
    			option.value = option.__value;
    			add_location(option, file, 55, 4, 1531);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, option, anchor);
    			append_dev(option, t0);
    			append_dev(option, t1);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(option);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(55:3) {#each colors as color}",
    		ctx
    	});

    	return block;
    }

    // (63:3) {#each palettes as palette}
    function create_each_block(ctx) {
    	let option;
    	let t0;
    	let t1_value = /*palette*/ ctx[5] + "";
    	let t1;
    	let option_value_value;

    	const block = {
    		c: function create() {
    			option = element("option");
    			t0 = text("text-");
    			t1 = text(t1_value);
    			option.__value = option_value_value = "text-" + /*palette*/ ctx[5];
    			option.value = option.__value;
    			add_location(option, file, 63, 4, 1719);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, option, anchor);
    			append_dev(option, t0);
    			append_dev(option, t1);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(option);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(63:3) {#each palettes as palette}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let t0;
    	let t1;
    	let t2;
    	let div2;
    	let div0;
    	let t3;
    	let div0_class_value;
    	let t4;
    	let div1;
    	let t5;
    	let div1_class_value;
    	let t6;
    	let div7;
    	let div3;
    	let select0;
    	let t7;
    	let div4;
    	let select1;
    	let t8;
    	let div5;
    	let select2;
    	let t9;
    	let div6;
    	let select3;
    	let dispose;
    	let each_value_3 = /*colors*/ ctx[6];
    	let each_blocks_3 = [];

    	for (let i = 0; i < each_value_3.length; i += 1) {
    		each_blocks_3[i] = create_each_block_3(get_each_context_3(ctx, each_value_3, i));
    	}

    	let each_value_2 = /*palettes*/ ctx[7];
    	let each_blocks_2 = [];

    	for (let i = 0; i < each_value_2.length; i += 1) {
    		each_blocks_2[i] = create_each_block_2(get_each_context_2(ctx, each_value_2, i));
    	}

    	let each_value_1 = /*colors*/ ctx[6];
    	let each_blocks_1 = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks_1[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	let each_value = /*palettes*/ ctx[7];
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			t0 = text("Materialize: ");
    			t1 = text(/*combinations*/ ctx[8]);
    			t2 = text(" color combinations\n\n");
    			div2 = element("div");
    			div0 = element("div");
    			t3 = text(/*class1*/ ctx[2]);
    			t4 = space();
    			div1 = element("div");
    			t5 = text(/*class2*/ ctx[3]);
    			t6 = space();
    			div7 = element("div");
    			div3 = element("div");
    			select0 = element("select");

    			for (let i = 0; i < each_blocks_3.length; i += 1) {
    				each_blocks_3[i].c();
    			}

    			t7 = space();
    			div4 = element("div");
    			select1 = element("select");

    			for (let i = 0; i < each_blocks_2.length; i += 1) {
    				each_blocks_2[i].c();
    			}

    			t8 = space();
    			div5 = element("div");
    			select2 = element("select");

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].c();
    			}

    			t9 = space();
    			div6 = element("div");
    			select3 = element("select");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(div0, "class", div0_class_value = "" + (null_to_empty(/*class1*/ ctx[2]) + " svelte-11jysl8"));
    			add_location(div0, file, 30, 1, 983);
    			attr_dev(div1, "class", div1_class_value = "" + (null_to_empty(/*class2*/ ctx[3]) + " svelte-11jysl8"));
    			add_location(div1, file, 31, 1, 1019);
    			attr_dev(div2, "class", "row");
    			add_location(div2, file, 29, 0, 964);
    			if (/*color*/ ctx[4] === void 0) add_render_callback(() => /*select0_change_handler*/ ctx[9].call(select0));
    			add_location(select0, file, 37, 2, 1126);
    			attr_dev(div3, "class", "input-field col s6");
    			add_location(div3, file, 36, 1, 1091);
    			if (/*palette*/ ctx[5] === void 0) add_render_callback(() => /*select1_change_handler*/ ctx[10].call(select1));
    			add_location(select1, file, 45, 2, 1292);
    			attr_dev(div4, "class", "input-field col s6");
    			add_location(div4, file, 44, 1, 1257);
    			if (/*colorText*/ ctx[0] === void 0) add_render_callback(() => /*select2_change_handler*/ ctx[11].call(select2));
    			add_location(select2, file, 53, 2, 1468);
    			attr_dev(div5, "class", "input-field col s6");
    			add_location(div5, file, 52, 1, 1433);
    			if (/*textPalette*/ ctx[1] === void 0) add_render_callback(() => /*select3_change_handler*/ ctx[12].call(select3));
    			add_location(select3, file, 61, 2, 1650);
    			attr_dev(div6, "class", "input-field col s6");
    			add_location(div6, file, 60, 1, 1615);
    			attr_dev(div7, "class", "row col left");
    			add_location(div7, file, 34, 0, 1062);

    			dispose = [
    				listen_dev(select0, "change", /*select0_change_handler*/ ctx[9]),
    				listen_dev(select1, "change", /*select1_change_handler*/ ctx[10]),
    				listen_dev(select2, "change", /*select2_change_handler*/ ctx[11]),
    				listen_dev(select3, "change", /*select3_change_handler*/ ctx[12])
    			];
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t0, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div0);
    			append_dev(div0, t3);
    			append_dev(div2, t4);
    			append_dev(div2, div1);
    			append_dev(div1, t5);
    			insert_dev(target, t6, anchor);
    			insert_dev(target, div7, anchor);
    			append_dev(div7, div3);
    			append_dev(div3, select0);

    			for (let i = 0; i < each_blocks_3.length; i += 1) {
    				each_blocks_3[i].m(select0, null);
    			}

    			select_option(select0, /*color*/ ctx[4]);
    			append_dev(div7, t7);
    			append_dev(div7, div4);
    			append_dev(div4, select1);

    			for (let i = 0; i < each_blocks_2.length; i += 1) {
    				each_blocks_2[i].m(select1, null);
    			}

    			select_option(select1, /*palette*/ ctx[5]);
    			append_dev(div7, t8);
    			append_dev(div7, div5);
    			append_dev(div5, select2);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].m(select2, null);
    			}

    			select_option(select2, /*colorText*/ ctx[0]);
    			append_dev(div7, t9);
    			append_dev(div7, div6);
    			append_dev(div6, select3);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(select3, null);
    			}

    			select_option(select3, /*textPalette*/ ctx[1]);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*class1*/ 4) set_data_dev(t3, /*class1*/ ctx[2]);

    			if (dirty & /*class1*/ 4 && div0_class_value !== (div0_class_value = "" + (null_to_empty(/*class1*/ ctx[2]) + " svelte-11jysl8"))) {
    				attr_dev(div0, "class", div0_class_value);
    			}

    			if (dirty & /*class2*/ 8) set_data_dev(t5, /*class2*/ ctx[3]);

    			if (dirty & /*class2*/ 8 && div1_class_value !== (div1_class_value = "" + (null_to_empty(/*class2*/ ctx[3]) + " svelte-11jysl8"))) {
    				attr_dev(div1, "class", div1_class_value);
    			}

    			if (dirty & /*colors*/ 64) {
    				each_value_3 = /*colors*/ ctx[6];
    				let i;

    				for (i = 0; i < each_value_3.length; i += 1) {
    					const child_ctx = get_each_context_3(ctx, each_value_3, i);

    					if (each_blocks_3[i]) {
    						each_blocks_3[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_3[i] = create_each_block_3(child_ctx);
    						each_blocks_3[i].c();
    						each_blocks_3[i].m(select0, null);
    					}
    				}

    				for (; i < each_blocks_3.length; i += 1) {
    					each_blocks_3[i].d(1);
    				}

    				each_blocks_3.length = each_value_3.length;
    			}

    			if (dirty & /*color*/ 16) {
    				select_option(select0, /*color*/ ctx[4]);
    			}

    			if (dirty & /*palettes*/ 128) {
    				each_value_2 = /*palettes*/ ctx[7];
    				let i;

    				for (i = 0; i < each_value_2.length; i += 1) {
    					const child_ctx = get_each_context_2(ctx, each_value_2, i);

    					if (each_blocks_2[i]) {
    						each_blocks_2[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_2[i] = create_each_block_2(child_ctx);
    						each_blocks_2[i].c();
    						each_blocks_2[i].m(select1, null);
    					}
    				}

    				for (; i < each_blocks_2.length; i += 1) {
    					each_blocks_2[i].d(1);
    				}

    				each_blocks_2.length = each_value_2.length;
    			}

    			if (dirty & /*palette*/ 32) {
    				select_option(select1, /*palette*/ ctx[5]);
    			}

    			if (dirty & /*colors*/ 64) {
    				each_value_1 = /*colors*/ ctx[6];
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (each_blocks_1[i]) {
    						each_blocks_1[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_1[i] = create_each_block_1(child_ctx);
    						each_blocks_1[i].c();
    						each_blocks_1[i].m(select2, null);
    					}
    				}

    				for (; i < each_blocks_1.length; i += 1) {
    					each_blocks_1[i].d(1);
    				}

    				each_blocks_1.length = each_value_1.length;
    			}

    			if (dirty & /*colorText*/ 1) {
    				select_option(select2, /*colorText*/ ctx[0]);
    			}

    			if (dirty & /*palettes*/ 128) {
    				each_value = /*palettes*/ ctx[7];
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(select3, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			if (dirty & /*textPalette*/ 2) {
    				select_option(select3, /*textPalette*/ ctx[1]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(div2);
    			if (detaching) detach_dev(t6);
    			if (detaching) detach_dev(div7);
    			destroy_each(each_blocks_3, detaching);
    			destroy_each(each_blocks_2, detaching);
    			destroy_each(each_blocks_1, detaching);
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
    	const colors = ("red pink purple deep-purple indigo blue light-blue cyan teal green light-green lime yellow amber orange deep-orange brown grey blue-grey black white transparent").split(" ");
    	const palettes = ("lighten-5 lighten-4 lighten-3 lighten-2 lighten-1 darken-1 darken-2 darken-3 darken-4 accent-1 accent-2 accent-3 accent-4").split(" ");
    	let color = "blue";
    	let palette = "lighten-1";
    	let colorText = "yellow-text";
    	let textPalette = "text-lighten-1";

    	document.addEventListener("DOMContentLoaded", function () {
    		const elems = document.querySelectorAll("select");
    		const instances = M.FormSelect.init(elems, {});
    	});

    	const combinations = colors.length * (palettes.length + 1) * colors.length * (palettes.length + 1);

    	function select0_change_handler() {
    		color = select_value(this);
    		$$invalidate(4, color);
    		$$invalidate(6, colors);
    	}

    	function select1_change_handler() {
    		palette = select_value(this);
    		$$invalidate(5, palette);
    		$$invalidate(7, palettes);
    	}

    	function select2_change_handler() {
    		colorText = select_value(this);
    		$$invalidate(0, colorText);
    		$$invalidate(6, colors);
    	}

    	function select3_change_handler() {
    		textPalette = select_value(this);
    		$$invalidate(1, textPalette);
    		$$invalidate(7, palettes);
    	}

    	$$self.$capture_state = () => {
    		return {};
    	};

    	$$self.$inject_state = $$props => {
    		if ("color" in $$props) $$invalidate(4, color = $$props.color);
    		if ("palette" in $$props) $$invalidate(5, palette = $$props.palette);
    		if ("colorText" in $$props) $$invalidate(0, colorText = $$props.colorText);
    		if ("textPalette" in $$props) $$invalidate(1, textPalette = $$props.textPalette);
    		if ("class1" in $$props) $$invalidate(2, class1 = $$props.class1);
    		if ("class2" in $$props) $$invalidate(3, class2 = $$props.class2);
    	};

    	let class1;
    	let class2;

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*color, colorText*/ 17) {
    			 $$invalidate(2, class1 = `${color} ${colorText}`);
    		}

    		if ($$self.$$.dirty & /*color, palette, colorText, textPalette*/ 51) {
    			 $$invalidate(3, class2 = `${color} ${palette} ${colorText} ${textPalette}`);
    		}
    	};

    	return [
    		colorText,
    		textPalette,
    		class1,
    		class2,
    		color,
    		palette,
    		colors,
    		palettes,
    		combinations,
    		select0_change_handler,
    		select1_change_handler,
    		select2_change_handler,
    		select3_change_handler
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
