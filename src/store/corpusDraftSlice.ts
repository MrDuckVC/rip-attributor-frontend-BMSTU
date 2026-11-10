import axios from 'axios'
import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { corpusApi, toCorpus } from '../api'
import type { DtoPublishCorpus } from '../api/generated/Api'
import type { Corpus } from '../modules/types'
import { authorSignedIn, authorSignedOut } from './authorSlice'
import { failedRequest, requestParams, type ThunkConfig } from './request'

const draftThunk = createAsyncThunk.withTypes<ThunkConfig>()
export const loadCorpusDraft = draftThunk('corpusDraft/loadCorpusDraft', async (_, api) => {
  const state = api.getState()
  try {
    const { data } = await corpusApi.corpora.getCorpusDraft(requestParams(state, api.signal))
    return toCorpus(data)
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) return null
    return api.rejectWithValue(failedRequest(error, api.getState, api.dispatch, state.author.epoch))
  }
})
export interface CreateCorpusInput { name: string; image?: File; video?: File }
export const createCorpusDraft = draftThunk('corpusDraft/createCorpusDraft', async (input: CreateCorpusInput, api) => {
  const state = api.getState()
  try {
    const { data } = await corpusApi.corpora.createCorpus(input, requestParams(state, api.signal))
    return toCorpus(data)
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 409
      && api.getState().author.epoch === state.author.epoch && !api.signal.aborted) {
      const request = api.dispatch(loadCorpusDraft())
      const cancel = () => request.abort()
      api.signal.addEventListener('abort', cancel, { once: true })
      try {
        const existing = await request
        if (loadCorpusDraft.fulfilled.match(existing) && existing.payload) return existing.payload
      } finally { api.signal.removeEventListener('abort', cancel) }
    }
    return api.rejectWithValue(failedRequest(error, api.getState, api.dispatch, state.author.epoch))
  }
})
export const publishCorpusDraft = draftThunk('corpusDraft/publishCorpusDraft', async ({ id, publication }: { id: number; publication: DtoPublishCorpus }, api) => {
  const state = api.getState()
  try {
    await corpusApi.corpora.publishCorpus(id, publication, requestParams(state, api.signal))
    return id
  } catch (error) { return api.rejectWithValue(failedRequest(error, api.getState, api.dispatch, state.author.epoch)) }
})
export const deleteCorpusDraft = draftThunk('corpusDraft/deleteCorpusDraft', async (id: number, api) => {
  const state = api.getState()
  try {
    await corpusApi.corpora.deleteCorpus(id, requestParams(state, api.signal))
    return id
  } catch (error) { return api.rejectWithValue(failedRequest(error, api.getState, api.dispatch, state.author.epoch)) }
})
interface CorpusDraftState {
  corpus: Corpus | null; publication: DtoPublishCorpus
  checked: boolean; requests: Record<string, boolean>; error: string | null
}
const initialState: CorpusDraftState = {
  corpus: null, publication: { description: '', word_count: 0, prep_percent: 0 }, checked: false, requests: {}, error: null,
}
const corpusDraftSlice = createSlice({
  name: 'corpusDraft', initialState,
  reducers: {
    setCorpusPublication(state, action: PayloadAction<Partial<DtoPublishCorpus>>) { Object.assign(state.publication, action.payload) },
  },
  extraReducers: builder => {
    builder.addCase(authorSignedIn, () => initialState).addCase(authorSignedOut, () => initialState)
    for (const thunk of [loadCorpusDraft, createCorpusDraft, publishCorpusDraft, deleteCorpusDraft]) {
      builder.addCase(thunk.pending, (state, action) => { state.requests[action.meta.requestId] = true; state.error = null })
    }
    for (const thunk of [loadCorpusDraft, createCorpusDraft]) {
      builder.addCase(thunk.fulfilled, (state, action) => {
        if (!state.requests[action.meta.requestId]) return
        delete state.requests[action.meta.requestId]
        state.checked = true; state.corpus = action.payload
      })
    }
    for (const thunk of [publishCorpusDraft, deleteCorpusDraft]) {
      builder.addCase(thunk.fulfilled, (state, action) => {
        if (!state.requests[action.meta.requestId]) return
        Object.assign(state, initialState, { checked: true })
      })
    }
    for (const thunk of [loadCorpusDraft, createCorpusDraft, publishCorpusDraft, deleteCorpusDraft]) {
      builder.addCase(thunk.rejected, (state, action) => {
        if (!state.requests[action.meta.requestId]) return
        delete state.requests[action.meta.requestId]
        if (!action.meta.aborted) state.error = action.payload?.message ?? 'Ошибка работы с черновиком.'
      })
    }
  },
})
export const { setCorpusPublication } = corpusDraftSlice.actions
export default corpusDraftSlice.reducer
