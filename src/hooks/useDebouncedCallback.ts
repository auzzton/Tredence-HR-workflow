import { useCallback, useEffect, useRef } from 'react'

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
): (...args: A) => void {
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

  return useCallback(
    (...args: A) => {
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => {
        fnRef.current(...args)
      }, delay)
    },
    [delay],
  )
}
