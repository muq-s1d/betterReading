import { useEffect, useRef, useState } from 'react'
import { Howl } from 'howler'
import { MOOD_TRACKS, MusicSettings, pickRandomStart, pickTrack, PREFETCH_COUNT } from './music'

const CROSSFADE_MS = 2500
const MOOD_CHANGE_DEBOUNCE_MS = 2000
const FADE_STEP_MS = CROSSFADE_MS / 50
const PRELOAD_CACHE_LIMIT = 4

const DEBUG = process.env.NODE_ENV !== 'production'
const debug = (...args: unknown[]) => {
  if (DEBUG) console.debug('[music]', ...args)
}

interface UseMoodPlayerState {
  isLoading: boolean
  currentTrackMood: string | null
}

export function useMoodPlayer(currentEmotion: string, settings: MusicSettings) {
  const [state, setState] = useState<UseMoodPlayerState>({
    isLoading: false,
    currentTrackMood: null,
  })
  const [autoplayBlocked, setAutoplayBlocked] = useState(false)

  const currentHowlRef = useRef<Howl | null>(null)
  const nextHowlRef = useRef<Howl | null>(null)
  const lastPlayedTrackRef = useRef<string>('')
  const currentTrackSrcRef = useRef<string>('')
  const nextTrackSrcRef = useRef<string>('')
  const preloadCacheRef = useRef<Map<string, Howl>>(new Map())
  const moodChangeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const fadeIntervalsRef = useRef<Set<ReturnType<typeof setInterval>>>(new Set())
  const lastMoodRef = useRef(currentEmotion)
  const settingsRef = useRef(settings)
  settingsRef.current = settings
  const hasInteractedRef = useRef(false)
  const pendingPlaybackRef = useRef<(() => void) | null>(null)

  const cleanup = (howl: Howl | null) => {
    if (howl) {
      // Strip listeners first — unload() can async-fire 'loaderror'/'load'
      // for in-flight requests, and we don't want stale callbacks acting
      // on a Howl instance we've already discarded.
      howl.off()
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

  const preloadTrack = (src: string) => {
    if (preloadCacheRef.current.has(src)) return
    if (currentTrackSrcRef.current === src || nextTrackSrcRef.current === src) return

    if (preloadCacheRef.current.size >= PRELOAD_CACHE_LIMIT) {
      const oldestKey = preloadCacheRef.current.keys().next().value
      if (oldestKey) {
        cleanup(preloadCacheRef.current.get(oldestKey) || null)
        preloadCacheRef.current.delete(oldestKey)
      }
    }

    preloadCacheRef.current.set(src, new Howl({ src, loop: true, volume: 0, preload: true, html5: true }))
  }

  const prefetchUpcoming = (mood: string, exclude: string) => {
    const tracks = MOOD_TRACKS[mood] || MOOD_TRACKS['Neutral']
    tracks
      .filter((t) => t !== exclude)
      .slice(0, PREFETCH_COUNT)
      .forEach(preloadTrack)
  }

  const startCrossfade = (
    newTrack: string,
    newMood: string,
    triedTracks: Set<string> = new Set(),
    neutralFallbackUsed = false
  ) => {
    debug('startCrossfade', newTrack, newMood, 'tried=', [...triedTracks], 'neutralFallback=', neutralFallbackUsed)

    // Discard any in-flight load for a previous mood change
    if (nextHowlRef.current) {
      cleanup(nextHowlRef.current)
      nextHowlRef.current = null
      nextTrackSrcRef.current = ''
    }

    setState({ isLoading: true, currentTrackMood: newMood })

    // Reuse a prefetched instance if we already preloaded this track
    let newHowl = preloadCacheRef.current.get(newTrack)
    if (newHowl) {
      preloadCacheRef.current.delete(newTrack)
    } else {
      newHowl = new Howl({
        src: newTrack,
        loop: true,
        volume: 0,
        preload: true,
        html5: true,
      })
    }

    nextHowlRef.current = newHowl
    nextTrackSrcRef.current = newTrack

    const onReady = () => {
      debug('onReady', newTrack, newMood)

      // If superseded by a newer crossfade while loading, discard silently
      if (nextHowlRef.current !== newHowl) {
        cleanup(newHowl!)
        return
      }

      const oldHowl = currentHowlRef.current

      // Skip the typically-slow intro by starting somewhere in the first 20-40s
      const duration = newHowl!.duration()
      newHowl!.seek(pickRandomStart(duration))

      const beginPlayback = () => {
        newHowl!.play()

        const fadeInInterval: ReturnType<typeof setInterval> = setInterval(() => {
          const current = newHowl!.volume()
          const target = settingsRef.current.muted ? 0 : settingsRef.current.volume
          if (current < target) {
            newHowl!.volume(Math.min(current + 0.05, target))
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
      }

      // On a hard reload, the page has had no user interaction yet and
      // browsers block audio playback until it does. Defer playback (and
      // tell the reader to show a prompt) until the user's first
      // click/tap/keypress, instead of calling .play() now and having it
      // silently fail with no event we can reliably react to.
      if (!hasInteractedRef.current) {
        debug('deferring playback until user interaction', newTrack, newMood)
        setAutoplayBlocked(true)
        pendingPlaybackRef.current = beginPlayback
        if (oldHowl) cleanup(oldHowl)
      } else {
        beginPlayback()
      }

      currentHowlRef.current = newHowl!
      currentTrackSrcRef.current = newTrack
      nextHowlRef.current = null
      nextTrackSrcRef.current = ''
      lastPlayedTrackRef.current = newTrack
      setState({ isLoading: false, currentTrackMood: newMood })

      // Warm up a couple of likely-next tracks for this mood so a future
      // crossfade doesn't have to wait on a cold fetch
      prefetchUpcoming(newMood, newTrack)
    }

    if (newHowl.state() === 'loaded') {
      onReady()
    } else {
      newHowl.once('load', onReady)
    }

    // Fallback: if .play() is somehow still blocked despite a recorded user
    // interaction (rare), at least don't spam the console with an unhandled
    // rejection.
    newHowl.once('playerror', () => {
      debug('playerror', newTrack, newMood)
    })

    newHowl.on('loaderror', () => {
      console.error(`Failed to load track: ${newTrack}`)
      debug('loaderror', newTrack, newMood)
      if (nextHowlRef.current === newHowl) {
        nextHowlRef.current = null
        nextTrackSrcRef.current = ''
      }
      cleanup(newHowl!)

      const updatedTried = new Set(triedTracks)
      updatedTried.add(newTrack)

      const tracks = MOOD_TRACKS[newMood] || MOOD_TRACKS['Neutral']
      const remaining = tracks.filter((t) => !updatedTried.has(t))
      if (remaining.length > 0) {
        const fallback = remaining[Math.floor(Math.random() * remaining.length)]
        startCrossfade(fallback, newMood, updatedTried, neutralFallbackUsed)
        return
      }

      // Every track for this mood has failed — try one Neutral track
      // before giving up entirely.
      if (!neutralFallbackUsed && newMood !== 'Neutral') {
        const neutralTracks = MOOD_TRACKS['Neutral']
        const fallback = neutralTracks[Math.floor(Math.random() * neutralTracks.length)]
        startCrossfade(fallback, newMood, updatedTried, true)
        return
      }

      // All tracks (including Neutral fallback) failed — give up but don't
      // leave the reader stuck waiting for a track that will never load.
      debug('giving up on music for mood', newMood)
      setState({ isLoading: false, currentTrackMood: newMood })
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

  // Track the user's first interaction since this page loaded — needed to
  // know whether .play() is allowed yet (browsers block audio autoplay
  // until the user has interacted with the document, e.g. after a hard
  // reload). Once they interact, run any playback we deferred.
  useEffect(() => {
    if (hasInteractedRef.current) return
    const markInteracted = () => {
      debug('user interacted — resuming any deferred playback')
      hasInteractedRef.current = true
      setAutoplayBlocked(false)
      document.removeEventListener('pointerdown', markInteracted)
      document.removeEventListener('keydown', markInteracted)
      const pending = pendingPlaybackRef.current
      pendingPlaybackRef.current = null
      pending?.()
    }
    document.addEventListener('pointerdown', markInteracted, { once: true })
    document.addEventListener('keydown', markInteracted, { once: true })
    return () => {
      document.removeEventListener('pointerdown', markInteracted)
      document.removeEventListener('keydown', markInteracted)
    }
  }, [])

  // Volume / mute changes apply live to whatever is currently playing
  useEffect(() => {
    if (settings.muted || settings.volume === 0) {
      setMuted(true)
    } else {
      setMuted(false)
      setVolume(settings.volume)
    }
  }, [settings.volume, settings.muted]) // eslint-disable-line react-hooks/exhaustive-deps

  // Teardown on unmount (also runs for React's dev-mode mount/cleanup/remount
  // cycle, so refs must be reset to null — otherwise a re-mount sees stale,
  // listener-stripped Howl instances and never restarts playback).
  useEffect(() => {
    return () => {
      debug('teardown')
      if (moodChangeTimeoutRef.current) {
        clearTimeout(moodChangeTimeoutRef.current)
      }
      moodChangeTimeoutRef.current = null
      fadeIntervalsRef.current.forEach((id) => clearInterval(id))
      fadeIntervalsRef.current.clear()
      cleanup(currentHowlRef.current)
      cleanup(nextHowlRef.current)
      currentHowlRef.current = null
      nextHowlRef.current = null
      currentTrackSrcRef.current = ''
      nextTrackSrcRef.current = ''
      preloadCacheRef.current.forEach((howl) => cleanup(howl))
      preloadCacheRef.current.clear()
    }
  }, [])

  return {
    isLoading: state.isLoading,
    currentTrackMood: state.currentTrackMood,
    autoplayBlocked,
  }
}
