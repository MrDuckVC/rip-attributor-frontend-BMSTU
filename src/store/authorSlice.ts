import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

export interface AuthorState {
  login: string
  token: string | null
  isAuthenticated: boolean
  loading: boolean
  error: string | null
  epoch: number
}
const initialState: AuthorState = { login: '', token: null, isAuthenticated: false, loading: false, error: null, epoch: 0 }
const authorSlice = createSlice({
  name: 'author', initialState,
  reducers: {
    authorRequestStarted(state) { state.loading = true; state.error = null },
    authorRequestFailed(state, action: PayloadAction<string>) { state.loading = false; state.error = action.payload },
    authorSignedIn(state, action: PayloadAction<{ login: string; token: string }>) {
      Object.assign(state, initialState, action.payload, { isAuthenticated: true, epoch: state.epoch + 1 })
    },
    authorSignedOut(state) { Object.assign(state, initialState, { epoch: state.epoch + 1 }) },
  },
})
export const { authorRequestStarted, authorRequestFailed, authorSignedIn, authorSignedOut } = authorSlice.actions
export default authorSlice.reducer
