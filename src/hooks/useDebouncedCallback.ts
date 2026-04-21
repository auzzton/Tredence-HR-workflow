import { useCallback, useEffect, useMemo, useRef } from 'react'

export type DebouncedCallback<A extends unknown[]> = {
  (...args: A): void
  /** Cancel any pending invocation. Call before a synchronous store flush
   *  to prevent a stale in-flight write from overwriting the flush result. */
  cancel(): void
}

/**
 * Returns a stable-identity callback that delays invocation of `fn` until
 * `delay` ms have passed since the last call. Used to batch form input
 * writeback to the store — each keystroke resets the timer, and only the
 * last value lands in the store after the user pauses typing.
 *
 * The latest `fn` is held in a ref so closures always see current state
 * without the returned callback identity changing per render (which would
 * invalidate any `useEffect` dependency arrays that reference it).
 *
 * The pending timer is cleared on unmount so late writebacks cannot land
 * after the component (or its selected node) has gone away.
 */
export function useDebouncedCallback<A extends unknown[]>(
  fn: (...args: A) => void,
  delay: number,
): DebouncedCallback<A> {
  const fnRef = useRef(fn)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    fnRef.current = fn
  })

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  const cancel = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [])

  return useMemo(() => {
    function debounced(...args: A) {
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => fnRef.current(...args), delay)
    }
    debounced.cancel = cancel
    return debounced
  }, [delay, cancel])
}
