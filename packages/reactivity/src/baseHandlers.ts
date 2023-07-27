import { track, trigger } from './effect';

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
