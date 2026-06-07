import { describe, it, expect, vi } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import MoodBadge from '@/components/MoodBadge'

describe('MoodBadge', () => {
  it('renders the emotion label', () => {
    render(<MoodBadge emotion="Joy" />)
    expect(screen.getByText('Joy')).toBeInTheDocument()
  })

  it('renders Neutral as default fallback text', () => {
    render(<MoodBadge emotion="Neutral" />)
    expect(screen.getByText('Neutral')).toBeInTheDocument()
  })

  it('shows a colored dot element', () => {
    const { container } = render(<MoodBadge emotion="Fear" />)
    const dot = container.querySelector('.mood-badge-dot')
    expect(dot).toBeTruthy()
  })

  it('dot has inline style with background-color for known emotion', () => {
    const { container } = render(<MoodBadge emotion="Joy" />)
    const dot = container.querySelector('.mood-badge-dot') as HTMLElement
    expect(dot.style.backgroundColor).toBeTruthy()
  })

  it('transitions emotion label after prop change', async () => {
    vi.useFakeTimers()
    const { rerender } = render(<MoodBadge emotion="Joy" />)
    expect(screen.getByText('Joy')).toBeInTheDocument()

    rerender(<MoodBadge emotion="Fear" />)
    // After the fade delay, label should update
    await act(async () => { vi.advanceTimersByTime(250) })
    expect(screen.getByText('Fear')).toBeInTheDocument()
    vi.useRealTimers()
  })
})
