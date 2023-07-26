/*
 * @Author: Gauche楽
 * @Date: 2023-07-25 19:45:46
 * @LastEditors: Gauche楽
 * @LastEditTime: 2023-07-25 20:13:21
 * @FilePath: /vue-next-mini/rollup.config.js
 */
import resolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import typescript from '@rollup/plugin-typescript'
export default [
    {
        // 入口文件
        input: 'packages/vue/src/index.ts',
        // 打包的出口
        output: [
            //导出iife格式的包
            {
                // 开启sourceMap
                sourcemap: true,
                file: './packages/vue/dist/vue.js',
                // 生成包的格式
                format: 'iife',
                // 变量名
                name: 'Vue'
            }
        ],
        // 插件
        plugins: [
            //ts
            typescript({ sourceMap: true }),
            // 模块导入补全插件
            resolve(),
            // 转commonjs 为ESM
            commonjs()
        ]
    }
]