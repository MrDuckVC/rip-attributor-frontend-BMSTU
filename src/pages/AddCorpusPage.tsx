import { useEffect, useState } from 'react'
import { Alert, Button, Form } from 'react-bootstrap'
import { Navigate, useNavigate } from 'react-router-dom'
import { CorpusImagePreview } from '../components/CorpusImagePreview'
import { CorpusImage } from '../components/CorpusImage'
import { useAppDispatch, useAppSelector, useAppStore } from '../store/hooks'
import { createCorpusDraft, deleteCorpusDraft, loadCorpusDraft, publishCorpusDraft, setCorpusPublication } from '../store/corpusDraftSlice'

export function AddCorpusPage() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const store = useAppStore()
  const { isAuthenticated, epoch } = useAppSelector(state => state.author)
  const { corpus, publication, error, checked } = useAppSelector(state => state.corpusDraft)
  const [name, setName] = useState('')
  const [image, setImage] = useState<File>()
  const [video, setVideo] = useState<File>()
  useEffect(() => {
    if (!isAuthenticated) return
    const request = dispatch(loadCorpusDraft())
    return () => request.abort()
  }, [dispatch, isAuthenticated, epoch])
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <main className="form-page" aria-label="Добавление корпуса">
    <h1>Добавить корпус</h1>
    {error && <Alert variant="danger">{error}<Button variant="link" onClick={() => dispatch(loadCorpusDraft())}>Повторить получение черновика</Button></Alert>}
    {!checked ? <p>Получение черновика…</p> : !corpus ? <Form onSubmit={event => {
      event.preventDefault()
      dispatch(createCorpusDraft({ name: name.trim(), ...(image ? { image } : {}), ...(video ? { video } : {}) }))
    }}>
      <Form.Group controlId="corpus-image"><Form.Label>Изображение</Form.Label><Form.Control type="file" accept="image/jpeg,image/png,image/gif,image/webp" onChange={event => setImage((event.target as HTMLInputElement).files?.[0])} /></Form.Group>
      <CorpusImagePreview file={image} />
      <Form.Group controlId="corpus-video"><Form.Label>Вертикальное видео</Form.Label><Form.Control type="file" accept="video/mp4,video/webm" onChange={event => setVideo((event.target as HTMLInputElement).files?.[0])} /><Form.Text>MP4 или WebM. Если файлы не выбраны, используются локальные заглушки.</Form.Text></Form.Group>
      <Form.Group controlId="corpus-name"><Form.Label>Название корпуса</Form.Label><Form.Control required maxLength={150} value={name} onChange={event => setName(event.target.value)} /></Form.Group>
      <Button type="submit" disabled={!name.trim() || !!error}>Создать черновик</Button>
    </Form> : <>
      <p className="draft-name">{corpus.name}</p>
      <CorpusImage url={corpus.image_url} name={corpus.name} className="draft-preview" />
      <p className="media-caption">Видео: {corpus.video_url ? 'загружено' : 'по умолчанию'}</p>
      <Form onSubmit={async event => {
        event.preventDefault()
        const result = await dispatch(publishCorpusDraft({ id: corpus.id, publication }))
        if (publishCorpusDraft.fulfilled.match(result) && store.getState().author.epoch === epoch) navigate(`/corpora/${corpus.id}`)
      }}>
        <Form.Group controlId="corpus-description"><Form.Label>Описание</Form.Label><Form.Control as="textarea" required rows={3} value={publication.description} onChange={event => dispatch(setCorpusPublication({ description: event.target.value }))} /></Form.Group>
        <Form.Group controlId="corpus-word-count"><Form.Label>Количество слов</Form.Label><Form.Control type="number" required min={0} max={2147483647} step={1} value={publication.word_count} onChange={event => dispatch(setCorpusPublication({ word_count: Number(event.target.value) }))} /></Form.Group>
        <Form.Group controlId="corpus-prep-percent"><Form.Label>Процент предлогов</Form.Label><Form.Control type="number" required min={0} max={100} step="any" value={publication.prep_percent} onChange={event => dispatch(setCorpusPublication({ prep_percent: Number(event.target.value) }))} /></Form.Group>
        <div className="form-actions"><Button type="submit" disabled={!publication.description.trim()}>Опубликовать</Button><Button variant="outline-danger" onClick={() => dispatch(deleteCorpusDraft(corpus.id))}>Удалить черновик</Button></div>
      </Form>
    </>}
  </main>
}
