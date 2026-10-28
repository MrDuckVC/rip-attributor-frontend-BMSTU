import { useState } from 'react'
import { Button } from 'react-bootstrap'
import { Link } from 'react-router-dom'
import type { Corpus } from '../modules/types'
import { getNextCorpus } from '../modules/corpora'
import { CorpusVideo } from '../components/CorpusVideo'
import { Icon } from '../components/Icons'

interface Props { corpus: Corpus; catalogSearch: string }

export function FeedPage({ corpus, catalogSearch }: Props) {
  const [expanded, setExpanded] = useState(false)
  const next = getNextCorpus(corpus.id)!

  return <main aria-label="Лента корпусов">
    <CorpusVideo videoUrl={corpus.video_url} imageUrl={corpus.image_url} name={corpus.name} />
    <div className="feed-info">
      <h2 className="feed-info-title">{corpus.name}</h2>
      <button type="button" className={`feed-info-desc ${expanded ? 'is-expanded' : ''}`} aria-expanded={expanded} onClick={() => setExpanded(!expanded)} title="Развернуть или свернуть описание">
        {corpus.description}<span className="feed-info-more">{expanded ? 'свернуть' : 'ещё'}</span>
      </button>
    </div>
    <div className="feed-sidebar">
      <div className="sidebar-item">
        <Button disabled className="circle-btn" aria-label="Лайк — требуется вход" title="Лайк доступен после входа"><Icon name="heart" /></Button>
        <span className="sidebar-text">{corpus.likes_count}</span>
      </div>
      <div className="sidebar-item"><div className="circle-btn"><span className="inner-text">СЛОВ</span></div><span className="sidebar-text">{corpus.word_count}</span></div>
      <div className="sidebar-item"><div className="circle-btn"><span className="inner-text">ПРЕД</span></div><span className="sidebar-text">{corpus.prep_percent ?? '—'}{corpus.prep_percent === null ? '' : '%'}</span></div>
      <Link to={`/corpora/${next.id}`} state={{ catalogSearch }} className="sidebar-item" aria-label="Следующий корпус" title="Следующий корпус"><div className="circle-btn"><Icon name="next" /></div></Link>
    </div>
  </main>
}
