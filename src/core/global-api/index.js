/* @flow */

import config from '../config'
import { initUse } from './use'
import { initMixin } from './mixin'
import { initExtend } from './extend'
import { initAssetRegisters } from './assets'
import { set, del } from '../observer/index'
import { ASSET_TYPES } from 'shared/constants'
import builtInComponents from '../components/index'

import {
  warn,
  extend,
  nextTick,
  mergeOptions,
  defineReactive
} from '../util/index'

export function initGlobalAPI(Vue: GlobalAPI) {
  // config
  const configDef = {}
  configDef.get = () => config
  Object.defineProperty(Vue, 'config', configDef)

  // exposed util methods.
  // NOTE: these are not considered part of the public API - avoid relying on
  // them unless you are aware of the risk.
  Vue.util = {
    warn,
    extend,
    mergeOptions,
    defineReactive
  }

  Vue.set = set
  Vue.delete = del
  Vue.nextTick = nextTick

  Vue.options = Object.create(null) // Vue.options = {};
  // ASSET_TYPES = ['component', 'directive', 'filter'];
  ASSET_TYPES.forEach(type => {
    Vue.options[type + 's'] = Object.create(null)
  })
  // 此时Vue.options
  // Vue.options = {
  //   components: {},
  //   directives: {},
  //   filters: {}
  // }

  // this is used to identify the "base" constructor to extend all plain-object
  // components with in Weex's multi-instance scenarios.
  // Vue.options._base指向Vue构造函数
  Vue.options._base = Vue

  extend(Vue.options.components, builtInComponents) // 向Vue.options.components中扩展内置组件 目前内置组件只有Keep-Alive

  /**
   * 到这一步，Vue.options = {
   *  components: {
   *   'keep-alive': KeepAlive 
   *  },
   *  directives: {},
   *  filters: {},
   *  _base: Vue
   * }
   */

  initUse(Vue)
  initMixin(Vue)
  initExtend(Vue)
  initAssetRegisters(Vue)
}
