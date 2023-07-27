/*
 * @Author: Gauche楽
 * @Date: 2023-07-27 00:40:51
 * @LastEditors: Gauche楽
 * @LastEditTime: 2023-07-27 02:58:10
 * @FilePath: /vue-next-mini/packages/reactivity/src/effect.ts
 */

import { isArray } from '@vue/shared';
import { Dep, createDep } from './dep';

type keyToDepMap = Map<any, Dep>;

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

export let activeEffect: ReactiveEffect | undefined;

export class ReactiveEffect<T = any> {
  constructor(public fn: () => T) {}
  run() {
    //标记当前被激活的 activeEffect
    activeEffect = this;
    return this.fn();
  }
}
