/*
 * @Author: Gauche楽
 * @Date: 2023-07-25 19:31:53
 * @LastEditors: Gauche楽
 * @LastEditTime: 2023-07-27 19:16:27
 * @FilePath: /vue-next-mini/packages/shared/src/index.ts
 */
export const isArray = arr => {
  return Array.isArray(arr);
};
export const isObject = (value: unknown) =>
  value !== null && typeof value === 'object';

//Object.is  如果值相同返回true，对比数据是否发生改变
export const hasChange = (value: any, oldValue: any): boolean =>
  !Object.is(value, oldValue);
