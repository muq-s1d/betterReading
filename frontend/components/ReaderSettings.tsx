'use client'

import { useEffect, useRef } from 'react'
import { ReaderSettings, PRESETS, FONT_OPTIONS } from '@/lib/reader-settings'

interface Props {
  settings: ReaderSettings
  onChange: (s: ReaderSettings) => void
  onClose: () => void
}

export default function ReaderSettingsPanel({ settings, onChange, onClose }: Props) {
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    function onPointer(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onPointer)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('mousedown', onPointer)
    }
  }, [onClose])

  return (
    <div className="rs-backdrop">
      <div ref={panelRef} className="rs-panel" role="dialog" aria-label="Reader settings">
        <div className="rs-header">
          <span className="rs-title">Reading settings</span>
          <button className="rs-close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <section className="rs-section">
          <p className="rs-label">Theme</p>
          <div className="rs-presets">
            {PRESETS.map((p) => (
              <button
                key={p.name}
                className="rs-preset"
                style={{
                  background: p.bg,
                  color: p.text,
                  outline: settings.bg === p.bg && settings.text === p.text
                    ? '2px solid var(--text-secondary)'
                    : 'none',
                  outlineOffset: '2px',
                }}
                onClick={() => onChange({ ...settings, bg: p.bg, text: p.text })}
                title={p.name}
                aria-label={p.name}
              >
                Aa
              </button>
            ))}
          </div>
        </section>

        <section className="rs-section">
          <p className="rs-label">Colors</p>
          <div className="rs-row">
            <label className="rs-color-label">
              Background
              <input
                type="color"
                value={settings.bg}
                onChange={(e) => onChange({ ...settings, bg: e.target.value })}
                className="rs-color-input"
              />
            </label>
            <label className="rs-color-label">
              Text
              <input
                type="color"
                value={settings.text}
                onChange={(e) => onChange({ ...settings, text: e.target.value })}
                className="rs-color-input"
              />
            </label>
          </div>
        </section>

        <section className="rs-section">
          <p className="rs-label">Font size — {settings.fontSize}px</p>
          <input
            type="range"
            min={14}
            max={24}
            value={settings.fontSize}
            onChange={(e) => onChange({ ...settings, fontSize: Number(e.target.value) })}
            className="rs-slider"
          />
          <div className="rs-slider-labels">
            <span style={{ fontSize: '0.7rem' }}>A</span>
            <span style={{ fontSize: '1.05rem' }}>A</span>
          </div>
        </section>

        <section className="rs-section">
          <p className="rs-label">Line width — {settings.contentWidth}px</p>
          <input
            type="range"
            min={400}
            max={960}
            step={20}
            value={settings.contentWidth}
            onChange={(e) => onChange({ ...settings, contentWidth: Number(e.target.value) })}
            className="rs-slider"
          />
          <div className="rs-slider-labels">
            <span>Narrow</span>
            <span>Wide</span>
          </div>
        </section>

        <section className="rs-section">
          <p className="rs-label">Font</p>
          <div className="rs-fonts">
            {FONT_OPTIONS.map((f) => (
              <button
                key={f.key}
                className={`rs-font-btn${settings.fontFamily === f.key ? ' active' : ''}`}
                style={{ fontFamily: f.cssVar }}
                onClick={() => onChange({ ...settings, fontFamily: f.key })}
              >
                {f.label}
              </button>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
