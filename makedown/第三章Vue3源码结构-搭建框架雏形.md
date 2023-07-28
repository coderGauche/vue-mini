## 第三章Vue3源码结构-搭建框架雏形



### 01. 源码设计解析

```javascript
vue-next-3.2.37
├─BACKERS.md //赞助声明
├─CHANGELOG.md // 更新日志
├─LICENSE //开源协议
├─README.md // 项目声明文件
├─SECURITY.md // 报告漏洞，维护安全的声明文件
├─api-extractor.json // TypeScript的API分析工具
├─jest.config.js // 测试相关
├─netlify.toml //自动化部署相关
├─package.json // npm 包管理工具
├─pnpm-lock.yaml // 使用pnpm 下载的依赖包版本
├─pnpm-workspace.yaml //pnpm相关配置
├─rollup.config.js // rollup打包配置
├─tsconfig.json // TypeScript配置
├─test-dts //测试相关，不关注
├─scripts //配置文件相关 不需要关注
├─packages // 核心代码区
|    ├─global.d.ts // 全局ts的声明
|    ├─vue-compat // 用于兼容vue2代码
|    ├─vue // 重要：测试实例，打包之后的dist都会放这里
|    ├─template-explorer // 提供上线测试用例（https://template-explorer.vuejs.org）用于把template转为render
|    ├─size-check // 测试运行时包大小
|    ├─shared //重要：共享的工具类
|    ├─sfc-playground // sfc,比如 https://sfc.vuejs.org/
|    ├─server-renderer // 服务器渲染
|    ├─runtime-test // runtime 测试相关
|    ├─runtime-dom // 重要：基于浏览器平台的运行时
|    ├─runtime-core // 重要：运行时的核心代码，内部针对不同平台进行了实现
|    ├─reactivity-transform // 已过期，无需关注
|    ├─reactivity // 重要：响应式的核心模块
|    ├─compiler-ssr // 服务端渲染的编译模块
|    ├─compiler-sfc // 单文件组件（.vue）的编译模块
|    ├─compiler-dom // 重要：浏览器相关的编译模块
|    ├─compiler-core // 重要：编译器核心代码
```





### 02. 运行测试实例

![image-20230725183544648](/Users/wuzaifa/Library/Application Support/typora-user-images/image-20230725183544648.png)

```html
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Document</title>
    <script src="../../../dist/vue.global.js"></script>
</head>

<body>
    <div id="app"></div>
</body>
<script>
    const { reactive, effect } = Vue
    const obj = reactive({
        name: 'xxx'
    })
    effect(() => {
        document.querySelector('#app').innerHTML = obj.name
    })

    setTimeout(() => {
        obj.name = 'yyy'
    }, 1000)
</script>

</html>
```

测试成功



### 03. 跟踪解析运行行为：为vue开启sourceMap

上一步是创建测试实例代码，但是怎么知道vue内部是如何执行的呢？

我们想知道这个，就要对vue的代码进行debugger来跟踪vue代码的执行

如何对**vue进行debgger操作？**

#### 开启vue的sourceMap

如何开启vue的source-map?

1. 打开package.json可以发现，当我们执行npm run build时，其实执行的是node scripts/build.js指令

2. 这意味，他的配置文件读取的是script/build.js文件

3. 那么该文件中存在这样代码

   ```javascript
   const sourceMap = args.sourcemap || args.s
   ```

   ```javascript
   const args = require('minimist')(process.argv.slice(2))
   ```

4. 我们会发现minimist这个库，他的作用是获取后面的参数比如

   ```javascript
   node scripts/build.js -b aaaa
   ```

   他就会获取-b：aaaa的值

5. 知道这个我们就知道咋开启了

   ```javascript
   "build": "node scripts/build.js -s",
   ```

   他就会传s等于true，sourceMap也变为true

6. 最后dist里就有.map文件





### 04. 开始搭建自己的框架：创建vue-next-mini

从0开始搭建

1. 创建 vue-next-mini 文件夹
2. vscode 打开
3. 初始化 npm init -y
4. 创建文件 vue 打包、测试实例。项目入口，导出
5. 创建文件 shared 共享方法模块
6. 创建文件 reactivity 响应性核心
7. 创建文件 compiler-core 编辑器核心
8. 创建文件 complier-dom 浏览器编辑器模块
9. 创建文件 runtime-core 运行时核心
10. 创建文件 runtime-dom 浏览器运行时模块



### 05. 给框架配置TypeScrip

```javascript
npm -init
```

Tsconfig.json文件配置

```javascript
// https://www.typescriptlang.org/tsconfig，也可以使用 tsc -init 生成默认的 tsconfig.json 文件进行属性查找
{
	// 编辑器配置
	"compilerOptions": {
		// 根目录
		"rootDir": ".",
		// 严格模式标志
		"strict": true,
		// 指定类型脚本如何从给定的模块说明符查找文件。
		"moduleResolution": "node",
		// https://www.typescriptlang.org/tsconfig#esModuleInterop
		"esModuleInterop": true, 
		// JS 语言版本
		"target": "es5",
		// 允许未读取局部变量
		"noUnusedLocals": false,
		// 允许未读取的参数
		"noUnusedParameters": false,
		// 允许解析 json
		"resolveJsonModule": true,
		// 支持语法迭代：https://www.typescriptlang.org/tsconfig#downlevelIteration
		"downlevelIteration": true,
		// 允许使用隐式的 any 类型（这样有助于我们简化 ts 的复杂度，从而更加专注于逻辑本身）
		"noImplicitAny": false,
		// 模块化
		"module": "esnext",
		// 转换为 JavaScript 时从 TypeScript 文件中删除所有注释。
		"removeComments": false,
		// 禁用 sourceMap
		"sourceMap": false,
		// https://www.typescriptlang.org/tsconfig#lib
		"lib": ["esnext", "dom"],
		// 设置快捷导入
		"baseUrl": ".",
		"paths": {
      "@vue/*": ["packages/*/src"]
    }
	},
	// 入口
	"include": [
		"packages/*/src"
	]
}
```

因为 "@vue/*": ["packages/*/src"]所以给packages的里面每个文件加上src





### 06. prettierrc配置

```javascript
{
    "semi": true, //是否去掉分号
    "singleQuote": true, //是否换成单引号 
    "printWidth": 80, //多少行代码换行
    "trailingComma": "none", //不未遂加逗号
    "arrowParens": 'avoid' //箭头函数小括号
}
```





## 07. 模块打包器-Rollup

1. 创建文件rollup.confing.js

   ```javascript
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
   ```

2. 安装 pnpm install -g rollup

3. 安装 pnpm add -D tslib@2.4.0 typescript@4.7.4      

4. 安装 pnpm install -D @rollup/plugin-commonjs@22.0.1  @rollup/plugin-node-resolve@13.3.0  @rollup/plugin-typescript@8.3.4

5. 在package.json新增"type": "module",

6. 在package.json配置"build": "rollup -c"

7. 在vue/src/index.ts文件编写测试代码console.log('hello word');

8. pnpm run build
