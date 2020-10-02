/* @flow */

import config from '../config'
import { warn } from './debug'
import { nativeWatch } from './env'
import { set } from '../observer/index'

import {
  ASSET_TYPES,
  LIFECYCLE_HOOKS
} from 'shared/constants'

import {
  extend,
  hasOwn,
  camelize,
  toRawType,
  capitalize,
  isBuiltInTag,
  isPlainObject
} from 'shared/util'

/**
 * Option overwriting strategies are functions that handle
 * how to merge a parent option value and a child option
 * value into the final value.
 */
/**
 * strats存在哪些合并策略呢？
 * 答：el,propsData / data / 11个钩子函数 / filters,components,directives / watch / props,methods,inject,computed / provide
 */
const strats = config.optionMergeStrategies // 选项合并策略 此时strats是一个绝对空的对象

/**
 * Options with restrictions
 * 用于提示警告信息，忽略
 */
if (process.env.NODE_ENV !== 'production') {
  strats.el = strats.propsData = function (parent, child, vm, key) {
    if (!vm) {
      warn(
        `option "${key}" can only be used during instance ` +
        'creation with the `new` keyword.'
      )
    }
    return defaultStrat(parent, child)
  }
}

/**
 * Helper that recursively merges two data objects together.
 * to: child  from: parent
 * 此处就是将parent上的数据深度拷贝到child上
 */
function mergeData(to: Object, from: ?Object): Object {
  if (!from) return to
  let key, toVal, fromVal
  const keys = Object.keys(from)
  for (let i = 0; i < keys.length; i++) {
    key = keys[i]
    toVal = to[key]
    fromVal = from[key]
    if (!hasOwn(to, key)) {
      set(to, key, fromVal)
    } else if (isPlainObject(toVal) && isPlainObject(fromVal)) {
      mergeData(toVal, fromVal)
    }
  }
  return to
}

/**
 * Data的合并策略
 */
export function mergeDataOrFn(
  parentVal: any,
  childVal: any,
  vm?: Component
): ?Function {
  if (!vm) {
    // 处理vm不存在的情况
    // in a Vue.extend merge, both should be functions
    if (!childVal) { // 子数据不存在，返回父数据
      return parentVal
    }
    if (!parentVal) { // 父数据不存在，返回子数据
      return childVal
    }
    // when parentVal & childVal are both present,
    // we need to return a function that returns the
    // merged result of both functions... no need to
    // check if parentVal is a function here because
    // it has to be a function to pass previous merges.
    return function mergedDataFn() {
      // mergeData函数是最终返回合并后的结果，第一个参数是子data，第二个参数是父data
      return mergeData(
        typeof childVal === 'function' ? childVal.call(this, this) : childVal,
        typeof parentVal === 'function' ? parentVal.call(this, this) : parentVal
      )
    }
  } else {
    // 处理vm存在的情况
    return function mergedInstanceDataFn() {
      // vm看起来应该是用来作为childVal或parentVal函数调用时的this指向的
      // instance merge
      const instanceData = typeof childVal === 'function'
        ? childVal.call(vm, vm)
        : childVal
      const defaultData = typeof parentVal === 'function'
        ? parentVal.call(vm, vm)
        : parentVal
      if (instanceData) {
        return mergeData(instanceData, defaultData)
      } else {
        return defaultData
      }
    }
  }
}
// 关于data的合并策略
// data的合并策略就是，将parentVal上的数据深度拷贝到childVal上，如果parentVal或childVal是函数，vm是用来作用函数调用的this指向的
strats.data = function (
  parentVal: any,
  childVal: any,
  vm?: Component
): ?Function {
  if (!vm) {
    // 如果childVal是不是一个函数，即data是一个普通的对象，则给出警告，data应该是一个返回值是对象的函数
    if (childVal && typeof childVal !== 'function') {
      process.env.NODE_ENV !== 'production' && warn(
        'The "data" option should be a function ' +
        'that returns a per-instance value in component ' +
        'definitions.',
        vm
      )

      return parentVal
    }
    return mergeDataOrFn(parentVal, childVal) // 
  }

  return mergeDataOrFn(parentVal, childVal, vm)
}

/**
 * Hooks and props are merged as arrays.
 * 合并钩子函数策略
 * 钩子函数的合并策略就是：
 * 如果没有childVal, 返回parentVal;
 * 如果childVal存在，但parentVal不存在，又分两种情况，一种是函数，一种是数组，如果是函数，包装成数组返回，如果是数组，直接返回
 * 如果childVal和parentVal都存在，则直接使用concat进行合并并返回合并后的结果
 */
function mergeHook(
  parentVal: ?Array<Function>, // parentVal存在则一定是函数数组
  childVal: ?Function | ?Array<Function> // childVal存在可能是函数，也可能是函数数组
): ?Array<Function> { // 返回值是函数数组
  return childVal
    ? parentVal
      ? parentVal.concat(childVal)
      : Array.isArray(childVal)
        ? childVal
        : [childVal]
    : parentVal
}
// 生命周期钩子的合并策略都是一样的
LIFECYCLE_HOOKS.forEach(hook => {
  strats[hook] = mergeHook
})

/**
 * Assets
 *
 * When a vm is present (instance creation), we need to do
 * a three-way merge between constructor options, instance
 * options and parent options.
 * filter, component, directive的合并策略
 * 返回结果类似于 {childVal上的属性和值，__proto__: parentVal}
 */
function mergeAssets(
  parentVal: ?Object,
  childVal: ?Object,
  vm?: Component,
  key: string
): Object {
  const res = Object.create(parentVal || null)// 创建一个空的对象 对象可以通过__proto__访问到parentVal
  // 此时已经可以通过res访问到parentVal上的属性和方法了
  if (childVal) { 
    process.env.NODE_ENV !== 'production' && assertObjectType(key, childVal, vm) // assertObjectType是一个断言，用于发出警告
    // extend方法用于将childVal上的属性和值浅拷贝到res上，最终返回res
    return extend(res, childVal)
  } else {
    return res
  }
}

ASSET_TYPES.forEach(function (type) {
  strats[type + 's'] = mergeAssets
})

/**
 * Watchers.
 *
 * Watchers hashes should not overwrite one
 * another, so we merge them as arrays.
 * watcher不能被重写，所以用数组来合并它们
 * return数据是这样的 {key1: [parent1, child1], key2: [parent2, child2], ...}
 */
strats.watch = function (
  parentVal: ?Object,
  childVal: ?Object,
  vm?: Component,
  key: string
): ?Object {
  // work around Firefox's Object.prototype.watch...
  // 火狐浏览器Object的原型方法在存在内置的watch函数，因此要对parentVal和childVal做一些处理
  if (parentVal === nativeWatch) parentVal = undefined
  if (childVal === nativeWatch) childVal = undefined
  /* istanbul ignore if */
  if (!childVal) return Object.create(parentVal || null) // 不存在childVal 返回空对象 {__proto__: parentVal}
  // 如果是开发环境，对childVal进行对象断言判断
  if (process.env.NODE_ENV !== 'production') {
    assertObjectType(key, childVal, vm)
  }
  // 如果parentVal不存在, 直接返回childVal
  if (!parentVal) return childVal

  // 上班部分都是对一些特殊情况的处理和判断，后面的是重点逻辑处理
  const ret = {} // 用于储存要返回的数据结果
  extend(ret, parentVal) // 先将parentVal对象上的数据属性值合并到ret上
  // 将parentVal和childVal都放到一个数组里面进行存储
  for (const key in childVal) {
    let parent = ret[key]
    const child = childVal[key]
    if (parent && !Array.isArray(parent)) {
      parent = [parent]
    }
    ret[key] = parent
      ? parent.concat(child)
      : Array.isArray(child) ? child : [child]
  }
  return ret
}

/**
 * Other object hashes.
 * props、methods、inject、computed等属性的合并策略, 返回值对象
 */
strats.props =
  strats.methods =
  strats.inject =
  strats.computed = function (
    parentVal: ?Object,
    childVal: ?Object,
    vm?: Component,
    key: string
): ?Object {
    // 开发环境下，对childVal进行对象断言
    if (childVal && process.env.NODE_ENV !== 'production') {
      assertObjectType(key, childVal, vm)
    }
    if (!parentVal) return childVal // 如果parentVal不存在，返回childVal
    const ret = Object.create(null) // 创建一个绝对的空对象ret，
    extend(ret, parentVal) // 将parentVal上的属性值浅拷贝到ret上
    if (childVal) extend(ret, childVal) // 将childVal上的属性值浅拷贝到ret上
    return ret // 将ret作为结果返回
  }
strats.provide = mergeDataOrFn // provide的合并策略 实际和data的合并策略是一样的

/**
 * Default strategy.
 * // 其他属性的合并策略，其实就是有childVal则返回childVal，无则返回parentVal
 */
const defaultStrat = function (parentVal: any, childVal: any): any {
  return childVal === undefined
    ? parentVal
    : childVal
}

/**
 * Validate component names
 * 校验options.components对象中的组件名是否符合规范并且不是内置标签和保留标签，如果不符合规范，则发出警告
 */
function checkComponents(options: Object) {
  for (const key in options.components) {
    validateComponentName(key)
  }
}

export function validateComponentName(name: string) {
  if (!/^[a-zA-Z][\w-]*$/.test(name)) {
    warn(
      'Invalid component name: "' + name + '". Component names ' +
      'can only contain alphanumeric characters and the hyphen, ' +
      'and must start with a letter.'
    )
  }
  if (isBuiltInTag(name) || config.isReservedTag(name)) {
    warn(
      'Do not use built-in or reserved HTML elements as component ' +
      'id: ' + name
    )
  }
}

/**
 * Ensure all props option syntax are normalized into the
 * Object-based format.
 */
// 标准化props，也就是将props全部转化为 
/**
 * props: {
 *  propsA: {type: null},
 *  propsB: {type: value}
 * }
 * 
 */
function normalizeProps(options: Object, vm: ?Component) {
  const props = options.props
  if (!props) return
  const res = {}
  let i, val, name
  if (Array.isArray(props)) {
    i = props.length
    while (i--) {
      val = props[i]
      if (typeof val === 'string') {
        name = camelize(val)
        res[name] = { type: null }
      }
    }
  } else if (isPlainObject(props)) {
    for (const key in props) {
      val = props[key] // val其实就是属性的类型 比如Array String 等
      name = camelize(key)
      res[name] = isPlainObject(val)
        ? val
        : { type: val }
    }
  }
  options.props = res
}

/**
 * Normalize all injections into Object-based format
 * 标准化options.inject属性,标准化格式为
 * inject: {
 *   injectA: { from: value},
 *   injectB: { from: key, ...value},
 *   injectC: { from: valuue }
 * }
 */
function normalizeInject(options: Object, vm: ?Component) {
  const inject = options.inject
  if (!inject) return
  const normalized = options.inject = {}
  if (Array.isArray(inject)) {
    for (let i = 0; i < inject.length; i++) {
      normalized[inject[i]] = { from: inject[i] }
    }
  } else if (isPlainObject(inject)) {
    for (const key in inject) {
      const val = inject[key]
      normalized[key] = isPlainObject(val)
        ? extend({ from: key }, val)
        : { from: val }
    }
  } else if (process.env.NODE_ENV !== 'production') {
    warn(
      `Invalid value for option "inject": expected an Array or an Object, ` +
      `but got ${toRawType(inject)}.`,
      vm
    )
  }
}

/**
 * Normalize raw function directives into object format.
 * 标准化options.directives格式，标准化格式为
 * directives: {
 *   directiveA: {bind: def, update: def} def为函数类型
 * }
 */
function normalizeDirectives(options: Object) {
  const dirs = options.directives
  if (dirs) {
    for (const key in dirs) {
      const def = dirs[key]
      if (typeof def === 'function') {
        dirs[key] = { bind: def, update: def }
      }
    }
  }
}

function assertObjectType(name: string, value: any, vm: ?Component) {
  if (!isPlainObject(value)) {
    warn(
      `Invalid value for option "${name}": expected an Object, ` +
      `but got ${toRawType(value)}.`,
      vm
    )
  }
}

/**
 * Merge two option objects into a new one.
 * Core utility used in both instantiation and inheritance.
 */
export function mergeOptions(
  parent: Object, // Vue.options
  child: Object, // vm.options
  vm?: Component // vm
): Object {

  if (typeof child === 'function') {
    child = child.options
  }

  normalizeProps(child, vm) // 将vm.options.props转化为标准化的格式
  normalizeInject(child, vm) // 将vm.options.inject转化为标准化的格式
  normalizeDirectives(child) // 将vm.options.directives转化为标准化的格式
  // 实际为vm.options.extends  处理extends属性，用来扩展组件，类似于mixins
  const extendsFrom = child.extends 
  if (extendsFrom) {
    parent = mergeOptions(parent, extendsFrom, vm) // 将child.extends上的属性扩展到parent上
  }
 // 实际为vm.options.mixins  将mixins扩展   将child.mixins上的属性扩展到parent上
  if (child.mixins) { 
    for (let i = 0, l = child.mixins.length; i < l; i++) {
      parent = mergeOptions(parent, child.mixins[i], vm)
    }
  }
  // 合并后的数据将全部放入options对象中
  const options = {}
  let key
  // starts是一个战略性的字段集合，通过便利parent和child上的key,将strats上的字段集合全部添加到options上
  // parent和child实际上是告诉strats，需要将哪些数据添加到options上
  // 所以这个地方的重点在于，strats上做了什么
  for (key in parent) {
    mergeField(key) 
  }
  for (key in child) {
    if (!hasOwn(parent, key)) {
      mergeField(key)
    }
  }
  function mergeField(key) {
    const strat = strats[key] || defaultStrat // strat战略的
    options[key] = strat(parent[key], child[key], vm, key)
  }
  return options
}

/**
 * Resolve an asset.
 * This function is used because child instances need access
 * to assets defined in its ancestor chain.
 */
export function resolveAsset(
  options: Object,
  type: string,
  id: string,
  warnMissing?: boolean
): any {
  /* istanbul ignore if */
  if (typeof id !== 'string') {
    return
  }
  const assets = options[type]
  // check local registration variations first
  if (hasOwn(assets, id)) return assets[id]
  const camelizedId = camelize(id)
  if (hasOwn(assets, camelizedId)) return assets[camelizedId]
  const PascalCaseId = capitalize(camelizedId)
  if (hasOwn(assets, PascalCaseId)) return assets[PascalCaseId]
  // fallback to prototype chain
  const res = assets[id] || assets[camelizedId] || assets[PascalCaseId]
  if (process.env.NODE_ENV !== 'production' && warnMissing && !res) {
    warn(
      'Failed to resolve ' + type.slice(0, -1) + ': ' + id,
      options
    )
  }
  return res
}
