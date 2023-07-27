var Vue = (function (exports) {
    'use strict';

    /*
     * @Author: Gauche楽
     * @Date: 2023-07-25 19:31:53
     * @LastEditors: Gauche楽
     * @LastEditTime: 2023-07-27 19:16:27
     * @FilePath: /vue-next-mini/packages/shared/src/index.ts
     */
    var isArray = function (arr) {
        return Array.isArray(arr);
    };
    var isObject = function (value) {
        return value !== null && typeof value === 'object';
    };
    //Object.is  如果值相同返回true，对比数据是否发生改变
    var hasChange = function (value, oldValue) {
        return !Object.is(value, oldValue);
    };

    /******************************************************************************
    Copyright (c) Microsoft Corporation.

    Permission to use, copy, modify, and/or distribute this software for any
    purpose with or without fee is hereby granted.

    THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
    REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
    AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
    INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
    LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
    OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
    PERFORMANCE OF THIS SOFTWARE.
    ***************************************************************************** */
    /* global Reflect, Promise */


    function __values(o) {
        var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
        if (m) return m.call(o);
        if (o && typeof o.length === "number") return {
            next: function () {
                if (o && i >= o.length) o = void 0;
                return { value: o && o[i++], done: !o };
            }
        };
        throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
    }

    function __read(o, n) {
        var m = typeof Symbol === "function" && o[Symbol.iterator];
        if (!m) return o;
        var i = m.call(o), r, ar = [], e;
        try {
            while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
        }
        catch (error) { e = { error: error }; }
        finally {
            try {
                if (r && !r.done && (m = i["return"])) m.call(i);
            }
            finally { if (e) throw e.error; }
        }
        return ar;
    }

    function __spreadArray(to, from, pack) {
        if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
            if (ar || !(i in from)) {
                if (!ar) ar = Array.prototype.slice.call(from, 0, i);
                ar[i] = from[i];
            }
        }
        return to.concat(ar || Array.prototype.slice.call(from));
    }

    var createDep = function (effects) {
        var dep = new Set(effects);
        return dep;
    };

    /*
     * @Author: Gauche楽
     * @Date: 2023-07-27 00:40:51
     * @LastEditors: Gauche楽
     * @LastEditTime: 2023-07-27 02:58:10
     * @FilePath: /vue-next-mini/packages/reactivity/src/effect.ts
     */
    /**
     * 1. key：响应式obj
       2. value：Map对象
          1. key：响应式对象的指定属性
          2. value：指定一下属性的执行函数
     */
    var targetMap = new WeakMap();
    /**
     * 用于收集依赖的方法
     * @param target mWeakap的key
     * @param key 代理对象的key，当依赖被处罚时，需要根据key获取
     */
    //收集依赖
    var track = function (target, key) {
        // 如果当前不存在执行函数,则直接return
        // console.log('收集依赖机制');
        // 尝试从targetMao中，根据target获取map
        if (!activeEffect)
            return;
        // 如果获取到的map不存在，则生成新的mao对象，并把该对象赋值给对应的value
        var depsMap = targetMap.get(target);
        if (!depsMap) {
            targetMap.set(target, (depsMap = new Map()));
        }
        // 为指定map，指定key 设置回调函数
        var dep = depsMap.get(key);
        if (!dep) {
            depsMap.set(key, (dep = createDep()));
        }
        trackEffects(dep);
    };
    /**
     * 利用dep依次跟踪指定key的所有effect
     */
    var trackEffects = function (dep) {
        dep.add(activeEffect);
    };
    //触发依赖
    var trigger = function (target, key, newValue) {
        //   console.log('触发依赖机制');
        var depsMap = targetMap.get(target);
        if (!depsMap)
            return;
        var dep = depsMap.get(key);
        if (!dep)
            return;
        triggerEffects(dep);
    };
    /**
     * 一次出发dep中保存的依赖
     */
    var triggerEffects = function (dep) {
        var e_1, _a;
        var effects = isArray(dep) ? dep : __spreadArray([], __read(dep), false);
        try {
            //依次触发依赖
            for (var effects_1 = __values(effects), effects_1_1 = effects_1.next(); !effects_1_1.done; effects_1_1 = effects_1.next()) {
                var effect_1 = effects_1_1.value;
                triggerEffect(effect_1);
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (effects_1_1 && !effects_1_1.done && (_a = effects_1.return)) _a.call(effects_1);
            }
            finally { if (e_1) throw e_1.error; }
        }
    };
    /**
     * 触发指定依赖
     */
    var triggerEffect = function (effect) {
        effect.run();
    };
    var effect = function (fn) {
        var _effect = new ReactiveEffect(fn);
        _effect.run();
    };
    var activeEffect;
    var ReactiveEffect = /** @class */ (function () {
        function ReactiveEffect(fn) {
            this.fn = fn;
        }
        ReactiveEffect.prototype.run = function () {
            //标记当前被激活的 activeEffect
            activeEffect = this;
            return this.fn();
        };
        return ReactiveEffect;
    }());

    /**
     * 响应性的hander
     */
    var createGetter = function () {
        return function get(target, key, reaceiver) {
            var res = Reflect.get(target, key, reaceiver);
            // 依赖收集
            track(target, key);
            return res;
        };
    };
    var get = createGetter();
    var createSetter = function () {
        return function (target, key, value, reaceiver) {
            var result = Reflect.set(target, key, value, reaceiver);
            // 触发依赖
            trigger(target, key);
            return result;
        };
    };
    var set = createSetter();
    var mutableHandlers = {
        get: get,
        set: set
    };

    /*
     * @Author: Gauche楽
     * @Date: 2023-07-26 17:27:35
     * @LastEditors: Gauche楽
     * @LastEditTime: 2023-07-27 19:02:58
     * @FilePath: /vue-next-mini/packages/reactivity/src/reactive.ts
     */
    /**
     * 响应式 Map 缓存对象
     * key:target
     * val:proxy
     */
    var reactiveMap = new WeakMap();
    /**
     * 为复杂数据类型，创建响应式对象
     * @param target 被代理对象
     * @returns 代理对象
     */
    var reactive = function (target) {
        return createReactiveObject(target, mutableHandlers, reactiveMap);
    };
    /**
     * 创建响应式对象
     * @param target 被代理对象
     * @param baseHandlers handler
     * @param proxyMap
     * @returns
     */
    var createReactiveObject = function (target, baseHandlers, proxyMap) {
        // 如果该实例已经被代理，则直接读取即可
        var existingProxy = proxyMap.get(target);
        if (existingProxy) {
            return existingProxy;
        }
        // 未被代理生成 proxy 实例
        var proxy = new Proxy(target, baseHandlers);
        // 缓存代理对象
        proxyMap.set(target, proxy);
        return proxy;
    };
    //判断是否是复杂类数据
    var toReactive = function (value) {
        return isObject(value) ? reactive(value) : value;
    };

    var ref = function (value) {
        return creacteRef(value, false);
    };
    var creacteRef = function (rawValue, shallow) {
        if (isRef(rawValue)) {
            return rawValue;
        }
        return new RefImpl(rawValue, shallow);
    };
    var RefImpl = /** @class */ (function () {
        function RefImpl(value, __v_isShallow) {
            this.__v_isShallow = __v_isShallow;
            this.dep = undefined;
            this._rowValue = value;
            this._value = __v_isShallow ? value : toReactive(value);
        }
        Object.defineProperty(RefImpl.prototype, "value", {
            get: function () {
                //收集依赖
                trackRefValue(this);
                return this._value;
            },
            set: function (newValue) {
                if (hasChange(newValue, this._rowValue)) {
                    this._rowValue = newValue;
                    this._value = toReactive(newValue);
                    triggerValue(this);
                }
            },
            enumerable: false,
            configurable: true
        });
        return RefImpl;
    }());
    /**
     * 触发依赖
     */
    function triggerValue(ref) {
        if (ref.dep) {
            triggerEffects(ref.dep);
        }
    }
    /**
     * 收集依赖
     */
    function trackRefValue(ref) {
        if (activeEffect) {
            trackEffects(ref.dep || (ref.dep = createDep()));
        }
    }
    /**
     * 是否为ref
     */
    function isRef(r) {
        return !!(r && r.__v_isRef === true);
    }

    exports.effect = effect;
    exports.reactive = reactive;
    exports.ref = ref;

    return exports;

})({});
//# sourceMappingURL=vue.js.map
