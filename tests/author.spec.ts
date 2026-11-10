import { expect, test, type Page } from '@playwright/test'
import { CORPORA_MOCK } from '../src/modules/mock'

async function login(page: Page) {
  await page.goto('/login')
  await page.getByLabel('Логин', { exact: true }).fill('author')
  await page.getByLabel('Пароль', { exact: true }).fill('secret')
  await page.getByRole('button', { name: 'Войти', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Выход' })).toBeVisible()
}

test('author: four screens, signed S3 URL, multipart draft/publication, like, F5 guest, delete and logout', async ({ page }) => {
  let published = false
  let deleted = false
  let draft = false
  let liked = 0
  let lastAuthorization: string | undefined
  const corpus = () => ({ ...CORPORA_MOCK[0], id: 101, name: 'Автор, новый корпус', is_owner: 1, is_liked: liked, likes_count: liked, image_url: `${process.env.VITE_MINIO_PUBLIC_URL || 'http://localhost:9000'}/corpora/object.png?X-Amz-Signature=abc` })
  const publicationBodies: unknown[] = []
  await page.route('**/s3/**', route => route.fulfill({ path: 'public/media/puskin.png', contentType: 'image/png' }))
  await page.route('http://localhost:3000/api/**', async route => {
    const request = route.request()
    const url = new URL(request.url())
    lastAuthorization = request.headers().authorization
    const authorized = lastAuthorization === 'Bearer test-jwt'
    if (url.pathname === '/api/users/login') return route.fulfill({ json: { access_token: 'test-jwt', token_type: 'Bearer', expires_in: 3600 } })
    if (url.pathname === '/api/users/logout') return route.fulfill({ status: 200 })
    if (url.pathname === '/api/corpora/draft') return route.fulfill(draft ? { json: corpus() } : { status: 404 })
    if (url.pathname === '/api/corpora' && request.method() === 'POST') {
      expect(authorized).toBe(true)
      expect(request.headers()['content-type']).toContain('multipart/form-data; boundary=')
      expect(request.postDataBuffer()?.toString()).toContain('filename="puskin.png"')
      draft = true
      return route.fulfill({ status: 201, json: corpus() })
    }
    if (url.pathname.endsWith('/publication')) {
      publicationBodies.push(request.postDataJSON()); published = true; draft = false
      return route.fulfill({ status: 200 })
    }
    if (url.pathname.endsWith('/like')) { liked = request.postDataJSON().like; return route.fulfill({ json: { is_liked: liked, likes_count: liked } }) }
    if (request.method() === 'DELETE') { deleted = true; return route.fulfill({ status: 200 }) }
    if (url.pathname === '/api/corpora/feed') return route.fulfill({ json: { ...corpus(), is_owner: authorized ? 1 : 0 } })
    return route.fulfill({ json: { items: published && !deleted ? [{ ...corpus(), is_owner: authorized ? 1 : 0 }] : [], total: published && !deleted ? 1 : 0, page: 1 } })
  })
  await login(page)
  await page.getByRole('link', { name: 'Добавить', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Создать черновик' })).toBeVisible()
  await page.getByLabel('Изображение', { exact: true }).setInputFiles('public/media/puskin.png')
  await page.getByLabel('Вертикальное видео', { exact: true }).setInputFiles('public/media/puskin.mp4')
  await page.getByLabel('Название корпуса', { exact: true }).fill('Автор, новый корпус')
  await page.getByRole('button', { name: 'Создать черновик' }).click()
  await expect(page.getByRole('button', { name: 'Опубликовать' })).toBeVisible()
  await expect(page.getByRole('img', { name: 'Автор, новый корпус' })).toHaveAttribute('src', '/s3/corpora/object.png?X-Amz-Signature=abc')
  await page.getByLabel('Описание', { exact: true }).fill('Описание нового корпуса')
  await page.getByLabel('Количество слов', { exact: true }).fill('55000')
  await page.getByLabel('Процент предлогов', { exact: true }).fill('8.5')
  await page.getByRole('button', { name: 'Опубликовать' }).click()
  await expect(page).toHaveURL('/corpora/101')
  expect(publicationBodies).toEqual([{ description: 'Описание нового корпуса', word_count: 55000, prep_percent: 8.5 }])
  await page.getByRole('button', { name: 'Поставить лайк' }).click()
  await expect(page.getByRole('button', { name: 'Снять лайк' })).toBeVisible()
  await page.getByRole('button', { name: 'Снять лайк' }).click()
  await expect(page.getByRole('button', { name: 'Поставить лайк' })).toBeVisible()
  await page.reload()
  await expect(page.getByRole('link', { name: 'Вход' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Лайк — требуется вход' })).toBeDisabled()
  expect(await page.evaluate(() => localStorage.getItem('attributor.access_token'))).toBe('test-jwt')
  expect(lastAuthorization).toBeUndefined()
  await login(page)
  await page.getByRole('button', { name: 'Удалить корпус: Автор, новый корпус' }).click()
  await expect(page.getByText('Корпусы не найдены')).toBeVisible()
  await page.getByRole('slider').fill('50000')
  await page.getByRole('button', { name: 'Применить фильтр' }).click()
  await expect(page.getByLabel('Загрузка', { exact: true })).toHaveCount(0)
  await page.getByRole('button', { name: 'Выход' }).click()
  await expect(page).toHaveURL('/corpora')
  await expect(page.getByRole('slider')).toHaveValue('0')
  expect(await page.evaluate(() => localStorage.getItem('attributor.access_token'))).toBeNull()
})

test('slow request blocks all actions, foreign delete stays disabled; API failure is not a user mock', async ({ page }) => {
  let release!: () => void
  const gate = new Promise<void>(resolve => { release = resolve })
  await page.route('http://localhost:3000/api/**', async route => {
    if (route.request().url().endsWith('/users/login')) return route.fulfill({ json: { access_token: 'test-jwt' } })
    if (route.request().headers().authorization) { await gate; return route.fulfill({ status: 503 }) }
    return route.fulfill({ json: { items: [CORPORA_MOCK[0]], total: 1, page: 1 } })
  })
  await page.goto('/corpora')
  await expect(page.getByRole('link', { name: /^Открыть корпус:/ })).toHaveCount(1)
  await page.getByRole('link', { name: 'Вход' }).click()
  await page.getByLabel('Логин', { exact: true }).fill('author')
  await page.getByLabel('Пароль', { exact: true }).fill('secret')
  await page.getByRole('button', { name: 'Войти', exact: true }).click()
  await expect(page.getByLabel('Загрузка', { exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Выход' })).toBeDisabled()
  await expect(page.getByRole('button', { name: 'Применить фильтр' })).toBeDisabled()
  await expect(page.locator('.app-content')).toHaveAttribute('inert', '')
  release()
  await expect(page.getByRole('alert')).toBeVisible()
  await expect(page.getByRole('link', { name: /^Открыть корпус:/ })).toHaveCount(0)
})
