import { create } from 'zustand'
import { supabase } from '../lib/supabase'

export type Track = {
  id: string
  name: string
  difficulty: string
  distance_km: number
  status: string
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
  completions: Record<string, Completion> // keyed by track_id
  loaded: boolean
  loading: boolean
  error: string
  loadInitialData: (userId: string) => Promise<void>
  setCompletion: (completion: Completion) => void
}

export const useTrackStore = create<TrackState>((set, get) => ({
  tracks: [],
  completions: {},
  loaded: false,
  loading: false,
  error: '',

  loadInitialData: async (userId: string) => {
    if (get().loaded) return // already loaded — skip entirely, no network call
    set({ loading: true, error: '' })

    const { data: trackData, error: trackError } = await supabase
      .from('tracks')
      .select('id, name, difficulty, distance_km, status, path')
      .eq('status', 'OPEN')
      .limit(300)

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

  // Called immediately after a successful insert/update — no refetch needed
  setCompletion: (completion: Completion) => {
    set((state) => ({
      completions: { ...state.completions, [completion.track_id]: completion },
    }))
  },
}))