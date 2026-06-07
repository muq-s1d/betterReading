import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import ReaderChunk from '@/components/ReaderChunk'

type IOCallback = (entries: Partial<IntersectionObserverEntry>[]) => void

let lastCallback: IOCallback | null = null
const observeMock = vi.fn()
const disconnectMock = vi.fn()

class MockIntersectionObserver {
  constructor(cb: IOCallback) {
    lastCallback = cb
  }
  observe = observeMock
  disconnect = disconnectMock
}

beforeEach(() => {
  lastCallback = null
  vi.stubGlobal('IntersectionObserver', MockIntersectionObserver)
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.clearAllMocks()
})

describe('ReaderChunk', () => {
  it('renders the chunk text', () => {
    const onVisible = vi.fn()
    render(<ReaderChunk chunkIndex={0} text="She ran through the forest." onVisible={onVisible} />)
    expect(screen.getByText('She ran through the forest.')).toBeInTheDocument()
  })

  it('attaches an IntersectionObserver on mount', () => {
    const onVisible = vi.fn()
    render(<ReaderChunk chunkIndex={3} text="Text content." onVisible={onVisible} />)
    expect(observeMock).toHaveBeenCalledTimes(1)
  })

  it('calls onVisible with correct index when intersecting', async () => {
    const onVisible = vi.fn()
    render(<ReaderChunk chunkIndex={7} text="Some text." onVisible={onVisible} />)
    await act(async () => {
      lastCallback!([{ isIntersecting: true } as IntersectionObserverEntry])
    })
    expect(onVisible).toHaveBeenCalledWith(7)
  })

  it('does not call onVisible when not intersecting', async () => {
    const onVisible = vi.fn()
    render(<ReaderChunk chunkIndex={2} text="Some text." onVisible={onVisible} />)
    await act(async () => {
      lastCallback!([{ isIntersecting: false } as IntersectionObserverEntry])
    })
    expect(onVisible).not.toHaveBeenCalled()
  })
})
