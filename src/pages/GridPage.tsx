import { useEffect, useRef } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { CorpusCard } from '../components/CorpusCard'
import { CorpusFilter } from '../components/CorpusFilter'
import { PAGE_SIZE, readCatalogParams } from '../modules/corpora'
import { selectBusy, useAppDispatch, useAppSelector } from '../store/hooks'
import { loadCorpora, setCorpusMinimum, syncCorpusCatalog } from '../store/corporaSlice'

export function GridPage() {
  const [params, setParams] = useSearchParams()
  const { minimum, page: requestedPage } = readCatalogParams(params)
  const dispatch = useAppDispatch()
  const { epoch, isAuthenticated } = useAppSelector(state => state.author)
  const previousAuthor = useRef({ epoch, isAuthenticated })
  const { minimum: value, items, page, total, error, source } = useAppSelector(state => state.corpora)
  const busy = useAppSelector(selectBusy)
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE))
  useEffect(() => {
    const signedOut = previousAuthor.current.isAuthenticated && !isAuthenticated && previousAuthor.current.epoch !== epoch
    previousAuthor.current = { epoch, isAuthenticated }
    if (signedOut && (minimum !== 0 || requestedPage !== 1)) {
      setParams({}, { replace: true })
      return
    }
    dispatch(syncCorpusCatalog({ minimum, page: requestedPage }))
    const request = dispatch(loadCorpora())
    return () => request.abort()
  }, [dispatch, minimum, requestedPage, epoch, isAuthenticated, setParams])
  useEffect(() => {
    if (!busy && !error && source && page > pageCount) {
      setParams({ query: String(minimum), page: String(pageCount) }, { replace: true })
    }
  }, [busy, error, source, page, pageCount, minimum, setParams])
  const catalogSearch = `?query=${minimum}&page=${requestedPage}`
  const pageHref = (target: number) => `/corpora?query=${minimum}&page=${target}`
  return <main className="grid-page" aria-label="Плитка корпусов">
    <CorpusFilter value={value} onChange={value => dispatch(setCorpusMinimum(value))} onSubmit={() => {
      if (minimum === value && requestedPage === 1) dispatch(loadCorpora())
      else setParams({ query: String(value), page: '1' })
    }} />
    {source === 'mock' && <p className="data-source" role="status">Сервис недоступен · демонстрационные данные</p>}
    <div className="authors-grid-container">
      {items.map(corpus => <CorpusCard key={corpus.id} corpus={corpus} catalogSearch={catalogSearch} />)}
      {!busy && !error && items.length === 0 && <p className="empty-result" role="status">Корпусы не найдены</p>}
    </div>
    <nav className="corpora-pagination" aria-label="Страницы корпусов">
      {page > 1 && <Link to={pageHref(page - 1)}>Назад</Link>}
      <span>Страница {page} из {pageCount}</span>
      {page < pageCount && <Link to={pageHref(page + 1)}>Далее</Link>}
    </nav>
  </main>
}
