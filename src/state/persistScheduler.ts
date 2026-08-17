export interface DebouncedWriter<T> {
  schedule(value: T): void
  cancel(): void
  flush(): void
}

export function createDebouncedWriter<T>(write: (value: T) => void, delay: number): DebouncedWriter<T> {
  let timer: ReturnType<typeof setTimeout> | null = null
  let pending: T | undefined

  const cancel = () => {
    if (timer !== null) clearTimeout(timer)
    timer = null
  }

  return {
    schedule(value) {
      pending = value
      cancel()
      timer = setTimeout(() => {
        timer = null
        const valueToWrite = pending
        pending = undefined
        if (valueToWrite !== undefined) write(valueToWrite)
      }, delay)
    },
    cancel() {
      cancel()
      pending = undefined
    },
    flush() {
      const valueToWrite = pending
      cancel()
      pending = undefined
      if (valueToWrite !== undefined) write(valueToWrite)
    },
  }
}
