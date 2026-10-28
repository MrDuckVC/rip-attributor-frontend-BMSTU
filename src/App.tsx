import { useEffect } from 'react'
import { Link, Navigate, Route, Routes, useLocation, useParams } from 'react-router-dom'
import { TabBar } from './components/TabBar'
import { getCorpusById } from './modules/corpora'
import { FeedPage } from './pages/FeedPage'
import { GridPage } from './pages/GridPage'

function FeedRoute({ catalogSearch }: { catalogSearch: string }) {
  const { id } = useParams()
  const corpus = getCorpusById(id)
  return corpus
    ? <FeedPage key={corpus.id} corpus={corpus} catalogSearch={catalogSearch} />
    : <main className="not-found"><h1>Корпус не найден</h1><Link to="/corpora">К плитке</Link></main>
}

export default function App() {
  const location = useLocation()
  const isFeed = location.pathname.startsWith('/corpora/')
  const state = location.state as { catalogSearch?: string } | null
  const catalogSearch = location.pathname === '/corpora' ? location.search : state?.catalogSearch ?? ''

  useEffect(() => {
    document.title = `Атрибутор — ${isFeed ? 'Лента' : 'Плитка'}`
  }, [isFeed])

  return <div className="app-shell">
    <header className="header"><Link to={`/corpora${catalogSearch}`} className="logo">Атрибутор</Link></header>
    <Routes>
      <Route path="/corpora" element={<GridPage key={location.search} />} />
      <Route path="/corpora/:id" element={<FeedRoute catalogSearch={catalogSearch} />} />
      <Route path="*" element={<Navigate to="/corpora" replace />} />
    </Routes>
    <TabBar isFeed={isFeed} catalogSearch={catalogSearch} />
  </div>
}
