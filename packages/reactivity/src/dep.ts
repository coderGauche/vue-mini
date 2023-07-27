/*
 * @Author: Gauche楽
 * @Date: 2023-07-27 02:37:26
 * @LastEditors: Gauche楽
 * @LastEditTime: 2023-07-27 02:39:26
 * @FilePath: /vue-next-mini/packages/reactivity/src/dep.ts
 */
import { ReactiveEffect } from "./effect";

export type Dep = Set<ReactiveEffect>

export const createDep = (effects?:ReactiveEffect[]):Dep => {
    const dep = new Set<ReactiveEffect>(effects) as Dep
    return dep
}