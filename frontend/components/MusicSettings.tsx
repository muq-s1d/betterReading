'use client'

import { useEffect, useRef, useState } from 'react'
import { MusicSettings } from '@/lib/music'

interface Props {
  settings: MusicSettings
  onChange: (s: MusicSettings) => void
  onClose: () => void
}

export default function MusicSettingsPanel({ settings, onChange, onClose }: Props) {
  const panelRef = useRef<HTMLDivElement>(null)
  const warningRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    function onPointer(e: MouseEvent) {
      if (warningRef.current?.contains(e.target as Node)) return
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onPointer)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('mousedown', onPointer)
    }
  }, [onClose])

  const volumePercent = Math.round(settings.volume * 100)
  const [warningDismissed, setWarningDismissed] = useState(false)

  useEffect(() => {
    if (volumePercent <= 75) setWarningDismissed(false)
  }, [volumePercent <= 75]) // eslint-disable-line react-hooks/exhaustive-deps

  const showVolumeWarning = volumePercent > 75 && !warningDismissed

  return (
    <div className="rs-backdrop">
      <div ref={panelRef} className="rs-panel" role="dialog" aria-label="Music settings">
        <div className="rs-header">
          <span className="rs-title">Music settings</span>
          <button className="rs-close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <section className="rs-section">
          <p className="rs-label">Playback</p>
          <div className="rs-music-controls">
            <button
              className={`rs-music-btn${settings.enabled ? ' active' : ''}`}
              onClick={() => onChange({ ...settings, enabled: !settings.enabled })}
              title={settings.enabled ? 'Pause music' : 'Play music'}
            >
              {settings.enabled ? '⏸' : '▶'}
            </button>
            <button
              className={`rs-music-btn${settings.muted ? ' active' : ''}`}
              onClick={() => onChange({ ...settings, muted: !settings.muted })}
              title={settings.muted ? 'Unmute' : 'Mute'}
            >
              {settings.muted ? '🔇' : '🔊'}
            </button>
          </div>
        </section>

        <section className="rs-section">
          <p className="rs-label">Volume — {volumePercent}%</p>
          <input
            type="range"
            min={0}
            max={100}
            value={volumePercent}
            onChange={(e) => onChange({ ...settings, volume: Number(e.target.value) / 100 })}
            className="rs-slider"
            disabled={!settings.enabled}
          />
          <div className="rs-slider-labels">
            <span>Silent</span>
            <span>Full</span>
          </div>
        </section>
      </div>

      {showVolumeWarning && (
        <div className="rs-backdrop rs-warning-backdrop">
          <div ref={warningRef} className="rs-warning-modal" role="alertdialog" aria-label="Volume warning">
            <p className="rs-warning-title">Volume is quite high</p>
            <p className="rs-warning-text">
              Music above 75% can pull focus away from your reading. Consider lowering it for a more
              balanced background.
            </p>
            <button className="rs-warning-dismiss" onClick={() => setWarningDismissed(true)}>
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
