import axios from 'axios'
import type { RootState, AppDispatch } from './index'
import { authorSignedOut } from './authorSlice'
import { requestError, TOKEN_KEY } from '../api/client'

export interface RequestFailure { message: string; status?: number }
export interface ThunkConfig { state: RootState; dispatch: AppDispatch; rejectValue: RequestFailure }

export function requestParams(state: RootState, signal: AbortSignal) {
  return { signal, headers: state.author.isAuthenticated && state.author.token
    ? { Authorization: `Bearer ${state.author.token}` } : {} }
}

export function failedRequest(error: unknown, state: () => RootState, dispatch: AppDispatch, epoch: number): RequestFailure {
  const status = axios.isAxiosError(error) ? error.response?.status : undefined
  if (status === 401 && state().author.isAuthenticated && state().author.epoch === epoch) {
    localStorage.removeItem(TOKEN_KEY)
    dispatch(authorSignedOut())
  }
  return { message: requestError(error), status }
}
