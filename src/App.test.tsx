import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import App from './App'
import { CORPORA_MOCK } from './modules/mock'
import { CorpusImage } from './components/CorpusImage'
import { CorpusVideo } from './components/CorpusVideo'

const open = (path = '/corpora') => render(<MemoryRouter initialEntries={[path]}><App /></MemoryRouter>)

describe('гостевое приложение', () => {
  it('показывает две доступные вкладки и два отключённых пункта', () => {
    open()
    const navigation = screen.getByRole('navigation', { name: 'Основная навигация' })
    expect(within(navigation).getAllByRole('link')).toHaveLength(2)
    expect(within(navigation).getByRole('button', { name: 'Добавить' })).toBeDisabled()
    expect(within(navigation).getByRole('button', { name: 'Вход' })).toBeDisabled()
    expect(screen.getAllByRole('button', { name: 'Удалить корпус — требуется вход' })[0]).toBeDisabled()
  })

  it('применяет фильтр кнопкой, сбрасывает страницу и оставляет пустой результат пустым', async () => {
    const user = userEvent.setup()
    open('/corpora?page=2')
    expect(screen.getByText('Страница 2 из 2')).toBeInTheDocument()
    fireEvent.change(screen.getByRole('slider'), { target: { value: '50000' } })
    expect(screen.getByText('Страница 2 из 2')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Применить фильтр' }))
    expect(screen.getByText('Страница 1 из 1')).toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: /^Открыть корпус:/ })).toHaveLength(5)
    fireEvent.change(screen.getByRole('slider'), { target: { value: '200000' } })
    await user.click(screen.getByRole('button', { name: 'Применить фильтр' }))
    expect(screen.getByText('Корпусы не найдены')).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /^Открыть корпус:/ })).not.toBeInTheDocument()
  })

  it('открывает выбранный корпус и следующий по порядку, возвращается к первому', async () => {
    const user = userEvent.setup()
    open(`/corpora/${CORPORA_MOCK.at(-1)!.id}`)
    expect(screen.getByRole('heading', { name: CORPORA_MOCK.at(-1)!.name })).toBeInTheDocument()
    await user.click(screen.getByRole('link', { name: 'Следующий корпус' }))
    expect(screen.getByRole('heading', { name: CORPORA_MOCK[0].name })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Лайк — требуется вход' })).toBeDisabled()
  })

  it('открывает карточку без перезагрузки и сохраняет фильтр при возврате', async () => {
    const user = userEvent.setup()
    open('/corpora?query=50000')
    await user.click(screen.getAllByRole('link', { name: /^Открыть корпус:/ })[0])
    expect(screen.getByRole('heading', { name: CORPORA_MOCK[3].name })).toBeInTheDocument()
    await user.click(within(screen.getByRole('navigation', { name: 'Основная навигация' })).getByRole('link', { name: 'Плитка' }))
    expect(screen.getByRole('slider')).toHaveValue('50000')
  })

  it('использует локальные медиа при пустых полях и ошибках загрузки', () => {
    open('/corpora/1')
    const video = screen.getByLabelText('Видео корпуса')
    expect(video).toHaveAttribute('src', '/media/puskin.mp4')
    expect(video).toHaveAttribute('poster', '/media/puskin.png')
    fireEvent.error(video)
    expect(screen.getByRole('img', { name: CORPORA_MOCK[0].name })).toHaveAttribute('src', '/media/puskin.png')
  })

  it('подменяет сломанное изображение и показывает локальную заглушку пустого', () => {
    open()
    const images = screen.getAllByRole('img')
    expect(images[0]).toHaveAttribute('src', '/media/puskin.png')
    fireEvent.error(images[1])
    expect(images[1]).toHaveAttribute('src', '/media/puskin.png')
  })

  it('заменяет недоступный пользовательский URL локальным изображением', () => {
    render(<CorpusImage url="/missing.png" name="Тестовый корпус" />)
    const image = screen.getByRole('img')
    expect(image).toHaveAttribute('src', '/missing.png')
    fireEvent.error(image)
    expect(image).toHaveAttribute('src', '/media/puskin.png')
  })

  it('после отказа пользовательского видео пробует дефолтное, затем изображение', () => {
    render(<CorpusVideo videoUrl="/missing.mp4" imageUrl="" name="Тестовый корпус" />)
    const video = screen.getByLabelText('Видео корпуса')
    expect(video).toHaveAttribute('src', '/missing.mp4')
    fireEvent.error(video)
    const defaultVideo = screen.getByLabelText('Видео корпуса')
    expect(defaultVideo).toHaveAttribute('src', '/media/puskin.mp4')
    fireEvent.error(defaultVideo)
    expect(screen.getByRole('img')).toHaveAttribute('src', '/media/puskin.png')
    expect(screen.getByRole('img')).not.toHaveClass('card-img')
  })

  it('обрабатывает неизвестный ID и обновляет заголовок страницы', () => {
    open('/corpora/99999')
    expect(screen.getByRole('heading', { name: 'Корпус не найден' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'К плитке' })).toHaveAttribute('href', '/corpora')
    expect(document.title).toBe('Атрибутор — Лента')
  })
})
