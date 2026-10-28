import { describe, expect, it } from 'vitest'
import { CORPORA_MOCK } from './mock'
import { getCorpora, getCorpusById, getNextCorpus, readCatalogParams } from './corpora'

describe('mock-каталог', () => {
  it('фильтрует включительно и возвращает только совпадения', () => {
    const result = getCorpora(50000, 1)
    expect(result.items.every((item) => item.word_count >= 50000)).toBe(true)
    expect(result.items.some((item) => item.word_count === 50000)).toBe(true)
    expect(result.total).toBe(CORPORA_MOCK.filter((item) => item.word_count >= 50000).length)
    expect(getCorpora(200000, 1).items).toEqual([])
  })

  it('разбивает каталог на страницы по шесть карточек', () => {
    expect(getCorpora(0, 1).items).toHaveLength(6)
    expect(getCorpora(0, 2).items).toEqual(CORPORA_MOCK.slice(6))
    expect(getCorpora(0, 999).page).toBe(2)
    expect(getCorpora(200000, 4).page).toBe(1)
  })

  it('находит корпус по ID, а следующий — по порядку с возвратом к первому', () => {
    expect(getCorpusById(String(CORPORA_MOCK[1].id))).toEqual(CORPORA_MOCK[1])
    expect(getNextCorpus(CORPORA_MOCK[0].id)).toEqual(CORPORA_MOCK[1])
    expect(getNextCorpus(CORPORA_MOCK.at(-1)!.id)).toEqual(CORPORA_MOCK[0])
    expect(getCorpusById('99999')).toBeUndefined()
    expect(getCorpusById('1abc')).toBeUndefined()
    expect(getNextCorpus(99999)).toBeUndefined()
  })

  it('безопасно читает параметры URL', () => {
    expect(readCatalogParams(new URLSearchParams('query=50000&page=2'))).toEqual({ minimum: 50000, page: 2 })
    for (const query of ['query=oops&page=-1', 'query=-5&page=1.2', 'query=Infinity&page=NaN']) {
      expect(readCatalogParams(new URLSearchParams(query))).toEqual({ minimum: 0, page: 1 })
    }
    expect(readCatalogParams(new URLSearchParams('query=999999&page=3'))).toEqual({ minimum: 200000, page: 3 })
  })
})
