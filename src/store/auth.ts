import axios from 'axios'
import type { AppStore } from './index'
import { authClient, requestError, TOKEN_KEY } from '../api/client'
import { authorRequestFailed, authorRequestStarted, authorSignedIn, authorSignedOut } from './authorSlice'

// Authentication intentionally uses handwritten Axios and ordinary actions, not thunk/codegen.
export async function loginAuthor(store: AppStore, credentials: { login: string; password: string }): Promise<boolean> {
  const epoch = store.getState().author.epoch
  store.dispatch(authorRequestStarted())
  try {
    const { data } = await authClient.post<{ access_token: string }>('/users/login', credentials)
    if (store.getState().author.epoch !== epoch) return false
    if (!data.access_token) throw new Error('Отсутствует JWT')
    localStorage.setItem(TOKEN_KEY, data.access_token)
    store.dispatch(authorSignedIn({ login: credentials.login, token: data.access_token }))
    return true
  } catch (error) {
    if (store.getState().author.epoch === epoch) store.dispatch(authorRequestFailed(requestError(error)))
    return false
  }
}
export async function logoutAuthor(store: AppStore): Promise<boolean> {
  const author = store.getState().author
  store.dispatch(authorRequestStarted())
  try {
    await authClient.post('/users/logout', undefined, { headers: { Authorization: `Bearer ${author.token}` } })
  } catch (error) {
    if (!(axios.isAxiosError(error) && error.response?.status === 401)) {
      if (store.getState().author.epoch === author.epoch) store.dispatch(authorRequestFailed(requestError(error)))
      return false
    }
  }
  if (store.getState().author.epoch !== author.epoch) return false
  localStorage.removeItem(TOKEN_KEY)
  store.dispatch(authorSignedOut())
  return true
}
