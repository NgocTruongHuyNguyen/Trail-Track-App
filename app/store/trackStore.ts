import { create } from 'zustand'
import { supabase } from '../lib/supabase'

export type Track = {
  id: string
  name: string
  difficulty: string
  distance_km: number
  status: string
  activity_type: string
  path: { latitude: number; longitude: number }[]
}

export type Completion = {
  track_id: string
  date_completed: string
  duration_minutes: number | null
  notes: string | null
}

interface TrackState {
  tracks: Track[]
  completions: Record<string, Completion>
  loaded: boolean
  loading: boolean
  error: string
  activeFilters: Set<string> // which activity_types are currently visible
  loadInitialData: (userId: string) => Promise<void>
  setCompletion: (completion: Completion) => void
  toggleFilter: (activityType: string) => void
}

const ALL_ACTIVITY_TYPES = ['walking', 'tramping', 'mountain_biking', 'historic']

export const useTrackStore = create<TrackState>((set, get) => ({
  tracks: [],
  completions: {},
  loaded: false,
  loading: false,
  error: '',
  activeFilters: new Set(ALL_ACTIVITY_TYPES), // all shown by default

  loadInitialData: async (userId: string) => {
    if (get().loaded) return
    set({ loading: true, error: '' })

    const { data: trackData, error: trackError } = await supabase
      .from('tracks')
      .select('id, name, difficulty, distance_km, status, activity_type, path')
      .eq('status', 'OPEN')

    if (trackError) {
      set({ error: trackError.message, loading: false })
      return
    }

    const { data: completionData, error: completionError } = await supabase
      .from('completions')
      .select('track_id, date_completed, duration_minutes, notes')
      .eq('user_id', userId)

    if (completionError) {
      set({ error: completionError.message, loading: false })
      return
    }

    const completionsMap: Record<string, Completion> = {}
    completionData?.forEach((c) => {
      completionsMap[c.track_id] = c
    })

    set({
      tracks: trackData || [],
      completions: completionsMap,
      loaded: true,
      loading: false,
    })
  },

  setCompletion: (completion: Completion) => {
    set((state) => ({
      completions: { ...state.completions, [completion.track_id]: completion },
    }))
  },

  toggleFilter: (activityType: string) => {
    set((state) => {
      const next = new Set(state.activeFilters)
      if (next.has(activityType)) {
        next.delete(activityType)
      } else {
        next.add(activityType)
      }
      return { activeFilters: next }
    })
  },
}))