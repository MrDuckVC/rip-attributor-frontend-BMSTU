import { CORPORA_MOCK } from './mock'

export const PAGE_SIZE = 6
export const MAX_WORD_COUNT = 200000

export function readCatalogParams(params: URLSearchParams) {
  const query = Number(params.get('query') ?? 0)
  const page = Number(params.get('page') ?? 1)
  return {
    minimum: Number.isInteger(query) && query >= 0 ? Math.min(query, MAX_WORD_COUNT) : 0,
    page: Number.isSafeInteger(page) && page >= 1 ? page : 1,
  }
}

export function getCorpora(minimum: number, requestedPage: number) {
  const filtered = CORPORA_MOCK.filter((corpus) => corpus.word_count >= minimum)
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const page = Math.min(Math.max(1, requestedPage), pageCount)
  return {
    items: filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    total: filtered.length,
    page,
    pageCount,
  }
}

export function getCorpusById(id: string | undefined) {
  return CORPORA_MOCK.find((corpus) => String(corpus.id) === id)
}

export function getNextCorpus(id: number) {
  const index = CORPORA_MOCK.findIndex((corpus) => corpus.id === id)
  return index < 0 ? undefined : CORPORA_MOCK[(index + 1) % CORPORA_MOCK.length]
}
