// Публичные поля корпуса из DTO backend ЛР4. Статус услуги не выводится.
export interface Corpus {
  id: number
  name: string
  description: string
  word_count: number
  prep_percent: number | null
  image_url: string
  video_url: string
  is_owner: 0 | 1
  is_liked: 0 | 1
  likes_count: number
  date_create: string
  date_finish: string | null
}
