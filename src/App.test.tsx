import { fireEvent, render, screen, within, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { Provider } from 'react-redux'
import { AxiosError } from 'axios'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import { createAppStore } from './store'
import { authorSignedIn } from './store/authorSlice'
import { corpusApi } from './api'
import { authClient } from './api/client'
import { CORPORA_MOCK } from './modules/mock'
import { CorpusImage } from './components/CorpusImage'
import { CorpusVideo } from './components/CorpusVideo'

const response = <T,>(data: T) => ({ data }) as never
const open = (path = '/corpora', store = createAppStore()) => {
  render(<Provider store={store}><MemoryRouter initialEntries={[path]}><App /></MemoryRouter></Provider>)
  return store
}
beforeEach(() => {
  vi.restoreAllMocks(); localStorage.clear()
  vi.spyOn(corpusApi.corpora, 'getCorpora').mockRejectedValue(new AxiosError('offline', 'ERR_NETWORK'))
  vi.spyOn(corpusApi.corpora, 'getCorpusFeed').mockRejectedValue(new AxiosError('offline', 'ERR_NETWORK'))
})

describe('гостевое приложение ЛР6', () => {
  it('показывает вход, блокирует добавление и гостевые изменения', async () => {
    open()
    await screen.findAllByRole('link', { name: /^Открыть корпус:/ })
    const navigation = screen.getByRole('navigation', { name: 'Основная навигация' })
    expect(within(navigation).getByRole('link', { name: 'Вход' })).toHaveAttribute('href', '/login')
    expect(within(navigation).getByRole('button', { name: 'Добавить' })).toBeDisabled()
    expect(screen.getAllByRole('button', { name: 'Удалить корпус — требуется вход' })[0]).toBeDisabled()
  })
  it('применяет Redux фильтр кнопкой, сбрасывает страницу и сохраняет пустой результат', async () => {
    const user = userEvent.setup()
    open('/corpora?page=2')
    await screen.findByText('Страница 2 из 2')
    fireEvent.change(screen.getByRole('slider'), { target: { value: '50000' } })
    expect(screen.getByText('Страница 2 из 2')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Применить фильтр' }))
    await screen.findByText('Страница 1 из 1')
    expect(screen.getAllByRole('link', { name: /^Открыть корпус:/ })).toHaveLength(5)
    fireEvent.change(screen.getByRole('slider'), { target: { value: '200000' } })
    await user.click(screen.getByRole('button', { name: 'Применить фильтр' }))
    await screen.findByText('Корпусы не найдены')
  })
  it('переходит к следующему корпусу и возвращается к первому', async () => {
    const user = userEvent.setup()
    open('/corpora/27')
    await screen.findByRole('heading', { name: CORPORA_MOCK.at(-1)!.name })
    await user.click(screen.getByRole('button', { name: 'Следующий корпус' }))
    await screen.findByRole('heading', { name: CORPORA_MOCK[0].name })
    expect(screen.getByRole('button', { name: 'Лайк — требуется вход' })).toBeDisabled()
  })
  it('возвращается из ленты с фильтром', async () => {
    const user = userEvent.setup()
    open('/corpora?query=50000')
    const cards = await screen.findAllByRole('link', { name: /^Открыть корпус:/ })
    await user.click(cards[0])
    await screen.findByRole('heading', { name: CORPORA_MOCK[3].name })
    await user.click(within(screen.getByRole('navigation', { name: 'Основная навигация' })).getByRole('link', { name: 'Плитка' }))
    await screen.findAllByRole('link', { name: /^Открыть корпус:/ })
    expect(screen.getByRole('slider')).toHaveValue('50000')
  })
  it('использует заглушки и показывает отсутствующий корпус', async () => {
    open('/corpora/99999')
    await screen.findByRole('heading', { name: 'Корпус не найден' })
    expect(screen.getByRole('link', { name: 'К плитке' })).toHaveAttribute('href', '/corpora')
  })
  it('не отправляет сохранённый JWT после F5 в гостевой запрос', async () => {
    localStorage.setItem('attributor.access_token', 'jwt')
    open()
    await screen.findAllByRole('link', { name: /^Открыть корпус:/ })
    expect(vi.mocked(corpusApi.corpora.getCorpora).mock.calls[0][1]?.headers).toEqual({})
  })
})

describe('author screens', () => {
  it('logs in via Axios, shows login/exit and resets filter on exit', async () => {
    const user = userEvent.setup()
    vi.spyOn(authClient, 'post').mockResolvedValue(response({ access_token: 'jwt' }))
    vi.mocked(corpusApi.corpora.getCorpora).mockResolvedValue(response({ items: [], total: 0, page: 1 }))
    open('/login')
    await user.type(screen.getByLabelText('Логин'), 'author')
    await user.type(screen.getByLabelText('Пароль'), 'secret')
    await user.click(screen.getByRole('button', { name: 'Войти' }))
    await screen.findByRole('button', { name: 'Выход' })
    expect(screen.getByText('author')).toBeInTheDocument()
    fireEvent.change(screen.getByRole('slider'), { target: { value: '50000' } })
    await user.click(screen.getByRole('button', { name: 'Применить фильтр' }))
    await waitFor(() => expect(screen.queryByLabelText('Загрузка')).not.toBeInTheDocument())
    await user.click(screen.getByRole('button', { name: 'Выход' }))
    await screen.findByRole('link', { name: 'Вход' })
    expect(screen.getByRole('slider')).toHaveValue('0')
  })
  it('does not navigate away on failed login', async () => {
    const user = userEvent.setup()
    vi.spyOn(authClient, 'post').mockRejectedValue(new AxiosError('', '', undefined, undefined, { status: 401 } as never))
    open('/login')
    await user.type(screen.getByLabelText('Логин'), 'wrong')
    await user.type(screen.getByLabelText('Пароль'), 'wrong')
    await user.click(screen.getByRole('button', { name: 'Войти' }))
    await screen.findByRole('alert')
    expect(screen.getByRole('heading', { name: 'Вход' })).toBeInTheDocument()
  })
  it('continues a draft and publishes through generated API', async () => {
    const user = userEvent.setup()
    const store = createAppStore(); store.dispatch(authorSignedIn({ login: 'a', token: 'jwt' }))
    vi.spyOn(corpusApi.corpora, 'getCorpusDraft').mockResolvedValue(response({ ...CORPORA_MOCK[0], description: '', word_count: 0, prep_percent: null }))
    const publish = vi.spyOn(corpusApi.corpora, 'publishCorpus').mockResolvedValue(response(''))
    vi.mocked(corpusApi.corpora.getCorpusFeed).mockResolvedValue(response(CORPORA_MOCK[0]))
    open('/corpora/add', store)
    await screen.findByRole('button', { name: 'Опубликовать' })
    await user.type(screen.getByLabelText('Описание'), 'Лирика автора')
    fireEvent.change(screen.getByLabelText('Количество слов'), { target: { value: '5000' } })
    fireEvent.change(screen.getByLabelText('Процент предлогов'), { target: { value: '8.5' } })
    await user.click(screen.getByRole('button', { name: 'Опубликовать' }))
    await screen.findByRole('heading', { name: CORPORA_MOCK[0].name })
    expect(publish.mock.calls[0][1]).toEqual({ description: 'Лирика автора', word_count: 5000, prep_percent: 8.5 })
  })
})

it('uses local image/video fallbacks on missing media', () => {
  render(<CorpusVideo videoUrl="/missing.mp4" imageUrl="" name="Корпус" />)
  fireEvent.error(screen.getByLabelText('Видео корпуса'))
  expect(screen.getByLabelText('Видео корпуса')).toHaveAttribute('src', '/media/puskin.mp4')
  fireEvent.error(screen.getByLabelText('Видео корпуса'))
  expect(screen.getByRole('img')).toHaveAttribute('src', '/media/puskin.png')
})
it('falls back for broken images', () => {
  render(<CorpusImage url="/missing.png" name="Корпус" />)
  fireEvent.error(screen.getByRole('img'))
  expect(screen.getByRole('img')).toHaveAttribute('src', '/media/puskin.png')
})

it('resets URL-backed filter when a protected request expires the session', async () => {
  const store = createAppStore()
  store.dispatch(authorSignedIn({ login: 'a', token: 'jwt' }))
  vi.mocked(corpusApi.corpora.getCorpora).mockRejectedValueOnce(new AxiosError('', '', undefined, undefined, { status: 401 } as never))
  open('/corpora?query=50000&page=2', store)
  await screen.findByRole('link', { name: 'Вход' })
  await screen.findAllByRole('link', { name: /^Открыть корпус:/ })
  expect(screen.getByRole('slider')).toHaveValue('0')
  expect(store.getState().corpora.appliedMinimum).toBe(0)
})

it('refreshes the same corpus after returning through the updated catalog', async () => {
  const user = userEvent.setup()
  const original = CORPORA_MOCK[0]
  const updated = { ...original, name: 'Пушкин, обновлено в БД', word_count: 60000, image_url: 'http://localhost:9000/corpora/fresh.png?X-Amz-Signature=new' }
  vi.mocked(corpusApi.corpora.getCorpusFeed).mockResolvedValue(response(original))
  vi.mocked(corpusApi.corpora.getCorpora).mockResolvedValue(response({ items: [updated], total: 1, page: 1 }))
  open('/corpora/1')
  await screen.findByRole('heading', { name: original.name })
  await user.click(within(screen.getByRole('navigation', { name: 'Основная навигация' })).getByRole('link', { name: 'Плитка' }))
  const card = await screen.findByRole('link', { name: `Открыть корпус: ${updated.name}` })
  vi.mocked(corpusApi.corpora.getCorpusFeed).mockResolvedValue(response(updated))
  await user.click(card)
  await screen.findByRole('heading', { name: updated.name })
  expect(screen.getByText('60000')).toBeInTheDocument()
  expect(screen.getByLabelText('Видео корпуса')).toHaveAttribute('poster', '/s3/corpora/fresh.png?X-Amz-Signature=new')
})

it('preserves unapplied filter value across page navigation', async () => {
  const user = userEvent.setup()
  open('/corpora')
  const cards = await screen.findAllByRole('link', { name: /^Открыть корпус:/ })
  fireEvent.change(screen.getByRole('slider'), { target: { value: '75000' } })
  await user.click(cards[0])
  await screen.findByRole('heading', { name: CORPORA_MOCK[0].name })
  await user.click(within(screen.getByRole('navigation', { name: 'Основная навигация' })).getByRole('link', { name: 'Плитка' }))
  await screen.findAllByRole('link', { name: /^Открыть корпус:/ })
  expect(screen.getByRole('slider')).toHaveValue('75000')
})

it('previews a selected image before creating a draft and releases object URLs', async () => {
  const createURL = vi.fn().mockReturnValue('blob:corpus-preview')
  const revokeURL = vi.fn()
  vi.stubGlobal('URL', Object.assign(URL, { createObjectURL: createURL, revokeObjectURL: revokeURL }))
  const store = createAppStore()
  store.dispatch(authorSignedIn({ login: 'a', token: 'jwt' }))
  vi.spyOn(corpusApi.corpora, 'getCorpusDraft').mockRejectedValue(new AxiosError('', '', undefined, undefined, { status: 404 } as never))
  open('/corpora/add', store)
  await screen.findByRole('button', { name: 'Создать черновик' })
  const file = new File(['image'], 'portrait.png', { type: 'image/png' })
  fireEvent.change(screen.getByLabelText('Изображение'), { target: { files: [file] } })
  expect(await screen.findByRole('img', { name: 'Предпросмотр изображения корпуса' })).toHaveAttribute('src', 'blob:corpus-preview')
  expect(createURL).toHaveBeenCalledWith(file)
  fireEvent.change(screen.getByLabelText('Изображение'), { target: { files: [] } })
  await waitFor(() => expect(revokeURL).toHaveBeenCalledWith('blob:corpus-preview'))
  vi.unstubAllGlobals()
})
