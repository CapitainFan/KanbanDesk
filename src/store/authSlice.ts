import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { User } from '@supabase/supabase-js'
import type { Profile } from '../types'

interface AuthState {
  user: User | null
  profile: Profile | null
  isLoading: boolean
}

const initialState: AuthState = {
  user: null,
  profile: null,
  isLoading: true,
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser(state, action: PayloadAction<User | null>) {
      state.user = action.payload
    },
    setProfile(state, action: PayloadAction<Profile | null>) {
      state.profile = action.payload
    },
    setLoading(state, action: PayloadAction<boolean>) {
      state.isLoading = action.payload
    },
    logout(state) {
      state.user = null
      state.profile = null
    },
  },
})

export const { setUser, setProfile, setLoading, logout } = authSlice.actions
export default authSlice.reducer