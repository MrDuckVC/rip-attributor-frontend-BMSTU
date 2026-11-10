import { useEffect, useState } from 'react'
import { Button } from 'react-bootstrap'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { CorpusVideo } from '../components/CorpusVideo'
import { Icon } from '../components/Icons'
import { useAppDispatch, useAppSelector, useAppStore } from '../store/hooks'
import { likeCorpus, loadCorpusFeed } from '../store/corporaSlice'

export function FeedPage({ catalogSearch }: { catalogSearch: string }) {
  const { id } = useParams()
  const dispatch = useAppDispatch()
  const store = useAppStore()
  const navigate = useNavigate()
  const { isAuthenticated, epoch } = useAppSelector(state => state.author)
  const { feed: corpus, feedError, feedStatus, feedSource } = useAppSelector(state => state.corpora)
  const [expanded, setExpanded] = useState(false)
  const validID = id === undefined || /^[1-9]\d*$/.test(id) && Number.isSafeInteger(Number(id))
  useEffect(() => {
    if (!validID) return
    const request = dispatch(loadCorpusFeed(id === undefined ? {} : { id: Number(id) }))
    return () => request.abort()
  }, [dispatch, id, epoch, validID])
  if (!validID || feedStatus === 404) return <main className="not-found"><h1>Корпус не найден</h1><Link to="/corpora">К плитке</Link></main>
  if (feedError) return <main className="not-found"><p role="alert">{feedError}</p><Button onClick={() => dispatch(loadCorpusFeed(id ? { id: Number(id) } : {}))}>Повторить</Button></main>
  if (!corpus) return <main aria-label="Лента корпусов" />
  const next = async () => {
    const result = await dispatch(loadCorpusFeed({ id: corpus.id, next: true }))
    if (loadCorpusFeed.fulfilled.match(result) && store.getState().author.epoch === epoch) {
      setExpanded(false)
      navigate(`/corpora/${result.payload.corpus.id}`, { state: { catalogSearch } })
    }
  }
  return <main aria-label="Лента корпусов">
    <CorpusVideo key={corpus.id} videoUrl={corpus.video_url} imageUrl={corpus.image_url} name={corpus.name} />
    {feedSource === 'mock' && <p className="feed-data-source">Демонстрационные данные</p>}
    <div className="feed-info">
      <h2 className="feed-info-title">{corpus.name}</h2>
      <button type="button" className={`feed-info-desc ${expanded ? 'is-expanded' : ''}`} aria-expanded={expanded} onClick={() => setExpanded(!expanded)} title="Развернуть или свернуть описание">
        {corpus.description}<span className="feed-info-more">{expanded ? 'свернуть' : 'ещё'}</span>
      </button>
    </div>
    <div className="feed-sidebar">
      <div className="sidebar-item">
        <Button disabled={!isAuthenticated} className={`circle-btn ${corpus.is_liked ? 'is-liked' : ''}`} aria-label={!isAuthenticated ? 'Лайк — требуется вход' : corpus.is_liked ? 'Снять лайк' : 'Поставить лайк'} onClick={() => dispatch(likeCorpus({ id: corpus.id, like: corpus.is_liked ? 0 : 1 }))}><Icon name="heart" /></Button>
        <span className="sidebar-text">{corpus.likes_count}</span>
      </div>
      <div className="sidebar-item"><div className="circle-btn"><span className="inner-text">СЛОВ</span></div><span className="sidebar-text">{corpus.word_count}</span></div>
      <div className="sidebar-item"><div className="circle-btn"><span className="inner-text">ПРЕД</span></div><span className="sidebar-text">{corpus.prep_percent ?? '—'}{corpus.prep_percent === null ? '' : '%'}</span></div>
      <Button className="sidebar-item next-corpus" onClick={next} aria-label="Следующий корпус" title="Следующий корпус"><span className="circle-btn"><Icon name="next" /></span></Button>
    </div>
  </main>
}
