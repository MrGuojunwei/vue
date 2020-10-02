export const SSR_ATTR = 'data-server-rendered'

export const ASSET_TYPES = [
  'component',
  'directive',
  'filter'
]

// 生命周期钩子
export const LIFECYCLE_HOOKS = [
  'beforeCreate',
  'created',
  'beforeMount',
  'mounted',
  'beforeUpdate',
  'updated',
  'beforeDestroy',
  'destroyed',
  // 下面三个比较特殊
  'activated',
  'deactivated',
  'errorCaptured'
]
