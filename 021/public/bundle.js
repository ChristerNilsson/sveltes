
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
    function svg_element(name) {
        return document.createElementNS('http://www.w3.org/2000/svg', name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function empty() {
        return text('');
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

    /* src/Clock.svelte generated by Svelte v3.16.7 */

    const { console: console_1 } = globals;
    const file = "src/Clock.svelte";

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[10] = list[i];
    	return child_ctx;
    }

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[7] = list[i];
    	return child_ctx;
    }

    // (29:2) {#each range(1,5) as offset}
    function create_each_block_1(ctx) {
    	let line;
    	let line_class_value;
    	let line_transform_value;

    	const block = {
    		c: function create() {
    			line = svg_element("line");
    			attr_dev(line, "class", line_class_value = "" + (/*halfday*/ ctx[5] + " minor" + " svelte-w4njvb"));
    			attr_dev(line, "y1", "42");
    			attr_dev(line, "y2", "45");
    			attr_dev(line, "transform", line_transform_value = "rotate(" + 6 * (/*minute*/ ctx[7] + /*offset*/ ctx[10]) + ")");
    			add_location(line, file, 29, 3, 819);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, line, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*halfday*/ 32 && line_class_value !== (line_class_value = "" + (/*halfday*/ ctx[5] + " minor" + " svelte-w4njvb"))) {
    				attr_dev(line, "class", line_class_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(line);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(29:2) {#each range(1,5) as offset}",
    		ctx
    	});

    	return block;
    }

    // (27:1) {#each range(0,60,5) as minute}
    function create_each_block(ctx) {
    	let line;
    	let line_class_value;
    	let line_transform_value;
    	let each_1_anchor;
    	let each_value_1 = lodash_range(1, 5);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	const block = {
    		c: function create() {
    			line = svg_element("line");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    			attr_dev(line, "class", line_class_value = "" + (/*halfday*/ ctx[5] + " major" + " svelte-w4njvb"));
    			attr_dev(line, "y1", "35");
    			attr_dev(line, "y2", "45");
    			attr_dev(line, "transform", line_transform_value = "rotate(" + 30 * /*minute*/ ctx[7] + ")");
    			add_location(line, file, 27, 2, 708);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, line, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*halfday*/ 32 && line_class_value !== (line_class_value = "" + (/*halfday*/ ctx[5] + " major" + " svelte-w4njvb"))) {
    				attr_dev(line, "class", line_class_value);
    			}

    			if (dirty & /*halfday, range*/ 32) {
    				each_value_1 = lodash_range(1, 5);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_1.length;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(line);
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(27:1) {#each range(0,60,5) as minute}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let svg;
    	let circle0;
    	let circle0_class_value;
    	let text_1;
    	let t_value = /*city*/ ctx[1].name + "";
    	let t;
    	let line0;
    	let line0_class_value;
    	let line0_transform_value;
    	let line1;
    	let line1_class_value;
    	let line1_transform_value;
    	let line2;
    	let line2_transform_value;
    	let g;
    	let circle1;
    	let g_transform_value;
    	let each_value = lodash_range(0, 60, 5);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			circle0 = svg_element("circle");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			text_1 = svg_element("text");
    			t = text(t_value);
    			line0 = svg_element("line");
    			line1 = svg_element("line");
    			line2 = svg_element("line");
    			g = svg_element("g");
    			circle1 = svg_element("circle");
    			attr_dev(circle0, "class", circle0_class_value = "" + (null_to_empty(/*halfday*/ ctx[5]) + " svelte-w4njvb"));
    			attr_dev(circle0, "r", "48");
    			add_location(circle0, file, 24, 1, 640);
    			set_style(text_1, "fill", /*textfill*/ ctx[6]);
    			attr_dev(text_1, "class", "city svelte-w4njvb");
    			attr_dev(text_1, "y", "25");
    			add_location(text_1, file, 33, 1, 927);
    			attr_dev(line0, "class", line0_class_value = "" + (/*halfday*/ ctx[5] + " hour" + " svelte-w4njvb"));
    			attr_dev(line0, "y1", "6");
    			attr_dev(line0, "y2", "-32");
    			attr_dev(line0, "transform", line0_transform_value = "rotate(" + 30 * (/*h*/ ctx[2] + /*m*/ ctx[3] / 60) + ")");
    			add_location(line0, file, 34, 1, 993);
    			attr_dev(line1, "class", line1_class_value = "" + (/*halfday*/ ctx[5] + " minute" + " svelte-w4njvb"));
    			attr_dev(line1, "y1", "6");
    			attr_dev(line1, "y2", "-45");
    			attr_dev(line1, "transform", line1_transform_value = "rotate(" + 6 * /*m*/ ctx[3] + ")");
    			add_location(line1, file, 35, 1, 1080);
    			attr_dev(line2, "class", "second svelte-w4njvb");
    			attr_dev(line2, "y1", "10");
    			attr_dev(line2, "y2", "-34");
    			attr_dev(line2, "transform", line2_transform_value = "rotate(" + 6 * /*s*/ ctx[4] + ")");
    			add_location(line2, file, 36, 1, 1155);
    			attr_dev(circle1, "class", "second svelte-w4njvb");
    			attr_dev(circle1, "x", "0");
    			attr_dev(circle1, "y", "0");
    			attr_dev(circle1, "r", "3");
    			attr_dev(circle1, "transform", "translate(0,-34)");
    			add_location(circle1, file, 38, 2, 1253);
    			attr_dev(g, "transform", g_transform_value = "rotate(" + 6 * /*s*/ ctx[4] + ")");
    			add_location(g, file, 37, 1, 1219);
    			attr_dev(svg, "viewBox", "-50 -50 100 100");
    			set_style(svg, "width", 100 / /*N*/ ctx[0] + "%");
    			set_style(svg, "height", 100 / /*N*/ ctx[0] + "%");
    			attr_dev(svg, "class", "svelte-w4njvb");
    			add_location(svg, file, 23, 0, 565);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svg, anchor);
    			append_dev(svg, circle0);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(svg, null);
    			}

    			append_dev(svg, text_1);
    			append_dev(text_1, t);
    			append_dev(svg, line0);
    			append_dev(svg, line1);
    			append_dev(svg, line2);
    			append_dev(svg, g);
    			append_dev(g, circle1);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*halfday*/ 32 && circle0_class_value !== (circle0_class_value = "" + (null_to_empty(/*halfday*/ ctx[5]) + " svelte-w4njvb"))) {
    				attr_dev(circle0, "class", circle0_class_value);
    			}

    			if (dirty & /*range, halfday*/ 32) {
    				each_value = lodash_range(0, 60, 5);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(svg, text_1);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			if (dirty & /*city*/ 2 && t_value !== (t_value = /*city*/ ctx[1].name + "")) set_data_dev(t, t_value);

    			if (dirty & /*textfill*/ 64) {
    				set_style(text_1, "fill", /*textfill*/ ctx[6]);
    			}

    			if (dirty & /*halfday*/ 32 && line0_class_value !== (line0_class_value = "" + (/*halfday*/ ctx[5] + " hour" + " svelte-w4njvb"))) {
    				attr_dev(line0, "class", line0_class_value);
    			}

    			if (dirty & /*h, m*/ 12 && line0_transform_value !== (line0_transform_value = "rotate(" + 30 * (/*h*/ ctx[2] + /*m*/ ctx[3] / 60) + ")")) {
    				attr_dev(line0, "transform", line0_transform_value);
    			}

    			if (dirty & /*halfday*/ 32 && line1_class_value !== (line1_class_value = "" + (/*halfday*/ ctx[5] + " minute" + " svelte-w4njvb"))) {
    				attr_dev(line1, "class", line1_class_value);
    			}

    			if (dirty & /*m*/ 8 && line1_transform_value !== (line1_transform_value = "rotate(" + 6 * /*m*/ ctx[3] + ")")) {
    				attr_dev(line1, "transform", line1_transform_value);
    			}

    			if (dirty & /*s*/ 16 && line2_transform_value !== (line2_transform_value = "rotate(" + 6 * /*s*/ ctx[4] + ")")) {
    				attr_dev(line2, "transform", line2_transform_value);
    			}

    			if (dirty & /*s*/ 16 && g_transform_value !== (g_transform_value = "rotate(" + 6 * /*s*/ ctx[4] + ")")) {
    				attr_dev(g, "transform", g_transform_value);
    			}

    			if (dirty & /*N*/ 1) {
    				set_style(svg, "width", 100 / /*N*/ ctx[0] + "%");
    			}

    			if (dirty & /*N*/ 1) {
    				set_style(svg, "height", 100 / /*N*/ ctx[0] + "%");
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
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { N } = $$props;
    	let { city } = $$props, { h } = $$props, { m } = $$props, { s } = $$props;
    	console.log(city, h, m, s);
    	const writable_props = ["N", "city", "h", "m", "s"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1.warn(`<Clock> was created with unknown prop '${key}'`);
    	});

    	$$self.$set = $$props => {
    		if ("N" in $$props) $$invalidate(0, N = $$props.N);
    		if ("city" in $$props) $$invalidate(1, city = $$props.city);
    		if ("h" in $$props) $$invalidate(2, h = $$props.h);
    		if ("m" in $$props) $$invalidate(3, m = $$props.m);
    		if ("s" in $$props) $$invalidate(4, s = $$props.s);
    	};

    	$$self.$capture_state = () => {
    		return { N, city, h, m, s, halfday, textfill };
    	};

    	$$self.$inject_state = $$props => {
    		if ("N" in $$props) $$invalidate(0, N = $$props.N);
    		if ("city" in $$props) $$invalidate(1, city = $$props.city);
    		if ("h" in $$props) $$invalidate(2, h = $$props.h);
    		if ("m" in $$props) $$invalidate(3, m = $$props.m);
    		if ("s" in $$props) $$invalidate(4, s = $$props.s);
    		if ("halfday" in $$props) $$invalidate(5, halfday = $$props.halfday);
    		if ("textfill" in $$props) $$invalidate(6, textfill = $$props.textfill);
    	};

    	let halfday;
    	let textfill;

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*h*/ 4) {
    			 $$invalidate(5, halfday = 6 <= h && h <= 17 ? "day" : "night");
    		}

    		if ($$self.$$.dirty & /*h*/ 4) {
    			 $$invalidate(6, textfill = 6 <= h && h <= 17 ? "black" : "white");
    		}
    	};

    	return [N, city, h, m, s, halfday, textfill];
    }

    class Clock extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, { N: 0, city: 1, h: 2, m: 3, s: 4 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Clock",
    			options,
    			id: create_fragment.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || ({});

    		if (/*N*/ ctx[0] === undefined && !("N" in props)) {
    			console_1.warn("<Clock> was created without expected prop 'N'");
    		}

    		if (/*city*/ ctx[1] === undefined && !("city" in props)) {
    			console_1.warn("<Clock> was created without expected prop 'city'");
    		}

    		if (/*h*/ ctx[2] === undefined && !("h" in props)) {
    			console_1.warn("<Clock> was created without expected prop 'h'");
    		}

    		if (/*m*/ ctx[3] === undefined && !("m" in props)) {
    			console_1.warn("<Clock> was created without expected prop 'm'");
    		}

    		if (/*s*/ ctx[4] === undefined && !("s" in props)) {
    			console_1.warn("<Clock> was created without expected prop 's'");
    		}
    	}

    	get N() {
    		throw new Error("<Clock>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set N(value) {
    		throw new Error("<Clock>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get city() {
    		throw new Error("<Clock>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set city(value) {
    		throw new Error("<Clock>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get h() {
    		throw new Error("<Clock>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set h(value) {
    		throw new Error("<Clock>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get m() {
    		throw new Error("<Clock>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set m(value) {
    		throw new Error("<Clock>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get s() {
    		throw new Error("<Clock>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set s(value) {
    		throw new Error("<Clock>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/App.svelte generated by Svelte v3.16.7 */

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[4] = list[i];
    	return child_ctx;
    }

    // (16:0) {#each cities as city}
    function create_each_block$1(ctx) {
    	let current;

    	const clock = new Clock({
    			props: {
    				N: /*cities*/ ctx[3].length,
    				city: /*city*/ ctx[4],
    				h: /*h*/ ctx[0] + /*city*/ ctx[4].offset,
    				m: /*m*/ ctx[1],
    				s: /*s*/ ctx[2]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(clock.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(clock, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const clock_changes = {};
    			if (dirty & /*h*/ 1) clock_changes.h = /*h*/ ctx[0] + /*city*/ ctx[4].offset;
    			if (dirty & /*m*/ 2) clock_changes.m = /*m*/ ctx[1];
    			if (dirty & /*s*/ 4) clock_changes.s = /*s*/ ctx[2];
    			clock.$set(clock_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(clock.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(clock.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(clock, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(16:0) {#each cities as city}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let each_1_anchor;
    	let current;
    	let each_value = /*cities*/ ctx[3];
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
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
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*cities, h, m, s*/ 15) {
    				each_value = /*cities*/ ctx[3];
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
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
    			if (detaching) detach_dev(each_1_anchor);
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
    	let h = 0, m = 0, s = 0;

    	let cities = [
    		{ name: "New York", offset: -6 },
    		{ name: "Bagarmossen", offset: 0 },
    		{ name: "Tokyo", offset: 8 }
    	];

    	setInterval(
    		() => {
    			const time = new Date();
    			$$invalidate(0, h = time.getHours());
    			$$invalidate(1, m = time.getMinutes());
    			$$invalidate(2, s = time.getSeconds() + time.getMilliseconds() / 1000);
    		},
    		50
    	);

    	$$self.$capture_state = () => {
    		return {};
    	};

    	$$self.$inject_state = $$props => {
    		if ("h" in $$props) $$invalidate(0, h = $$props.h);
    		if ("m" in $$props) $$invalidate(1, m = $$props.m);
    		if ("s" in $$props) $$invalidate(2, s = $$props.s);
    		if ("cities" in $$props) $$invalidate(3, cities = $$props.cities);
    	};

    	return [h, m, s, cities];
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
