import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { CorpusCard } from '../components/CorpusCard'
import { CorpusFilter } from '../components/CorpusFilter'
import { getCorpora, readCatalogParams } from '../modules/corpora'

export function GridPage() {
  const [params, setParams] = useSearchParams()
  const { minimum, page: requestedPage } = readCatalogParams(params)
  const [value, setValue] = useState(minimum)
  const { items, page, pageCount } = getCorpora(minimum, requestedPage)
  const catalogSearch = params.size ? `?${params}` : ''
  const applyFilter = () => setParams({ query: String(value), page: '1' })
  const pageHref = (target: number) => `/corpora?query=${minimum}&page=${target}`

  return <main className="grid-page" aria-label="Плитка корпусов">
    <CorpusFilter value={value} onChange={setValue} onSubmit={applyFilter} />
    <div className="authors-grid-container">
      {items.map((corpus) => <CorpusCard key={corpus.id} corpus={corpus} catalogSearch={catalogSearch} />)}
      {items.length === 0 && <p className="empty-result" role="status">Корпусы не найдены</p>}
    </div>
    <nav className="corpora-pagination" aria-label="Страницы корпусов">
      {page > 1 && <Link to={pageHref(page - 1)}>Назад</Link>}
      <span>Страница {page} из {pageCount}</span>
      {page < pageCount && <Link to={pageHref(page + 1)}>Далее</Link>}
    </nav>
  </main>
}
