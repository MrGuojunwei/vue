import { initMixin } from './init'
import { stateMixin } from './state'
import { renderMixin } from './render'
import { eventsMixin } from './events'
import { lifecycleMixin } from './lifecycle'
import { warn } from '../util/index'

// vue实例
function Vue(options) {
  this._init(options)
}

// initMixin 向vue原型添加_init方法
initMixin(Vue)
/**
 * stateMixin
 * 向Vue的原型中添加了$data和$props属性，其中定义了$data和$props的get方法，分别返回vm._data和vm._props;
 * 另外向原型中添加了$set、$delete、$watch三个方法
 */
stateMixin(Vue)
/**
 * eventsMixin
 * 向Vue原型中添加了$on、$once、$off、$emit四个方法
 */
eventsMixin(Vue)
/**
 * eventsMixin
 * 向Vue原型中添加了_update、$forceUpdate、$destroy三个方法
 */
lifecycleMixin(Vue)
/**
 * 向Vue原型中添加了render辅助函数，包括
 * target._o = markOnce
 * target._n = toNumber
 * target._s = toString
 * target._l = renderList
 * target._t = renderSlot
 * target._q = looseEqual
 * target._i = looseIndexOf
 * target._m = renderStatic
 * target._f = resolveFilter
 * target._k = checkKeyCodes
 * target._b = bindObjectProps
 * target._v = createTextVNode
 * target._e = createEmptyVNode
 * target._u = resolveScopedSlots
 * target._g = bindObjectListeners
 * 另外向Vue原型中还添加了$nextTick和_render两个方法
 */
renderMixin(Vue)

export default Vue
