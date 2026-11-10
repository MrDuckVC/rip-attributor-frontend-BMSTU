import { configureStore } from '@reduxjs/toolkit'
import author from './authorSlice'
import corpora from './corporaSlice'
import corpusDraft from './corpusDraftSlice'

export const createAppStore = () => configureStore({ reducer: { author, corpora, corpusDraft } })
export type AppStore = ReturnType<typeof createAppStore>
export type RootState = ReturnType<AppStore['getState']>
export type AppDispatch = AppStore['dispatch']
export const store = createAppStore()
