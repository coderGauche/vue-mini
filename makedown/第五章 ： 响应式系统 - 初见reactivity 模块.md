## 第五章 ： 响应式系统 - 初见`reactivity` 模块

### 01. `reactive` 方法

### 02. `effect` 方法

看完源码可以得知，整个effect主要做了三件事情

1. 生成 `ReactiveEffect` 实例
2. 触发fn方法，从而激活getter
3. 建立了 `targetMap` 和 `activeEffect`之间的联系
   1. `dep.add(activeEffect)`
   2. `acctiveEffect.deps.push(dep)`

那么至此；页面中即可展示obj.name，但是不会忘记，等待两秒之后，我们会修改obj.name的值，我们知道，这样触发setter，那么我们接下来看setter中有做了什么？

setter做了两件事情：

1. 修改obj的值
2. 触发`targetMap`下保存的fn函数

总结：

跟踪了reactive.html 实例中：

1. `reactive` 函数
2. `effect` 函数
3. `obj.name = xx` 表达式

这三块代码背后，vue究竟做了什么。虽然整个过程比较复杂，但是如果我们简单来去看，其实内部的完成还是比较简单的：

1. 创建 proxy
2. 收集`effect`的依赖
3. 触发收集的依赖





### 03. 框架实现

主程序reactive.ts

```javascript
import { mutableHandlers } from './baseHandlers';

/**
 * 响应式 Map 缓存对象
 * key:target
 * val:proxy
 */
export const reactiveMap = new WeakMap<object, any>();

/**
 * 为复杂数据类型，创建响应式对象
 * @param target 被代理对象
 * @returns 代理对象
 */

export const reactive = (target: object) => {
  return createReactiveObject(target, mutableHandlers, reactiveMap);
};

/**
 * 创建响应式对象
 * @param target 被代理对象
 * @param baseHandlers handler
 * @param proxyMap
 * @returns
 */
export const createReactiveObject = (
  target: object,
  baseHandlers: ProxyHandler<any>,
  proxyMap: WeakMap<object, any>
) => {
  // 如果该实例已经被代理，则直接读取即可
  const existingProxy = proxyMap.get(target);
  if (existingProxy) {
    return existingProxy;
  }
  // 未被代理生成 proxy 实例
  const proxy = new Proxy(target, baseHandlers);
  // 缓存代理对象
  proxyMap.set(target, proxy);

  return proxy;
};

```

baseHandlers.ts文件

```javascript
export const mutableHandlers: ProxyHandler<object> = {};
```

Index.ts导出

```javascript
export { reactive } from './reactive';

```

测试文件vue/src/index.ts导出

```javascript
export { reactive } from '@vue/reactivity';
```

打包

```javascript
pnpm run build
```

上面的代码得到了个基础的reactive函数，但是在reactive函数中我们还存在三个问题：

1. `WebMap`是什么？ 他和map有啥区别
2. `mutableHandlers`现在是一个空的，我们又该如何实现呢？
3. 那不成以后每次测试，都要打包一次？





### 04. 什么是WeakMap?它和Map有什么区别？

对比WeakMap和Map，他们具有一个核心共同点，就是都是`{key,value}`结构对象。但是对于WeakMap而言，它却存在两个不同的地方：

1. key必须是对象
2. key必须是弱引用

弱引用的概念

1. 弱引用：不会影响垃圾回收机制。即：`WeakMap`的key不再存在任何引用是，会被直接回收。
2. 强引用：会影响垃圾回收机制。存在强引用的对象永远不会被回收。





### 05. mutableHandlers文件实现的setter和getter

```javascript
/**
 * 响应性的hander
 */
const createGetter = () => {
  return function get(target: object, key: string | symbol, reaceiver: object) {
    const res = Reflect.get(target, key, reaceiver);
    // 依赖收集
    track(target, key);
    return res;
  };
};
const get = createGetter();

const createSetter = () => {
  return function (
    target: object,
    key: string | symbol,
    value: unknown,
    reaceiver: object
  ) {
    const result = Reflect.set(target, key, value, reaceiver);
    // 触发依赖
    trigger(target, key, value);
    return result;
  };
};

const set = createSetter();

export const mutableHandlers: ProxyHandler<object> = {
  get,
  set
};

```

effect.ts文件

```javascript
//收集依赖
export const track = (target: object, key: unknown) => {
  console.log('收集依赖');
};

//触发依赖
export const trigger = (target: object, key: unknown, newValue: unknown) => {
  console.log('触发依赖');
};

```

上下联动很好理解





### 06. 解决热更新问题

在`package.json`中修改

```javascript
 "dev": "rollup -c -w" // -w代码是否有改动会重新执行， -c是读取文件
```





### 07. 实现`effect`

`effect.ts`编写

做的事情无非就是把传进来的fn进行触发

但是`activeEffect`标记`this`没有用到

```javascript
export const effect = <T = any>(fn: () => T) => {
  const _effect = new ReactiveEffect(fn);
  _effect.run();
};

export let activeEffect: ReactiveEffect | undefined;

export class ReactiveEffect<T = any> {
  constructor(public fn: () => T) {}
  run() {
    //标记当前被激活的 activeEffect
    activeEffect = this;
    return this.fn();
  }
}

```

挂载` /vue-next-mini/packages/reactivity/src/index.ts`

```javascript
export { effect } from './effect';
```

挂载`/vue-next-mini/packages/vue/src/index.ts`

```
export { reactive, effect } from '@vue/reactivity';
```

使用

```html
 <div id="app"></div>
    <script>
        const { reactive, effect } = Vue
        const obj = reactive({
            name: '张珊'
        })
        effect(() => {
            document.querySelector('#app').innerHTML = obj.name
        })
    </script>
```







### 08. 实现track&&trigger原理

下面要做

1. track 依赖收集
2. trigger 触发依赖

如何实现呢

我们要去使用WeakMap去实现

1. key：响应式obj
2. value：Map对象
   1. key：响应式对象的指定属性
   2. value：指定一下属性的执行函数







### 09. 实现track

```javascript
type keyToDepMap = Map<any, ReactiveEffect>;

/**
 * 1. key：响应式obj
   2. value：Map对象
      1. key：响应式对象的指定属性
      2. value：指定一下属性的执行函数
 */

const targetMap = new WeakMap<any, keyToDepMap>();
/**
 * 用于收集依赖的方法
 * @param target mWeakap的key
 * @param key 代理对象的key，当依赖被处罚时，需要根据key获取
 */

//收集依赖
export const track = (target: object, key: unknown) => {
  // 如果当前不存在执行函数,则直接return
  console.log('收集依赖机制');
  // 尝试从targetMao中，根据target获取map
  if (!activeEffect) return;
  // 如果获取到的map不存在，则生成新的mao对象，并把该对象赋值给对应的value
  let depsMap = targetMap.get(target);
  if (!depsMap) {
    targetMap.set(target, (depsMap = new Map()));
  }
  // 为指定map，指定key 设置回调函数
  depsMap.set(key, activeEffect);
  console.log(targetMap);
};
```



### 10. 实现trigger

```javascript
export const trigger = (target: object, key: unknown, newValue: unknown) => {
  //   console.log('触发依赖机制');
  const depsMap = targetMap.get(target);
  if (!depsMap) return;
  const effect = depsMap.get(key) as ReactiveEffect;
  if (!effect) return;
  effect.fn();
};
```





### 11. 解决activeEffect是单个的问题

主要是把单个activeEffect搞成多个set

就要创建封装set  在/vue-next-mini/packages/reactivity/src/dep.ts文件

```typescript
import { ReactiveEffect } from "./effect";

export type Dep = Set<ReactiveEffect>

export const createDep = (effects?:ReactiveEffect[]):Dep => {
    const dep = new Set<ReactiveEffect>(effects) as Dep
    return dep
}
```



```typescript
import { isArray } from '@vue/shared';
import { Dep, createDep } from './dep';
//收集依赖
export const track = (target: object, key: unknown) => {
  // 如果当前不存在执行函数,则直接return
  // console.log('收集依赖机制');
  // 尝试从targetMao中，根据target获取map
  if (!activeEffect) return;
  // 如果获取到的map不存在，则生成新的mao对象，并把该对象赋值给对应的value
  let depsMap = targetMap.get(target);
  if (!depsMap) {
    targetMap.set(target, (depsMap = new Map()));
  }
  // 为指定map，指定key 设置回调函数
  let dep = depsMap.get(key);
  if (!dep) {
    depsMap.set(key, (dep = createDep()));
  }
  trackEffects(dep);
};

/**
 * 利用dep依次跟踪指定key的所有effect
 */
export const trackEffects = (dep: Dep) => {
  dep.add(activeEffect!);
};

//触发依赖
export const trigger = (target: object, key: unknown, newValue: unknown) => {
  //   console.log('触发依赖机制');
  const depsMap = targetMap.get(target);
  if (!depsMap) return;
  const dep: Dep | undefined = depsMap.get(key);
  if (!dep) return;
  triggerEffects(dep);
};

/**
 * 一次出发dep中保存的依赖
 */
export const triggerEffects = (dep: Dep) => {
  const effects = isArray(dep) ? dep : [...dep];
  //依次触发依赖
  for (const effect of effects) {
    triggerEffect(effect);
  }
};

/**
 * 触发指定依赖
 */
export const triggerEffect = (effect: ReactiveEffect) => {
  effect.run();
};

export const effect = <T = any>(fn: () => T) => {
  const _effect = new ReactiveEffect(fn);
  _effect.run();
};
```





### 12. 总结

`reactive`的响应性而言

1. 是通过proxy的setter和getter来实现监听
2. 需要配合effect函数进行使用
3. 基于Weakmap完成的依赖手机和处理
4. 可以存在一对多的依赖关系

reactive函数的不足

1. reactive只能对复杂数据类型进行使用
2. reactive的响应性数据，不可以进行结构

因为reactive的不足，所以vue3又为我们提供了ref函数构建响应性，name：

1. ref函数的内容是如何进行实现的呢？
2. ref可以构建但数据类型的响应性吗？
3. 为什么ref类型的数据，必须通过.value访问呢？
