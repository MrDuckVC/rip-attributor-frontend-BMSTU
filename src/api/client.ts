import axios from 'axios'

export const TOKEN_KEY = 'attributor.access_token'
export const authClient = axios.create({ baseURL: '/api', timeout: 8000 })

export function mediaURL(value: string): string {
  if (!value || value.startsWith('/')) return value
  try {
    const url = new URL(value)
    const minio = new URL(import.meta.env.VITE_MINIO_PUBLIC_URL || 'http://localhost:9000')
    if (url.origin === minio.origin) return `/s3${url.pathname}${url.search}`
  } catch { /* Empty/relative legacy fields retain the local media fallback. */ }
  return value
}

export function canUseGuestMock(error: unknown, authenticated: boolean): boolean {
  return !authenticated && axios.isAxiosError(error) && !axios.isCancel(error)
    && error.code !== 'ERR_CANCELED'
    && (!error.response || [500, 502, 503, 504].includes(error.response.status))
}

export function requestError(error: unknown): string {
  if (!axios.isAxiosError(error)) return 'Не удалось выполнить запрос.'
  switch (error.response?.status) {
    case 400: return 'Проверьте заполнение полей и формат файлов.'
    case 401: return 'Войдите в систему: логин или пароль неверны либо сессия истекла.'
    case 403: return 'Изменять можно только собственные корпуса.'
    case 404: return 'Корпус не найден.'
    case 409: return 'Корпус уже опубликован или у вас уже есть черновик.'
    default: return 'Сервис недоступен. Повторите запрос.'
  }
}
