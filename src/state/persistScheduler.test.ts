import { afterEach, describe, expect, it, vi } from 'vitest'
import { createDebouncedWriter } from './persistScheduler'

describe('debounced persistence', () => {
  afterEach(() => vi.useRealTimers())

  it('coalesces rapid state changes into the latest write', () => {
    vi.useFakeTimers()
    const write = vi.fn()
    const scheduler = createDebouncedWriter(write, 120)

    scheduler.schedule('first')
    scheduler.schedule('latest')
    vi.advanceTimersByTime(119)
    expect(write).not.toHaveBeenCalled()

    vi.advanceTimersByTime(1)
    expect(write).toHaveBeenCalledOnce()
    expect(write).toHaveBeenCalledWith('latest')
  })

  it('can cancel a pending write', () => {
    vi.useFakeTimers()
    const write = vi.fn()
    const scheduler = createDebouncedWriter(write, 120)

    scheduler.schedule('pending')
    scheduler.cancel()
    vi.runAllTimers()

    expect(write).not.toHaveBeenCalled()
  })

  it('flushes the latest pending value immediately', () => {
    vi.useFakeTimers()
    const write = vi.fn()
    const scheduler = createDebouncedWriter(write, 120)

    scheduler.schedule('latest')
    scheduler.flush()

    expect(write).toHaveBeenCalledOnce()
    expect(write).toHaveBeenCalledWith('latest')
    vi.runAllTimers()
    expect(write).toHaveBeenCalledOnce()
  })
})
