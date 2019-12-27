
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

    const assert = chai.assert.deepEqual;

    const testReducer = (reducers, stack) => {
    	let states = [];
    	let errors = [];
    	const run = (script) => {
    		const arr = script.split('\n');
    		errors = [];
    		for (let nr=0; nr < arr.length; nr++) { 
    			let line = arr[nr];
    			const pos = line.lastIndexOf('#');
    			if (pos >= 0) line = line.slice(0,pos);
    			try {
    				if (line.trim().length != 0) runTest(line, nr);
    			} catch (err) {
    				errors.push(err);
    				break
    			}
    		}
    		return errors
    	};

    	const runTest = (line, nr) => {
    		const index = countTabs(line);
    		line = line.trim();
    		if (index === 0) return states = [JSON.parse(line)]
    		stack.length = 0;
    		let state = states[index - 1];
    		for (const cmd of line.split(' ')) {
    			state = rpn(cmd, state, nr);
    		}
    		states[index] = state;
    		while (stack.length >= 2) {
    			rpn('==', state, nr);
    		}
    		if (stack.length === 1) {
    			errors.push(`Orphan in line ${nr + 1}`);
    			return 
    		}
    	};

    	const rpn = (cmd, state, nr) => {
    		if (cmd === '@') {
    			stack.push(state);
    			return state
    		}
    		const key = cmd.slice(1);
    		if (Object.keys(state).includes(key)) {
    			stack.push(state[key]);
    			return state
    		}
    		if (Object.keys(reducers).includes(cmd)) {
    			return state = reducers[cmd](state)
    		}
    		if (cmd === '==') {
    			let x;
    			let y;
    			try {
    				x = stack.pop();
    				y = stack.pop();
    				assert(x, y);
    			} catch (error) {
    				errors.push('Assert failure in line ' + (nr + 1));
    				errors.push('  Actual ' + JSON.stringify(y));
    				errors.push('  Expect ' + JSON.stringify(x));
    			}
    			return state
    		}
    		try {
    			if (cmd == '') return state
    			stack.push(JSON.parse(cmd));
    		} catch (error) {
    			errors.push('JSON.parse failure in line ' + (nr + 1)+ ' '+ cmd);
    			errors.push('	' + cmd);
    		}
    		return state
    	};

    	const countTabs = (line) => {
    		let result = 0;
    		for (let i=0; i < line.length; i++) {
    			const ch = line[i];
    			if (ch !== '\t') return result
    			result++;
    		}
    		return result
    	};
    	return {run}
    };

    /* src/Info.svelte generated by Svelte v3.16.7 */

    const file = "src/Info.svelte";

    function create_fragment(ctx) {
    	let div19;
    	let h2;
    	let t1;
    	let div0;
    	let t2;
    	let a0;
    	let t4;
    	let t5;
    	let pre0;
    	let t11;
    	let div1;
    	let t13;
    	let div2;
    	let t15;
    	let div3;
    	let t17;
    	let div4;
    	let t18;
    	let a1;
    	let t20;
    	let div5;
    	let t22;
    	let div6;
    	let t24;
    	let div7;
    	let t26;
    	let div8;
    	let t28;
    	let div9;
    	let t30;
    	let div10;
    	let a2;
    	let t32;
    	let t33;
    	let div11;
    	let a3;
    	let t35;
    	let t36;
    	let div12;
    	let t38;
    	let div13;
    	let t40;
    	let div14;
    	let t42;
    	let div15;
    	let t44;
    	let div16;
    	let t46;
    	let div17;
    	let t48;
    	let div18;
    	let t50;
    	let ul0;
    	let li0;
    	let t52;
    	let li1;
    	let t54;
    	let li2;
    	let t56;
    	let li3;
    	let t58;
    	let li4;
    	let t60;
    	let ul1;
    	let li5;
    	let t62;
    	let li6;
    	let t64;
    	let li7;
    	let t66;
    	let li8;
    	let t68;
    	let ul2;
    	let li9;
    	let t70;
    	let li10;
    	let t72;
    	let div21;
    	let div20;
    	let t73;
    	let a4;
    	let t75;
    	let t76;
    	let pre1;

    	const block = {
    		c: function create() {
    			div19 = element("div");
    			h2 = element("h2");
    			h2.textContent = "Reducer Based Testing";
    			t1 = space();
    			div0 = element("div");
    			t2 = text("This is a compact format for testing ");
    			a0 = element("a");
    			a0.textContent = "Reducers";
    			t4 = text(" and an alternative to:");
    			t5 = space();
    			pre0 = element("pre");

    			pre0.textContent = `
test('adds 1 + 2 to equal 3', () => ${"{"}
  expect(sum(1, 2)).toBe(3);
${"}"});
	`;

    			t11 = space();
    			div1 = element("div");
    			div1.textContent = "Reducer: State + Action => State";
    			t13 = space();
    			div2 = element("div");
    			div2.textContent = " ";
    			t15 = space();
    			div3 = element("div");
    			div3.textContent = "Each line contains zero or more actions";
    			t17 = space();
    			div4 = element("div");
    			t18 = text("Each line contains zero or more ");
    			a1 = element("a");
    			a1.textContent = "assertions";
    			t20 = space();
    			div5 = element("div");
    			div5.textContent = " ";
    			t22 = space();
    			div6 = element("div");
    			div6.textContent = "Lines with no indentation contains initial states";
    			t24 = space();
    			div7 = element("div");
    			div7.textContent = "Indented lines are based on previous states";
    			t26 = space();
    			div8 = element("div");
    			div8.textContent = "Alternative actions have the same indentation";
    			t28 = space();
    			div9 = element("div");
    			div9.textContent = " ";
    			t30 = space();
    			div10 = element("div");
    			a2 = element("a");
    			a2.textContent = "JSON";
    			t32 = text(" is used to describe states");
    			t33 = space();
    			div11 = element("div");
    			a3 = element("a");
    			a3.textContent = "RPN";
    			t35 = text(" is used for actions and getters");
    			t36 = space();
    			div12 = element("div");
    			div12.textContent = " ";
    			t38 = space();
    			div13 = element("div");
    			div13.textContent = "Implicit assertion uses ==";
    			t40 = space();
    			div14 = element("div");
    			div14.textContent = "== deeply compares top two stack elements";
    			t42 = space();
    			div15 = element("div");
    			div15.textContent = "Implicit assertions repeats until the stack is empty";
    			t44 = space();
    			div16 = element("div");
    			div16.textContent = "Alternative assertions might be defined";
    			t46 = space();
    			div17 = element("div");
    			div17.textContent = "Actions may consume parameters";
    			t48 = space();
    			div18 = element("div");
    			div18.textContent = " ";
    			t50 = text("\n\n\tActions:\n\t");
    			ul0 = element("ul");
    			li0 = element("li");
    			li0.textContent = "ADD : a = a + 2";
    			t52 = space();
    			li1 = element("li");
    			li1.textContent = "MUL : a = a * 2";
    			t54 = space();
    			li2 = element("li");
    			li2.textContent = "DIV : a = a / 2";
    			t56 = space();
    			li3 = element("li");
    			li3.textContent = "NEW";
    			t58 = space();
    			li4 = element("li");
    			li4.textContent = "UNDO";
    			t60 = text("\n\t\n\tGetters: \n\t");
    			ul1 = element("ul");
    			li5 = element("li");
    			li5.textContent = "@ : The State";
    			t62 = space();
    			li6 = element("li");
    			li6.textContent = "@a : The number to be changed";
    			t64 = space();
    			li7 = element("li");
    			li7.textContent = "@b : Target number";
    			t66 = space();
    			li8 = element("li");
    			li8.textContent = "@hist : List for Undo";
    			t68 = text("\n\t\n\tKnown bugs:\n\t");
    			ul2 = element("ul");
    			li9 = element("li");
    			li9.textContent = "Spaces are not allowed in expressions";
    			t70 = space();
    			li10 = element("li");
    			li10.textContent = "Tabs must be used for indentation";
    			t72 = space();
    			div21 = element("div");
    			div20 = element("div");
    			t73 = text("Chess example (");
    			a4 = element("a");
    			a4.textContent = "Forsyth–Edwards Notation";
    			t75 = text(")");
    			t76 = space();
    			pre1 = element("pre");

    			pre1.textContent = `${"{"}"board":"rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR"${"}"}
  e2e4 MOVE @board rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR
    e7e5 MOVE @board rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR
	`;

    			add_location(h2, file, 7, 1, 120);
    			attr_dev(a0, "href", "https://redux.js.org/basics/reducers");
    			add_location(a0, file, 8, 43, 194);
    			add_location(div0, file, 8, 1, 152);
    			set_style(pre0, "width", "450px");
    			attr_dev(pre0, "class", "svelte-zo0saz");
    			add_location(pre0, file, 9, 1, 284);
    			add_location(div1, file, 14, 1, 398);
    			add_location(div2, file, 15, 1, 443);
    			add_location(div3, file, 16, 1, 462);
    			attr_dev(a1, "href", "https://en.wikipedia.org/wiki/Assertion_(software_development)");
    			add_location(a1, file, 17, 38, 551);
    			add_location(div4, file, 17, 1, 514);
    			add_location(div5, file, 18, 1, 646);
    			add_location(div6, file, 19, 1, 665);
    			add_location(div7, file, 20, 1, 727);
    			add_location(div8, file, 21, 1, 783);
    			add_location(div9, file, 22, 1, 841);
    			attr_dev(a2, "href", "https://en.wikipedia.org/wiki/JSON");
    			add_location(a2, file, 23, 6, 865);
    			add_location(div10, file, 23, 1, 860);
    			attr_dev(a3, "href", "https://en.wikipedia.org/wiki/Reverse_Polish_notation");
    			add_location(a3, file, 24, 6, 958);
    			add_location(div11, file, 24, 1, 953);
    			add_location(div12, file, 25, 1, 1069);
    			add_location(div13, file, 26, 1, 1088);
    			add_location(div14, file, 27, 1, 1127);
    			add_location(div15, file, 28, 1, 1181);
    			add_location(div16, file, 29, 1, 1246);
    			add_location(div17, file, 30, 1, 1298);
    			add_location(div18, file, 31, 1, 1341);
    			add_location(li0, file, 35, 3, 1379);
    			add_location(li1, file, 36, 2, 1406);
    			add_location(li2, file, 37, 2, 1433);
    			add_location(li3, file, 38, 2, 1460);
    			add_location(li4, file, 39, 2, 1475);
    			add_location(ul0, file, 34, 1, 1371);
    			add_location(li5, file, 44, 2, 1517);
    			add_location(li6, file, 45, 2, 1542);
    			add_location(li7, file, 46, 2, 1583);
    			add_location(li8, file, 47, 2, 1613);
    			add_location(ul1, file, 43, 1, 1510);
    			add_location(li9, file, 52, 2, 1674);
    			add_location(li10, file, 53, 2, 1723);
    			add_location(ul2, file, 51, 1, 1667);
    			set_style(div19, "position", "absolute");
    			set_style(div19, "left", "1050px");
    			set_style(div19, "top", "10px");
    			set_style(div19, "width", "40%");
    			add_location(div19, file, 6, 0, 53);
    			attr_dev(a4, "href", "https://en.wikipedia.org/wiki/Forsyth%E2%80%93Edwards_Notation");
    			add_location(a4, file, 58, 21, 1867);
    			add_location(div20, file, 58, 1, 1847);
    			set_style(pre1, "width", "1000px");
    			attr_dev(pre1, "class", "svelte-zo0saz");
    			add_location(pre1, file, 59, 1, 1977);
    			set_style(div21, "position", "absolute");
    			set_style(div21, "left", "10px");
    			set_style(div21, "top", "965px");
    			set_style(div21, "width", "80%");
    			add_location(div21, file, 57, 0, 1781);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div19, anchor);
    			append_dev(div19, h2);
    			append_dev(div19, t1);
    			append_dev(div19, div0);
    			append_dev(div0, t2);
    			append_dev(div0, a0);
    			append_dev(div0, t4);
    			append_dev(div19, t5);
    			append_dev(div19, pre0);
    			append_dev(div19, t11);
    			append_dev(div19, div1);
    			append_dev(div19, t13);
    			append_dev(div19, div2);
    			append_dev(div19, t15);
    			append_dev(div19, div3);
    			append_dev(div19, t17);
    			append_dev(div19, div4);
    			append_dev(div4, t18);
    			append_dev(div4, a1);
    			append_dev(div19, t20);
    			append_dev(div19, div5);
    			append_dev(div19, t22);
    			append_dev(div19, div6);
    			append_dev(div19, t24);
    			append_dev(div19, div7);
    			append_dev(div19, t26);
    			append_dev(div19, div8);
    			append_dev(div19, t28);
    			append_dev(div19, div9);
    			append_dev(div19, t30);
    			append_dev(div19, div10);
    			append_dev(div10, a2);
    			append_dev(div10, t32);
    			append_dev(div19, t33);
    			append_dev(div19, div11);
    			append_dev(div11, a3);
    			append_dev(div11, t35);
    			append_dev(div19, t36);
    			append_dev(div19, div12);
    			append_dev(div19, t38);
    			append_dev(div19, div13);
    			append_dev(div19, t40);
    			append_dev(div19, div14);
    			append_dev(div19, t42);
    			append_dev(div19, div15);
    			append_dev(div19, t44);
    			append_dev(div19, div16);
    			append_dev(div19, t46);
    			append_dev(div19, div17);
    			append_dev(div19, t48);
    			append_dev(div19, div18);
    			append_dev(div19, t50);
    			append_dev(div19, ul0);
    			append_dev(ul0, li0);
    			append_dev(ul0, t52);
    			append_dev(ul0, li1);
    			append_dev(ul0, t54);
    			append_dev(ul0, li2);
    			append_dev(ul0, t56);
    			append_dev(ul0, li3);
    			append_dev(ul0, t58);
    			append_dev(ul0, li4);
    			append_dev(div19, t60);
    			append_dev(div19, ul1);
    			append_dev(ul1, li5);
    			append_dev(ul1, t62);
    			append_dev(ul1, li6);
    			append_dev(ul1, t64);
    			append_dev(ul1, li7);
    			append_dev(ul1, t66);
    			append_dev(ul1, li8);
    			append_dev(div19, t68);
    			append_dev(div19, ul2);
    			append_dev(ul2, li9);
    			append_dev(ul2, t70);
    			append_dev(ul2, li10);
    			insert_dev(target, t72, anchor);
    			insert_dev(target, div21, anchor);
    			append_dev(div21, div20);
    			append_dev(div20, t73);
    			append_dev(div20, a4);
    			append_dev(div20, t75);
    			append_dev(div21, t76);
    			append_dev(div21, pre1);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div19);
    			if (detaching) detach_dev(t72);
    			if (detaching) detach_dev(div21);
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

    class Info extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, null, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Info",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    /* src/App.svelte generated by Svelte v3.16.7 */

    function create_fragment$1(ctx) {
    	let current;
    	const info = new Info({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(info.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(info, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(info.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(info.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(info, detaching);
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

    function instance($$self) {
    	const stack = [];

    	const op = (state, value) => {
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
{"a":18,"b":17,"hist":[]} # initial state
	@a 18 ==                # assert @a deeply equals 18
	@b 17                   # implicit == assertion
	ADD @a 20               # based on line 1
	MUL @a 36 @hist [18]    # also based on line 1
	DIV @ {"a":9,"b":17,"hist":[18]} # @ is the state
	3 4 NEW @a 3 @b 4 @hist [] # NEW takes two parameters
{"a":17,"b":1,"hist":[]}  # another initial state
	MUL ADD DIV @ {"a":18,"b":1,"hist":[17,34,36]}
		UNDO @ {"a":36,"b":1,"hist":[17,34]} # based on 9
			UNDO @ {"a":34,"b":1,"hist":[17]}  # based on 10
				UNDO @ {"a":17,"b":1,"hist":[]}
	# a solution from 17 to 1 in eleven steps
	MUL ADD DIV ADD DIV ADD DIV ADD DIV DIV DIV @a @b
`;

    	const editor = CodeMirror(document.body, {
    		lineNumbers: true,
    		tabSize: 2,
    		indentWithTabs: true,
    		theme: "dracula"
    	});

    	editor.setSize(1000, 600);
    	editor.setValue(script.trim());

    	editor.on("change", () => {
    		viewer.setValue(reducer.run(editor.getValue()).join("\n"));
    	});

    	const viewer = CodeMirror(document.body, { readOnly: true, tabSize: 2 });
    	viewer.setSize(1000, 300);
    	const reducer = testReducer(reducers, stack);
    	viewer.setValue(reducer.run(editor.getValue()).join("\n"));

    	$$self.$capture_state = () => {
    		return {};
    	};

    	$$self.$inject_state = $$props => {
    		if ("script" in $$props) script = $$props.script;
    	};

    	return [];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment$1, safe_not_equal, {});

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
