import type { Corpus } from './types'

// Учебные показатели, а не результаты лингвистического анализа.
// Все медиа локальные. У первой записи пустые URL для показа заглушек.
export const CORPORA_MOCK: readonly Corpus[] = [
  { id: 1, name: 'А. С. Пушкин, Лирика', word_count: 5000, prep_percent: 8.5, image_url: '', video_url: '' },
  { id: 3, name: 'А. С. Пушкин, Проза', word_count: 25000, prep_percent: 9.2, image_url: '/media/puskin.png', video_url: '/media/puskin.mp4' },
  { id: 6, name: 'А. С. Пушкин, Драматургия', word_count: 40000, prep_percent: 7.8, image_url: '/media/puskin.png', video_url: '' },
  { id: 8, name: 'А. С. Пушкин, Поэмы', word_count: 50000, prep_percent: 8.1, image_url: '', video_url: '/media/puskin.mp4' },
  { id: 12, name: 'А. С. Пушкин, Письма', word_count: 100000, prep_percent: 10.4, image_url: '/media/puskin.png', video_url: '' },
  { id: 17, name: 'А. С. Пушкин, Публицистика', word_count: 150000, prep_percent: 9.7, image_url: '/media/puskin.png', video_url: '/media/puskin.mp4' },
  { id: 21, name: 'А. С. Пушкин, Исторические тексты', word_count: 175000, prep_percent: 11.2, image_url: '', video_url: '' },
  { id: 27, name: 'А. С. Пушкин, Собрание текстов', word_count: 195000, prep_percent: 9.5, image_url: '/media/puskin.png', video_url: '/media/puskin.mp4' },
].map((item, index) => ({
  ...item,
  description: `Корпус текстов потенциального автора для атрибуции анонимного текста по частотности служебных слов. Подборка: ${item.name}. Показатели в демонстрационных данных условные.`,
  is_owner: 0,
  is_liked: 0,
  likes_count: index * 3,
  date_create: '2026-10-01T10:00:00Z',
  date_finish: '2026-10-01T10:05:00Z',
}))
