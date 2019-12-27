
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
    function prevent_default(fn) {
        return function (event) {
            event.preventDefault();
            // @ts-ignore
            return fn.call(this, event);
        };
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
    function get_current_component() {
        if (!current_component)
            throw new Error(`Function called outside component initialization`);
        return current_component;
    }
    function createEventDispatcher() {
        const component = get_current_component();
        return (type, detail) => {
            const callbacks = component.$$.callbacks[type];
            if (callbacks) {
                // TODO are there situations where events could be dispatched
                // in a server (non-DOM) environment?
                const event = custom_event(type, detail);
                callbacks.slice().forEach(fn => {
                    fn.call(component, event);
                });
            }
        };
    }
    // TODO figure out if we still want to support
    // shorthand events, or if we want to implement
    // a real bubbling mechanism
    function bubble(component, event) {
        const callbacks = component.$$.callbacks[event.type];
        if (callbacks) {
            callbacks.slice().forEach(fn => fn(event));
        }
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

    /* src/Todo.svelte generated by Svelte v3.16.7 */
    const file = "src/Todo.svelte";

    function create_fragment(ctx) {
    	let li;
    	let input;
    	let t0;
    	let span;
    	let t1;
    	let span_class_value;
    	let t2;
    	let button;
    	let dispose;

    	const block = {
    		c: function create() {
    			li = element("li");
    			input = element("input");
    			t0 = space();
    			span = element("span");
    			t1 = text(/*text*/ ctx[0]);
    			t2 = space();
    			button = element("button");
    			button.textContent = "Delete";
    			attr_dev(input, "type", "checkbox");
    			input.checked = /*done*/ ctx[1];
    			add_location(input, file, 18, 1, 261);
    			attr_dev(span, "class", span_class_value = "" + (null_to_empty("done-" + /*done*/ ctx[1]) + " svelte-17vuvu1"));
    			add_location(span, file, 23, 1, 351);
    			add_location(button, file, 24, 1, 395);
    			attr_dev(li, "class", "svelte-17vuvu1");
    			add_location(li, file, 17, 0, 255);

    			dispose = [
    				listen_dev(input, "change", /*change_handler*/ ctx[3], false, false, false),
    				listen_dev(button, "click", /*click_handler*/ ctx[4], false, false, false)
    			];
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    			append_dev(li, input);
    			append_dev(li, t0);
    			append_dev(li, span);
    			append_dev(span, t1);
    			append_dev(li, t2);
    			append_dev(li, button);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*done*/ 2) {
    				prop_dev(input, "checked", /*done*/ ctx[1]);
    			}

    			if (dirty & /*text*/ 1) set_data_dev(t1, /*text*/ ctx[0]);

    			if (dirty & /*done*/ 2 && span_class_value !== (span_class_value = "" + (null_to_empty("done-" + /*done*/ ctx[1]) + " svelte-17vuvu1"))) {
    				attr_dev(span, "class", span_class_value);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);
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
    	const dispatch = createEventDispatcher();
    	let { text } = $$props;
    	let { done } = $$props;
    	const writable_props = ["text", "done"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Todo> was created with unknown prop '${key}'`);
    	});

    	const change_handler = () => dispatch("toggleDone");
    	const click_handler = () => dispatch("delete");

    	$$self.$set = $$props => {
    		if ("text" in $$props) $$invalidate(0, text = $$props.text);
    		if ("done" in $$props) $$invalidate(1, done = $$props.done);
    	};

    	$$self.$capture_state = () => {
    		return { text, done };
    	};

    	$$self.$inject_state = $$props => {
    		if ("text" in $$props) $$invalidate(0, text = $$props.text);
    		if ("done" in $$props) $$invalidate(1, done = $$props.done);
    	};

    	return [text, done, dispatch, change_handler, click_handler];
    }

    class Todo extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, { text: 0, done: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Todo",
    			options,
    			id: create_fragment.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || ({});

    		if (/*text*/ ctx[0] === undefined && !("text" in props)) {
    			console.warn("<Todo> was created without expected prop 'text'");
    		}

    		if (/*done*/ ctx[1] === undefined && !("done" in props)) {
    			console.warn("<Todo> was created without expected prop 'done'");
    		}
    	}

    	get text() {
    		throw new Error("<Todo>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set text(value) {
    		throw new Error("<Todo>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get done() {
    		throw new Error("<Todo>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set done(value) {
    		throw new Error("<Todo>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/TodoList.svelte generated by Svelte v3.16.7 */
    const file$1 = "src/TodoList.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[12] = list[i];
    	return child_ctx;
    }

    // (60:2) {#each todos as todo}
    function create_each_block(ctx) {
    	let current;

    	function toggleDone_handler(...args) {
    		return /*toggleDone_handler*/ ctx[10](/*todo*/ ctx[12], ...args);
    	}

    	function delete_handler(...args) {
    		return /*delete_handler*/ ctx[11](/*todo*/ ctx[12], ...args);
    	}

    	const todo = new Todo({
    			props: {
    				text: /*todo*/ ctx[12].text,
    				done: /*todo*/ ctx[12].done
    			},
    			$$inline: true
    		});

    	todo.$on("toggleDone", toggleDone_handler);
    	todo.$on("delete", delete_handler);

    	const block = {
    		c: function create() {
    			create_component(todo.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(todo, target, anchor);
    			current = true;
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			const todo_changes = {};
    			if (dirty & /*todos*/ 2) todo_changes.text = /*todo*/ ctx[12].text;
    			if (dirty & /*todos*/ 2) todo_changes.done = /*todo*/ ctx[12].done;
    			todo.$set(todo_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(todo.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(todo.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(todo, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(60:2) {#each todos as todo}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let div1;
    	let h2;
    	let t1;
    	let div0;
    	let t2;
    	let t3_value = /*todos*/ ctx[1].filter(func).length + "";
    	let t3;
    	let t4;
    	let t5_value = /*todos*/ ctx[1].length + "";
    	let t5;
    	let t6;
    	let button0;
    	let t8;
    	let br;
    	let t9;
    	let form;
    	let input;
    	let t10;
    	let button1;
    	let t11;
    	let button1_disabled_value;
    	let t12;
    	let ul;
    	let current;
    	let dispose;
    	let each_value = /*todos*/ ctx[1];
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			h2 = element("h2");
    			h2.textContent = "To Do List";
    			t1 = space();
    			div0 = element("div");
    			t2 = text("status = ");
    			t3 = text(t3_value);
    			t4 = text(" of ");
    			t5 = text(t5_value);
    			t6 = text(" remaining\n\t\t");
    			button0 = element("button");
    			button0.textContent = "Archive Completed";
    			t8 = space();
    			br = element("br");
    			t9 = space();
    			form = element("form");
    			input = element("input");
    			t10 = space();
    			button1 = element("button");
    			t11 = text("Add");
    			t12 = space();
    			ul = element("ul");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			add_location(h2, file$1, 39, 1, 764);
    			attr_dev(button0, "class", "svelte-18sxobk");
    			add_location(button0, file$1, 42, 2, 868);
    			add_location(div0, file$1, 40, 1, 785);
    			add_location(br, file$1, 44, 1, 940);
    			attr_dev(input, "type", "text");
    			attr_dev(input, "size", "30");
    			input.autofocus = true;
    			attr_dev(input, "placeholder", "enter new todo here");
    			add_location(input, file$1, 46, 2, 982);
    			button1.disabled = button1_disabled_value = !/*todoText*/ ctx[0];
    			attr_dev(button1, "class", "svelte-18sxobk");
    			add_location(button1, file$1, 53, 2, 1099);
    			add_location(form, file$1, 45, 1, 948);
    			attr_dev(ul, "class", "unstyled svelte-18sxobk");
    			add_location(ul, file$1, 58, 1, 1178);
    			add_location(div1, file$1, 38, 0, 757);

    			dispose = [
    				listen_dev(button0, "click", /*archiveCompleted*/ ctx[3], false, false, false),
    				listen_dev(input, "input", /*input_input_handler*/ ctx[9]),
    				listen_dev(button1, "click", /*addTodo*/ ctx[2], false, false, false),
    				listen_dev(form, "submit", prevent_default(/*submit_handler*/ ctx[8]), false, true, false)
    			];
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, h2);
    			append_dev(div1, t1);
    			append_dev(div1, div0);
    			append_dev(div0, t2);
    			append_dev(div0, t3);
    			append_dev(div0, t4);
    			append_dev(div0, t5);
    			append_dev(div0, t6);
    			append_dev(div0, button0);
    			append_dev(div1, t8);
    			append_dev(div1, br);
    			append_dev(div1, t9);
    			append_dev(div1, form);
    			append_dev(form, input);
    			set_input_value(input, /*todoText*/ ctx[0]);
    			append_dev(form, t10);
    			append_dev(form, button1);
    			append_dev(button1, t11);
    			append_dev(div1, t12);
    			append_dev(div1, ul);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(ul, null);
    			}

    			current = true;
    			input.focus();
    		},
    		p: function update(ctx, [dirty]) {
    			if ((!current || dirty & /*todos*/ 2) && t3_value !== (t3_value = /*todos*/ ctx[1].filter(func).length + "")) set_data_dev(t3, t3_value);
    			if ((!current || dirty & /*todos*/ 2) && t5_value !== (t5_value = /*todos*/ ctx[1].length + "")) set_data_dev(t5, t5_value);

    			if (dirty & /*todoText*/ 1 && input.value !== /*todoText*/ ctx[0]) {
    				set_input_value(input, /*todoText*/ ctx[0]);
    			}

    			if (!current || dirty & /*todoText*/ 1 && button1_disabled_value !== (button1_disabled_value = !/*todoText*/ ctx[0])) {
    				prop_dev(button1, "disabled", button1_disabled_value);
    			}

    			if (dirty & /*todos, toggleDone, deleteTodo*/ 50) {
    				each_value = /*todos*/ ctx[1];
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
    						each_blocks[i].m(ul, null);
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
    			if (detaching) detach_dev(div1);
    			destroy_each(each_blocks, detaching);
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

    const func = t => !t.done;

    function instance$1($$self, $$props, $$invalidate) {
    	let lastId = 0;
    	const createTodo = (text, done = false) => ({ id: ++lastId, text, done });
    	let todoText = "";
    	let todos = [createTodo("learn Svelte", true), createTodo("build a Svelte app")];

    	function addTodo() {
    		$$invalidate(1, todos = todos.concat(createTodo(todoText)));
    		$$invalidate(0, todoText = "");
    	}

    	const archiveCompleted = () => $$invalidate(1, todos = todos.filter(t => !t.done));
    	const deleteTodo = id => $$invalidate(1, todos = todos.filter(t => t.id !== id));
    	const toggleDone = id => $$invalidate(1, todos = todos.map(t => t.id === id ? { ...t, done: !t.done } : t));

    	function submit_handler(event) {
    		bubble($$self, event);
    	}

    	function input_input_handler() {
    		todoText = this.value;
    		$$invalidate(0, todoText);
    	}

    	const toggleDone_handler = todo => toggleDone(todo.id);
    	const delete_handler = todo => deleteTodo(todo.id);

    	$$self.$capture_state = () => {
    		return {};
    	};

    	$$self.$inject_state = $$props => {
    		if ("lastId" in $$props) lastId = $$props.lastId;
    		if ("todoText" in $$props) $$invalidate(0, todoText = $$props.todoText);
    		if ("todos" in $$props) $$invalidate(1, todos = $$props.todos);
    	};

    	return [
    		todoText,
    		todos,
    		addTodo,
    		archiveCompleted,
    		deleteTodo,
    		toggleDone,
    		lastId,
    		createTodo,
    		submit_handler,
    		input_input_handler,
    		toggleDone_handler,
    		delete_handler
    	];
    }

    class TodoList extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "TodoList",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    const app = new TodoList({target: document.body});

    return app;

}());
//# sourceMappingURL=bundle.js.map
