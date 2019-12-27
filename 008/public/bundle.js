
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.head.appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
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
    function create_slot(definition, ctx, $$scope, fn) {
        if (definition) {
            const slot_ctx = get_slot_context(definition, ctx, $$scope, fn);
            return definition[0](slot_ctx);
        }
    }
    function get_slot_context(definition, ctx, $$scope, fn) {
        return definition[1] && fn
            ? assign($$scope.ctx.slice(), definition[1](fn(ctx)))
            : $$scope.ctx;
    }
    function get_slot_changes(definition, $$scope, dirty, fn) {
        if (definition[2] && fn) {
            const lets = definition[2](fn(dirty));
            if (typeof $$scope.dirty === 'object') {
                const merged = [];
                const len = Math.max($$scope.dirty.length, lets.length);
                for (let i = 0; i < len; i += 1) {
                    merged[i] = $$scope.dirty[i] | lets[i];
                }
                return merged;
            }
            return $$scope.dirty | lets;
        }
        return $$scope.dirty;
    }
    function set_store_value(store, ret, value = ret) {
        store.set(value);
        return ret;
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
    function to_number(value) {
        return value === '' ? undefined : +value;
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        if (value != null || input.value) {
            input.value = value;
        }
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
    function get_current_component() {
        if (!current_component)
            throw new Error(`Function called outside component initialization`);
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
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

    const shapeRendering = writable('crispEdges');

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

    /* src/Menu.svelte generated by Svelte v3.16.7 */

    const file = "src/Menu.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[6] = list[i];
    	return child_ctx;
    }

    // (29:2) {:else}
    function create_else_block(ctx) {
    	let div;
    	let t_value = /*c*/ ctx[6] + "";
    	let t;
    	let dispose;

    	function click_handler_1(...args) {
    		return /*click_handler_1*/ ctx[5](/*c*/ ctx[6], ...args);
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			t = text(t_value);
    			attr_dev(div, "class", "mnu svelte-a2ip36");
    			set_style(div, "color", /*color*/ ctx[1]);
    			add_location(div, file, 29, 3, 490);
    			dispose = listen_dev(div, "click", click_handler_1, false, false, false);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t);
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty & /*children*/ 8 && t_value !== (t_value = /*c*/ ctx[6] + "")) set_data_dev(t, t_value);

    			if (dirty & /*color*/ 2) {
    				set_style(div, "color", /*color*/ ctx[1]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(29:2) {:else}",
    		ctx
    	});

    	return block;
    }

    // (27:2) {#if selected==c}
    function create_if_block(ctx) {
    	let div;
    	let t_value = /*c*/ ctx[6] + "";
    	let t;
    	let dispose;

    	function click_handler(...args) {
    		return /*click_handler*/ ctx[4](/*c*/ ctx[6], ...args);
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			t = text(t_value);
    			attr_dev(div, "class", "mnu text-red svelte-a2ip36");
    			add_location(div, file, 27, 3, 410);
    			dispose = listen_dev(div, "click", click_handler, false, false, false);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t);
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty & /*children*/ 8 && t_value !== (t_value = /*c*/ ctx[6] + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(27:2) {#if selected==c}",
    		ctx
    	});

    	return block;
    }

    // (26:1) {#each children as c}
    function create_each_block(ctx) {
    	let if_block_anchor;

    	function select_block_type(ctx, dirty) {
    		if (/*selected*/ ctx[0] == /*c*/ ctx[6]) return create_if_block;
    		return create_else_block;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			}
    		},
    		d: function destroy(detaching) {
    			if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(26:1) {#each children as c}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let div;
    	let each_value = /*children*/ ctx[3];
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(div, "class", "nav svelte-a2ip36");
    			set_style(div, "background-color", /*bgcolor*/ ctx[2]);
    			add_location(div, file, 24, 0, 311);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*selected, children, color*/ 11) {
    				each_value = /*children*/ ctx[3];
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			if (dirty & /*bgcolor*/ 4) {
    				set_style(div, "background-color", /*bgcolor*/ ctx[2]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
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
    	let { color = "black" } = $$props;
    	let { bgcolor = "grey" } = $$props;
    	let { children } = $$props;
    	let { selected = children[0] } = $$props;
    	const writable_props = ["color", "bgcolor", "children", "selected"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Menu> was created with unknown prop '${key}'`);
    	});

    	const click_handler = c => $$invalidate(0, selected = c);
    	const click_handler_1 = c => $$invalidate(0, selected = c);

    	$$self.$set = $$props => {
    		if ("color" in $$props) $$invalidate(1, color = $$props.color);
    		if ("bgcolor" in $$props) $$invalidate(2, bgcolor = $$props.bgcolor);
    		if ("children" in $$props) $$invalidate(3, children = $$props.children);
    		if ("selected" in $$props) $$invalidate(0, selected = $$props.selected);
    	};

    	$$self.$capture_state = () => {
    		return { color, bgcolor, children, selected };
    	};

    	$$self.$inject_state = $$props => {
    		if ("color" in $$props) $$invalidate(1, color = $$props.color);
    		if ("bgcolor" in $$props) $$invalidate(2, bgcolor = $$props.bgcolor);
    		if ("children" in $$props) $$invalidate(3, children = $$props.children);
    		if ("selected" in $$props) $$invalidate(0, selected = $$props.selected);
    	};

    	return [selected, color, bgcolor, children, click_handler, click_handler_1];
    }

    class Menu extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance, create_fragment, safe_not_equal, {
    			color: 1,
    			bgcolor: 2,
    			children: 3,
    			selected: 0
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Menu",
    			options,
    			id: create_fragment.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || ({});

    		if (/*children*/ ctx[3] === undefined && !("children" in props)) {
    			console.warn("<Menu> was created without expected prop 'children'");
    		}
    	}

    	get color() {
    		throw new Error("<Menu>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set color(value) {
    		throw new Error("<Menu>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get bgcolor() {
    		throw new Error("<Menu>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set bgcolor(value) {
    		throw new Error("<Menu>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get children() {
    		throw new Error("<Menu>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set children(value) {
    		throw new Error("<Menu>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get selected() {
    		throw new Error("<Menu>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set selected(value) {
    		throw new Error("<Menu>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/Canvas.svelte generated by Svelte v3.16.7 */
    const file$1 = "src/Canvas.svelte";

    function create_fragment$1(ctx) {
    	let svg;
    	let rect;
    	let current;
    	let dispose;
    	const default_slot_template = /*$$slots*/ ctx[3].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[2], null);

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			rect = svg_element("rect");
    			if (default_slot) default_slot.c();
    			attr_dev(rect, "width", "200");
    			attr_dev(rect, "height", "200");
    			set_style(rect, "stroke-width", "0");
    			add_location(rect, file$1, 14, 1, 278);
    			attr_dev(svg, "class", "col left s6 svelte-14is3tx");
    			attr_dev(svg, "width", "200");
    			attr_dev(svg, "height", "200");
    			set_style(svg, "margin", "2px 2px 0px");
    			attr_dev(svg, "shape-rendering", /*$shapeRendering*/ ctx[1]);
    			add_location(svg, file$1, 13, 0, 168);
    			dispose = listen_dev(rect, "click", /*click*/ ctx[0], false, false, false);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svg, anchor);
    			append_dev(svg, rect);

    			if (default_slot) {
    				default_slot.m(svg, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot && default_slot.p && dirty & /*$$scope*/ 4) {
    				default_slot.p(get_slot_context(default_slot_template, ctx, /*$$scope*/ ctx[2], null), get_slot_changes(default_slot_template, /*$$scope*/ ctx[2], dirty, null));
    			}

    			if (!current || dirty & /*$shapeRendering*/ 2) {
    				attr_dev(svg, "shape-rendering", /*$shapeRendering*/ ctx[1]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(svg);
    			if (default_slot) default_slot.d(detaching);
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
    	let $shapeRendering;
    	validate_store(shapeRendering, "shapeRendering");
    	component_subscribe($$self, shapeRendering, $$value => $$invalidate(1, $shapeRendering = $$value));

    	let { click = () => {
    		
    	} } = $$props;

    	const writable_props = ["click"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Canvas> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;

    	$$self.$set = $$props => {
    		if ("click" in $$props) $$invalidate(0, click = $$props.click);
    		if ("$$scope" in $$props) $$invalidate(2, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => {
    		return { click, $shapeRendering };
    	};

    	$$self.$inject_state = $$props => {
    		if ("click" in $$props) $$invalidate(0, click = $$props.click);
    		if ("$shapeRendering" in $$props) shapeRendering.set($shapeRendering = $$props.$shapeRendering);
    	};

    	return [click, $shapeRendering, $$scope, $$slots];
    }

    class Canvas extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { click: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Canvas",
    			options,
    			id: create_fragment$1.name
    		});
    	}

    	get click() {
    		throw new Error("<Canvas>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set click(value) {
    		throw new Error("<Canvas>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/Grid.svelte generated by Svelte v3.16.7 */
    const file$2 = "src/Grid.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[3] = list[i];
    	return child_ctx;
    }

    // (19:1) {#each range(0,200,20) as i}
    function create_each_block$1(ctx) {
    	let line0;
    	let line0_x__value;
    	let line0_y__value;
    	let line0_x__value_1;
    	let line0_y__value_1;
    	let t;
    	let line1;
    	let line1_y__value;
    	let line1_x__value;
    	let line1_y__value_1;
    	let line1_x__value_1;

    	const block = {
    		c: function create() {
    			line0 = svg_element("line");
    			t = space();
    			line1 = svg_element("line");
    			attr_dev(line0, "x1", line0_x__value = /*i*/ ctx[3]);
    			attr_dev(line0, "y1", line0_y__value = 0);
    			attr_dev(line0, "x2", line0_x__value_1 = /*i*/ ctx[3]);
    			attr_dev(line0, "y2", line0_y__value_1 = 200);
    			attr_dev(line0, "class", "grid svelte-1qnue2y");
    			add_location(line0, file$2, 19, 4, 271);
    			attr_dev(line1, "y1", line1_y__value = /*i*/ ctx[3]);
    			attr_dev(line1, "x1", line1_x__value = 0);
    			attr_dev(line1, "y2", line1_y__value_1 = /*i*/ ctx[3]);
    			attr_dev(line1, "x2", line1_x__value_1 = 200);
    			attr_dev(line1, "class", "grid svelte-1qnue2y");
    			add_location(line1, file$2, 20, 4, 325);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, line0, anchor);
    			insert_dev(target, t, anchor);
    			insert_dev(target, line1, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(line0);
    			if (detaching) detach_dev(t);
    			if (detaching) detach_dev(line1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(19:1) {#each range(0,200,20) as i}",
    		ctx
    	});

    	return block;
    }

    // (18:0) <Canvas {click}>
    function create_default_slot(ctx) {
    	let t;
    	let current;
    	let each_value = lodash_range(0, 200, 20);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	const default_slot_template = /*$$slots*/ ctx[1].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[2], null);

    	const block = {
    		c: function create() {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t = space();
    			if (default_slot) default_slot.c();
    		},
    		m: function mount(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, t, anchor);

    			if (default_slot) {
    				default_slot.m(target, anchor);
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*range*/ 0) {
    				each_value = lodash_range(0, 200, 20);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(t.parentNode, t);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			if (default_slot && default_slot.p && dirty & /*$$scope*/ 4) {
    				default_slot.p(get_slot_context(default_slot_template, ctx, /*$$scope*/ ctx[2], null), get_slot_changes(default_slot_template, /*$$scope*/ ctx[2], dirty, null));
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(t);
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot.name,
    		type: "slot",
    		source: "(18:0) <Canvas {click}>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let current;

    	const canvas = new Canvas({
    			props: {
    				click: /*click*/ ctx[0],
    				$$slots: { default: [create_default_slot] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(canvas.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(canvas, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const canvas_changes = {};
    			if (dirty & /*click*/ 1) canvas_changes.click = /*click*/ ctx[0];

    			if (dirty & /*$$scope*/ 4) {
    				canvas_changes.$$scope = { dirty, ctx };
    			}

    			canvas.$set(canvas_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(canvas.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(canvas.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(canvas, detaching);
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
    	let { click = () => {
    		
    	} } = $$props;

    	const writable_props = ["click"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Grid> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;

    	$$self.$set = $$props => {
    		if ("click" in $$props) $$invalidate(0, click = $$props.click);
    		if ("$$scope" in $$props) $$invalidate(2, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => {
    		return { click };
    	};

    	$$self.$inject_state = $$props => {
    		if ("click" in $$props) $$invalidate(0, click = $$props.click);
    	};

    	return [click, $$slots, $$scope];
    }

    class Grid extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { click: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Grid",
    			options,
    			id: create_fragment$2.name
    		});
    	}

    	get click() {
    		throw new Error("<Grid>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set click(value) {
    		throw new Error("<Grid>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/Rect.svelte generated by Svelte v3.16.7 */
    const file$3 = "src/Rect.svelte";

    // (5:0) <Grid>
    function create_default_slot$1(ctx) {
    	let rect0;
    	let t;
    	let rect1;

    	const block = {
    		c: function create() {
    			rect0 = svg_element("rect");
    			t = space();
    			rect1 = svg_element("rect");
    			attr_dev(rect0, "x", "10");
    			attr_dev(rect0, "y", "20");
    			attr_dev(rect0, "width", "30");
    			attr_dev(rect0, "height", "40");
    			set_style(rect0, "stroke-width", "1");
    			set_style(rect0, "stroke", "red");
    			set_style(rect0, "fill", "yellow");
    			add_location(rect0, file$3, 5, 1, 62);
    			attr_dev(rect1, "x", "30");
    			attr_dev(rect1, "y", "40");
    			attr_dev(rect1, "width", "40");
    			attr_dev(rect1, "height", "50");
    			set_style(rect1, "stroke-width", "1");
    			set_style(rect1, "stroke", "yellow");
    			set_style(rect1, "fill", "red");
    			add_location(rect1, file$3, 6, 1, 147);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, rect0, anchor);
    			insert_dev(target, t, anchor);
    			insert_dev(target, rect1, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(rect0);
    			if (detaching) detach_dev(t);
    			if (detaching) detach_dev(rect1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$1.name,
    		type: "slot",
    		source: "(5:0) <Grid>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let current;

    	const grid = new Grid({
    			props: {
    				$$slots: { default: [create_default_slot$1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(grid.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(grid, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const grid_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				grid_changes.$$scope = { dirty, ctx };
    			}

    			grid.$set(grid_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(grid.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(grid.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(grid, detaching);
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

    class Rect extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, null, create_fragment$3, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Rect",
    			options,
    			id: create_fragment$3.name
    		});
    	}
    }

    /* src/Circle.svelte generated by Svelte v3.16.7 */
    const file$4 = "src/Circle.svelte";

    // (5:0) <Grid>
    function create_default_slot$2(ctx) {
    	let circle0;
    	let t0;
    	let circle1;
    	let t1;
    	let circle2;

    	const block = {
    		c: function create() {
    			circle0 = svg_element("circle");
    			t0 = space();
    			circle1 = svg_element("circle");
    			t1 = space();
    			circle2 = svg_element("circle");
    			attr_dev(circle0, "cx", "50");
    			attr_dev(circle0, "cy", "40");
    			attr_dev(circle0, "r", "40");
    			set_style(circle0, "stroke-width", "2");
    			set_style(circle0, "stroke", "red");
    			set_style(circle0, "fill", "yellow");
    			add_location(circle0, file$4, 5, 1, 62);
    			attr_dev(circle1, "cx", "130");
    			attr_dev(circle1, "cy", "140");
    			attr_dev(circle1, "r", "60");
    			set_style(circle1, "stroke-width", "3");
    			set_style(circle1, "stroke", "yellow");
    			set_style(circle1, "fill", "red");
    			add_location(circle1, file$4, 6, 1, 137);
    			attr_dev(circle2, "cx", "100");
    			attr_dev(circle2, "cy", "100");
    			attr_dev(circle2, "r", "50");
    			set_style(circle2, "stroke-width", "5");
    			set_style(circle2, "stroke", "white");
    			set_style(circle2, "fill", "black");
    			add_location(circle2, file$4, 7, 1, 214);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, circle0, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, circle1, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, circle2, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(circle0);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(circle1);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(circle2);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$2.name,
    		type: "slot",
    		source: "(5:0) <Grid>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$4(ctx) {
    	let current;

    	const grid = new Grid({
    			props: {
    				$$slots: { default: [create_default_slot$2] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(grid.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(grid, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const grid_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				grid_changes.$$scope = { dirty, ctx };
    			}

    			grid.$set(grid_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(grid.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(grid.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(grid, detaching);
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

    class Circle extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, null, create_fragment$4, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Circle",
    			options,
    			id: create_fragment$4.name
    		});
    	}
    }

    /* src/Line.svelte generated by Svelte v3.16.7 */
    const file$5 = "src/Line.svelte";

    // (5:0) <Grid>
    function create_default_slot$3(ctx) {
    	let line0;
    	let t;
    	let line1;

    	const block = {
    		c: function create() {
    			line0 = svg_element("line");
    			t = space();
    			line1 = svg_element("line");
    			attr_dev(line0, "x1", "50");
    			attr_dev(line0, "y1", "40");
    			attr_dev(line0, "x2", "100");
    			attr_dev(line0, "y2", "100");
    			set_style(line0, "stroke-width", "2");
    			set_style(line0, "stroke", "red");
    			add_location(line0, file$5, 5, 1, 62);
    			attr_dev(line1, "x1", "100");
    			attr_dev(line1, "y1", "100");
    			attr_dev(line1, "x2", "190");
    			attr_dev(line1, "y2", "100");
    			set_style(line1, "stroke-width", "5");
    			set_style(line1, "stroke", "yellow");
    			add_location(line1, file$5, 6, 1, 134);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, line0, anchor);
    			insert_dev(target, t, anchor);
    			insert_dev(target, line1, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(line0);
    			if (detaching) detach_dev(t);
    			if (detaching) detach_dev(line1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$3.name,
    		type: "slot",
    		source: "(5:0) <Grid>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$5(ctx) {
    	let current;

    	const grid = new Grid({
    			props: {
    				$$slots: { default: [create_default_slot$3] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(grid.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(grid, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const grid_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				grid_changes.$$scope = { dirty, ctx };
    			}

    			grid.$set(grid_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(grid.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(grid.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(grid, detaching);
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

    class Line extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, null, create_fragment$5, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Line",
    			options,
    			id: create_fragment$5.name
    		});
    	}
    }

    /* src/CRect.svelte generated by Svelte v3.16.7 */

    const file$6 = "src/CRect.svelte";

    function create_fragment$6(ctx) {
    	let rect;
    	let rect_x_value;
    	let rect_y_value;

    	const block = {
    		c: function create() {
    			rect = svg_element("rect");
    			attr_dev(rect, "x", rect_x_value = /*x*/ ctx[0] - /*w*/ ctx[2] / 2);
    			attr_dev(rect, "y", rect_y_value = /*y*/ ctx[1] - /*h*/ ctx[3] / 2);
    			attr_dev(rect, "width", /*w*/ ctx[2]);
    			attr_dev(rect, "height", /*h*/ ctx[3]);
    			attr_dev(rect, "style", /*style*/ ctx[4]);
    			add_location(rect, file$6, 5, 0, 73);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, rect, anchor);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*x, w*/ 5 && rect_x_value !== (rect_x_value = /*x*/ ctx[0] - /*w*/ ctx[2] / 2)) {
    				attr_dev(rect, "x", rect_x_value);
    			}

    			if (dirty & /*y, h*/ 10 && rect_y_value !== (rect_y_value = /*y*/ ctx[1] - /*h*/ ctx[3] / 2)) {
    				attr_dev(rect, "y", rect_y_value);
    			}

    			if (dirty & /*w*/ 4) {
    				attr_dev(rect, "width", /*w*/ ctx[2]);
    			}

    			if (dirty & /*h*/ 8) {
    				attr_dev(rect, "height", /*h*/ ctx[3]);
    			}

    			if (dirty & /*style*/ 16) {
    				attr_dev(rect, "style", /*style*/ ctx[4]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(rect);
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

    function instance$3($$self, $$props, $$invalidate) {
    	let { x = 0 } = $$props,
    		{ y = 0 } = $$props,
    		{ w = 100 } = $$props,
    		{ h = 100 } = $$props;

    	let { style = "" } = $$props;
    	const writable_props = ["x", "y", "w", "h", "style"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<CRect> was created with unknown prop '${key}'`);
    	});

    	$$self.$set = $$props => {
    		if ("x" in $$props) $$invalidate(0, x = $$props.x);
    		if ("y" in $$props) $$invalidate(1, y = $$props.y);
    		if ("w" in $$props) $$invalidate(2, w = $$props.w);
    		if ("h" in $$props) $$invalidate(3, h = $$props.h);
    		if ("style" in $$props) $$invalidate(4, style = $$props.style);
    	};

    	$$self.$capture_state = () => {
    		return { x, y, w, h, style };
    	};

    	$$self.$inject_state = $$props => {
    		if ("x" in $$props) $$invalidate(0, x = $$props.x);
    		if ("y" in $$props) $$invalidate(1, y = $$props.y);
    		if ("w" in $$props) $$invalidate(2, w = $$props.w);
    		if ("h" in $$props) $$invalidate(3, h = $$props.h);
    		if ("style" in $$props) $$invalidate(4, style = $$props.style);
    	};

    	return [x, y, w, h, style];
    }

    class CRect extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$6, safe_not_equal, { x: 0, y: 1, w: 2, h: 3, style: 4 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "CRect",
    			options,
    			id: create_fragment$6.name
    		});
    	}

    	get x() {
    		throw new Error("<CRect>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set x(value) {
    		throw new Error("<CRect>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get y() {
    		throw new Error("<CRect>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set y(value) {
    		throw new Error("<CRect>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get w() {
    		throw new Error("<CRect>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set w(value) {
    		throw new Error("<CRect>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get h() {
    		throw new Error("<CRect>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set h(value) {
    		throw new Error("<CRect>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get style() {
    		throw new Error("<CRect>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set style(value) {
    		throw new Error("<CRect>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/CText.svelte generated by Svelte v3.16.7 */

    const file$7 = "src/CText.svelte";

    function create_fragment$7(ctx) {
    	let text_1;
    	let current;
    	const default_slot_template = /*$$slots*/ ctx[4].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[3], null);

    	const block = {
    		c: function create() {
    			text_1 = svg_element("text");
    			if (default_slot) default_slot.c();
    			attr_dev(text_1, "x", /*x*/ ctx[0]);
    			attr_dev(text_1, "y", /*y*/ ctx[1]);
    			attr_dev(text_1, "style", /*style*/ ctx[2]);
    			attr_dev(text_1, "text-anchor", "middle");
    			attr_dev(text_1, "alignment-baseline", "middle");
    			add_location(text_1, file$7, 5, 0, 61);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, text_1, anchor);

    			if (default_slot) {
    				default_slot.m(text_1, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot && default_slot.p && dirty & /*$$scope*/ 8) {
    				default_slot.p(get_slot_context(default_slot_template, ctx, /*$$scope*/ ctx[3], null), get_slot_changes(default_slot_template, /*$$scope*/ ctx[3], dirty, null));
    			}

    			if (!current || dirty & /*x*/ 1) {
    				attr_dev(text_1, "x", /*x*/ ctx[0]);
    			}

    			if (!current || dirty & /*y*/ 2) {
    				attr_dev(text_1, "y", /*y*/ ctx[1]);
    			}

    			if (!current || dirty & /*style*/ 4) {
    				attr_dev(text_1, "style", /*style*/ ctx[2]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(text_1);
    			if (default_slot) default_slot.d(detaching);
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

    function instance$4($$self, $$props, $$invalidate) {
    	let { x = 0 } = $$props, { y = 0 } = $$props;
    	let { style = "" } = $$props;
    	const writable_props = ["x", "y", "style"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<CText> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;

    	$$self.$set = $$props => {
    		if ("x" in $$props) $$invalidate(0, x = $$props.x);
    		if ("y" in $$props) $$invalidate(1, y = $$props.y);
    		if ("style" in $$props) $$invalidate(2, style = $$props.style);
    		if ("$$scope" in $$props) $$invalidate(3, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => {
    		return { x, y, style };
    	};

    	$$self.$inject_state = $$props => {
    		if ("x" in $$props) $$invalidate(0, x = $$props.x);
    		if ("y" in $$props) $$invalidate(1, y = $$props.y);
    		if ("style" in $$props) $$invalidate(2, style = $$props.style);
    	};

    	return [x, y, style, $$scope, $$slots];
    }

    class CText extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$7, safe_not_equal, { x: 0, y: 1, style: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "CText",
    			options,
    			id: create_fragment$7.name
    		});
    	}

    	get x() {
    		throw new Error("<CText>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set x(value) {
    		throw new Error("<CText>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get y() {
    		throw new Error("<CText>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set y(value) {
    		throw new Error("<CText>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get style() {
    		throw new Error("<CText>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set style(value) {
    		throw new Error("<CText>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/Text.svelte generated by Svelte v3.16.7 */
    const file$8 = "src/Text.svelte";

    // (24:3) <CText>
    function create_default_slot_1(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Grumpy!");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_1.name,
    		type: "slot",
    		source: "(24:3) <CText>",
    		ctx
    	});

    	return block;
    }

    // (18:0) <Grid click={() => angle=angle+10}>
    function create_default_slot$4(ctx) {
    	let g2;
    	let g0;
    	let g1;
    	let g2_transform_value;
    	let current;

    	const crect = new CRect({
    			props: { w: "144", h: "45" },
    			$$inline: true
    		});

    	const ctext = new CText({
    			props: {
    				$$slots: { default: [create_default_slot_1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			g2 = svg_element("g");
    			g0 = svg_element("g");
    			create_component(crect.$$.fragment);
    			g1 = svg_element("g");
    			create_component(ctext.$$.fragment);
    			attr_dev(g0, "class", "fn red svelte-pbk4wn");
    			add_location(g0, file$8, 19, 2, 428);
    			attr_dev(g1, "class", "sw0 fs40 f-yellow svelte-pbk4wn");
    			add_location(g1, file$8, 22, 2, 480);
    			attr_dev(g2, "transform", g2_transform_value = "translate(100,100) rotate(" + /*angle*/ ctx[0] + ")");
    			add_location(g2, file$8, 18, 1, 374);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, g2, anchor);
    			append_dev(g2, g0);
    			mount_component(crect, g0, null);
    			append_dev(g2, g1);
    			mount_component(ctext, g1, null);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const ctext_changes = {};

    			if (dirty & /*$$scope*/ 4) {
    				ctext_changes.$$scope = { dirty, ctx };
    			}

    			ctext.$set(ctext_changes);

    			if (!current || dirty & /*angle*/ 1 && g2_transform_value !== (g2_transform_value = "translate(100,100) rotate(" + /*angle*/ ctx[0] + ")")) {
    				attr_dev(g2, "transform", g2_transform_value);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(crect.$$.fragment, local);
    			transition_in(ctext.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(crect.$$.fragment, local);
    			transition_out(ctext.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(g2);
    			destroy_component(crect);
    			destroy_component(ctext);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$4.name,
    		type: "slot",
    		source: "(18:0) <Grid click={() => angle=angle+10}>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$8(ctx) {
    	let current;

    	const grid = new Grid({
    			props: {
    				click: /*func*/ ctx[1],
    				$$slots: { default: [create_default_slot$4] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(grid.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(grid, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const grid_changes = {};
    			if (dirty & /*angle*/ 1) grid_changes.click = /*func*/ ctx[1];

    			if (dirty & /*$$scope, angle*/ 5) {
    				grid_changes.$$scope = { dirty, ctx };
    			}

    			grid.$set(grid_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(grid.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(grid.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(grid, detaching);
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

    function instance$5($$self, $$props, $$invalidate) {
    	let angle = 0;
    	const func = () => $$invalidate(0, angle = angle + 10);

    	$$self.$capture_state = () => {
    		return {};
    	};

    	$$self.$inject_state = $$props => {
    		if ("angle" in $$props) $$invalidate(0, angle = $$props.angle);
    	};

    	return [angle, func];
    }

    class Text extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$8, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Text",
    			options,
    			id: create_fragment$8.name
    		});
    	}
    }

    /* src/Each.svelte generated by Svelte v3.16.7 */
    const file$9 = "src/Each.svelte";

    function get_each_context$2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[0] = list[i];
    	return child_ctx;
    }

    // (10:1) {#each [50,100,150] as i}
    function create_each_block$2(ctx) {
    	let circle;
    	let circle_cx_value;
    	let circle_cy_value;

    	const block = {
    		c: function create() {
    			circle = svg_element("circle");
    			attr_dev(circle, "cx", circle_cx_value = /*i*/ ctx[0]);
    			attr_dev(circle, "cy", circle_cy_value = /*i*/ ctx[0]);
    			attr_dev(circle, "r", "10");
    			attr_dev(circle, "class", "svelte-7nuu68");
    			add_location(circle, file$9, 10, 2, 160);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, circle, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(circle);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$2.name,
    		type: "each",
    		source: "(10:1) {#each [50,100,150] as i}",
    		ctx
    	});

    	return block;
    }

    // (9:0) <Grid>
    function create_default_slot$5(ctx) {
    	let each_1_anchor;
    	let each_value = [50, 100, 150];
    	let each_blocks = [];

    	for (let i = 0; i < 3; i += 1) {
    		each_blocks[i] = create_each_block$2(get_each_context$2(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			for (let i = 0; i < 3; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			for (let i = 0; i < 3; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$5.name,
    		type: "slot",
    		source: "(9:0) <Grid>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$9(ctx) {
    	let current;

    	const grid = new Grid({
    			props: {
    				$$slots: { default: [create_default_slot$5] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(grid.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(grid, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const grid_changes = {};

    			if (dirty & /*$$scope*/ 8) {
    				grid_changes.$$scope = { dirty, ctx };
    			}

    			grid.$set(grid_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(grid.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(grid.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(grid, detaching);
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

    class Each extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, null, create_fragment$9, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Each",
    			options,
    			id: create_fragment$9.name
    		});
    	}
    }

    /* src/If.svelte generated by Svelte v3.16.7 */
    const file$a = "src/If.svelte";

    function get_each_context$3(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[0] = list[i];
    	return child_ctx;
    }

    // (18:2) {:else}
    function create_else_block$1(ctx) {
    	let rect;
    	let rect_x_value;
    	let rect_y_value;

    	const block = {
    		c: function create() {
    			rect = svg_element("rect");
    			attr_dev(rect, "x", rect_x_value = 20 * /*i*/ ctx[0] - 10);
    			attr_dev(rect, "y", rect_y_value = 20 * /*i*/ ctx[0] - 10);
    			attr_dev(rect, "width", "20");
    			attr_dev(rect, "height", "20");
    			attr_dev(rect, "class", "svelte-114jxik");
    			add_location(rect, file$a, 18, 3, 271);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, rect, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(rect);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$1.name,
    		type: "else",
    		source: "(18:2) {:else}",
    		ctx
    	});

    	return block;
    }

    // (16:2) {#if i%2==0}
    function create_if_block$1(ctx) {
    	let circle;
    	let circle_cx_value;
    	let circle_cy_value;

    	const block = {
    		c: function create() {
    			circle = svg_element("circle");
    			attr_dev(circle, "cx", circle_cx_value = 20 * /*i*/ ctx[0]);
    			attr_dev(circle, "cy", circle_cy_value = 20 * /*i*/ ctx[0]);
    			attr_dev(circle, "r", "10");
    			attr_dev(circle, "class", "svelte-114jxik");
    			add_location(circle, file$a, 16, 3, 222);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, circle, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(circle);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(16:2) {#if i%2==0}",
    		ctx
    	});

    	return block;
    }

    // (15:1) {#each range(11) as i}
    function create_each_block$3(ctx) {
    	let if_block_anchor;

    	function select_block_type(ctx, dirty) {
    		if (/*i*/ ctx[0] % 2 == 0) return create_if_block$1;
    		return create_else_block$1;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if_block.p(ctx, dirty);
    		},
    		d: function destroy(detaching) {
    			if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$3.name,
    		type: "each",
    		source: "(15:1) {#each range(11) as i}",
    		ctx
    	});

    	return block;
    }

    // (14:0) <Grid>
    function create_default_slot$6(ctx) {
    	let each_1_anchor;
    	let each_value = lodash_range(11);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$3(get_each_context$3(ctx, each_value, i));
    	}

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
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*range*/ 0) {
    				each_value = lodash_range(11);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$3(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$3(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		d: function destroy(detaching) {
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$6.name,
    		type: "slot",
    		source: "(14:0) <Grid>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$a(ctx) {
    	let current;

    	const grid = new Grid({
    			props: {
    				$$slots: { default: [create_default_slot$6] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(grid.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(grid, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const grid_changes = {};

    			if (dirty & /*$$scope*/ 8) {
    				grid_changes.$$scope = { dirty, ctx };
    			}

    			grid.$set(grid_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(grid.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(grid.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(grid, detaching);
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

    class If extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, null, create_fragment$a, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "If",
    			options,
    			id: create_fragment$a.name
    		});
    	}
    }

    /* src/Range.svelte generated by Svelte v3.16.7 */
    const file$b = "src/Range.svelte";

    function get_each_context$4(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[0] = list[i];
    	return child_ctx;
    }

    // (11:1) {#each range(11) as i}
    function create_each_block$4(ctx) {
    	let circle;
    	let circle_cx_value;
    	let circle_cy_value;
    	let circle_r_value;

    	const block = {
    		c: function create() {
    			circle = svg_element("circle");
    			attr_dev(circle, "cx", circle_cx_value = 20 * /*i*/ ctx[0]);
    			attr_dev(circle, "cy", circle_cy_value = 20 * /*i*/ ctx[0]);
    			attr_dev(circle, "r", circle_r_value = 2 * /*i*/ ctx[0]);
    			attr_dev(circle, "class", "svelte-7nuu68");
    			add_location(circle, file$b, 11, 2, 191);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, circle, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(circle);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$4.name,
    		type: "each",
    		source: "(11:1) {#each range(11) as i}",
    		ctx
    	});

    	return block;
    }

    // (10:0) <Grid>
    function create_default_slot$7(ctx) {
    	let each_1_anchor;
    	let each_value = lodash_range(11);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$4(get_each_context$4(ctx, each_value, i));
    	}

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
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*range*/ 0) {
    				each_value = lodash_range(11);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$4(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$4(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		d: function destroy(detaching) {
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$7.name,
    		type: "slot",
    		source: "(10:0) <Grid>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$b(ctx) {
    	let current;

    	const grid = new Grid({
    			props: {
    				$$slots: { default: [create_default_slot$7] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(grid.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(grid, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const grid_changes = {};

    			if (dirty & /*$$scope*/ 8) {
    				grid_changes.$$scope = { dirty, ctx };
    			}

    			grid.$set(grid_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(grid.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(grid.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(grid, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$b.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    class Range extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, null, create_fragment$b, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Range",
    			options,
    			id: create_fragment$b.name
    		});
    	}
    }

    /* src/Chess.svelte generated by Svelte v3.16.7 */
    const file$c = "src/Chess.svelte";

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[3] = list[i];
    	return child_ctx;
    }

    function get_each_context$5(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[0] = list[i];
    	return child_ctx;
    }

    // (11:3) {:else}
    function create_else_block$2(ctx) {
    	let rect;
    	let rect_x_value;
    	let rect_y_value;

    	const block = {
    		c: function create() {
    			rect = svg_element("rect");
    			attr_dev(rect, "x", rect_x_value = 20 + 20 * /*i*/ ctx[0]);
    			attr_dev(rect, "y", rect_y_value = 20 + 20 * /*j*/ ctx[3]);
    			attr_dev(rect, "width", "20");
    			attr_dev(rect, "height", "20");
    			set_style(rect, "fill", "black");
    			add_location(rect, file$c, 11, 4, 257);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, rect, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(rect);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$2.name,
    		type: "else",
    		source: "(11:3) {:else}",
    		ctx
    	});

    	return block;
    }

    // (9:3) {#if (i+j)%2==0}
    function create_if_block$2(ctx) {
    	let rect;
    	let rect_x_value;
    	let rect_y_value;

    	const block = {
    		c: function create() {
    			rect = svg_element("rect");
    			attr_dev(rect, "x", rect_x_value = 20 + 20 * /*i*/ ctx[0]);
    			attr_dev(rect, "y", rect_y_value = 20 + 20 * /*j*/ ctx[3]);
    			attr_dev(rect, "width", "20");
    			attr_dev(rect, "height", "20");
    			set_style(rect, "fill", "white");
    			add_location(rect, file$c, 9, 4, 172);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, rect, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(rect);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(9:3) {#if (i+j)%2==0}",
    		ctx
    	});

    	return block;
    }

    // (8:2) {#each range(8) as j}
    function create_each_block_1(ctx) {
    	let if_block_anchor;

    	function select_block_type(ctx, dirty) {
    		if ((/*i*/ ctx[0] + /*j*/ ctx[3]) % 2 == 0) return create_if_block$2;
    		return create_else_block$2;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if_block.p(ctx, dirty);
    		},
    		d: function destroy(detaching) {
    			if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(8:2) {#each range(8) as j}",
    		ctx
    	});

    	return block;
    }

    // (7:1) {#each range(8) as i}
    function create_each_block$5(ctx) {
    	let each_1_anchor;
    	let each_value_1 = lodash_range(8);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

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
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*range*/ 0) {
    				each_value_1 = lodash_range(8);
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
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$5.name,
    		type: "each",
    		source: "(7:1) {#each range(8) as i}",
    		ctx
    	});

    	return block;
    }

    // (6:0) <Canvas>
    function create_default_slot$8(ctx) {
    	let each_1_anchor;
    	let each_value = lodash_range(8);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$5(get_each_context$5(ctx, each_value, i));
    	}

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
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*range*/ 0) {
    				each_value = lodash_range(8);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$5(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$5(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		d: function destroy(detaching) {
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$8.name,
    		type: "slot",
    		source: "(6:0) <Canvas>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$c(ctx) {
    	let current;

    	const canvas = new Canvas({
    			props: {
    				$$slots: { default: [create_default_slot$8] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(canvas.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(canvas, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const canvas_changes = {};

    			if (dirty & /*$$scope*/ 64) {
    				canvas_changes.$$scope = { dirty, ctx };
    			}

    			canvas.$set(canvas_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(canvas.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(canvas.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(canvas, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$c.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    class Chess extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, null, create_fragment$c, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Chess",
    			options,
    			id: create_fragment$c.name
    		});
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

    /* src/Random.svelte generated by Svelte v3.16.7 */
    const file$d = "src/Random.svelte";

    function get_each_context$6(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[0] = list[i];
    	return child_ctx;
    }

    // (8:1) {#each range(10) as i }
    function create_each_block$6(ctx) {
    	let circle;
    	let circle_cx_value;
    	let circle_cy_value;
    	let circle_r_value;

    	const block = {
    		c: function create() {
    			circle = svg_element("circle");
    			attr_dev(circle, "cx", circle_cx_value = lodash_random(1, 200));
    			attr_dev(circle, "cy", circle_cy_value = lodash_random(1, 200));
    			attr_dev(circle, "r", circle_r_value = lodash_random(10, 20));
    			set_style(circle, "fill", "black");
    			set_style(circle, "stroke", "white");
    			set_style(circle, "stroke-width", "1");
    			add_location(circle, file$d, 8, 2, 158);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, circle, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(circle);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$6.name,
    		type: "each",
    		source: "(8:1) {#each range(10) as i }",
    		ctx
    	});

    	return block;
    }

    // (7:0) <Grid>
    function create_default_slot$9(ctx) {
    	let each_1_anchor;
    	let each_value = lodash_range(10);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$6(get_each_context$6(ctx, each_value, i));
    	}

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
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*random*/ 0) {
    				each_value = lodash_range(10);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$6(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$6(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		d: function destroy(detaching) {
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$9.name,
    		type: "slot",
    		source: "(7:0) <Grid>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$d(ctx) {
    	let current;

    	const grid = new Grid({
    			props: {
    				$$slots: { default: [create_default_slot$9] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(grid.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(grid, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const grid_changes = {};

    			if (dirty & /*$$scope*/ 8) {
    				grid_changes.$$scope = { dirty, ctx };
    			}

    			grid.$set(grid_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(grid.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(grid.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(grid, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$d.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    class Random extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, null, create_fragment$d, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Random",
    			options,
    			id: create_fragment$d.name
    		});
    	}
    }

    /* src/Button.svelte generated by Svelte v3.16.7 */

    const file$e = "src/Button.svelte";

    function create_fragment$e(ctx) {
    	let div;
    	let t0;
    	let t1;
    	let button;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			t0 = text(/*i*/ ctx[0]);
    			t1 = space();
    			button = element("button");
    			button.textContent = "Click!";
    			set_style(div, "color", "red");
    			add_location(div, file$e, 2, 0, 26);
    			add_location(button, file$e, 3, 0, 59);
    			dispose = listen_dev(button, "click", /*click_handler*/ ctx[1], false, false, false);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t0);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, button, anchor);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*i*/ 1) set_data_dev(t0, /*i*/ ctx[0]);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(button);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$e.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$6($$self, $$props, $$invalidate) {
    	let i = 0;
    	const click_handler = () => $$invalidate(0, i++, i);

    	$$self.$capture_state = () => {
    		return {};
    	};

    	$$self.$inject_state = $$props => {
    		if ("i" in $$props) $$invalidate(0, i = $$props.i);
    	};

    	return [i, click_handler];
    }

    class Button extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$e, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Button",
    			options,
    			id: create_fragment$e.name
    		});
    	}
    }

    /* src/Click.svelte generated by Svelte v3.16.7 */

    function create_fragment$f(ctx) {
    	const block = {
    		c: noop,
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: noop,
    		p: noop,
    		i: noop,
    		o: noop,
    		d: noop
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$f.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    class Click extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, null, create_fragment$f, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Click",
    			options,
    			id: create_fragment$f.name
    		});
    	}
    }

    /* src/Shortcut.svelte generated by Svelte v3.16.7 */

    const file$f = "src/Shortcut.svelte";

    function create_fragment$g(ctx) {
    	let div;
    	let t0;
    	let t1;
    	let t2;
    	let t3;
    	let button0;
    	let t5;
    	let button1;
    	let t7;
    	let button2;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			t0 = text(/*a*/ ctx[0]);
    			t1 = text(" to ");
    			t2 = text(/*b*/ ctx[1]);
    			t3 = space();
    			button0 = element("button");
    			button0.textContent = "+2";
    			t5 = space();
    			button1 = element("button");
    			button1.textContent = "*2";
    			t7 = space();
    			button2 = element("button");
    			button2.textContent = "/2";
    			set_style(div, "color", "white");
    			add_location(div, file$f, 6, 0, 68);
    			add_location(button0, file$f, 7, 0, 112);
    			add_location(button1, file$f, 8, 0, 155);
    			add_location(button2, file$f, 9, 0, 198);

    			dispose = [
    				listen_dev(button0, "click", /*click_handler*/ ctx[3], false, false, false),
    				listen_dev(button1, "click", /*click_handler_1*/ ctx[4], false, false, false),
    				listen_dev(button2, "click", /*click_handler_2*/ ctx[5], false, false, false)
    			];
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t0);
    			append_dev(div, t1);
    			append_dev(div, t2);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, button0, anchor);
    			insert_dev(target, t5, anchor);
    			insert_dev(target, button1, anchor);
    			insert_dev(target, t7, anchor);
    			insert_dev(target, button2, anchor);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*a*/ 1) set_data_dev(t0, /*a*/ ctx[0]);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(button0);
    			if (detaching) detach_dev(t5);
    			if (detaching) detach_dev(button1);
    			if (detaching) detach_dev(t7);
    			if (detaching) detach_dev(button2);
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$g.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$7($$self, $$props, $$invalidate) {
    	let a = 17;
    	let b = 1;
    	const op = value => $$invalidate(0, a = value);
    	const click_handler = () => op(a + 2);
    	const click_handler_1 = () => op(a * 2);
    	const click_handler_2 = () => a % 2 == 0 ? op(a / 2) : a;

    	$$self.$capture_state = () => {
    		return {};
    	};

    	$$self.$inject_state = $$props => {
    		if ("a" in $$props) $$invalidate(0, a = $$props.a);
    		if ("b" in $$props) $$invalidate(1, b = $$props.b);
    	};

    	return [a, b, op, click_handler, click_handler_1, click_handler_2];
    }

    class Shortcut extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$7, create_fragment$g, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Shortcut",
    			options,
    			id: create_fragment$g.name
    		});
    	}
    }

    /* src/ColorPair.svelte generated by Svelte v3.16.7 */
    const file$g = "src/ColorPair.svelte";

    function get_each_context$7(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[3] = list[i];
    	return child_ctx;
    }

    // (16:2) {#each circles as c}
    function create_each_block$7(ctx) {
    	let circle;
    	let circle_cx_value;
    	let circle_cy_value;
    	let circle_fill_value;
    	let dispose;

    	function click_handler(...args) {
    		return /*click_handler*/ ctx[2](/*c*/ ctx[3], ...args);
    	}

    	const block = {
    		c: function create() {
    			circle = svg_element("circle");
    			attr_dev(circle, "cx", circle_cx_value = /*c*/ ctx[3].x);
    			attr_dev(circle, "cy", circle_cy_value = /*c*/ ctx[3].y);
    			attr_dev(circle, "r", r);
    			attr_dev(circle, "fill", circle_fill_value = /*c*/ ctx[3].color);
    			add_location(circle, file$g, 16, 3, 381);
    			dispose = listen_dev(circle, "click", click_handler, false, false, false);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, circle, anchor);
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty & /*circles*/ 1 && circle_cx_value !== (circle_cx_value = /*c*/ ctx[3].x)) {
    				attr_dev(circle, "cx", circle_cx_value);
    			}

    			if (dirty & /*circles*/ 1 && circle_cy_value !== (circle_cy_value = /*c*/ ctx[3].y)) {
    				attr_dev(circle, "cy", circle_cy_value);
    			}

    			if (dirty & /*circles*/ 1 && circle_fill_value !== (circle_fill_value = /*c*/ ctx[3].color)) {
    				attr_dev(circle, "fill", circle_fill_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(circle);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$7.name,
    		type: "each",
    		source: "(16:2) {#each circles as c}",
    		ctx
    	});

    	return block;
    }

    // (14:0) <Grid>
    function create_default_slot$a(ctx) {
    	let g;
    	let each_value = /*circles*/ ctx[0];
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$7(get_each_context$7(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			g = svg_element("g");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(g, "stroke", "#fff");
    			attr_dev(g, "stroke-width", "1");
    			add_location(g, file$g, 14, 1, 322);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, g, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(g, null);
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*circles, r, click*/ 3) {
    				each_value = /*circles*/ ctx[0];
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$7(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$7(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(g, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(g);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$a.name,
    		type: "slot",
    		source: "(14:0) <Grid>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$h(ctx) {
    	let current;

    	const grid = new Grid({
    			props: {
    				$$slots: { default: [create_default_slot$a] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(grid.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(grid, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const grid_changes = {};

    			if (dirty & /*$$scope, circles*/ 65) {
    				grid_changes.$$scope = { dirty, ctx };
    			}

    			grid.$set(grid_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(grid.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(grid.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(grid, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$h.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const r = 50;

    function instance$8($$self, $$props, $$invalidate) {
    	let circles = [];

    	for (const x of [80, 120]) {
    		for (const y of [80, 120]) {
    			const color = circles.length % 2 == 0 ? "#00f8" : "#ff08";
    			circles.push({ color, x, y });
    		}
    	}

    	const click = c => $$invalidate(0, circles = circles.filter(circle => circle != c));
    	const click_handler = c => click(c);

    	$$self.$capture_state = () => {
    		return {};
    	};

    	$$self.$inject_state = $$props => {
    		if ("circles" in $$props) $$invalidate(0, circles = $$props.circles);
    	};

    	return [circles, click, click_handler];
    }

    class ColorPair extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$8, create_fragment$h, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ColorPair",
    			options,
    			id: create_fragment$h.name
    		});
    	}
    }

    /* src/Bind.svelte generated by Svelte v3.16.7 */

    const file$h = "src/Bind.svelte";

    function create_fragment$i(ctx) {
    	let div;
    	let t0_value = /*i*/ ctx[0] * /*i*/ ctx[0] + "";
    	let t0;
    	let t1;
    	let input;
    	let input_updating = false;
    	let dispose;

    	function input_input_handler() {
    		input_updating = true;
    		/*input_input_handler*/ ctx[1].call(input);
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			t0 = text(t0_value);
    			t1 = space();
    			input = element("input");
    			set_style(div, "color", "red");
    			add_location(div, file$h, 4, 0, 30);
    			attr_dev(input, "type", "number");
    			add_location(input, file$h, 5, 0, 65);
    			dispose = listen_dev(input, "input", input_input_handler);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t0);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, input, anchor);
    			set_input_value(input, /*i*/ ctx[0]);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*i*/ 1 && t0_value !== (t0_value = /*i*/ ctx[0] * /*i*/ ctx[0] + "")) set_data_dev(t0, t0_value);

    			if (!input_updating && dirty & /*i*/ 1) {
    				set_input_value(input, /*i*/ ctx[0]);
    			}

    			input_updating = false;
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(input);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$i.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$9($$self, $$props, $$invalidate) {
    	let i = 10;

    	function input_input_handler() {
    		i = to_number(this.value);
    		$$invalidate(0, i);
    	}

    	$$self.$capture_state = () => {
    		return {};
    	};

    	$$self.$inject_state = $$props => {
    		if ("i" in $$props) $$invalidate(0, i = $$props.i);
    	};

    	return [i, input_input_handler];
    }

    class Bind extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$9, create_fragment$i, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Bind",
    			options,
    			id: create_fragment$i.name
    		});
    	}
    }

    /* src/KeyUp.svelte generated by Svelte v3.16.7 */

    const file$i = "src/KeyUp.svelte";

    function create_fragment$j(ctx) {
    	let div0;
    	let t0;
    	let t1;
    	let t2;
    	let div1;
    	let t3;
    	let t4;
    	let t5;
    	let input;
    	let dispose;

    	const block = {
    		c: function create() {
    			div0 = element("div");
    			t0 = text("key: ");
    			t1 = text(/*key*/ ctx[0]);
    			t2 = space();
    			div1 = element("div");
    			t3 = text("keycode: ");
    			t4 = text(/*keyCode*/ ctx[1]);
    			t5 = space();
    			input = element("input");
    			set_style(div0, "color", "red");
    			add_location(div0, file$i, 9, 0, 123);
    			set_style(div1, "color", "yellow");
    			add_location(div1, file$i, 10, 0, 163);
    			add_location(input, file$i, 11, 0, 214);
    			dispose = listen_dev(input, "keyup", /*handleKey*/ ctx[2], false, false, false);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div0, anchor);
    			append_dev(div0, t0);
    			append_dev(div0, t1);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, div1, anchor);
    			append_dev(div1, t3);
    			append_dev(div1, t4);
    			insert_dev(target, t5, anchor);
    			insert_dev(target, input, anchor);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*key*/ 1) set_data_dev(t1, /*key*/ ctx[0]);
    			if (dirty & /*keyCode*/ 2) set_data_dev(t4, /*keyCode*/ ctx[1]);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div0);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(div1);
    			if (detaching) detach_dev(t5);
    			if (detaching) detach_dev(input);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$j.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$a($$self, $$props, $$invalidate) {
    	let key = "";
    	let keyCode = "";

    	const handleKey = event => {
    		$$invalidate(0, key = event.key);
    		$$invalidate(1, keyCode = event.keyCode);
    	};

    	$$self.$capture_state = () => {
    		return {};
    	};

    	$$self.$inject_state = $$props => {
    		if ("key" in $$props) $$invalidate(0, key = $$props.key);
    		if ("keyCode" in $$props) $$invalidate(1, keyCode = $$props.keyCode);
    	};

    	return [key, keyCode, handleKey];
    }

    class KeyUp extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$a, create_fragment$j, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "KeyUp",
    			options,
    			id: create_fragment$j.name
    		});
    	}
    }

    /* src/GuessMyNumber.svelte generated by Svelte v3.16.7 */
    const file$j = "src/GuessMyNumber.svelte";

    function create_fragment$k(ctx) {
    	let div;
    	let t0;
    	let t1;
    	let t2;
    	let t3;
    	let t4;
    	let t5;
    	let input;
    	let input_updating = false;
    	let dispose;

    	function input_input_handler() {
    		input_updating = true;
    		/*input_input_handler*/ ctx[6].call(input);
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			t0 = text(/*low*/ ctx[0]);
    			t1 = text(" to ");
    			t2 = text(/*high*/ ctx[1]);
    			t3 = space();
    			t4 = text(/*msg*/ ctx[3]);
    			t5 = space();
    			input = element("input");
    			attr_dev(input, "type", "number");
    			add_location(input, file$j, 17, 1, 396);
    			set_style(div, "color", "white");
    			add_location(div, file$j, 15, 0, 346);

    			dispose = [
    				listen_dev(input, "keyup", /*keyup*/ ctx[4], false, false, false),
    				listen_dev(input, "input", input_input_handler)
    			];
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t0);
    			append_dev(div, t1);
    			append_dev(div, t2);
    			append_dev(div, t3);
    			append_dev(div, t4);
    			append_dev(div, t5);
    			append_dev(div, input);
    			set_input_value(input, /*guess*/ ctx[2]);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*low*/ 1) set_data_dev(t0, /*low*/ ctx[0]);
    			if (dirty & /*high*/ 2) set_data_dev(t2, /*high*/ ctx[1]);
    			if (dirty & /*msg*/ 8) set_data_dev(t4, /*msg*/ ctx[3]);

    			if (!input_updating && dirty & /*guess*/ 4) {
    				set_input_value(input, /*guess*/ ctx[2]);
    			}

    			input_updating = false;
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$k.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$b($$self, $$props, $$invalidate) {
    	let low = 1;
    	let high = 127;
    	let guess;
    	let msg = "";
    	let secret = lodash_random(low, high);

    	const keyup = event => {
    		if (event.key != "Enter") return;
    		if (guess < secret) $$invalidate(0, low = guess + 1);
    		if (guess > secret) $$invalidate(1, high = guess - 1);
    		if (guess == secret) $$invalidate(3, msg = "Yes! The number was " + secret);
    	};

    	function input_input_handler() {
    		guess = to_number(this.value);
    		$$invalidate(2, guess);
    	}

    	$$self.$capture_state = () => {
    		return {};
    	};

    	$$self.$inject_state = $$props => {
    		if ("low" in $$props) $$invalidate(0, low = $$props.low);
    		if ("high" in $$props) $$invalidate(1, high = $$props.high);
    		if ("guess" in $$props) $$invalidate(2, guess = $$props.guess);
    		if ("msg" in $$props) $$invalidate(3, msg = $$props.msg);
    		if ("secret" in $$props) secret = $$props.secret;
    	};

    	return [low, high, guess, msg, keyup, secret, input_input_handler];
    }

    class GuessMyNumber extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$b, create_fragment$k, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "GuessMyNumber",
    			options,
    			id: create_fragment$k.name
    		});
    	}
    }

    /* src/Translate.svelte generated by Svelte v3.16.7 */

    const file$k = "src/Translate.svelte";

    function create_fragment$l(ctx) {
    	let svg;
    	let rect;
    	let line0;
    	let line1;

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			rect = svg_element("rect");
    			line0 = svg_element("line");
    			line1 = svg_element("line");
    			attr_dev(rect, "x", "-100");
    			attr_dev(rect, "y", "-100");
    			attr_dev(rect, "width", "200");
    			attr_dev(rect, "height", "200");
    			set_style(rect, "fill", "grey");
    			add_location(rect, file$k, 9, 1, 119);
    			attr_dev(line0, "y1", "0");
    			attr_dev(line0, "y2", "90");
    			set_style(line0, "stroke", "black");
    			attr_dev(line0, "class", "svelte-6lghdy");
    			add_location(line0, file$k, 10, 1, 181);
    			attr_dev(line1, "y1", "0");
    			attr_dev(line1, "y2", "90");
    			set_style(line1, "stroke", "red");
    			attr_dev(line1, "transform", "translate(20)");
    			attr_dev(line1, "class", "svelte-6lghdy");
    			add_location(line1, file$k, 11, 1, 222);
    			attr_dev(svg, "viewBox", "-100 -100 200 200");
    			attr_dev(svg, "class", "svelte-6lghdy");
    			add_location(svg, file$k, 8, 0, 84);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svg, anchor);
    			append_dev(svg, rect);
    			append_dev(svg, line0);
    			append_dev(svg, line1);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(svg);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$l.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    class Translate extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, null, create_fragment$l, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Translate",
    			options,
    			id: create_fragment$l.name
    		});
    	}
    }

    /* src/Rotate.svelte generated by Svelte v3.16.7 */

    const file$l = "src/Rotate.svelte";

    function create_fragment$m(ctx) {
    	let svg;
    	let rect;
    	let line0;
    	let line1;

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			rect = svg_element("rect");
    			line0 = svg_element("line");
    			line1 = svg_element("line");
    			attr_dev(rect, "x", "-100");
    			attr_dev(rect, "y", "-100");
    			attr_dev(rect, "width", "200");
    			attr_dev(rect, "height", "200");
    			set_style(rect, "fill", "grey");
    			add_location(rect, file$l, 9, 1, 119);
    			attr_dev(line0, "y2", "90");
    			set_style(line0, "stroke", "black");
    			attr_dev(line0, "class", "svelte-6lghdy");
    			add_location(line0, file$l, 10, 1, 181);
    			attr_dev(line1, "y2", "90");
    			set_style(line1, "stroke", "red");
    			attr_dev(line1, "transform", "rotate(45)");
    			attr_dev(line1, "class", "svelte-6lghdy");
    			add_location(line1, file$l, 11, 1, 217);
    			attr_dev(svg, "viewBox", "-100 -100 200 200");
    			attr_dev(svg, "class", "svelte-6lghdy");
    			add_location(svg, file$l, 8, 0, 84);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svg, anchor);
    			append_dev(svg, rect);
    			append_dev(svg, line0);
    			append_dev(svg, line1);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(svg);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$m.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    class Rotate extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, null, create_fragment$m, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Rotate",
    			options,
    			id: create_fragment$m.name
    		});
    	}
    }

    /* src/Scale.svelte generated by Svelte v3.16.7 */

    const file$m = "src/Scale.svelte";

    function create_fragment$n(ctx) {
    	let svg;
    	let rect;
    	let line0;
    	let line1;

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			rect = svg_element("rect");
    			line0 = svg_element("line");
    			line1 = svg_element("line");
    			attr_dev(rect, "x", "-100");
    			attr_dev(rect, "y", "-100");
    			attr_dev(rect, "width", "200");
    			attr_dev(rect, "height", "200");
    			set_style(rect, "fill", "grey");
    			add_location(rect, file$m, 9, 1, 119);
    			attr_dev(line0, "y1", "0");
    			attr_dev(line0, "y2", "90");
    			set_style(line0, "stroke", "black");
    			attr_dev(line0, "class", "svelte-6lghdy");
    			add_location(line0, file$m, 10, 1, 181);
    			attr_dev(line1, "y1", "0");
    			attr_dev(line1, "y2", "90");
    			set_style(line1, "stroke", "red");
    			attr_dev(line1, "transform", "rotate(90) scale(0.5)");
    			attr_dev(line1, "class", "svelte-6lghdy");
    			add_location(line1, file$m, 11, 1, 222);
    			attr_dev(svg, "viewBox", "-100 -100 200 200");
    			attr_dev(svg, "class", "svelte-6lghdy");
    			add_location(svg, file$m, 8, 0, 84);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svg, anchor);
    			append_dev(svg, rect);
    			append_dev(svg, line0);
    			append_dev(svg, line1);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(svg);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$n.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    class Scale extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, null, create_fragment$n, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Scale",
    			options,
    			id: create_fragment$n.name
    		});
    	}
    }

    /* src/Clock.svelte generated by Svelte v3.16.7 */
    const file$n = "src/Clock.svelte";

    function get_each_context_1$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[7] = list[i];
    	return child_ctx;
    }

    function get_each_context$8(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[4] = list[i];
    	return child_ctx;
    }

    // (38:4) <CText>
    function create_default_slot$b(ctx) {
    	let t_value = 1 + (/*i*/ ctx[4] + 2) % 12 + "";
    	let t;

    	const block = {
    		c: function create() {
    			t = text(t_value);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$b.name,
    		type: "slot",
    		source: "(38:4) <CText>",
    		ctx
    	});

    	return block;
    }

    // (41:3) {#each range(1,5) as offset}
    function create_each_block_1$1(ctx) {
    	let line;
    	let line_transform_value;

    	const block = {
    		c: function create() {
    			line = svg_element("line");
    			attr_dev(line, "class", "minor svelte-159ev0q");
    			attr_dev(line, "y1", "42");
    			attr_dev(line, "y2", "45");
    			attr_dev(line, "transform", line_transform_value = "rotate(" + 6 * /*offset*/ ctx[7] + ")");
    			add_location(line, file$n, 41, 4, 1056);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, line, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(line);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1$1.name,
    		type: "each",
    		source: "(41:3) {#each range(1,5) as offset}",
    		ctx
    	});

    	return block;
    }

    // (34:1) {#each range(12) as i}
    function create_each_block$8(ctx) {
    	let g1;
    	let line;
    	let g0;
    	let g0_transform_value;
    	let g1_transform_value;
    	let current;

    	const ctext = new CText({
    			props: {
    				$$slots: { default: [create_default_slot$b] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	let each_value_1 = lodash_range(1, 5);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks[i] = create_each_block_1$1(get_each_context_1$1(ctx, each_value_1, i));
    	}

    	const block = {
    		c: function create() {
    			g1 = svg_element("g");
    			line = svg_element("line");
    			g0 = svg_element("g");
    			create_component(ctext.$$.fragment);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(line, "class", "major svelte-159ev0q");
    			attr_dev(line, "y1", "35");
    			attr_dev(line, "y2", "45");
    			add_location(line, file$n, 35, 3, 881);
    			attr_dev(g0, "transform", g0_transform_value = "translate(" + 30 + ") rotate(" + -30 * /*i*/ ctx[4] + ")");
    			attr_dev(g0, "class", "fs svelte-159ev0q");
    			add_location(g0, file$n, 36, 3, 919);
    			attr_dev(g1, "transform", g1_transform_value = "rotate(" + 30 * /*i*/ ctx[4] + ")");
    			add_location(g1, file$n, 34, 2, 843);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, g1, anchor);
    			append_dev(g1, line);
    			append_dev(g1, g0);
    			mount_component(ctext, g0, null);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(g1, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const ctext_changes = {};

    			if (dirty & /*$$scope*/ 1024) {
    				ctext_changes.$$scope = { dirty, ctx };
    			}

    			ctext.$set(ctext_changes);

    			if (dirty & /*range*/ 0) {
    				each_value_1 = lodash_range(1, 5);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1$1(ctx, each_value_1, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_1$1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(g1, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_1.length;
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(ctext.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(ctext.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(g1);
    			destroy_component(ctext);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$8.name,
    		type: "each",
    		source: "(34:1) {#each range(12) as i}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$o(ctx) {
    	let svg;
    	let circle;
    	let line0;
    	let line0_transform_value;
    	let line1;
    	let line1_transform_value;
    	let g;
    	let line2;
    	let line3;
    	let g_transform_value;
    	let current;
    	let each_value = lodash_range(12);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$8(get_each_context$8(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			circle = svg_element("circle");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			line0 = svg_element("line");
    			line1 = svg_element("line");
    			g = svg_element("g");
    			line2 = svg_element("line");
    			line3 = svg_element("line");
    			attr_dev(circle, "class", "clock-face svelte-159ev0q");
    			attr_dev(circle, "r", "48");
    			add_location(circle, file$n, 30, 1, 762);
    			attr_dev(line0, "class", "hour svelte-159ev0q");
    			attr_dev(line0, "y1", "2");
    			attr_dev(line0, "y2", "-20");
    			attr_dev(line0, "transform", line0_transform_value = "rotate(" + (30 * /*hours*/ ctx[0] + /*minutes*/ ctx[1] / 2) + ")");
    			add_location(line0, file$n, 47, 1, 1169);
    			attr_dev(line1, "class", "minute svelte-159ev0q");
    			attr_dev(line1, "y1", "4");
    			attr_dev(line1, "y2", "-30");
    			attr_dev(line1, "transform", line1_transform_value = "rotate(" + (6 * /*minutes*/ ctx[1] + /*seconds*/ ctx[2] / 10) + ")");
    			add_location(line1, file$n, 48, 1, 1251);
    			attr_dev(line2, "class", "second svelte-159ev0q");
    			attr_dev(line2, "y1", "10");
    			attr_dev(line2, "y2", "-38");
    			add_location(line2, file$n, 50, 2, 1377);
    			attr_dev(line3, "class", "second-counterweight svelte-159ev0q");
    			attr_dev(line3, "y1", "10");
    			attr_dev(line3, "y2", "2");
    			add_location(line3, file$n, 51, 2, 1415);
    			attr_dev(g, "transform", g_transform_value = "rotate(" + 6 * /*seconds*/ ctx[2] + ")");
    			add_location(g, file$n, 49, 1, 1337);
    			attr_dev(svg, "viewBox", "-50 -50 100 100");
    			attr_dev(svg, "class", "svelte-159ev0q");
    			add_location(svg, file$n, 29, 0, 729);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svg, anchor);
    			append_dev(svg, circle);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(svg, null);
    			}

    			append_dev(svg, line0);
    			append_dev(svg, line1);
    			append_dev(svg, g);
    			append_dev(g, line2);
    			append_dev(g, line3);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*range*/ 0) {
    				each_value = lodash_range(12);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$8(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block$8(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(svg, line0);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}

    			if (!current || dirty & /*hours, minutes*/ 3 && line0_transform_value !== (line0_transform_value = "rotate(" + (30 * /*hours*/ ctx[0] + /*minutes*/ ctx[1] / 2) + ")")) {
    				attr_dev(line0, "transform", line0_transform_value);
    			}

    			if (!current || dirty & /*minutes, seconds*/ 6 && line1_transform_value !== (line1_transform_value = "rotate(" + (6 * /*minutes*/ ctx[1] + /*seconds*/ ctx[2] / 10) + ")")) {
    				attr_dev(line1, "transform", line1_transform_value);
    			}

    			if (!current || dirty & /*seconds*/ 4 && g_transform_value !== (g_transform_value = "rotate(" + 6 * /*seconds*/ ctx[2] + ")")) {
    				attr_dev(g, "transform", g_transform_value);
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
    			if (detaching) detach_dev(svg);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$o.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$c($$self, $$props, $$invalidate) {
    	let time = new Date();

    	onMount(() => {
    		const interval = setInterval(
    			() => {
    				$$invalidate(3, time = new Date());
    			},
    			1000
    		);

    		return () => clearInterval(interval);
    	});

    	$$self.$capture_state = () => {
    		return {};
    	};

    	$$self.$inject_state = $$props => {
    		if ("time" in $$props) $$invalidate(3, time = $$props.time);
    		if ("hours" in $$props) $$invalidate(0, hours = $$props.hours);
    		if ("minutes" in $$props) $$invalidate(1, minutes = $$props.minutes);
    		if ("seconds" in $$props) $$invalidate(2, seconds = $$props.seconds);
    	};

    	let hours;
    	let minutes;
    	let seconds;

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*time*/ 8) {
    			 $$invalidate(0, hours = time.getHours());
    		}

    		if ($$self.$$.dirty & /*time*/ 8) {
    			 $$invalidate(1, minutes = time.getMinutes());
    		}

    		if ($$self.$$.dirty & /*time*/ 8) {
    			 $$invalidate(2, seconds = time.getSeconds());
    		}
    	};

    	return [hours, minutes, seconds];
    }

    class Clock extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$c, create_fragment$o, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Clock",
    			options,
    			id: create_fragment$o.name
    		});
    	}
    }

    const helpTexts = {

    	L1grid:
`<script>
  import range from 'lodash.range'
  const N=200
</script>

<style>
  .grid {
    stroke:#ccc; 
    fill:#888;
  }
  * {
    shape-rendering:crispEdges;
    stroke:black;
    fill:white;
  }
</style>

<svg width={N} height={N}>
  <rect width={N} height={N} class=grid/>
  {#each range(0,N,20) as i}
    <line x1={i} y1={0} x2={i} y2={N} class=grid />
    <line y1={i} x1={0} y2={i} x2={N} class=grid />
  {/each}
  <slot/>
</svg>`    ,

    	L1rect:
`<script>
  import Grid from './Grid.svelte'
</script>

<Grid>
  <rect x=... y=... width=... height=... style='stroke-width:...; stroke:...; fill:...'/>
</Grid>`    ,

    	L1circle:
`<circle cx=... cy=... r=.../>`    ,

    	L1line:
`<line x1=... y1=... x2=... y2=.../>`    ,

    	L2each:
`{#each range(...) as i}
  <circle ... />
{/each}`    ,

    	L2if:
`{#if ... }
  <circle ... />
{:else}
  <rect ... />
{/if}`    ,

    	L2range:
`{#each ... }
  <circle ... />
{/each}`    ,

    	L2chess:
`{#each ...}
  {#each ...}
    {#if ...}
      <rect .../>
    {:else}
      <rect .../>
    {/if}
  {/each}
{/each}`    ,

    	L3random:
`<...>
  import ... from '...'
  import random from 'lodash.random'
</...>

{#each range(...) as ... }
  <circle cx={random(0,200)} cy=... r=... />
{/each}`    ,

    	L3button:
`<...>
  let i=0
</...>

<div style=...>...</div>
<button on:click = { () => i++ } > ... </button>`    ,

    	L3shortcut:
`<...>
  let ...=17
  let ...=1
  const op=(value) => ...
</...>

<div ...> {a} to {b} </div>
<button on:click={()=>op(a+2)}> ... </button>
<button on:click={...}> ... </button>
<button on:click={()=> ... ? ... : ... } > ... </button>`    ,

    	L4canvas:
`<svg>
  <rect ... />
</svg>`    ,

    	L4colorPair:
`<...>
  let circles = []
  const r=...
  for (const x of [...]) {
    for (const y of [...]) {
      const color = circles.length ... == 0 ? '#00f8' : '#...'
      circles.push({..., ..., ...})
    }
  }
  const click = (...) => ... = ... .filter((...) => ... != ...)
</...>

<g stroke='#...' stroke-width=...>
  {#each ...}
    <... on:click={()=>click(c)} cx=... cy=... r=... fill=.../>
  {/each}
</g>`    ,

    	'L5bind:':
`<...>
  let i=...
</...>

<div ...>{...}</div>
<input type=number bind:value={i}/>`    ,

    	'L5on:keyup':
`<...>
  let key=''
  let keyCode=''
  const handleKey = (...) => {
    ... = event.key
    ... = event.keyCode
  }
</...>

<div ...> ... </div>
<div ...> ... </div>
<input on:keyup={...}/>`    ,

    	L5guessMyNumber:
`<...>
  import ... from 'lodash.random'
  let low = 1
  let high = 127
  let guess
  let msg =''
  let secret = random(..., ...)
  const keyup = (...)=> {
    if (event.key != 'Enter') return
    if (... < ...) low = ...
    if (... > ...) high = ...
    if (... == ...) msg = ...
  }
</...>
<div ...>
  {...} to {...} {...}
  <input on:keyup = {...} type=... bind:value={...}/>
</div>`    ,

    	L6text:
`<style>
  .fs40 {font: italic 1px serif}
</style>

<text x=... y=... class='fs40' text-anchor=... alignment-baseline=... >
  ...
</text>`    ,

    	L6translate:
`<... y1=... y2=... style=... transform="translate(...)"/>`    ,

    	L6rotate:
`<... y2=... style=... transform="rotate(...)"/>`    ,

    	L6scale:
`<... y1=... y2=... style=... transform="rotate(...) scale(...)"/>`    ,

    	L6clock:
`<...>
  import range from 'lodash.range'
  import { onMount } from 'svelte'

  let time = new Date()

  $: hours = time.getHours()
  $: minutes = time.getMinutes()
  $: seconds = time.getSeconds()

  onMount(() => {
    const interval = setInterval(() => {time = new Date()}, ...)
    return () => clearInterval(interval)
  })
</...>

<style>
  svg { width: 100%; height: 100% }
  .clock-face { stroke: ...; fill: ... }
  .minor { stroke: ...; stroke-width: ... }
  .major { stroke: ...; stroke-width: ... }
  .hour { stroke: ... }
  .minute { stroke: ... }
  .second, .second-counterweight { stroke: rgb(...,...,...) }
  .second-counterweight { stroke-width: ... }
  .fs {font-size: ... }
</style>

<svg viewBox='-50 -50 100 100'>
  <circle class='...' r = ... />

  <!-- markers -->
  {#each range(...) as i}
    <g transform = 'rotate({...})'>
      <line class='major' y1=... y2=... />

      {#each range(..., ...) as offset}
        <line class='minor' y1=... y2=... transform='rotate(...)' />
      {/each}
    </g>
  {/each}

  <!-- hands -->
  <line class='hour' y1=... y2=... transform='rotate({...})' />
  <line class='minute' y1=... y2=... transform='rotate(...)' />
  <g transform='rotate(...)'>
    <line class='second' y1=... y2=... />
    <line class='second-counterweight' y1=... y2=... />
  </g>
</svg>`

    };

    /* src/App.svelte generated by Svelte v3.16.7 */
    const file$o = "src/App.svelte";

    // (113:1) {#if selected1 == 'svg'}
    function create_if_block_23(ctx) {
    	let current;
    	const canvas = new Canvas({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(canvas.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(canvas, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(canvas.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(canvas.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(canvas, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_23.name,
    		type: "if",
    		source: "(113:1) {#if selected1 == 'svg'}",
    		ctx
    	});

    	return block;
    }

    // (114:1) {#if selected1 == 'canvas'}
    function create_if_block_22(ctx) {
    	let current;
    	const canvas = new Canvas({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(canvas.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(canvas, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(canvas.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(canvas.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(canvas, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_22.name,
    		type: "if",
    		source: "(114:1) {#if selected1 == 'canvas'}",
    		ctx
    	});

    	return block;
    }

    // (115:1) {#if selected1 == 'grid'}
    function create_if_block_21(ctx) {
    	let current;
    	const grid = new Grid({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(grid.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(grid, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(grid.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(grid.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(grid, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_21.name,
    		type: "if",
    		source: "(115:1) {#if selected1 == 'grid'}",
    		ctx
    	});

    	return block;
    }

    // (116:1) {#if selected1 == 'rect'}
    function create_if_block_20(ctx) {
    	let current;
    	const rect = new Rect({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(rect.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(rect, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(rect.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(rect.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(rect, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_20.name,
    		type: "if",
    		source: "(116:1) {#if selected1 == 'rect'}",
    		ctx
    	});

    	return block;
    }

    // (117:1) {#if selected1 == 'circle'}
    function create_if_block_19(ctx) {
    	let current;
    	const circle = new Circle({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(circle.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(circle, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(circle.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(circle.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(circle, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_19.name,
    		type: "if",
    		source: "(117:1) {#if selected1 == 'circle'}",
    		ctx
    	});

    	return block;
    }

    // (118:1) {#if selected1 == 'line'}
    function create_if_block_18(ctx) {
    	let current;
    	const line = new Line({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(line.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(line, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(line.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(line.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(line, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_18.name,
    		type: "if",
    		source: "(118:1) {#if selected1 == 'line'}",
    		ctx
    	});

    	return block;
    }

    // (119:1) {#if selected1 == 'text'}
    function create_if_block_17(ctx) {
    	let current;
    	const text_1 = new Text({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(text_1.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(text_1, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(text_1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(text_1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(text_1, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_17.name,
    		type: "if",
    		source: "(119:1) {#if selected1 == 'text'}",
    		ctx
    	});

    	return block;
    }

    // (122:1) {#if selected1 == 'each'}
    function create_if_block_16(ctx) {
    	let current;
    	const each_1 = new Each({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(each_1.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(each_1, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(each_1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(each_1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(each_1, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_16.name,
    		type: "if",
    		source: "(122:1) {#if selected1 == 'each'}",
    		ctx
    	});

    	return block;
    }

    // (123:1) {#if selected1 == 'if'}
    function create_if_block_15(ctx) {
    	let current;
    	const if_1 = new If({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(if_1.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(if_1, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(if_1, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_15.name,
    		type: "if",
    		source: "(123:1) {#if selected1 == 'if'}",
    		ctx
    	});

    	return block;
    }

    // (124:1) {#if selected1 == 'range'}
    function create_if_block_14(ctx) {
    	let current;
    	const range_1 = new Range({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(range_1.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(range_1, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(range_1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(range_1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(range_1, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_14.name,
    		type: "if",
    		source: "(124:1) {#if selected1 == 'range'}",
    		ctx
    	});

    	return block;
    }

    // (125:1) {#if selected1 == 'chess'}
    function create_if_block_13(ctx) {
    	let current;
    	const chess = new Chess({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(chess.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(chess, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(chess.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(chess.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(chess, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_13.name,
    		type: "if",
    		source: "(125:1) {#if selected1 == 'chess'}",
    		ctx
    	});

    	return block;
    }

    // (128:1) {#if selected1 == 'random'}
    function create_if_block_12(ctx) {
    	let current;
    	const random = new Random({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(random.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(random, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(random.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(random.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(random, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_12.name,
    		type: "if",
    		source: "(128:1) {#if selected1 == 'random'}",
    		ctx
    	});

    	return block;
    }

    // (129:1) {#if selected1 == 'button'}
    function create_if_block_11(ctx) {
    	let current;
    	const button = new Button({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(button.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(button, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(button.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(button.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(button, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_11.name,
    		type: "if",
    		source: "(129:1) {#if selected1 == 'button'}",
    		ctx
    	});

    	return block;
    }

    // (130:1) {#if selected1 == 'on:click'}
    function create_if_block_10(ctx) {
    	let current;
    	const click = new Click({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(click.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(click, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(click.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(click.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(click, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_10.name,
    		type: "if",
    		source: "(130:1) {#if selected1 == 'on:click'}",
    		ctx
    	});

    	return block;
    }

    // (131:1) {#if selected1 == 'shortcut'}
    function create_if_block_9(ctx) {
    	let current;
    	const shortcut = new Shortcut({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(shortcut.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(shortcut, target, anchor);
    			current = true;
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
    			destroy_component(shortcut, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_9.name,
    		type: "if",
    		source: "(131:1) {#if selected1 == 'shortcut'}",
    		ctx
    	});

    	return block;
    }

    // (134:1) {#if selected1 == 'colorPair'}
    function create_if_block_8(ctx) {
    	let current;
    	const colorpair = new ColorPair({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(colorpair.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(colorpair, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(colorpair.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(colorpair.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(colorpair, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_8.name,
    		type: "if",
    		source: "(134:1) {#if selected1 == 'colorPair'}",
    		ctx
    	});

    	return block;
    }

    // (137:1) {#if selected1 == 'bind:'}
    function create_if_block_7(ctx) {
    	let current;
    	const bind_1 = new Bind({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(bind_1.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(bind_1, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(bind_1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(bind_1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(bind_1, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_7.name,
    		type: "if",
    		source: "(137:1) {#if selected1 == 'bind:'}",
    		ctx
    	});

    	return block;
    }

    // (138:1) {#if selected1 == 'on:keyup'}
    function create_if_block_6(ctx) {
    	let current;
    	const keyup = new KeyUp({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(keyup.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(keyup, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(keyup.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(keyup.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(keyup, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_6.name,
    		type: "if",
    		source: "(138:1) {#if selected1 == 'on:keyup'}",
    		ctx
    	});

    	return block;
    }

    // (139:1) {#if selected1 == 'guessMyNumber'}
    function create_if_block_5(ctx) {
    	let current;
    	const guessmynumber = new GuessMyNumber({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(guessmynumber.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(guessmynumber, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(guessmynumber.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(guessmynumber.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(guessmynumber, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_5.name,
    		type: "if",
    		source: "(139:1) {#if selected1 == 'guessMyNumber'}",
    		ctx
    	});

    	return block;
    }

    // (142:1) {#if selected1 == 'translate'}
    function create_if_block_4(ctx) {
    	let current;
    	const translate = new Translate({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(translate.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(translate, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(translate.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(translate.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(translate, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_4.name,
    		type: "if",
    		source: "(142:1) {#if selected1 == 'translate'}",
    		ctx
    	});

    	return block;
    }

    // (143:1) {#if selected1 == 'rotate'}
    function create_if_block_3(ctx) {
    	let current;
    	const rotate = new Rotate({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(rotate.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(rotate, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(rotate.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(rotate.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(rotate, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3.name,
    		type: "if",
    		source: "(143:1) {#if selected1 == 'rotate'}",
    		ctx
    	});

    	return block;
    }

    // (144:1) {#if selected1 == 'scale'}
    function create_if_block_2(ctx) {
    	let current;
    	const scale = new Scale({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(scale.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(scale, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(scale.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(scale.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(scale, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(144:1) {#if selected1 == 'scale'}",
    		ctx
    	});

    	return block;
    }

    // (145:1) {#if selected1 == 'clock'}
    function create_if_block_1(ctx) {
    	let current;
    	const clock = new Clock({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(clock.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(clock, target, anchor);
    			current = true;
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
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(145:1) {#if selected1 == 'clock'}",
    		ctx
    	});

    	return block;
    }

    // (150:1) {#if helpTexts[selected0+selected1]}
    function create_if_block$3(ctx) {
    	let textarea;
    	let textarea_value_value;

    	const block = {
    		c: function create() {
    			textarea = element("textarea");
    			textarea.disabled = true;
    			set_style(textarea, "width", "500px");
    			set_style(textarea, "height", "500px");
    			textarea.value = textarea_value_value = helpTexts[/*selected0*/ ctx[0] + /*selected1*/ ctx[3]];
    			attr_dev(textarea, "class", "svelte-1z04yta");
    			add_location(textarea, file$o, 150, 2, 5695);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, textarea, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*selected0, selected1*/ 9 && textarea_value_value !== (textarea_value_value = helpTexts[/*selected0*/ ctx[0] + /*selected1*/ ctx[3]])) {
    				prop_dev(textarea, "value", textarea_value_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(textarea);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$3.name,
    		type: "if",
    		source: "(150:1) {#if helpTexts[selected0+selected1]}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$p(ctx) {
    	let div0;
    	let updating_selected;
    	let t0;
    	let updating_selected_1;
    	let t1;
    	let updating_selected_2;
    	let t2;
    	let updating_selected_3;
    	let t3;
    	let div1;
    	let t4;
    	let t5;
    	let t6;
    	let t7;
    	let t8;
    	let t9;
    	let t10;
    	let t11;
    	let t12;
    	let t13;
    	let t14;
    	let t15;
    	let t16;
    	let t17;
    	let t18;
    	let t19;
    	let t20;
    	let t21;
    	let t22;
    	let t23;
    	let t24;
    	let t25;
    	let t26;
    	let div2;
    	let current;

    	function menu0_selected_binding(value) {
    		/*menu0_selected_binding*/ ctx[15].call(null, value);
    	}

    	let menu0_props = { children: /*children3*/ ctx[7] };

    	if (/*selected3*/ ctx[5] !== void 0) {
    		menu0_props.selected = /*selected3*/ ctx[5];
    	}

    	const menu0 = new Menu({ props: menu0_props, $$inline: true });
    	binding_callbacks.push(() => bind(menu0, "selected", menu0_selected_binding));

    	function menu1_selected_binding(value_1) {
    		/*menu1_selected_binding*/ ctx[16].call(null, value_1);
    	}

    	let menu1_props = { children: /*children0*/ ctx[6] };

    	if (/*selected0*/ ctx[0] !== void 0) {
    		menu1_props.selected = /*selected0*/ ctx[0];
    	}

    	const menu1 = new Menu({ props: menu1_props, $$inline: true });
    	binding_callbacks.push(() => bind(menu1, "selected", menu1_selected_binding));

    	function menu2_selected_binding(value_2) {
    		/*menu2_selected_binding*/ ctx[17].call(null, value_2);
    	}

    	let menu2_props = { children: /*children1*/ ctx[1] };

    	if (/*selected1*/ ctx[3] !== void 0) {
    		menu2_props.selected = /*selected1*/ ctx[3];
    	}

    	const menu2 = new Menu({ props: menu2_props, $$inline: true });
    	binding_callbacks.push(() => bind(menu2, "selected", menu2_selected_binding));

    	function menu3_selected_binding(value_3) {
    		/*menu3_selected_binding*/ ctx[18].call(null, value_3);
    	}

    	let menu3_props = {
    		children: /*keywords*/ ctx[2],
    		color: "yellow",
    		bgcolor: "black"
    	};

    	if (/*keyword*/ ctx[4] !== void 0) {
    		menu3_props.selected = /*keyword*/ ctx[4];
    	}

    	const menu3 = new Menu({ props: menu3_props, $$inline: true });
    	binding_callbacks.push(() => bind(menu3, "selected", menu3_selected_binding));
    	let if_block0 = /*selected1*/ ctx[3] == "svg" && create_if_block_23(ctx);
    	let if_block1 = /*selected1*/ ctx[3] == "canvas" && create_if_block_22(ctx);
    	let if_block2 = /*selected1*/ ctx[3] == "grid" && create_if_block_21(ctx);
    	let if_block3 = /*selected1*/ ctx[3] == "rect" && create_if_block_20(ctx);
    	let if_block4 = /*selected1*/ ctx[3] == "circle" && create_if_block_19(ctx);
    	let if_block5 = /*selected1*/ ctx[3] == "line" && create_if_block_18(ctx);
    	let if_block6 = /*selected1*/ ctx[3] == "text" && create_if_block_17(ctx);
    	let if_block7 = /*selected1*/ ctx[3] == "each" && create_if_block_16(ctx);
    	let if_block8 = /*selected1*/ ctx[3] == "if" && create_if_block_15(ctx);
    	let if_block9 = /*selected1*/ ctx[3] == "range" && create_if_block_14(ctx);
    	let if_block10 = /*selected1*/ ctx[3] == "chess" && create_if_block_13(ctx);
    	let if_block11 = /*selected1*/ ctx[3] == "random" && create_if_block_12(ctx);
    	let if_block12 = /*selected1*/ ctx[3] == "button" && create_if_block_11(ctx);
    	let if_block13 = /*selected1*/ ctx[3] == "on:click" && create_if_block_10(ctx);
    	let if_block14 = /*selected1*/ ctx[3] == "shortcut" && create_if_block_9(ctx);
    	let if_block15 = /*selected1*/ ctx[3] == "colorPair" && create_if_block_8(ctx);
    	let if_block16 = /*selected1*/ ctx[3] == "bind:" && create_if_block_7(ctx);
    	let if_block17 = /*selected1*/ ctx[3] == "on:keyup" && create_if_block_6(ctx);
    	let if_block18 = /*selected1*/ ctx[3] == "guessMyNumber" && create_if_block_5(ctx);
    	let if_block19 = /*selected1*/ ctx[3] == "translate" && create_if_block_4(ctx);
    	let if_block20 = /*selected1*/ ctx[3] == "rotate" && create_if_block_3(ctx);
    	let if_block21 = /*selected1*/ ctx[3] == "scale" && create_if_block_2(ctx);
    	let if_block22 = /*selected1*/ ctx[3] == "clock" && create_if_block_1(ctx);
    	let if_block23 = helpTexts[/*selected0*/ ctx[0] + /*selected1*/ ctx[3]] && create_if_block$3(ctx);

    	const block = {
    		c: function create() {
    			div0 = element("div");
    			create_component(menu0.$$.fragment);
    			t0 = space();
    			create_component(menu1.$$.fragment);
    			t1 = space();
    			create_component(menu2.$$.fragment);
    			t2 = space();
    			create_component(menu3.$$.fragment);
    			t3 = space();
    			div1 = element("div");
    			if (if_block0) if_block0.c();
    			t4 = space();
    			if (if_block1) if_block1.c();
    			t5 = space();
    			if (if_block2) if_block2.c();
    			t6 = space();
    			if (if_block3) if_block3.c();
    			t7 = space();
    			if (if_block4) if_block4.c();
    			t8 = space();
    			if (if_block5) if_block5.c();
    			t9 = space();
    			if (if_block6) if_block6.c();
    			t10 = space();
    			if (if_block7) if_block7.c();
    			t11 = space();
    			if (if_block8) if_block8.c();
    			t12 = space();
    			if (if_block9) if_block9.c();
    			t13 = space();
    			if (if_block10) if_block10.c();
    			t14 = space();
    			if (if_block11) if_block11.c();
    			t15 = space();
    			if (if_block12) if_block12.c();
    			t16 = space();
    			if (if_block13) if_block13.c();
    			t17 = space();
    			if (if_block14) if_block14.c();
    			t18 = space();
    			if (if_block15) if_block15.c();
    			t19 = space();
    			if (if_block16) if_block16.c();
    			t20 = space();
    			if (if_block17) if_block17.c();
    			t21 = space();
    			if (if_block18) if_block18.c();
    			t22 = space();
    			if (if_block19) if_block19.c();
    			t23 = space();
    			if (if_block20) if_block20.c();
    			t24 = space();
    			if (if_block21) if_block21.c();
    			t25 = space();
    			if (if_block22) if_block22.c();
    			t26 = space();
    			div2 = element("div");
    			if (if_block23) if_block23.c();
    			add_location(div0, file$o, 102, 0, 4237);
    			attr_dev(div1, "class", "col left s2 m svelte-1z04yta");
    			add_location(div1, file$o, 109, 0, 4504);
    			attr_dev(div2, "class", "col left s8 m svelte-1z04yta");
    			add_location(div2, file$o, 148, 0, 5627);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div0, anchor);
    			mount_component(menu0, div0, null);
    			append_dev(div0, t0);
    			mount_component(menu1, div0, null);
    			append_dev(div0, t1);
    			mount_component(menu2, div0, null);
    			append_dev(div0, t2);
    			mount_component(menu3, div0, null);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, div1, anchor);
    			if (if_block0) if_block0.m(div1, null);
    			append_dev(div1, t4);
    			if (if_block1) if_block1.m(div1, null);
    			append_dev(div1, t5);
    			if (if_block2) if_block2.m(div1, null);
    			append_dev(div1, t6);
    			if (if_block3) if_block3.m(div1, null);
    			append_dev(div1, t7);
    			if (if_block4) if_block4.m(div1, null);
    			append_dev(div1, t8);
    			if (if_block5) if_block5.m(div1, null);
    			append_dev(div1, t9);
    			if (if_block6) if_block6.m(div1, null);
    			append_dev(div1, t10);
    			if (if_block7) if_block7.m(div1, null);
    			append_dev(div1, t11);
    			if (if_block8) if_block8.m(div1, null);
    			append_dev(div1, t12);
    			if (if_block9) if_block9.m(div1, null);
    			append_dev(div1, t13);
    			if (if_block10) if_block10.m(div1, null);
    			append_dev(div1, t14);
    			if (if_block11) if_block11.m(div1, null);
    			append_dev(div1, t15);
    			if (if_block12) if_block12.m(div1, null);
    			append_dev(div1, t16);
    			if (if_block13) if_block13.m(div1, null);
    			append_dev(div1, t17);
    			if (if_block14) if_block14.m(div1, null);
    			append_dev(div1, t18);
    			if (if_block15) if_block15.m(div1, null);
    			append_dev(div1, t19);
    			if (if_block16) if_block16.m(div1, null);
    			append_dev(div1, t20);
    			if (if_block17) if_block17.m(div1, null);
    			append_dev(div1, t21);
    			if (if_block18) if_block18.m(div1, null);
    			append_dev(div1, t22);
    			if (if_block19) if_block19.m(div1, null);
    			append_dev(div1, t23);
    			if (if_block20) if_block20.m(div1, null);
    			append_dev(div1, t24);
    			if (if_block21) if_block21.m(div1, null);
    			append_dev(div1, t25);
    			if (if_block22) if_block22.m(div1, null);
    			insert_dev(target, t26, anchor);
    			insert_dev(target, div2, anchor);
    			if (if_block23) if_block23.m(div2, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const menu0_changes = {};

    			if (!updating_selected && dirty & /*selected3*/ 32) {
    				updating_selected = true;
    				menu0_changes.selected = /*selected3*/ ctx[5];
    				add_flush_callback(() => updating_selected = false);
    			}

    			menu0.$set(menu0_changes);
    			const menu1_changes = {};

    			if (!updating_selected_1 && dirty & /*selected0*/ 1) {
    				updating_selected_1 = true;
    				menu1_changes.selected = /*selected0*/ ctx[0];
    				add_flush_callback(() => updating_selected_1 = false);
    			}

    			menu1.$set(menu1_changes);
    			const menu2_changes = {};
    			if (dirty & /*children1*/ 2) menu2_changes.children = /*children1*/ ctx[1];

    			if (!updating_selected_2 && dirty & /*selected1*/ 8) {
    				updating_selected_2 = true;
    				menu2_changes.selected = /*selected1*/ ctx[3];
    				add_flush_callback(() => updating_selected_2 = false);
    			}

    			menu2.$set(menu2_changes);
    			const menu3_changes = {};
    			if (dirty & /*keywords*/ 4) menu3_changes.children = /*keywords*/ ctx[2];

    			if (!updating_selected_3 && dirty & /*keyword*/ 16) {
    				updating_selected_3 = true;
    				menu3_changes.selected = /*keyword*/ ctx[4];
    				add_flush_callback(() => updating_selected_3 = false);
    			}

    			menu3.$set(menu3_changes);

    			if (/*selected1*/ ctx[3] == "svg") {
    				if (!if_block0) {
    					if_block0 = create_if_block_23(ctx);
    					if_block0.c();
    					transition_in(if_block0, 1);
    					if_block0.m(div1, t4);
    				} else {
    					transition_in(if_block0, 1);
    				}
    			} else if (if_block0) {
    				group_outros();

    				transition_out(if_block0, 1, 1, () => {
    					if_block0 = null;
    				});

    				check_outros();
    			}

    			if (/*selected1*/ ctx[3] == "canvas") {
    				if (!if_block1) {
    					if_block1 = create_if_block_22(ctx);
    					if_block1.c();
    					transition_in(if_block1, 1);
    					if_block1.m(div1, t5);
    				} else {
    					transition_in(if_block1, 1);
    				}
    			} else if (if_block1) {
    				group_outros();

    				transition_out(if_block1, 1, 1, () => {
    					if_block1 = null;
    				});

    				check_outros();
    			}

    			if (/*selected1*/ ctx[3] == "grid") {
    				if (!if_block2) {
    					if_block2 = create_if_block_21(ctx);
    					if_block2.c();
    					transition_in(if_block2, 1);
    					if_block2.m(div1, t6);
    				} else {
    					transition_in(if_block2, 1);
    				}
    			} else if (if_block2) {
    				group_outros();

    				transition_out(if_block2, 1, 1, () => {
    					if_block2 = null;
    				});

    				check_outros();
    			}

    			if (/*selected1*/ ctx[3] == "rect") {
    				if (!if_block3) {
    					if_block3 = create_if_block_20(ctx);
    					if_block3.c();
    					transition_in(if_block3, 1);
    					if_block3.m(div1, t7);
    				} else {
    					transition_in(if_block3, 1);
    				}
    			} else if (if_block3) {
    				group_outros();

    				transition_out(if_block3, 1, 1, () => {
    					if_block3 = null;
    				});

    				check_outros();
    			}

    			if (/*selected1*/ ctx[3] == "circle") {
    				if (!if_block4) {
    					if_block4 = create_if_block_19(ctx);
    					if_block4.c();
    					transition_in(if_block4, 1);
    					if_block4.m(div1, t8);
    				} else {
    					transition_in(if_block4, 1);
    				}
    			} else if (if_block4) {
    				group_outros();

    				transition_out(if_block4, 1, 1, () => {
    					if_block4 = null;
    				});

    				check_outros();
    			}

    			if (/*selected1*/ ctx[3] == "line") {
    				if (!if_block5) {
    					if_block5 = create_if_block_18(ctx);
    					if_block5.c();
    					transition_in(if_block5, 1);
    					if_block5.m(div1, t9);
    				} else {
    					transition_in(if_block5, 1);
    				}
    			} else if (if_block5) {
    				group_outros();

    				transition_out(if_block5, 1, 1, () => {
    					if_block5 = null;
    				});

    				check_outros();
    			}

    			if (/*selected1*/ ctx[3] == "text") {
    				if (!if_block6) {
    					if_block6 = create_if_block_17(ctx);
    					if_block6.c();
    					transition_in(if_block6, 1);
    					if_block6.m(div1, t10);
    				} else {
    					transition_in(if_block6, 1);
    				}
    			} else if (if_block6) {
    				group_outros();

    				transition_out(if_block6, 1, 1, () => {
    					if_block6 = null;
    				});

    				check_outros();
    			}

    			if (/*selected1*/ ctx[3] == "each") {
    				if (!if_block7) {
    					if_block7 = create_if_block_16(ctx);
    					if_block7.c();
    					transition_in(if_block7, 1);
    					if_block7.m(div1, t11);
    				} else {
    					transition_in(if_block7, 1);
    				}
    			} else if (if_block7) {
    				group_outros();

    				transition_out(if_block7, 1, 1, () => {
    					if_block7 = null;
    				});

    				check_outros();
    			}

    			if (/*selected1*/ ctx[3] == "if") {
    				if (!if_block8) {
    					if_block8 = create_if_block_15(ctx);
    					if_block8.c();
    					transition_in(if_block8, 1);
    					if_block8.m(div1, t12);
    				} else {
    					transition_in(if_block8, 1);
    				}
    			} else if (if_block8) {
    				group_outros();

    				transition_out(if_block8, 1, 1, () => {
    					if_block8 = null;
    				});

    				check_outros();
    			}

    			if (/*selected1*/ ctx[3] == "range") {
    				if (!if_block9) {
    					if_block9 = create_if_block_14(ctx);
    					if_block9.c();
    					transition_in(if_block9, 1);
    					if_block9.m(div1, t13);
    				} else {
    					transition_in(if_block9, 1);
    				}
    			} else if (if_block9) {
    				group_outros();

    				transition_out(if_block9, 1, 1, () => {
    					if_block9 = null;
    				});

    				check_outros();
    			}

    			if (/*selected1*/ ctx[3] == "chess") {
    				if (!if_block10) {
    					if_block10 = create_if_block_13(ctx);
    					if_block10.c();
    					transition_in(if_block10, 1);
    					if_block10.m(div1, t14);
    				} else {
    					transition_in(if_block10, 1);
    				}
    			} else if (if_block10) {
    				group_outros();

    				transition_out(if_block10, 1, 1, () => {
    					if_block10 = null;
    				});

    				check_outros();
    			}

    			if (/*selected1*/ ctx[3] == "random") {
    				if (!if_block11) {
    					if_block11 = create_if_block_12(ctx);
    					if_block11.c();
    					transition_in(if_block11, 1);
    					if_block11.m(div1, t15);
    				} else {
    					transition_in(if_block11, 1);
    				}
    			} else if (if_block11) {
    				group_outros();

    				transition_out(if_block11, 1, 1, () => {
    					if_block11 = null;
    				});

    				check_outros();
    			}

    			if (/*selected1*/ ctx[3] == "button") {
    				if (!if_block12) {
    					if_block12 = create_if_block_11(ctx);
    					if_block12.c();
    					transition_in(if_block12, 1);
    					if_block12.m(div1, t16);
    				} else {
    					transition_in(if_block12, 1);
    				}
    			} else if (if_block12) {
    				group_outros();

    				transition_out(if_block12, 1, 1, () => {
    					if_block12 = null;
    				});

    				check_outros();
    			}

    			if (/*selected1*/ ctx[3] == "on:click") {
    				if (!if_block13) {
    					if_block13 = create_if_block_10(ctx);
    					if_block13.c();
    					transition_in(if_block13, 1);
    					if_block13.m(div1, t17);
    				} else {
    					transition_in(if_block13, 1);
    				}
    			} else if (if_block13) {
    				group_outros();

    				transition_out(if_block13, 1, 1, () => {
    					if_block13 = null;
    				});

    				check_outros();
    			}

    			if (/*selected1*/ ctx[3] == "shortcut") {
    				if (!if_block14) {
    					if_block14 = create_if_block_9(ctx);
    					if_block14.c();
    					transition_in(if_block14, 1);
    					if_block14.m(div1, t18);
    				} else {
    					transition_in(if_block14, 1);
    				}
    			} else if (if_block14) {
    				group_outros();

    				transition_out(if_block14, 1, 1, () => {
    					if_block14 = null;
    				});

    				check_outros();
    			}

    			if (/*selected1*/ ctx[3] == "colorPair") {
    				if (!if_block15) {
    					if_block15 = create_if_block_8(ctx);
    					if_block15.c();
    					transition_in(if_block15, 1);
    					if_block15.m(div1, t19);
    				} else {
    					transition_in(if_block15, 1);
    				}
    			} else if (if_block15) {
    				group_outros();

    				transition_out(if_block15, 1, 1, () => {
    					if_block15 = null;
    				});

    				check_outros();
    			}

    			if (/*selected1*/ ctx[3] == "bind:") {
    				if (!if_block16) {
    					if_block16 = create_if_block_7(ctx);
    					if_block16.c();
    					transition_in(if_block16, 1);
    					if_block16.m(div1, t20);
    				} else {
    					transition_in(if_block16, 1);
    				}
    			} else if (if_block16) {
    				group_outros();

    				transition_out(if_block16, 1, 1, () => {
    					if_block16 = null;
    				});

    				check_outros();
    			}

    			if (/*selected1*/ ctx[3] == "on:keyup") {
    				if (!if_block17) {
    					if_block17 = create_if_block_6(ctx);
    					if_block17.c();
    					transition_in(if_block17, 1);
    					if_block17.m(div1, t21);
    				} else {
    					transition_in(if_block17, 1);
    				}
    			} else if (if_block17) {
    				group_outros();

    				transition_out(if_block17, 1, 1, () => {
    					if_block17 = null;
    				});

    				check_outros();
    			}

    			if (/*selected1*/ ctx[3] == "guessMyNumber") {
    				if (!if_block18) {
    					if_block18 = create_if_block_5(ctx);
    					if_block18.c();
    					transition_in(if_block18, 1);
    					if_block18.m(div1, t22);
    				} else {
    					transition_in(if_block18, 1);
    				}
    			} else if (if_block18) {
    				group_outros();

    				transition_out(if_block18, 1, 1, () => {
    					if_block18 = null;
    				});

    				check_outros();
    			}

    			if (/*selected1*/ ctx[3] == "translate") {
    				if (!if_block19) {
    					if_block19 = create_if_block_4(ctx);
    					if_block19.c();
    					transition_in(if_block19, 1);
    					if_block19.m(div1, t23);
    				} else {
    					transition_in(if_block19, 1);
    				}
    			} else if (if_block19) {
    				group_outros();

    				transition_out(if_block19, 1, 1, () => {
    					if_block19 = null;
    				});

    				check_outros();
    			}

    			if (/*selected1*/ ctx[3] == "rotate") {
    				if (!if_block20) {
    					if_block20 = create_if_block_3(ctx);
    					if_block20.c();
    					transition_in(if_block20, 1);
    					if_block20.m(div1, t24);
    				} else {
    					transition_in(if_block20, 1);
    				}
    			} else if (if_block20) {
    				group_outros();

    				transition_out(if_block20, 1, 1, () => {
    					if_block20 = null;
    				});

    				check_outros();
    			}

    			if (/*selected1*/ ctx[3] == "scale") {
    				if (!if_block21) {
    					if_block21 = create_if_block_2(ctx);
    					if_block21.c();
    					transition_in(if_block21, 1);
    					if_block21.m(div1, t25);
    				} else {
    					transition_in(if_block21, 1);
    				}
    			} else if (if_block21) {
    				group_outros();

    				transition_out(if_block21, 1, 1, () => {
    					if_block21 = null;
    				});

    				check_outros();
    			}

    			if (/*selected1*/ ctx[3] == "clock") {
    				if (!if_block22) {
    					if_block22 = create_if_block_1(ctx);
    					if_block22.c();
    					transition_in(if_block22, 1);
    					if_block22.m(div1, null);
    				} else {
    					transition_in(if_block22, 1);
    				}
    			} else if (if_block22) {
    				group_outros();

    				transition_out(if_block22, 1, 1, () => {
    					if_block22 = null;
    				});

    				check_outros();
    			}

    			if (helpTexts[/*selected0*/ ctx[0] + /*selected1*/ ctx[3]]) {
    				if (if_block23) {
    					if_block23.p(ctx, dirty);
    				} else {
    					if_block23 = create_if_block$3(ctx);
    					if_block23.c();
    					if_block23.m(div2, null);
    				}
    			} else if (if_block23) {
    				if_block23.d(1);
    				if_block23 = null;
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(menu0.$$.fragment, local);
    			transition_in(menu1.$$.fragment, local);
    			transition_in(menu2.$$.fragment, local);
    			transition_in(menu3.$$.fragment, local);
    			transition_in(if_block0);
    			transition_in(if_block1);
    			transition_in(if_block2);
    			transition_in(if_block3);
    			transition_in(if_block4);
    			transition_in(if_block5);
    			transition_in(if_block6);
    			transition_in(if_block7);
    			transition_in(if_block8);
    			transition_in(if_block9);
    			transition_in(if_block10);
    			transition_in(if_block11);
    			transition_in(if_block12);
    			transition_in(if_block13);
    			transition_in(if_block14);
    			transition_in(if_block15);
    			transition_in(if_block16);
    			transition_in(if_block17);
    			transition_in(if_block18);
    			transition_in(if_block19);
    			transition_in(if_block20);
    			transition_in(if_block21);
    			transition_in(if_block22);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(menu0.$$.fragment, local);
    			transition_out(menu1.$$.fragment, local);
    			transition_out(menu2.$$.fragment, local);
    			transition_out(menu3.$$.fragment, local);
    			transition_out(if_block0);
    			transition_out(if_block1);
    			transition_out(if_block2);
    			transition_out(if_block3);
    			transition_out(if_block4);
    			transition_out(if_block5);
    			transition_out(if_block6);
    			transition_out(if_block7);
    			transition_out(if_block8);
    			transition_out(if_block9);
    			transition_out(if_block10);
    			transition_out(if_block11);
    			transition_out(if_block12);
    			transition_out(if_block13);
    			transition_out(if_block14);
    			transition_out(if_block15);
    			transition_out(if_block16);
    			transition_out(if_block17);
    			transition_out(if_block18);
    			transition_out(if_block19);
    			transition_out(if_block20);
    			transition_out(if_block21);
    			transition_out(if_block22);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div0);
    			destroy_component(menu0);
    			destroy_component(menu1);
    			destroy_component(menu2);
    			destroy_component(menu3);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(div1);
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    			if (if_block2) if_block2.d();
    			if (if_block3) if_block3.d();
    			if (if_block4) if_block4.d();
    			if (if_block5) if_block5.d();
    			if (if_block6) if_block6.d();
    			if (if_block7) if_block7.d();
    			if (if_block8) if_block8.d();
    			if (if_block9) if_block9.d();
    			if (if_block10) if_block10.d();
    			if (if_block11) if_block11.d();
    			if (if_block12) if_block12.d();
    			if (if_block13) if_block13.d();
    			if (if_block14) if_block14.d();
    			if (if_block15) if_block15.d();
    			if (if_block16) if_block16.d();
    			if (if_block17) if_block17.d();
    			if (if_block18) if_block18.d();
    			if (if_block19) if_block19.d();
    			if (if_block20) if_block20.d();
    			if (if_block21) if_block21.d();
    			if (if_block22) if_block22.d();
    			if (detaching) detach_dev(t26);
    			if (detaching) detach_dev(div2);
    			if (if_block23) if_block23.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$p.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$d($$self, $$props, $$invalidate) {
    	let $shapeRendering;
    	validate_store(shapeRendering, "shapeRendering");
    	component_subscribe($$self, shapeRendering, $$value => $$invalidate(9, $shapeRendering = $$value));

    	const help = keyword => keyword != ""
    	? window.open("https://github.com/ChristerNilsson/svelte-projects/wiki/" + keyword, "_blank")
    	: 0;

    	const link = link => window.open(links[link], "_blank");
    	const links = {};
    	links["Svelte"] = "https://github.com/ChristerNilsson/svelte-projects/wiki/Svelte";
    	links["REPL"] = "https://svelte.dev/repl/884dce5bfde14f7bb0903684aaac2f80?version=3.15.0";
    	let selectedTree = "";
    	let hor = "hor";
    	let path = [""];
    	const children0 = ("L1|L2|L3|L4|L5|L6").split("|");
    	let selected0 = "L1";
    	let children1 = [""];
    	let children3 = ("Svelte|REPL|render:auto|render:crisp").split("|");
    	let keywords = [];
    	let selected1 = "";
    	let keyword = "";
    	let selected3 = "";

    	function menu0_selected_binding(value) {
    		selected3 = value;
    		$$invalidate(5, selected3);
    	}

    	function menu1_selected_binding(value_1) {
    		selected0 = value_1;
    		$$invalidate(0, selected0);
    	}

    	function menu2_selected_binding(value_2) {
    		selected1 = value_2;
    		($$invalidate(3, selected1), $$invalidate(0, selected0));
    	}

    	function menu3_selected_binding(value_3) {
    		keyword = value_3;
    		$$invalidate(4, keyword);
    	}

    	$$self.$capture_state = () => {
    		return {};
    	};

    	$$self.$inject_state = $$props => {
    		if ("selectedTree" in $$props) selectedTree = $$props.selectedTree;
    		if ("hor" in $$props) hor = $$props.hor;
    		if ("path" in $$props) path = $$props.path;
    		if ("selected0" in $$props) $$invalidate(0, selected0 = $$props.selected0);
    		if ("children1" in $$props) $$invalidate(1, children1 = $$props.children1);
    		if ("children3" in $$props) $$invalidate(7, children3 = $$props.children3);
    		if ("keywords" in $$props) $$invalidate(2, keywords = $$props.keywords);
    		if ("selected1" in $$props) $$invalidate(3, selected1 = $$props.selected1);
    		if ("keyword" in $$props) $$invalidate(4, keyword = $$props.keyword);
    		if ("selected3" in $$props) $$invalidate(5, selected3 = $$props.selected3);
    		if ("$shapeRendering" in $$props) shapeRendering.set($shapeRendering = $$props.$shapeRendering);
    	};

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*selected0*/ 1) {
    			 if (selected0 == "L1") $$invalidate(1, children1 = ("rect|circle|line").split("|"));
    		}

    		if ($$self.$$.dirty & /*selected0*/ 1) {
    			 if (selected0 == "L2") $$invalidate(1, children1 = ("each|if|range|chess").split("|"));
    		}

    		if ($$self.$$.dirty & /*selected0*/ 1) {
    			 if (selected0 == "L3") $$invalidate(1, children1 = ("random|button|shortcut").split("|"));
    		}

    		if ($$self.$$.dirty & /*selected0*/ 1) {
    			 if (selected0 == "L4") $$invalidate(1, children1 = ("canvas|grid|colorPair").split("|"));
    		}

    		if ($$self.$$.dirty & /*selected0*/ 1) {
    			 if (selected0 == "L5") $$invalidate(1, children1 = ("bind:|on:keyup|guessMyNumber").split("|"));
    		}

    		if ($$self.$$.dirty & /*selected0*/ 1) {
    			 if (selected0 == "L6") $$invalidate(1, children1 = ("text|translate|rotate|scale|clock").split("|"));
    		}

    		if ($$self.$$.dirty & /*selected0*/ 1) {
    			 if (selected0) $$invalidate(3, selected1 = "");
    		}

    		if ($$self.$$.dirty & /*selected1*/ 8) {
    			 if (selected1 == "rect") $$invalidate(2, keywords = ("rect|import|style|stroke|stroke-width|fill|color").split("|"));
    		}

    		if ($$self.$$.dirty & /*selected1*/ 8) {
    			 if (selected1 == "circle") $$invalidate(2, keywords = ("circle").split("|"));
    		}

    		if ($$self.$$.dirty & /*selected1*/ 8) {
    			 if (selected1 == "line") $$invalidate(2, keywords = ("line").split("|"));
    		}

    		if ($$self.$$.dirty & /*selected1*/ 8) {
    			 if (selected1 == "each") $$invalidate(2, keywords = ("each|{}").split("|"));
    		}

    		if ($$self.$$.dirty & /*selected1*/ 8) {
    			 if (selected1 == "if") $$invalidate(2, keywords = ("if").split("|"));
    		}

    		if ($$self.$$.dirty & /*selected1*/ 8) {
    			 if (selected1 == "range") $$invalidate(2, keywords = ("range").split("|"));
    		}

    		if ($$self.$$.dirty & /*selected1*/ 8) {
    			 if (selected1 == "chess") $$invalidate(2, keywords = ("each|if|rect").split("|"));
    		}

    		if ($$self.$$.dirty & /*selected1*/ 8) {
    			 if (selected1 == "random") $$invalidate(2, keywords = ("random").split("|"));
    		}

    		if ($$self.$$.dirty & /*selected1*/ 8) {
    			 if (selected1 == "button") $$invalidate(2, keywords = ("button").split("|"));
    		}

    		if ($$self.$$.dirty & /*selected1*/ 8) {
    			 if (selected1 == "shortcut") $$invalidate(2, keywords = ("button|on:click").split("|"));
    		}

    		if ($$self.$$.dirty & /*selected1*/ 8) {
    			 if (selected1 == "canvas") $$invalidate(2, keywords = ("svg").split("|"));
    		}

    		if ($$self.$$.dirty & /*selected1*/ 8) {
    			 if (selected1 == "grid") $$invalidate(2, keywords = ("stroke|fill|each|range|line|slot|class").split("|"));
    		}

    		if ($$self.$$.dirty & /*selected1*/ 8) {
    			 if (selected1 == "colorPair") $$invalidate(2, keywords = ("on:click|g|each|filter").split("|"));
    		}

    		if ($$self.$$.dirty & /*selected1*/ 8) {
    			 if (selected1 == "bind:") $$invalidate(2, keywords = ("bind:|input").split("|"));
    		}

    		if ($$self.$$.dirty & /*selected1*/ 8) {
    			 if (selected1 == "on:keyup") $$invalidate(2, keywords = ("on:keyup|input").split("|"));
    		}

    		if ($$self.$$.dirty & /*selected1*/ 8) {
    			 if (selected1 == "guessMyNumber") $$invalidate(2, keywords = ("random|on:keyup|input|bind:|import").split("|"));
    		}

    		if ($$self.$$.dirty & /*selected1*/ 8) {
    			 if (selected1 == "text") $$invalidate(2, keywords = ("text|text-anchor|alignment-baseline").split("|"));
    		}

    		if ($$self.$$.dirty & /*selected1*/ 8) {
    			 if (selected1 == "translate") $$invalidate(2, keywords = ("translate").split("|"));
    		}

    		if ($$self.$$.dirty & /*selected1*/ 8) {
    			 if (selected1 == "rotate") $$invalidate(2, keywords = ("rotate").split("|"));
    		}

    		if ($$self.$$.dirty & /*selected1*/ 8) {
    			 if (selected1 == "scale") $$invalidate(2, keywords = ("scale").split("|"));
    		}

    		if ($$self.$$.dirty & /*selected1*/ 8) {
    			 if (selected1 == "clock") $$invalidate(2, keywords = ("range|onMount|Date|circle|line|stroke|stroke-width|fill|import|class|g|setInterval|clearInterval|transform|rgb|each|rotate|$:").split("|"));
    		}

    		if ($$self.$$.dirty & /*keyword*/ 16) {
    			 help(keyword);
    		}

    		if ($$self.$$.dirty & /*selected0*/ 1) {
    			 if (selected0) $$invalidate(2, keywords = []);
    		}

    		if ($$self.$$.dirty & /*selected3*/ 32) {
    			 if (selected3 == "render:auto") set_store_value(shapeRendering, $shapeRendering = "auto"); else if (selected3 == "render:crisp") set_store_value(shapeRendering, $shapeRendering = "crispEdges"); else link(selected3);
    		}
    	};

    	return [
    		selected0,
    		children1,
    		keywords,
    		selected1,
    		keyword,
    		selected3,
    		children0,
    		children3,
    		links,
    		$shapeRendering,
    		help,
    		link,
    		selectedTree,
    		hor,
    		path,
    		menu0_selected_binding,
    		menu1_selected_binding,
    		menu2_selected_binding,
    		menu3_selected_binding
    	];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$d, create_fragment$p, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$p.name
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
