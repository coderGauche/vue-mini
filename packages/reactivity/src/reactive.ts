/*
 * @Author: Gauche楽
 * @Date: 2023-07-26 17:27:35
 * @LastEditors: Gauche楽
 * @LastEditTime: 2023-07-27 19:02:58
 * @FilePath: /vue-next-mini/packages/reactivity/src/reactive.ts
 */
import { isObject } from '@vue/shared';
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

//判断是否是复杂类数据
export const toReactive = <T extends unknown>(value: T): T => {
  return isObject(value) ? reactive(value as object) : value;
};
