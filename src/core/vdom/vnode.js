/* @flow */
// 注释节点会包含text/isComment两个有效属性
// 文本节点只有text一个有效属性
// 克隆节点是将现有节点的属性复制到新节点中，以静态节点为例，静态节点的内容不会改变，那么在更新时就不必执行渲染函数来获取vnode，
// 只需将现有的vnode克隆一份即可，这样可以在一定程度上提升性能，可以通过cloneNode这个函数来克隆一个vnode
export default class VNode {
  tag: string | void; // 节点类型 div/img/a/span/p...
  data: VNodeData | void; // 包含了一些节点上的数据 比如attrs,class,style等
  children: ?Array<VNode>; // 该虚拟节点的子节点
  text: string | void; // 如果该节点是文本节点，text是文本内容
  elm: Node | void; // 该虚拟节点渲染出的真实dom
  ns: string | void;
  context: Component | void; // rendered in this component's scope // 它是当前组件的vue实例
  key: string | number | void; // 该虚拟节点的key，类似于id
  componentOptions: VNodeComponentOptions | void; // 组件节点的选项参数
  componentInstance: Component | void; // component instance 组件的vue实例 组件节点的tag值以'vue-component-'开头
  parent: VNode | void; // component placeholder node

  // strictly internal
  raw: boolean; // contains raw HTML? (server only)
  isStatic: boolean; // hoisted static node
  isRootInsert: boolean; // necessary for enter transition check
  isComment: boolean; // empty comment placeholder? 表示该节点是否是一个注释节点
  isCloned: boolean; // is a cloned node? 表示该节点是否是一个克隆节点
  isOnce: boolean; // is a v-once node?
  asyncFactory: Function | void; // async component factory function
  asyncMeta: Object | void;
  isAsyncPlaceholder: boolean;
  ssrContext: Object | void;
  fnContext: Component | void; // real context vm for functional nodes 函数组件的实例
  fnOptions: ?ComponentOptions; // for SSR caching 函数组件的选项
  fnScopeId: ?string; // functional scope id support

  constructor (
    tag?: string,
    data?: VNodeData,
    children?: ?Array<VNode>,
    text?: string,
    elm?: Node,
    context?: Component,
    componentOptions?: VNodeComponentOptions,
    asyncFactory?: Function
  ) {
    this.tag = tag
    this.data = data
    this.children = children
    this.text = text
    this.elm = elm
    this.ns = undefined
    this.context = context
    this.fnContext = undefined
    this.fnOptions = undefined
    this.fnScopeId = undefined
    this.key = data && data.key
    this.componentOptions = componentOptions
    this.componentInstance = undefined
    this.parent = undefined
    this.raw = false
    this.isStatic = false
    this.isRootInsert = true
    this.isComment = false
    this.isCloned = false
    this.isOnce = false
    this.asyncFactory = asyncFactory
    this.asyncMeta = undefined
    this.isAsyncPlaceholder = false
  }

  // DEPRECATED: alias for componentInstance for backwards compat.
  /* istanbul ignore next */
  get child (): Component | void {
    return this.componentInstance
  }
}
// 创建注释vnode
export const createEmptyVNode = (text: string = '') => {
  const node = new VNode()
  node.text = text
  node.isComment = true
  return node
}
// 创建文本vnode
export function createTextVNode (val: string | number) {
  return new VNode(undefined, undefined, undefined, String(val))
}

// optimized shallow clone
// used for static nodes and slot nodes because they may be reused across
// multiple renders, cloning them avoids errors when DOM manipulations rely
// on their elm reference.
export function cloneVNode (vnode: VNode): VNode {
  const cloned = new VNode(
    vnode.tag,
    vnode.data,
    vnode.children,
    vnode.text,
    vnode.elm,
    vnode.context,
    vnode.componentOptions,
    vnode.asyncFactory
  )
  cloned.ns = vnode.ns
  cloned.isStatic = vnode.isStatic
  cloned.key = vnode.key
  cloned.isComment = vnode.isComment
  cloned.fnContext = vnode.fnContext
  cloned.fnOptions = vnode.fnOptions
  cloned.fnScopeId = vnode.fnScopeId
  cloned.asyncMeta = vnode.asyncMeta
  cloned.isCloned = true // 克隆节点的isCloned属性值为true
  return cloned
}
