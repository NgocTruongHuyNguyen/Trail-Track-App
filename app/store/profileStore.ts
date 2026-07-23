import { create } from 'zustand'
import { supabase } from '../lib/supabase'

export type Profile = {
  id: string
  name: string | null
  gender: string | null
  date_of_birth: string | null
  hobbies: string[]
  location: string | null
}

interface ProfileState {
  profile: Profile | null
  loading: boolean
  error: string
  fetchProfile: (userId: string) => Promise<void>
  updateProfile: (updates: Partial<Profile>) => Promise<boolean>
}

export const useProfileStore = create<ProfileState>((set, get) => ({
  profile: null,
  loading: false,
  error: '',

  fetchProfile: async (userId: string) => {
    set({ loading: true, error: '' })
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) {
      set({ error: error.message, loading: false })
      return
    }
    set({ profile: data, loading: false })
  },

  updateProfile: async (updates: Partial<Profile>) => {
    const current = get().profile
    if (!current) return false

    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', current.id)
      .select()
      .single()

    if (error) {
      set({ error: error.message })
      return false
    }
    set({ profile: data })
    return true
  },
}))