import { AxiosError } from 'axios'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createAppStore } from './index'
import { authorSignedIn, authorSignedOut } from './authorSlice'
import { loadCorpora, loadCorpusFeed, setCorpusMinimum, applyCorpusFilter, removeCorpus, likeCorpus } from './corporaSlice'
import { createCorpusDraft, loadCorpusDraft, publishCorpusDraft } from './corpusDraftSlice'
import { corpusApi } from '../api'
import { CORPORA_MOCK } from '../modules/mock'
import { TOKEN_KEY, authClient } from '../api/client'
import { loginAuthor, logoutAuthor } from './auth'

const offline = () => new AxiosError('offline', 'ERR_NETWORK')
const httpError = (status: number) => new AxiosError('', '', undefined, undefined, { status } as never)
const response = <T,>(data: T) => ({ data }) as never
beforeEach(() => { vi.restoreAllMocks(); localStorage.clear() })

describe('corpora requests and state', () => {
  it('reads Redux filter into generated API and preserves successful empty collections', async () => {
    const store = createAppStore()
    const api = vi.spyOn(corpusApi.corpora, 'getCorpora').mockResolvedValue(response({ items: [], total: 0, page: 1 }))
    store.dispatch(setCorpusMinimum(50000)); store.dispatch(applyCorpusFilter())
    await store.dispatch(loadCorpora())
    expect(api.mock.calls[0][0]).toEqual({ query: 50000, page: 1 })
    expect(store.getState().corpora.items).toEqual([])
    expect(store.getState().corpora.source).toBe('api')
    expect(Object.keys(store.getState().corpora.requests)).toHaveLength(0)
  })
  it('falls back to filtered mocks only for guest connection errors', async () => {
    const store = createAppStore()
    const api = vi.spyOn(corpusApi.corpora, 'getCorpora').mockRejectedValue(offline())
    store.dispatch(setCorpusMinimum(50000)); store.dispatch(applyCorpusFilter())
    await store.dispatch(loadCorpora())
    expect(store.getState().corpora.items).toHaveLength(5)
    store.dispatch(authorSignedIn({ login: 'author', token: 'jwt' }))
    await store.dispatch(loadCorpora())
    expect(store.getState().corpora.items).toEqual([])
    expect(store.getState().corpora.error).toBeTruthy()
    api.mockRejectedValue(httpError(404))
    store.dispatch(authorSignedOut())
    await store.dispatch(loadCorpora())
    expect(store.getState().corpora.source).not.toBe('mock')
  })
  it('does not substitute mock for missing feed and requests next on backend', async () => {
    const store = createAppStore()
    const api = vi.spyOn(corpusApi.corpora, 'getCorpusFeed').mockRejectedValue(httpError(404))
    await store.dispatch(loadCorpusFeed({ id: 999 }))
    expect(store.getState().corpora.feed).toBeNull()
    api.mockResolvedValue(response(CORPORA_MOCK[1]))
    await store.dispatch(loadCorpusFeed({ id: 1, next: true }))
    expect(api.mock.calls.at(-1)?.[0]).toEqual({ id: 1, next: true })
    expect(store.getState().corpora.feed?.id).toBe(3)
  })
  it('ignores delayed previous-session results and resets filter on signout', async () => {
    const store = createAppStore()
    store.dispatch(authorSignedIn({ login: 'a', token: 'jwt' }))
    let complete!: (value: never) => void
    vi.spyOn(corpusApi.corpora, 'getCorpora').mockImplementation(() => new Promise(resolve => { complete = resolve }))
    store.dispatch(setCorpusMinimum(100000)); store.dispatch(applyCorpusFilter())
    const pending = store.dispatch(loadCorpora())
    store.dispatch(authorSignedOut())
    complete(response({ items: [{ ...CORPORA_MOCK[0], is_owner: 1 }], total: 1, page: 1 }))
    await pending
    expect(store.getState().corpora.items).toEqual([])
    expect(store.getState().corpora.minimum).toBe(0)
  })
  it('uses server like counts, does not optimistically change on failure, deletes through generated API', async () => {
    const store = createAppStore()
    store.dispatch(authorSignedIn({ login: 'a', token: 'jwt' }))
    vi.spyOn(corpusApi.corpora, 'getCorpusFeed').mockResolvedValue(response(CORPORA_MOCK[0]))
    await store.dispatch(loadCorpusFeed({ id: 1 }))
    const like = vi.spyOn(corpusApi.corpora, 'setCorpusLike').mockResolvedValue(response({ is_liked: 1, likes_count: 9 }))
    await store.dispatch(likeCorpus({ id: 1, like: 1 }))
    expect(store.getState().corpora.feed?.likes_count).toBe(9)
    expect(like.mock.calls[0].slice(0, 2)).toEqual([1, { like: 1 }])
    like.mockRejectedValue(offline())
    await store.dispatch(likeCorpus({ id: 1, like: 0 }))
    expect(store.getState().corpora.feed?.is_liked).toBe(1)
    const remove = vi.spyOn(corpusApi.corpora, 'deleteCorpus').mockResolvedValue(response(''))
    await store.dispatch(removeCorpus(1))
    expect(remove).toHaveBeenCalled()
    expect(store.getState().corpora.feed).toBeNull()
  })
})

describe('author session', () => {
  it('logs in/out via handwritten Axios, resets Redux but retains JWT on a fresh store', async () => {
    const store = createAppStore()
    const post = vi.spyOn(authClient, 'post').mockResolvedValue(response({ access_token: 'jwt' }))
    await loginAuthor(store, { login: 'a', password: 'secret' })
    expect(store.getState().author.isAuthenticated).toBe(true)
    expect(localStorage.getItem(TOKEN_KEY)).toBe('jwt')
    expect(createAppStore().getState().author.isAuthenticated).toBe(false)
    await logoutAuthor(store)
    expect(post.mock.calls.at(-1)?.[0]).toBe('/users/logout')
    expect(localStorage.getItem(TOKEN_KEY)).toBeNull()
    expect(store.getState().author.isAuthenticated).toBe(false)
  })
  it('retains session on network logout failure but clears on 401', async () => {
    const store = createAppStore()
    store.dispatch(authorSignedIn({ login: 'a', token: 'jwt' }))
    const post = vi.spyOn(authClient, 'post').mockRejectedValue(offline())
    await logoutAuthor(store)
    expect(store.getState().author.isAuthenticated).toBe(true)
    post.mockRejectedValue(httpError(401))
    await logoutAuthor(store)
    expect(store.getState().author.isAuthenticated).toBe(false)
  })
  it('expires the session on protected API 401', async () => {
    const store = createAppStore()
    store.dispatch(authorSignedIn({ login: 'a', token: 'jwt' }))
    vi.spyOn(corpusApi.corpora, 'setCorpusLike').mockRejectedValue(httpError(401))
    await store.dispatch(likeCorpus({ id: 1, like: 1 }))
    expect(store.getState().author.isAuthenticated).toBe(false)
  })
})

describe('corpus draft', () => {
  it('treats missing draft as empty; creates multipart, publishes exactly the three fields', async () => {
    const store = createAppStore()
    store.dispatch(authorSignedIn({ login: 'a', token: 'jwt' }))
    vi.spyOn(corpusApi.corpora, 'getCorpusDraft').mockRejectedValue(httpError(404))
    await store.dispatch(loadCorpusDraft())
    expect(store.getState().corpusDraft.error).toBeNull()
    const create = vi.spyOn(corpusApi.corpora, 'createCorpus').mockResolvedValue(response(CORPORA_MOCK[0]))
    const image = new File(['image'], 'a.png', { type: 'image/png' })
    await store.dispatch(createCorpusDraft({ name: 'Пушкин', image }))
    expect(create.mock.calls[0][0]).toEqual({ name: 'Пушкин', image })
    const publish = vi.spyOn(corpusApi.corpora, 'publishCorpus').mockResolvedValue(response(''))
    const publication = { description: 'Лирика', word_count: 5000, prep_percent: 8.5 }
    await store.dispatch(publishCorpusDraft({ id: 1, publication }))
    expect(publish.mock.calls[0].slice(0, 2)).toEqual([1, publication])
    expect(store.getState().corpusDraft.corpus).toBeNull()
  })
})

it('does not start a new-session draft request after a delayed old create conflict', async () => {
  for (const switchAuthor of [false, true]) {
    const store = createAppStore()
    store.dispatch(authorSignedIn({ login: 'old', token: 'old-jwt' }))
    let reject!: (error: unknown) => void
    vi.spyOn(corpusApi.corpora, 'createCorpus').mockImplementation(() => new Promise((_, rejectPromise) => { reject = rejectPromise }))
    const draft = vi.spyOn(corpusApi.corpora, 'getCorpusDraft').mockResolvedValue(response(CORPORA_MOCK[0]))
    const pending = store.dispatch(createCorpusDraft({ name: 'Old author' }))
    store.dispatch(authorSignedOut())
    if (switchAuthor) store.dispatch(authorSignedIn({ login: 'new', token: 'new-jwt' }))
    reject(httpError(409))
    await pending
    expect(draft).not.toHaveBeenCalled()
    expect(store.getState().corpusDraft.corpus).toBeNull()
    vi.restoreAllMocks()
  }
})
