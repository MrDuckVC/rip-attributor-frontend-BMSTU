import { Api } from './generated/Api'
import type { DtoCorpus } from './generated/Api'
import type { Corpus } from '../modules/types'
import { mediaURL } from './client'

export const corpusApi = new Api({ baseURL: '/api', timeout: 8000 })

// Swagger marks Go response fields optional. Normalize its DTO at the API boundary.
export function toCorpus(value: DtoCorpus): Corpus {
  if (!Number.isInteger(value.id) || !value.id || typeof value.name !== 'string') {
    throw new Error('Некорректный ответ корпуса')
  }
  return {
    id: value.id, name: value.name, description: value.description ?? '',
    word_count: value.word_count ?? 0, prep_percent: value.prep_percent ?? null,
    image_url: mediaURL(value.image_url ?? ''), video_url: mediaURL(value.video_url ?? ''),
    is_owner: value.is_owner === 1 ? 1 : 0, is_liked: value.is_liked === 1 ? 1 : 0,
    likes_count: value.likes_count ?? 0, date_create: value.date_create ?? '', date_finish: value.date_finish ?? null,
  }
}
