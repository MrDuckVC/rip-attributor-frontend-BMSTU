import { Button, Card } from 'react-bootstrap'
import { Link } from 'react-router-dom'
import type { Corpus } from '../modules/types'
import { CorpusImage } from './CorpusImage'
import { Icon } from './Icons'

interface Props { corpus: Corpus; catalogSearch: string }

export function CorpusCard({ corpus, catalogSearch }: Props) {
  return <div className="author-card-wrapper">
    <Card as={Link} to={`/corpora/${corpus.id}`} state={{ catalogSearch }} className="author-card" aria-label={`Открыть корпус: ${corpus.name}`}>
      <CorpusImage url={corpus.image_url} name={corpus.name} />
      <Card.Title as="h3" className="card-title">{corpus.name}</Card.Title>
      <div className="card-words">{corpus.word_count} слов</div>
      <div className="card-likes"><Icon name="heart" outline /><span>{corpus.likes_count}</span></div>
    </Card>
    <div className="card-delete-form">
      <Button disabled className="btn-delete" aria-label="Удалить корпус — требуется вход" title="Удаление доступно после входа"><Icon name="trash" /></Button>
    </div>
  </div>
}
