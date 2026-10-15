/**
 * 前端埋点调度器（与 DOM 解耦，便于单测）。
 *
 * 旧实现在 pathname 变化时用 `clearTimeout` 取消上一个 500ms 定时器，若用户在一次
 * 页面停留不足 500ms 就跳转，上一页事件会被直接丢弃（漏报）。
 *
 * 这里的语义是「不丢页 + 去重」：
 *   1. 每次 visit 先把上一个尚未发送的页面立即冲刷出去，再调度当前页面；
 *   2. 同一路径在 minRepeatMs 内重复触发只发送一次，规避严格模式 / 重复渲染的重复上报；
 *   3. 页面卸载（pagehide/visibilitychange）时 flush 待发送页面。
 *
 * 定时器与时钟通过 deps 注入，测试里可替换成假实现。
 */
export interface PageVisit {
  /** 用于去重的路径（通常是 pathname）。 */
  path: string
  /** 真正发送时才构建负载（此时 document.title 已稳定）。 */
  build: () => Record<string, unknown>
}

export interface VisitSchedulerDeps {
  /** 实际发送一个已构建好的负载。 */
  emit: (payload: Record<string, unknown>) => void
  /** 上报前的小延迟（毫秒），用于等 document.title 稳定。 */
  delayMs: number
  /** 同一路径在该时间窗内重复触发只发一次。 */
  minRepeatMs: number
  now: () => number
  setTimeout: (fn: () => void, ms: number) => unknown
  clearTimeout: (id: unknown) => void
}

export interface VisitScheduler {
  /** 记录一次页面访问：先冲刷上一个未发送页面，再调度当前页面。 */
  visit: (item: PageVisit) => void
  /** 立即发送待发送的页面。 */
  flush: () => void
  /** 丢弃待发送的页面且不发送。 */
  reset: () => void
  pendingPath: () => string | null
}

export function createVisitScheduler(deps: VisitSchedulerDeps): VisitScheduler {
  let pending: PageVisit | null = null
  let timer: unknown = null
  let lastPath: string | null = null
  let lastAt = Number.NEGATIVE_INFINITY

  const clearTimer = () => {
    if (timer !== null) {
      deps.clearTimeout(timer)
      timer = null
    }
  }

  const emitNow = (item: PageVisit) => {
    const at = deps.now()
    if (item.path === lastPath && at - lastAt < deps.minRepeatMs) return
    lastPath = item.path
    lastAt = at
    deps.emit(item.build())
  }

  const flush = () => {
    if (!pending) return
    const item = pending
    pending = null
    clearTimer()
    emitNow(item)
  }

  const reset = () => {
    pending = null
    clearTimer()
  }

  const visit = (item: PageVisit) => {
    flush()
    pending = item
    clearTimer()
    timer = deps.setTimeout(() => {
      timer = null
      flush()
    }, deps.delayMs)
  }

  return { visit, flush, reset, pendingPath: () => pending?.path ?? null }
}
