
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

    /* src/SiteHeader.svelte generated by Svelte v3.16.7 */

    const file = "src/SiteHeader.svelte";

    function create_fragment(ctx) {
    	let header;
    	let h1;
    	let t1;
    	let nav;
    	let ul;
    	let li0;
    	let button0;
    	let t3;
    	let li1;
    	let button1;
    	let dispose;

    	const block = {
    		c: function create() {
    			header = element("header");
    			h1 = element("h1");
    			h1.textContent = "M.C. Desplat";
    			t1 = space();
    			nav = element("nav");
    			ul = element("ul");
    			li0 = element("li");
    			button0 = element("button");
    			button0.textContent = "My work";
    			t3 = space();
    			li1 = element("li");
    			button1 = element("button");
    			button1.textContent = "About me";
    			add_location(h1, file, 5, 1, 67);
    			add_location(button0, file, 9, 4, 115);
    			add_location(li0, file, 8, 3, 106);
    			add_location(button1, file, 12, 4, 183);
    			add_location(li1, file, 11, 3, 174);
    			add_location(ul, file, 7, 2, 98);
    			add_location(nav, file, 6, 1, 90);
    			attr_dev(header, "class", "site-header");
    			add_location(header, file, 4, 0, 37);

    			dispose = [
    				listen_dev(button0, "click", /*click_handler*/ ctx[1], false, false, false),
    				listen_dev(button1, "click", /*click_handler_1*/ ctx[2], false, false, false)
    			];
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, header, anchor);
    			append_dev(header, h1);
    			append_dev(header, t1);
    			append_dev(header, nav);
    			append_dev(nav, ul);
    			append_dev(ul, li0);
    			append_dev(li0, button0);
    			append_dev(ul, t3);
    			append_dev(ul, li1);
    			append_dev(li1, button1);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(header);
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
    	let { page } = $$props;
    	const writable_props = ["page"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<SiteHeader> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => $$invalidate(0, page = 0);
    	const click_handler_1 = () => $$invalidate(0, page = 1);

    	$$self.$set = $$props => {
    		if ("page" in $$props) $$invalidate(0, page = $$props.page);
    	};

    	$$self.$capture_state = () => {
    		return { page };
    	};

    	$$self.$inject_state = $$props => {
    		if ("page" in $$props) $$invalidate(0, page = $$props.page);
    	};

    	return [page, click_handler, click_handler_1];
    }

    class SiteHeader extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, { page: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "SiteHeader",
    			options,
    			id: create_fragment.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || ({});

    		if (/*page*/ ctx[0] === undefined && !("page" in props)) {
    			console.warn("<SiteHeader> was created without expected prop 'page'");
    		}
    	}

    	get page() {
    		throw new Error("<SiteHeader>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set page(value) {
    		throw new Error("<SiteHeader>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/Sidebar.svelte generated by Svelte v3.16.7 */

    const file$1 = "src/Sidebar.svelte";

    function create_fragment$1(ctx) {
    	let div;

    	const block = {
    		c: function create() {
    			div = element("div");
    			attr_dev(div, "class", "");
    			add_location(div, file$1, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
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

    class Sidebar extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, null, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Sidebar",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    /* src/Thumbnail.svelte generated by Svelte v3.16.7 */

    const file$2 = "src/Thumbnail.svelte";

    function create_fragment$2(ctx) {
    	let div;
    	let button;
    	let img;
    	let img_src_value;
    	let img_alt_value;

    	const block = {
    		c: function create() {
    			div = element("div");
    			button = element("button");
    			img = element("img");
    			if (img.src !== (img_src_value = "images/" + /*image*/ ctx[0])) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", img_alt_value = "" + (/*website*/ ctx[1] + " website thumbnail"));
    			add_location(img, file$2, 5, 9, 97);
    			add_location(button, file$2, 5, 1, 89);
    			attr_dev(div, "class", "thumbnail slide-in-top");
    			add_location(div, file$2, 4, 0, 51);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, button);
    			append_dev(button, img);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*image*/ 1 && img.src !== (img_src_value = "images/" + /*image*/ ctx[0])) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if (dirty & /*website*/ 2 && img_alt_value !== (img_alt_value = "" + (/*website*/ ctx[1] + " website thumbnail"))) {
    				attr_dev(img, "alt", img_alt_value);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
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

    function instance$1($$self, $$props, $$invalidate) {
    	let { name } = $$props, { image } = $$props, { website } = $$props;
    	const writable_props = ["name", "image", "website"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Thumbnail> was created with unknown prop '${key}'`);
    	});

    	$$self.$set = $$props => {
    		if ("name" in $$props) $$invalidate(2, name = $$props.name);
    		if ("image" in $$props) $$invalidate(0, image = $$props.image);
    		if ("website" in $$props) $$invalidate(1, website = $$props.website);
    	};

    	$$self.$capture_state = () => {
    		return { name, image, website };
    	};

    	$$self.$inject_state = $$props => {
    		if ("name" in $$props) $$invalidate(2, name = $$props.name);
    		if ("image" in $$props) $$invalidate(0, image = $$props.image);
    		if ("website" in $$props) $$invalidate(1, website = $$props.website);
    	};

    	return [image, website, name];
    }

    class Thumbnail extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$2, safe_not_equal, { name: 2, image: 0, website: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Thumbnail",
    			options,
    			id: create_fragment$2.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || ({});

    		if (/*name*/ ctx[2] === undefined && !("name" in props)) {
    			console.warn("<Thumbnail> was created without expected prop 'name'");
    		}

    		if (/*image*/ ctx[0] === undefined && !("image" in props)) {
    			console.warn("<Thumbnail> was created without expected prop 'image'");
    		}

    		if (/*website*/ ctx[1] === undefined && !("website" in props)) {
    			console.warn("<Thumbnail> was created without expected prop 'website'");
    		}
    	}

    	get name() {
    		throw new Error("<Thumbnail>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set name(value) {
    		throw new Error("<Thumbnail>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get image() {
    		throw new Error("<Thumbnail>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set image(value) {
    		throw new Error("<Thumbnail>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get website() {
    		throw new Error("<Thumbnail>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set website(value) {
    		throw new Error("<Thumbnail>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/Thumbnails.svelte generated by Svelte v3.16.7 */
    const file$3 = "src/Thumbnails.svelte";

    function create_fragment$3(ctx) {
    	let div;
    	let t0;
    	let t1;
    	let t2;
    	let t3;
    	let t4;
    	let current;
    	const sidebar = new Sidebar({ $$inline: true });

    	const thumbnail0 = new Thumbnail({
    			props: {
    				name: "clac",
    				image: "clac-home-th.jpg",
    				website: "certainslaimentchaud.com"
    			},
    			$$inline: true
    		});

    	const thumbnail1 = new Thumbnail({
    			props: {
    				name: "solrey",
    				image: "solrey-home-th.jpg",
    				website: "solrey.fr"
    			},
    			$$inline: true
    		});

    	const thumbnail2 = new Thumbnail({
    			props: {
    				name: "xadx",
    				image: "xadx-home-th.jpg",
    				website: "alexandedesplat.net"
    			},
    			$$inline: true
    		});

    	const thumbnail3 = new Thumbnail({
    			props: {
    				name: "digitpaul",
    				image: "digitpaul-home-th.jpg",
    				website: "digitpaul.se"
    			},
    			$$inline: true
    		});

    	const thumbnail4 = new Thumbnail({
    			props: {
    				name: "pnog",
    				image: "pnog-th.jpg",
    				website: "paulsneworleansgang.se"
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(sidebar.$$.fragment);
    			t0 = space();
    			create_component(thumbnail0.$$.fragment);
    			t1 = space();
    			create_component(thumbnail1.$$.fragment);
    			t2 = space();
    			create_component(thumbnail2.$$.fragment);
    			t3 = space();
    			create_component(thumbnail3.$$.fragment);
    			t4 = space();
    			create_component(thumbnail4.$$.fragment);
    			attr_dev(div, "class", "works-thumbnails");
    			add_location(div, file$3, 5, 0, 104);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(sidebar, div, null);
    			append_dev(div, t0);
    			mount_component(thumbnail0, div, null);
    			append_dev(div, t1);
    			mount_component(thumbnail1, div, null);
    			append_dev(div, t2);
    			mount_component(thumbnail2, div, null);
    			append_dev(div, t3);
    			mount_component(thumbnail3, div, null);
    			append_dev(div, t4);
    			mount_component(thumbnail4, div, null);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(sidebar.$$.fragment, local);
    			transition_in(thumbnail0.$$.fragment, local);
    			transition_in(thumbnail1.$$.fragment, local);
    			transition_in(thumbnail2.$$.fragment, local);
    			transition_in(thumbnail3.$$.fragment, local);
    			transition_in(thumbnail4.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(sidebar.$$.fragment, local);
    			transition_out(thumbnail0.$$.fragment, local);
    			transition_out(thumbnail1.$$.fragment, local);
    			transition_out(thumbnail2.$$.fragment, local);
    			transition_out(thumbnail3.$$.fragment, local);
    			transition_out(thumbnail4.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(sidebar);
    			destroy_component(thumbnail0);
    			destroy_component(thumbnail1);
    			destroy_component(thumbnail2);
    			destroy_component(thumbnail3);
    			destroy_component(thumbnail4);
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

    class Thumbnails extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, null, create_fragment$3, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Thumbnails",
    			options,
    			id: create_fragment$3.name
    		});
    	}
    }

    /* src/WorkClac.svelte generated by Svelte v3.16.7 */

    const file$4 = "src/WorkClac.svelte";

    function create_fragment$4(ctx) {
    	let div3;
    	let div0;
    	let h2;
    	let t0;
    	let span;
    	let t2;
    	let div1;
    	let h3;
    	let t4;
    	let p0;
    	let t6;
    	let p1;
    	let t8;
    	let p2;
    	let t10;
    	let p3;
    	let t12;
    	let div2;
    	let h4;
    	let t14;
    	let h5;
    	let a;
    	let t16;

    	const block = {
    		c: function create() {
    			div3 = element("div");
    			div0 = element("div");
    			h2 = element("h2");
    			t0 = text("Certains L'Aiment Chaud ");
    			span = element("span");
    			span.textContent = "Female jazz band";
    			t2 = space();
    			div1 = element("div");
    			h3 = element("h3");
    			h3.textContent = "Certains L'Aiment Chaud";
    			t4 = space();
    			p0 = element("p");
    			p0.textContent = "Lorem Salu bissame ! Wie geht's les samis ? Hans apporte moi une Wurschtsalad\n\t\t\tavec un picon bitte, s'il te plaît. Voss ? Une Carola et du Melfor ? Yo dû,\n\t\t\tespèce de Knäckes, ch'ai dit un picon !";
    			t6 = space();
    			p1 = element("p");
    			p1.textContent = "Hopla vous savez que la mamsell Huguette, la miss Miss Dahlias du messti de Bischheim\n\t\t\tétait au Christkindelsmärik en compagnie de Richard Schirmeck (celui qui a un blottkopf),\n\t\t\tle mari de Chulia Roberstau, qui lui trempait sa Nüdle dans sa Schneck ! Yo dû,\n\t\t\tPfourtz ! Ch'espère qu'ils avaient du Kabinetpapier, Gal !";
    			t8 = space();
    			p2 = element("p");
    			p2.textContent = "Yoo ch'ai lu dans les DNA que le Racing a encore perdu contre Oberschaeffolsheim. Verdammi\n\t\t\tet moi ch'avais donc parié deux knacks et une flammekueche. Ah so ? T'inquiète, ch'ai\n\t\t\tramené du schpeck, du chambon, un kuglopf et du schnaps dans mon rucksack. Allez,\n\t\t\ts'guelt ! Wotch a kofee avec ton bibalaekaess et ta wurscht ? Yeuh non che suis\n\t\t\tau réchime, je ne mange plus que des Grumbeere light et che fais de la chym avec Chulien.\n\t\t\tTiens, un rottznoz sur le comptoir.";
    			t10 = space();
    			p3 = element("p");
    			p3.textContent = "Tu restes pour le lotto-owe ce soir, y'a baeckeoffe ? Yeuh non, merci vielmols mais\n\t\t\tche dois partir à la Coopé de Truchtersheim acheter des mänele et des rossbolla pour les\n\t\t\tgamins. Hopla tchao bissame ! Consectetur adipiscing elit";
    			t12 = space();
    			div2 = element("div");
    			h4 = element("h4");
    			h4.textContent = "visit site";
    			t14 = space();
    			h5 = element("h5");
    			a = element("a");
    			a.textContent = "certainslaimentchaud.com";
    			t16 = text(" | 2019");
    			add_location(span, file$4, 11, 27, 201);
    			add_location(h2, file$4, 10, 2, 169);
    			attr_dev(div0, "class", "clac full-size svelte-np6e6j");
    			add_location(div0, file$4, 9, 1, 138);
    			add_location(h3, file$4, 17, 2, 305);
    			add_location(p0, file$4, 18, 2, 340);
    			add_location(p1, file$4, 23, 2, 581);
    			add_location(p2, file$4, 29, 2, 936);
    			add_location(p3, file$4, 37, 2, 1447);
    			attr_dev(div1, "id", "clac-desc");
    			attr_dev(div1, "class", "clac desc");
    			add_location(div1, file$4, 16, 1, 264);
    			add_location(h4, file$4, 46, 2, 1764);
    			attr_dev(a, "href", "https://certainslaimentchaud.com/");
    			add_location(a, file$4, 48, 3, 1794);
    			add_location(h5, file$4, 47, 2, 1786);
    			attr_dev(div2, "class", "clac site-link");
    			add_location(div2, file$4, 45, 1, 1733);
    			attr_dev(div3, "id", "clac");
    			attr_dev(div3, "class", "work");
    			add_location(div3, file$4, 6, 0, 91);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div3, anchor);
    			append_dev(div3, div0);
    			append_dev(div0, h2);
    			append_dev(h2, t0);
    			append_dev(h2, span);
    			append_dev(div3, t2);
    			append_dev(div3, div1);
    			append_dev(div1, h3);
    			append_dev(div1, t4);
    			append_dev(div1, p0);
    			append_dev(div1, t6);
    			append_dev(div1, p1);
    			append_dev(div1, t8);
    			append_dev(div1, p2);
    			append_dev(div1, t10);
    			append_dev(div1, p3);
    			append_dev(div3, t12);
    			append_dev(div3, div2);
    			append_dev(div2, h4);
    			append_dev(div2, t14);
    			append_dev(div2, h5);
    			append_dev(h5, a);
    			append_dev(h5, t16);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div3);
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

    class WorkClac extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, null, create_fragment$4, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "WorkClac",
    			options,
    			id: create_fragment$4.name
    		});
    	}
    }

    /* src/WorkSolrey.svelte generated by Svelte v3.16.7 */

    const file$5 = "src/WorkSolrey.svelte";

    function create_fragment$5(ctx) {
    	let div0;
    	let h2;
    	let t0;
    	let span;
    	let t2;
    	let div1;
    	let h3;
    	let t4;
    	let p0;
    	let t6;
    	let p1;
    	let t8;
    	let div2;
    	let h4;
    	let t10;
    	let h5;
    	let a;
    	let t12;

    	const block = {
    		c: function create() {
    			div0 = element("div");
    			h2 = element("h2");
    			t0 = text("Solrey ");
    			span = element("span");
    			span.textContent = "Producer, stage director, violinist";
    			t2 = space();
    			div1 = element("div");
    			h3 = element("h3");
    			h3.textContent = "Solrey";
    			t4 = space();
    			p0 = element("p");
    			p0.textContent = "Yoo ch'ai lu dans les DNA que le Racing a encore perdu contre Oberschaeffolsheim. Verdammi\n\t\tet moi ch'avais donc parié deux knacks et une flammekueche. Ah so ? T'inquiète, ch'ai\n\t\tramené du schpeck, du chambon, un kuglopf et du schnaps dans mon rucksack. Allez,\n\t\ts'guelt ! Wotch a kofee avec ton bibalaekaess et ta wurscht ? Yeuh non che suis\n\t\tau réchime, je ne mange plus que des Grumbeere light et che fais de la chym avec Chulien.\n\t\tTiens, un rottznoz sur le comptoir.";
    			t6 = space();
    			p1 = element("p");
    			p1.textContent = "Tu restes pour le lotto-owe ce soir, y'a baeckeoffe ? Yeuh non, merci vielmols mais\n\t\tche dois partir à la Coopé de Truchtersheim acheter des mänele et des rossbolla pour les\n\t\tgamins. Hopla tchao bissame ! Consectetur adipiscing elit";
    			t8 = space();
    			div2 = element("div");
    			h4 = element("h4");
    			h4.textContent = "visit site";
    			t10 = space();
    			h5 = element("h5");
    			a = element("a");
    			a.textContent = "solrey.fr";
    			t12 = text(" | 2019");
    			add_location(span, file$5, 9, 9, 156);
    			add_location(h2, file$5, 8, 1, 142);
    			attr_dev(div0, "class", "solrey full-size svelte-z5ak81");
    			add_location(div0, file$5, 7, 0, 110);
    			add_location(h3, file$5, 15, 1, 272);
    			add_location(p0, file$5, 16, 1, 289);
    			add_location(p1, file$5, 24, 1, 792);
    			attr_dev(div1, "id", "solrey-desc");
    			attr_dev(div1, "class", "desc");
    			add_location(div1, file$5, 14, 0, 235);
    			add_location(h4, file$5, 33, 1, 1104);
    			attr_dev(a, "href", "https://solrey.fr/");
    			add_location(a, file$5, 35, 2, 1132);
    			add_location(h5, file$5, 34, 1, 1125);
    			attr_dev(div2, "class", "solrey site-link");
    			add_location(div2, file$5, 32, 0, 1072);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div0, anchor);
    			append_dev(div0, h2);
    			append_dev(h2, t0);
    			append_dev(h2, span);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, div1, anchor);
    			append_dev(div1, h3);
    			append_dev(div1, t4);
    			append_dev(div1, p0);
    			append_dev(div1, t6);
    			append_dev(div1, p1);
    			insert_dev(target, t8, anchor);
    			insert_dev(target, div2, anchor);
    			append_dev(div2, h4);
    			append_dev(div2, t10);
    			append_dev(div2, h5);
    			append_dev(h5, a);
    			append_dev(h5, t12);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div0);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(div1);
    			if (detaching) detach_dev(t8);
    			if (detaching) detach_dev(div2);
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

    class WorkSolrey extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, null, create_fragment$5, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "WorkSolrey",
    			options,
    			id: create_fragment$5.name
    		});
    	}
    }

    /* src/WorkAd.svelte generated by Svelte v3.16.7 */

    const file$6 = "src/WorkAd.svelte";

    function create_fragment$6(ctx) {
    	let div3;
    	let div0;
    	let h2;
    	let t0;
    	let span;
    	let t2;
    	let div1;
    	let h3;
    	let t4;
    	let p0;
    	let t6;
    	let p1;
    	let t8;
    	let p2;
    	let t10;
    	let p3;
    	let t12;
    	let div2;
    	let h4;
    	let t14;
    	let h5;
    	let a;
    	let t16;

    	const block = {
    		c: function create() {
    			div3 = element("div");
    			div0 = element("div");
    			h2 = element("h2");
    			t0 = text("Alexandre Desplat ");
    			span = element("span");
    			span.textContent = "Film music composer";
    			t2 = space();
    			div1 = element("div");
    			h3 = element("h3");
    			h3.textContent = "Alexandre Desplat";
    			t4 = space();
    			p0 = element("p");
    			p0.textContent = "Hopla vous savez que la mamsell Huguette, la miss Miss Dahlias du messti de Bischheim\n\t\tétait au Christkindelsmärik en compagnie de Richard Schirmeck (celui qui a un blottkopf),\n\t\tle mari de Chulia Roberstau, qui lui trempait sa Nüdle dans sa Schneck ! Yo dû,\n\t\tPfourtz ! Ch'espère qu'ils avaient du Kabinetpapier, Gal !";
    			t6 = space();
    			p1 = element("p");
    			p1.textContent = "Tu restes pour le lotto-owe ce soir, y'a baeckeoffe ? Yeuh non, merci vielmols mais\n\t\tche dois partir à la Coopé de Truchtersheim acheter des mänele et des rossbolla pour les\n\t\tgamins. Hopla tchao bissame ! Consectetur adipiscing elit";
    			t8 = space();
    			p2 = element("p");
    			p2.textContent = "Yoo ch'ai lu dans les DNA que le Racing a encore perdu contre Oberschaeffolsheim. Verdammi\n\t\tet moi ch'avais donc parié deux knacks et une flammekueche. Ah so ? T'inquiète, ch'ai\n\t\tramené du schpeck, du chambon, un kuglopf et du schnaps dans mon rucksack. Allez,\n\t\ts'guelt ! Wotch a kofee avec ton bibalaekaess et ta wurscht ? Yeuh non che suis\n\t\tau réchime, je ne mange plus que des Grumbeere light et che fais de la chym avec Chulien.\n\t\tTiens, un rottznoz sur le comptoir.";
    			t10 = space();
    			p3 = element("p");
    			p3.textContent = "Tu restes pour le lotto-owe ce soir, y'a baeckeoffe ? Yeuh non, merci vielmols mais\n\t\tche dois partir à la Coopé de Truchtersheim acheter des mänele et des rossbolla pour les\n\t\tgamins. Hopla tchao bissame ! Consectetur adipiscing elit";
    			t12 = space();
    			div2 = element("div");
    			h4 = element("h4");
    			h4.textContent = "visit site";
    			t14 = space();
    			h5 = element("h5");
    			a = element("a");
    			a.textContent = "alexandredesplat.net";
    			t16 = text(" | 2018");
    			add_location(span, file$6, 11, 20, 183);
    			add_location(h2, file$6, 10, 1, 158);
    			attr_dev(div0, "class", "ad full-size svelte-mfj2kv");
    			add_location(div0, file$6, 9, 0, 130);
    			add_location(h3, file$6, 17, 1, 281);
    			add_location(p0, file$6, 18, 1, 309);
    			add_location(p1, file$6, 24, 1, 658);
    			add_location(p2, file$6, 29, 1, 916);
    			add_location(p3, file$6, 37, 1, 1419);
    			attr_dev(div1, "id", "ad-desc");
    			attr_dev(div1, "class", "ad desc");
    			add_location(div1, file$6, 16, 0, 245);
    			add_location(h4, file$6, 46, 1, 1726);
    			attr_dev(a, "href", "https://www.alexandredesplat.net");
    			add_location(a, file$6, 48, 2, 1754);
    			add_location(h5, file$6, 47, 1, 1747);
    			attr_dev(div2, "class", "ad site-link");
    			add_location(div2, file$6, 45, 0, 1698);
    			attr_dev(div3, "id", "ad");
    			attr_dev(div3, "class", "work");
    			add_location(div3, file$6, 6, 0, 87);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div3, anchor);
    			append_dev(div3, div0);
    			append_dev(div0, h2);
    			append_dev(h2, t0);
    			append_dev(h2, span);
    			append_dev(div3, t2);
    			append_dev(div3, div1);
    			append_dev(div1, h3);
    			append_dev(div1, t4);
    			append_dev(div1, p0);
    			append_dev(div1, t6);
    			append_dev(div1, p1);
    			append_dev(div1, t8);
    			append_dev(div1, p2);
    			append_dev(div1, t10);
    			append_dev(div1, p3);
    			append_dev(div3, t12);
    			append_dev(div3, div2);
    			append_dev(div2, h4);
    			append_dev(div2, t14);
    			append_dev(div2, h5);
    			append_dev(h5, a);
    			append_dev(h5, t16);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div3);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    class WorkAd extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, null, create_fragment$6, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "WorkAd",
    			options,
    			id: create_fragment$6.name
    		});
    	}
    }

    /* src/WorkDigitpaul.svelte generated by Svelte v3.16.7 */

    const file$7 = "src/WorkDigitpaul.svelte";

    function create_fragment$7(ctx) {
    	let div0;
    	let h2;
    	let t0;
    	let span0;
    	let t2;
    	let div1;
    	let h3;
    	let t3;
    	let br0;
    	let t4;
    	let span1;
    	let t6;
    	let br1;
    	let t7;
    	let span2;
    	let t9;
    	let p0;
    	let t11;
    	let p1;
    	let t13;
    	let p2;
    	let t15;
    	let p3;
    	let t17;
    	let div2;
    	let h4;
    	let t19;
    	let h50;
    	let a0;
    	let t21;
    	let t22;
    	let h51;
    	let a1;
    	let t24;
    	let t25;
    	let h52;
    	let a2;
    	let t27;

    	const block = {
    		c: function create() {
    			div0 = element("div");
    			h2 = element("h2");
    			t0 = text("Digitpaul ");
    			span0 = element("span");
    			span0.textContent = "Multisite for a jazz musician, with archives and news";
    			t2 = space();
    			div1 = element("div");
    			h3 = element("h3");
    			t3 = text("Digitpaul\n\t\t");
    			br0 = element("br");
    			t4 = space();
    			span1 = element("span");
    			span1.textContent = "Paul's New Orleans Gang";
    			t6 = space();
    			br1 = element("br");
    			t7 = space();
    			span2 = element("span");
    			span2.textContent = "Paul and His Gang";
    			t9 = space();
    			p0 = element("p");
    			p0.textContent = "Hopla vous savez que la mamsell Huguette, la miss Miss Dahlias du messti de Bischheim\n\t\tétait au Christkindelsmärik en compagnie de Richard Schirmeck (celui qui a un blottkopf),\n\t\tle mari de Chulia Roberstau, qui lui trempait sa Nüdle dans sa Schneck ! Yo dû,\n\t\tPfourtz ! Ch'espère qu'ils avaient du Kabinetpapier, Gal !";
    			t11 = space();
    			p1 = element("p");
    			p1.textContent = "Tu restes pour le lotto-owe ce soir, y'a baeckeoffe ? Yeuh non, merci vielmols mais\n\t\tche dois partir à la Coopé de Truchtersheim acheter des mänele et des rossbolla pour les\n\t\tgamins. Hopla tchao bissame ! Consectetur adipiscing elit";
    			t13 = space();
    			p2 = element("p");
    			p2.textContent = "Yoo ch'ai lu dans les DNA que le Racing a encore perdu contre Oberschaeffolsheim. Verdammi\n\t\tet moi ch'avais donc parié deux knacks et une flammekueche. Ah so ? T'inquiète, ch'ai\n\t\tramené du schpeck, du chambon, un kuglopf et du schnaps dans mon rucksack. Allez,\n\t\ts'guelt ! Wotch a kofee avec ton bibalaekaess et ta wurscht ? Yeuh non che suis\n\t\tau réchime, je ne mange plus que des Grumbeere light et che fais de la chym avec Chulien.\n\t\tTiens, un rottznoz sur le comptoir.";
    			t15 = space();
    			p3 = element("p");
    			p3.textContent = "Tu restes pour le lotto-owe ce soir, y'a baeckeoffe ? Yeuh non, merci vielmols mais\n\t\tche dois partir à la Coopé de Truchtersheim acheter des mänele et des rossbolla pour les\n\t\tgamins. Hopla tchao bissame ! Consectetur adipiscing elit";
    			t17 = space();
    			div2 = element("div");
    			h4 = element("h4");
    			h4.textContent = "visit sites";
    			t19 = space();
    			h50 = element("h5");
    			a0 = element("a");
    			a0.textContent = "digitpaul.se";
    			t21 = text(" | 2017");
    			t22 = space();
    			h51 = element("h5");
    			a1 = element("a");
    			a1.textContent = "paulsneworleansgang.se";
    			t24 = text(" | 2017");
    			t25 = space();
    			h52 = element("h5");
    			a2 = element("a");
    			a2.textContent = "paulandhisgang.com";
    			t27 = text(" | 2017");
    			add_location(span0, file$7, 9, 12, 168);
    			add_location(h2, file$7, 8, 1, 151);
    			attr_dev(div0, "class", "digitpaul full-size svelte-1lq5zop");
    			add_location(div0, file$7, 7, 0, 116);
    			add_location(br0, file$7, 17, 2, 323);
    			add_location(span1, file$7, 18, 2, 332);
    			add_location(br1, file$7, 19, 2, 371);
    			add_location(span2, file$7, 20, 2, 380);
    			add_location(h3, file$7, 15, 1, 304);
    			add_location(p0, file$7, 22, 1, 419);
    			add_location(p1, file$7, 28, 1, 768);
    			add_location(p2, file$7, 33, 1, 1026);
    			add_location(p3, file$7, 41, 1, 1529);
    			attr_dev(div1, "id", "digitpaul-desc");
    			attr_dev(div1, "class", "desc");
    			add_location(div1, file$7, 14, 0, 264);
    			add_location(h4, file$7, 50, 1, 1844);
    			attr_dev(a0, "href", "https://www.digitpaul.se/");
    			add_location(a0, file$7, 52, 2, 1873);
    			add_location(h50, file$7, 51, 1, 1866);
    			attr_dev(a1, "href", "https://www.paulsneworleansgang.se/");
    			add_location(a1, file$7, 55, 2, 1948);
    			add_location(h51, file$7, 54, 1, 1941);
    			attr_dev(a2, "href", "https://www.paulandhisgang.com/");
    			add_location(a2, file$7, 58, 2, 2043);
    			add_location(h52, file$7, 57, 1, 2036);
    			attr_dev(div2, "class", "digitpaul site-link");
    			add_location(div2, file$7, 49, 0, 1809);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div0, anchor);
    			append_dev(div0, h2);
    			append_dev(h2, t0);
    			append_dev(h2, span0);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, div1, anchor);
    			append_dev(div1, h3);
    			append_dev(h3, t3);
    			append_dev(h3, br0);
    			append_dev(h3, t4);
    			append_dev(h3, span1);
    			append_dev(h3, t6);
    			append_dev(h3, br1);
    			append_dev(h3, t7);
    			append_dev(h3, span2);
    			append_dev(div1, t9);
    			append_dev(div1, p0);
    			append_dev(div1, t11);
    			append_dev(div1, p1);
    			append_dev(div1, t13);
    			append_dev(div1, p2);
    			append_dev(div1, t15);
    			append_dev(div1, p3);
    			insert_dev(target, t17, anchor);
    			insert_dev(target, div2, anchor);
    			append_dev(div2, h4);
    			append_dev(div2, t19);
    			append_dev(div2, h50);
    			append_dev(h50, a0);
    			append_dev(h50, t21);
    			append_dev(div2, t22);
    			append_dev(div2, h51);
    			append_dev(h51, a1);
    			append_dev(h51, t24);
    			append_dev(div2, t25);
    			append_dev(div2, h52);
    			append_dev(h52, a2);
    			append_dev(h52, t27);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div0);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(div1);
    			if (detaching) detach_dev(t17);
    			if (detaching) detach_dev(div2);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$7.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    class WorkDigitpaul extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, null, create_fragment$7, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "WorkDigitpaul",
    			options,
    			id: create_fragment$7.name
    		});
    	}
    }

    /* src/Work.svelte generated by Svelte v3.16.7 */
    const file$8 = "src/Work.svelte";

    function create_fragment$8(ctx) {
    	let div;
    	let t0;
    	let t1;
    	let t2;
    	let current;
    	const workclac = new WorkClac({ $$inline: true });
    	const worksolrey = new WorkSolrey({ $$inline: true });
    	const workad = new WorkAd({ $$inline: true });
    	const workdigitpaul = new WorkDigitpaul({ $$inline: true });

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(workclac.$$.fragment);
    			t0 = space();
    			create_component(worksolrey.$$.fragment);
    			t1 = space();
    			create_component(workad.$$.fragment);
    			t2 = space();
    			create_component(workdigitpaul.$$.fragment);
    			attr_dev(div, "class", "works");
    			add_location(div, file$8, 7, 0, 198);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(workclac, div, null);
    			append_dev(div, t0);
    			mount_component(worksolrey, div, null);
    			append_dev(div, t1);
    			mount_component(workad, div, null);
    			append_dev(div, t2);
    			mount_component(workdigitpaul, div, null);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(workclac.$$.fragment, local);
    			transition_in(worksolrey.$$.fragment, local);
    			transition_in(workad.$$.fragment, local);
    			transition_in(workdigitpaul.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(workclac.$$.fragment, local);
    			transition_out(worksolrey.$$.fragment, local);
    			transition_out(workad.$$.fragment, local);
    			transition_out(workdigitpaul.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(workclac);
    			destroy_component(worksolrey);
    			destroy_component(workad);
    			destroy_component(workdigitpaul);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$8.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    class Work extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, null, create_fragment$8, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Work",
    			options,
    			id: create_fragment$8.name
    		});
    	}
    }

    /* src/About.svelte generated by Svelte v3.16.7 */
    const file$9 = "src/About.svelte";

    function create_fragment$9(ctx) {
    	let div1;
    	let div0;
    	let h2;
    	let t1;
    	let img;
    	let img_src_value;
    	let t2;
    	let p0;
    	let t4;
    	let p1;
    	let t6;
    	let p2;
    	let t8;
    	let p3;
    	let t10;
    	let h4;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			h2 = element("h2");
    			h2.textContent = "About Me";
    			t1 = space();
    			img = element("img");
    			t2 = space();
    			p0 = element("p");
    			p0.textContent = "Tu restes pour le lotto-owe ce soir, y'a baeckeoffe ? Yeuh non, merci vielmols mais\n\t\t\tche dois partir à la Coopé de Truchtersheim acheter des mänele et des rossbolla pour les\n\t\t\tgamins. Hopla tchao bissame ! Consectetur adipiscing elit";
    			t4 = space();
    			p1 = element("p");
    			p1.textContent = "Yoo ch'ai lu dans les DNA que le Racing a encore perdu contre Oberschaeffolsheim. Verdammi\n\t\t\tet moi ch'avais donc parié deux knacks et une flammekueche. Ah so ? T'inquiète, ch'ai\n\t\t\tramené du schpeck, du chambon, un kuglopf et du schnaps dans mon rucksack. Allez,\n\t\t\ts'guelt ! Wotch a kofee avec ton bibalaekaess et ta wurscht ? Yeuh non che suis\n\t\t\tau réchime, je ne mange plus que des Grumbeere light et che fais de la chym avec Chulien.\n\t\t\tTiens, un rottznoz sur le comptoir.";
    			t6 = space();
    			p2 = element("p");
    			p2.textContent = "Tu restes pour le lotto-owe ce soir, y'a baeckeoffe ? Yeuh non, merci vielmols mais\n\t\t\tche dois partir à la Coopé de Truchtersheim acheter des mänele et des rossbolla pour les\n\t\t\tgamins. Hopla tchao bissame ! Consectetur adipiscing elit";
    			t8 = space();
    			p3 = element("p");
    			p3.textContent = "Hopla vous savez que la mamsell Huguette, la miss Miss Dahlias du messti de Bischheim\n\t\t\tétait au en compagnie de Richard Schirmeck (celui qui a un blottkopf), le mari de Chulia\n\t\t\tRoberstau, qui lui trempait sa Nüdle dans sa Schneck ! Yo dû, Pfourtz !\n\t\t\tCh'espère qu'ils avaient du Kabinetpapier, Gal !";
    			t10 = space();
    			h4 = element("h4");
    			h4.textContent = "Telephone number ? | Adress ? | email ?";
    			add_location(h2, file$9, 7, 2, 108);
    			attr_dev(img, "class", "me");
    			if (img.src !== (img_src_value = "images/mcdesplat.jpg")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "Marie-Christine Desplat");
    			add_location(img, file$9, 8, 2, 128);
    			add_location(p0, file$9, 9, 2, 206);
    			add_location(p1, file$9, 14, 2, 469);
    			add_location(p2, file$9, 22, 2, 980);
    			add_location(p3, file$9, 27, 2, 1243);
    			add_location(h4, file$9, 33, 2, 1579);
    			attr_dev(div0, "class", "bio");
    			add_location(div0, file$9, 6, 1, 88);
    			attr_dev(div1, "class", "about");
    			add_location(div1, file$9, 4, 0, 66);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			append_dev(div0, h2);
    			append_dev(div0, t1);
    			append_dev(div0, img);
    			append_dev(div0, t2);
    			append_dev(div0, p0);
    			append_dev(div0, t4);
    			append_dev(div0, p1);
    			append_dev(div0, t6);
    			append_dev(div0, p2);
    			append_dev(div0, t8);
    			append_dev(div0, p3);
    			append_dev(div0, t10);
    			append_dev(div0, h4);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$9.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    class About extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, null, create_fragment$9, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "About",
    			options,
    			id: create_fragment$9.name
    		});
    	}
    }

    /* src/App.svelte generated by Svelte v3.16.7 */
    const file$a = "src/App.svelte";

    // (20:1) {:else}
    function create_else_block(ctx) {
    	let current;
    	const about = new About({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(about.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(about, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(about.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(about.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(about, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(20:1) {:else}",
    		ctx
    	});

    	return block;
    }

    // (13:1) {#if page==0}
    function create_if_block(ctx) {
    	let div0;
    	let t;
    	let div1;
    	let current;
    	const thumbnails = new Thumbnails({ $$inline: true });
    	const work = new Work({ $$inline: true });

    	const block = {
    		c: function create() {
    			div0 = element("div");
    			create_component(thumbnails.$$.fragment);
    			t = space();
    			div1 = element("div");
    			create_component(work.$$.fragment);
    			attr_dev(div0, "class", "top-thumbnails");
    			add_location(div0, file$a, 13, 2, 285);
    			attr_dev(div1, "class", "works-content");
    			add_location(div1, file$a, 16, 2, 354);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div0, anchor);
    			mount_component(thumbnails, div0, null);
    			insert_dev(target, t, anchor);
    			insert_dev(target, div1, anchor);
    			mount_component(work, div1, null);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(thumbnails.$$.fragment, local);
    			transition_in(work.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(thumbnails.$$.fragment, local);
    			transition_out(work.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div0);
    			destroy_component(thumbnails);
    			if (detaching) detach_dev(t);
    			if (detaching) detach_dev(div1);
    			destroy_component(work);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(13:1) {#if page==0}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$a(ctx) {
    	let div;
    	let updating_page;
    	let t;
    	let current_block_type_index;
    	let if_block;
    	let current;

    	function siteheader_page_binding(value) {
    		/*siteheader_page_binding*/ ctx[1].call(null, value);
    	}

    	let siteheader_props = {};

    	if (/*page*/ ctx[0] !== void 0) {
    		siteheader_props.page = /*page*/ ctx[0];
    	}

    	const siteheader = new SiteHeader({ props: siteheader_props, $$inline: true });
    	binding_callbacks.push(() => bind(siteheader, "page", siteheader_page_binding));
    	const if_block_creators = [create_if_block, create_else_block];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*page*/ ctx[0] == 0) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(siteheader.$$.fragment);
    			t = space();
    			if_block.c();
    			attr_dev(div, "id", "site-container");
    			add_location(div, file$a, 10, 0, 198);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(siteheader, div, null);
    			append_dev(div, t);
    			if_blocks[current_block_type_index].m(div, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const siteheader_changes = {};

    			if (!updating_page && dirty & /*page*/ 1) {
    				updating_page = true;
    				siteheader_changes.page = /*page*/ ctx[0];
    				add_flush_callback(() => updating_page = false);
    			}

    			siteheader.$set(siteheader_changes);
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index !== previous_block_index) {
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
    				if_block.m(div, null);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(siteheader.$$.fragment, local);
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(siteheader.$$.fragment, local);
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(siteheader);
    			if_blocks[current_block_type_index].d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$a.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let page = 0;

    	function siteheader_page_binding(value) {
    		page = value;
    		$$invalidate(0, page);
    	}

    	$$self.$capture_state = () => {
    		return {};
    	};

    	$$self.$inject_state = $$props => {
    		if ("page" in $$props) $$invalidate(0, page = $$props.page);
    	};

    	return [page, siteheader_page_binding];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$a, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$a.name
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
