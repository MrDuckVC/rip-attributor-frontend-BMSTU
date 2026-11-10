import { Button, Card } from 'react-bootstrap'
import { Link } from 'react-router-dom'
import type { Corpus } from '../modules/types'
import { CorpusImage } from './CorpusImage'
import { Icon } from './Icons'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import { loadCorpora, removeCorpus } from '../store/corporaSlice'

interface Props { corpus: Corpus; catalogSearch: string }

export function CorpusCard({ corpus, catalogSearch }: Props) {
  const dispatch = useAppDispatch()
  const authenticated = useAppSelector(state => state.author.isAuthenticated)
  const canDelete = authenticated && corpus.is_owner === 1
  const remove = async () => {
    const result = await dispatch(removeCorpus(corpus.id))
    if (removeCorpus.fulfilled.match(result)) await dispatch(loadCorpora())
  }
  return <div className="author-card-wrapper">
    <Card as={Link} to={`/corpora/${corpus.id}`} state={{ catalogSearch }} className="author-card" aria-label={`Открыть корпус: ${corpus.name}`}>
      <CorpusImage url={corpus.image_url} name={corpus.name} />
      <Card.Title as="h3" className="card-title">{corpus.name}</Card.Title>
      <div className="card-words">{corpus.word_count} слов</div>
      <div className="card-likes"><Icon name="heart" outline /><span>{corpus.likes_count}</span></div>
    </Card>
    <div className="card-delete-form">
      <Button disabled={!canDelete} className="btn-delete" aria-label={canDelete ? `Удалить корпус: ${corpus.name}` : authenticated ? "Удалить корпус — только владелец" : "Удалить корпус — требуется вход"} title={canDelete ? "Удалить корпус" : "Удаление доступно только владельцу"} onClick={remove}><Icon name="trash" /></Button>
    </div>
  </div>
}
