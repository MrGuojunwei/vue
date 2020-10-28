/*
 * not type checking this file because flow doesn't play well with
 * dynamically accessing methods on Array prototype
 */

import { def } from '../util/index'

const arrayProto = Array.prototype
export const arrayMethods = Object.create(arrayProto)
// 该数组存储将要改写的数组的原型方法名
const methodsToPatch = [
  'push',
  'pop',
  'shift',
  'unshift',
  'splice',
  'sort',
  'reverse'
]

/**
 * Intercept mutating methods and emit events
 */
// 下面代码改变了数组的的原型方法
methodsToPatch.forEach(function (method) {
  // cache original method
  const original = arrayProto[method] // 拿到真实原型的函数引用
  def(arrayMethods, method, function mutator(...args) {
    // 当调用数组push/pop/shift/unshift/splice/sort/reverse这些方法的时候，执行调用的时mutator这个函数
    const result = original.apply(this, args) // 拿到真是数组方法的调用后的结果
    // 此时，需要做的就是拿到监听数组的依赖，然后通知依赖中的watcher进行更新，那么如何收集到监听数组的依赖呢
    const ob = this.__ob__
    let inserted
    // push/unshift/splice这些方法会向数组中添加元素，
    // inserted用来存储添加的元素数组，对于添加的这些元素，也要变成响应式元素
    switch (method) {
      case 'push':
      case 'unshift':
        inserted = args
        break
      case 'splice':
        inserted = args.slice(2)
        break
    }
    if (inserted) ob.observeArray(inserted)
    // notify change
    // 
    // 每个响应式数组都会有__ob__属性，是Observer的实例，通过ob.dep即可以拿到依赖
    ob.dep.notify()
    return result
  })
})
