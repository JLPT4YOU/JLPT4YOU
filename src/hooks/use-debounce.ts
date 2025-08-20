import { useEffect, useMemo, useRef } from 'react'

export function useDebounce<T>(value: T, delay = 300): T {
  const timeoutRef = useRef<number | null>(null)
  const debounced = useMemo(() => value, [value])

  useEffect(() => {
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current)
    const id = window.setTimeout(() => {
      // noop; the memoized value is read after the delay by rerender
    }, delay)
    timeoutRef.current = id
    return () => {
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current)
    }
  }, [value, delay])

  return debounced
}

export function debounceFn<F extends (...args: any[]) => void>(fn: F, delay = 300) {
  let t: any
  return (...args: Parameters<F>) => {
    clearTimeout(t)
    t = setTimeout(() => fn(...args), delay)
  }
}

