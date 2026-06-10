import { useEffect, useRef, useState } from 'react'
import { Howl } from 'howler'
import { MusicSettings, pickTrack } from './music'

const CROSSFADE_MS = 2500
const MOOD_CHANGE_DEBOUNCE_MS = 2000
const FADE_STEP_MS = CROSSFADE_MS / 50

interface UseMoodPlayerState {
  isLoading: boolean
  currentTrackMood: string | null
}

export function useMoodPlayer(currentEmotion: string, settings: MusicSettings) {
  const [state, setState] = useState<UseMoodPlayerState>({
    isLoading: false,
    currentTrackMood: null,
  })

  const currentHowlRef = useRef<Howl | null>(null)
  const nextHowlRef = useRef<Howl | null>(null)
  const lastPlayedTrackRef = useRef<string>('')
  const moodChangeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const fadeIntervalsRef = useRef<Set<ReturnType<typeof setInterval>>>(new Set())
  const lastMoodRef = useRef(currentEmotion)
  const settingsRef = useRef(settings)
  settingsRef.current = settings

  const cleanup = (howl: Howl | null) => {
    if (howl) {
      howl.stop()
      howl.unload()
    }
  }

  const trackInterval = (id: ReturnType<typeof setInterval>) => {
    fadeIntervalsRef.current.add(id)
  }

  const clearTrackedInterval = (id: ReturnType<typeof setInterval>) => {
    clearInterval(id)
    fadeIntervalsRef.current.delete(id)
  }

  const startCrossfade = (newTrack: string, newMood: string) => {
    // Discard any in-flight load for a previous mood change
    if (nextHowlRef.current) {
      cleanup(nextHowlRef.current)
      nextHowlRef.current = null
    }

    setState({ isLoading: true, currentTrackMood: newMood })

    const newHowl = new Howl({
      src: newTrack,
      loop: true,
      volume: 0,
      preload: true,
    })

    nextHowlRef.current = newHowl

    newHowl.on('load', () => {
      // If superseded by a newer crossfade while loading, discard silently
      if (nextHowlRef.current !== newHowl) {
        cleanup(newHowl)
        return
      }

      const oldHowl = currentHowlRef.current

      newHowl.play()

      const fadeInInterval: ReturnType<typeof setInterval> = setInterval(() => {
        const current = newHowl.volume()
        const target = settingsRef.current.muted ? 0 : settingsRef.current.volume
        if (current < target) {
          newHowl.volume(Math.min(current + 0.05, target))
        } else {
          clearTrackedInterval(fadeInInterval)
        }
      }, FADE_STEP_MS)
      trackInterval(fadeInInterval)

      if (oldHowl) {
        const fadeOutInterval: ReturnType<typeof setInterval> = setInterval(() => {
          const current = oldHowl.volume()
          if (current > 0) {
            oldHowl.volume(Math.max(current - 0.05, 0))
          } else {
            clearTrackedInterval(fadeOutInterval)
            cleanup(oldHowl)
          }
        }, FADE_STEP_MS)
        trackInterval(fadeOutInterval)
      }

      currentHowlRef.current = newHowl
      nextHowlRef.current = null
      lastPlayedTrackRef.current = newTrack
      setState({ isLoading: false, currentTrackMood: newMood })
    })

    newHowl.on('loaderror', () => {
      console.error(`Failed to load track: ${newTrack}`)
      if (nextHowlRef.current === newHowl) {
        nextHowlRef.current = null
      }
      setState({ isLoading: false, currentTrackMood: null })
      cleanup(newHowl)
    })
  }

  const setVolume = (vol: number) => {
    if (currentHowlRef.current) {
      currentHowlRef.current.volume(vol)
    }
  }

  const setMuted = (muted: boolean) => {
    if (currentHowlRef.current) {
      currentHowlRef.current.volume(muted ? 0 : settingsRef.current.volume)
    }
  }

  // Mood-driven playback: load/crossfade tracks as the emotion changes
  useEffect(() => {
    if (!settings.enabled) {
      if (currentHowlRef.current?.playing()) {
        currentHowlRef.current.pause()
      }
      return
    }

    if (moodChangeTimeoutRef.current) {
      clearTimeout(moodChangeTimeoutRef.current)
      moodChangeTimeoutRef.current = null
    }

    // Nothing loaded yet (first enable, or reader just opened) — start immediately
    if (!currentHowlRef.current && !nextHowlRef.current) {
      lastMoodRef.current = currentEmotion
      const track = pickTrack(currentEmotion, lastPlayedTrackRef.current)
      startCrossfade(track, currentEmotion)
      return
    }

    // Mood unchanged — just make sure playback is (re)started if it was paused
    if (currentEmotion === lastMoodRef.current) {
      if (currentHowlRef.current && !currentHowlRef.current.playing()) {
        currentHowlRef.current.play()
      }
      return
    }

    // Mood changed — debounce briefly to avoid jitter near mood boundaries
    lastMoodRef.current = currentEmotion
    moodChangeTimeoutRef.current = setTimeout(() => {
      if (!settingsRef.current.enabled) return
      const track = pickTrack(currentEmotion, lastPlayedTrackRef.current)
      startCrossfade(track, currentEmotion)
    }, MOOD_CHANGE_DEBOUNCE_MS)
  }, [currentEmotion, settings.enabled]) // eslint-disable-line react-hooks/exhaustive-deps

  // Volume / mute changes apply live to whatever is currently playing
  useEffect(() => {
    if (settings.muted || settings.volume === 0) {
      setMuted(true)
    } else {
      setMuted(false)
      setVolume(settings.volume)
    }
  }, [settings.volume, settings.muted]) // eslint-disable-line react-hooks/exhaustive-deps

  // Teardown on unmount
  useEffect(() => {
    return () => {
      if (moodChangeTimeoutRef.current) {
        clearTimeout(moodChangeTimeoutRef.current)
      }
      fadeIntervalsRef.current.forEach((id) => clearInterval(id))
      fadeIntervalsRef.current.clear()
      cleanup(currentHowlRef.current)
      cleanup(nextHowlRef.current)
    }
  }, [])

  return {
    isLoading: state.isLoading,
    currentTrackMood: state.currentTrackMood,
  }
}
