import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { corpusApi, toCorpus } from '../api'
import { canUseGuestMock } from '../api/client'
import { getCorpora, getCorpusById, getNextCorpus } from '../modules/corpora'
import { CORPORA_MOCK } from '../modules/mock'
import type { Corpus } from '../modules/types'
import { authorSignedIn, authorSignedOut } from './authorSlice'
import { failedRequest, requestParams, type ThunkConfig } from './request'

const corpusThunk = createAsyncThunk.withTypes<ThunkConfig>()
export const loadCorpora = corpusThunk('corpora/loadCorpora', async (_, api) => {
  const state = api.getState()
  try {
    const { data } = await corpusApi.corpora.getCorpora({ query: state.corpora.appliedMinimum, page: state.corpora.page }, requestParams(state, api.signal))
    return { items: (data.items ?? []).map(toCorpus), total: data.total ?? 0, page: data.page ?? 1, source: 'api' as const }
  } catch (error) {
    if (canUseGuestMock(error, state.author.isAuthenticated)) {
      const { items, total, page } = getCorpora(state.corpora.appliedMinimum, state.corpora.page)
      return { items, total, page, source: 'mock' as const }
    }
    return api.rejectWithValue(failedRequest(error, api.getState, api.dispatch, state.author.epoch))
  }
})
export const loadCorpusFeed = corpusThunk('corpora/loadCorpusFeed', async (query: { id?: number; next?: boolean }, api) => {
  const state = api.getState()
  try {
    const { data } = await corpusApi.corpora.getCorpusFeed(query, requestParams(state, api.signal))
    return { corpus: toCorpus(data), source: 'api' as const }
  } catch (error) {
    if (canUseGuestMock(error, state.author.isAuthenticated)) {
      const corpus = query.id === undefined ? CORPORA_MOCK[0]
        : query.next ? getNextCorpus(query.id) : getCorpusById(String(query.id))
      if (corpus) return { corpus, source: 'mock' as const }
      return api.rejectWithValue({ message: 'Корпус не найден.', status: 404 })
    }
    return api.rejectWithValue(failedRequest(error, api.getState, api.dispatch, state.author.epoch))
  }
})
export const removeCorpus = corpusThunk('corpora/removeCorpus', async (id: number, api) => {
  const state = api.getState()
  try {
    await corpusApi.corpora.deleteCorpus(id, requestParams(state, api.signal))
    return id
  } catch (error) { return api.rejectWithValue(failedRequest(error, api.getState, api.dispatch, state.author.epoch)) }
})
export const likeCorpus = corpusThunk('corpora/likeCorpus', async ({ id, like }: { id: number; like: 0 | 1 }, api) => {
  const state = api.getState()
  try {
    const { data } = await corpusApi.corpora.setCorpusLike(id, { like }, requestParams(state, api.signal))
    return { id, is_liked: data.is_liked === 1 ? 1 as const : 0 as const, likes_count: data.likes_count ?? 0 }
  } catch (error) { return api.rejectWithValue(failedRequest(error, api.getState, api.dispatch, state.author.epoch)) }
})
export interface CorporaState {
  minimum: number; appliedMinimum: number; page: number; total: number
  items: Corpus[]; feed: Corpus | null; source: 'api' | 'mock' | null; feedSource: 'api' | 'mock' | null
  error: string | null; feedError: string | null; feedStatus: number | null
  requests: Record<string, boolean>; listRequest: string | null; feedRequest: string | null
}
const initialState: CorporaState = {
  minimum: 0, appliedMinimum: 0, page: 1, total: 0, items: [], feed: null,
  source: null, feedSource: null, error: null, feedError: null, feedStatus: null,
  requests: {}, listRequest: null, feedRequest: null,
}
const corporaSlice = createSlice({
  name: 'corpora', initialState,
  reducers: {
    setCorpusMinimum(state, action: PayloadAction<number>) { state.minimum = action.payload },
    applyCorpusFilter(state) { state.appliedMinimum = state.minimum; state.page = 1 },
    syncCorpusCatalog(state, action: PayloadAction<{ minimum: number; page: number }>) {
      if (state.appliedMinimum !== action.payload.minimum) state.minimum = action.payload.minimum
      state.appliedMinimum = action.payload.minimum; state.page = action.payload.page
    },
    clearCorpusError(state) { state.error = null; state.feedError = null },
  },
  extraReducers: builder => {
    builder.addCase(authorSignedIn, () => initialState).addCase(authorSignedOut, () => initialState)
    builder.addCase(loadCorpora.pending, (state, action) => {
      state.requests[action.meta.requestId] = true; state.listRequest = action.meta.requestId; state.error = null
    }).addCase(loadCorpora.fulfilled, (state, action) => {
      if (!state.requests[action.meta.requestId]) return
      delete state.requests[action.meta.requestId]
      if (state.listRequest !== action.meta.requestId) return
      Object.assign(state, action.payload)
    }).addCase(loadCorpora.rejected, (state, action) => {
      if (!state.requests[action.meta.requestId]) return
      delete state.requests[action.meta.requestId]
      if (state.listRequest !== action.meta.requestId || action.meta.aborted) return
      state.error = action.payload?.message ?? 'Ошибка загрузки корпусов.'
      state.items = []; state.total = 0; state.source = null
    })
    builder.addCase(loadCorpusFeed.pending, (state, action) => {
      state.requests[action.meta.requestId] = true; state.feedRequest = action.meta.requestId
      state.feedError = null; state.feedStatus = null
    }).addCase(loadCorpusFeed.fulfilled, (state, action) => {
      if (!state.requests[action.meta.requestId]) return
      delete state.requests[action.meta.requestId]
      if (state.feedRequest !== action.meta.requestId) return
      state.feed = action.payload.corpus; state.feedSource = action.payload.source
    }).addCase(loadCorpusFeed.rejected, (state, action) => {
      if (!state.requests[action.meta.requestId]) return
      delete state.requests[action.meta.requestId]
      if (state.feedRequest !== action.meta.requestId || action.meta.aborted) return
      state.feed = null; state.feedSource = null
      state.feedError = action.payload?.message ?? 'Ошибка загрузки корпуса.'; state.feedStatus = action.payload?.status ?? null
    })
    for (const thunk of [removeCorpus, likeCorpus]) {
      builder.addCase(thunk.pending, (state, action) => { state.requests[action.meta.requestId] = true; state.error = null })
    }
    builder.addCase(removeCorpus.fulfilled, (state, action) => {
      if (!state.requests[action.meta.requestId]) return
      delete state.requests[action.meta.requestId]
      state.items = state.items.filter(item => item.id !== action.payload)
      if (state.feed?.id === action.payload) state.feed = null
    }).addCase(likeCorpus.fulfilled, (state, action) => {
      if (!state.requests[action.meta.requestId]) return
      delete state.requests[action.meta.requestId]
      for (const corpus of [...state.items, ...(state.feed ? [state.feed] : [])]) {
        if (corpus.id === action.payload.id) Object.assign(corpus, { is_liked: action.payload.is_liked, likes_count: action.payload.likes_count })
      }
    })
    for (const thunk of [removeCorpus, likeCorpus]) {
      builder.addCase(thunk.rejected, (state, action) => {
        if (!state.requests[action.meta.requestId]) return
        delete state.requests[action.meta.requestId]
        state.error = action.payload?.message ?? 'Не удалось изменить корпус.'
      })
    }
  },
})
export const { setCorpusMinimum, applyCorpusFilter, syncCorpusCatalog, clearCorpusError } = corporaSlice.actions
export default corporaSlice.reducer
