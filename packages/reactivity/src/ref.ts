import { hasChange } from '@vue/shared';
import { Dep, createDep } from './dep';
import { activeEffect, trackEffects, triggerEffects } from './effect';
import { toReactive } from './reactive';

/*
 * @Author: Gauche楽
 * @Date: 2023-07-27 18:46:42
 * @LastEditors: Gauche楽
 * @LastEditTime: 2023-07-27 19:20:44
 * @FilePath: /vue-next-mini/packages/reactivity/src/ref.ts
 */
export interface Ref<T = any> {
  value: T;
}

export const ref = (value?: unknown) => {
  return creacteRef(value, false);
};

export const creacteRef = (rawValue: unknown, shallow: boolean) => {
  if (isRef(rawValue)) {
    return rawValue;
  }
  return new RefImpl(rawValue, shallow);
};

class RefImpl<T> {
  private _value: T;
  private _rowValue: T;
  public dep?: Dep = undefined;
  constructor(value: T, public readonly __v_isShallow: boolean) {
    this._rowValue = value;
    this._value = __v_isShallow ? value : toReactive(value);
  }
  get value() {
    //收集依赖
    trackRefValue(this);
    return this._value;
  }
  set value(newValue) {
    if (hasChange(newValue, this._rowValue)) {
      this._rowValue = newValue;
      this._value = toReactive(newValue);
      triggerValue(this);
    }
  }
}

/**
 * 触发依赖
 */

export function triggerValue(ref) {
  if (ref.dep) {
    triggerEffects(ref.dep);
  }
}

/**
 * 收集依赖
 */
export function trackRefValue(ref) {
  if (activeEffect) {
    trackEffects(ref.dep || (ref.dep = createDep()));
  }
}

/**
 * 是否为ref
 */
export function isRef(r: any): r is Ref {
  return !!(r && r.__v_isRef === true);
}
