## 第六章：响应系统 - ref的响应性

### 00. 问题

1. ref如何实现de
   1. ref函数本质上是生成了一个RefIml类型的实例对象，通过get和set标记处理了vlaue函数

1. ref可以构建简单数据类型的响应性嘛

   1. 是的，ref可以构建简单数据类型响应性，但是是通过主动触发getvalue和setvalue形成类似proxy的响应性

2. 为什么renf数据类型必须.value访问呢

   必须访问set value 和get value 导致用.vue

   1. 因为ref需要处理简单数据类型的响应性，但是对于简单数据类型而言他无法通过proxy建立代理
   2. 所以vue通过getvalue()和set value()定义了两个属性函数，通过主动触发这两个函数(属性调用)的形式进行依赖手机和触发依赖
   3. 所以我们必须通过.value来保证响应性

   

### 01. ref源码debug结论

#### ref函数

1. Ref 函数中，直接触发 createRef 函数
2. 在 createRef中，进行了判断如果当前已经是一个ref类型数据则直接返回，否则返回RefImpl类型的实例
3. name这个RefImpl是什么呢？
   1. RefImpl 是同样位于packages/reactivity/src/ref.ts之下的一个类
   2. 该类的构造函数中，执行了一个 toReactive 的方法，传入value并把返回值赋值给了this.value,那么我们来看看toReactive的作用：
      1. toReactive 方法吧数据分成了两种类型：
         1. 复杂类型数据：调用了reactive函数，即吧value变为响应式
         2. 简单数据类型：直接把value原样返回
   3. 该类提供了一个分别被get和set标记的函数value
      1. 当执行xxx.value是，会触发get标记
      2. 放置箱xxx.value = xxx 时，会触发set标记
4. 至此ref函数执行完成。

以上逻辑可知：

1. 对于ref而言，主要生成了RefImpl的实例
2. 在构造函数中对传入的数据进行了处理：
   1. 复杂数据类型：转为响应式的proxy实例
   2. 简单数据类型：不处理
3. RefImpl分裂提供了get value,set value,以此来完成对getter和setter的监听，注意这哭并没有使用proxy

#### effect函数：

当red函数执行完成之后，测试实例开始执行effect函数。

effect函数之前跟踪过他的执行流程，我们知道整个effect主要做了三件事：

1. 生成ReactiveEffect实例
2. 触发fn方法，从而激活getter
3. 建立了targetMap和activeEffect之间的联系
   1. dep.add(activeEffect)
   2. activeEffect.deps.push(dep)

通过以上可知，effect中会触发fn函数，也就是说会指向obj.value.name,那么根据get value机制，此时会触发RefImpl的get value 方法。

所以我们在117行增加断点，等代码进入get value

#### get value()

1. 在 get value中会触发 trackRefValue 方法

   1. 触发trackEffects 函数，并且在此时为ref新增了dep属性

      ```javascript
      trackEffects(ref.dep || (ref.dep = creactDep()))
      ```

   2. 而trackEffects其实我们是有过了解的，我们知道trackEffects主要作用就是：手机所有依赖

2. 至此get value执行完成

忧伤逻辑可知：

整个get value的处理逻辑还是比较简单的饿，主要还是通过之前的trackEffects属性来收集依赖。

#### 再次触发get value()

最后就是在两秒之后修改了数据源：

```
obj.value.name='xxxx'
```

凡是这里有个关键的问题，就是此时会触发get value还是set value？

以上代码 被拆解为

```javascript
const value = obj.value
value.name = ‘xxxx'
```

通过上面代码，结果是触发get value函数

在get value函数中：

1. 再次执行trackRefValue 函数：
   1. 但是此刻activeEffect 为undefined，所以不会执行后续逻辑
2. 返回this._value:
   1. 通过构造函数，我们可知，此刻的this._value是经过toReactive函数过滤之后的数据，在当前实例中为proxy实例。
3. Get value 执行完成

以上逻辑可知：

1. cosnt value是proxy类型的实例，即：代理对象被代理对象为{name:'xxxx'}
2. 执行value.name = 'xxxx'，本质上是触发了proxy和setter
3. 根据reactive的执行逻辑可知，此时会触发trugger触发依赖
4. 至此，修改视图

#### 总结

1. 对ref函数，会返回RefImpl类型的实例

2. 在该实例中，会根据传入的数据类型进行分开处理

   1. 复杂数据类型：转换为reactive返回的proxy实例
   2. 简单数据类型：不作处理

   无论我们执行obj.value.name还是obj.value.name = 'xxx'本质上都出发get value

   之所以会进行响应性是因为obj.value是一个reactive函数生成的proxy



### 02. ref简单数据类型响应性

简单数据类型，不具备数据监听概念，及本身并不是响应性。

只是因为vue通过set value() 语法把函数调用变成了属性调用的形式，让我们通过主动调用该函数，来完成一个类似于响应性的结果。

