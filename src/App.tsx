import { useEffect } from 'react'
import { Alert, Button, Spinner } from 'react-bootstrap'
import { Link, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { TabBar } from './components/TabBar'
import { FeedPage } from './pages/FeedPage'
import { GridPage } from './pages/GridPage'
import { LoginPage } from './pages/LoginPage'
import { AddCorpusPage } from './pages/AddCorpusPage'
import { selectBusy, useAppDispatch, useAppSelector } from './store/hooks'
import { clearCorpusError, loadCorpora } from './store/corporaSlice'

export default function App() {
  const location = useLocation()
  const dispatch = useAppDispatch()
  const { appliedMinimum, page, error } = useAppSelector(state => state.corpora)
  const { login, error: authorError } = useAppSelector(state => state.author)
  const busy = useAppSelector(selectBusy)
  const catalogSearch = `?query=${appliedMinimum}&page=${page}`
  const title = location.pathname === '/login' ? 'Вход' : location.pathname === '/corpora/add' ? 'Добавление' : location.pathname === '/corpora' ? 'Плитка' : 'Лента'
  useEffect(() => { document.title = `Атрибутор — ${title}` }, [title])
  return <div className="app-shell" aria-busy={busy}>
    <fieldset className="app-content" disabled={busy} inert={busy}>
      <header className="header"><Link to={`/corpora${catalogSearch}`} className="logo">Атрибутор</Link>{login && <span className="author-login" title={login}>{login}</span>}</header>
      <Routes>
        <Route path="/corpora" element={<GridPage />} />
        <Route path="/corpora/add" element={<AddCorpusPage />} />
        <Route path="/corpora/feed" element={<FeedPage catalogSearch={catalogSearch} />} />
        <Route path="/corpora/:id" element={<FeedPage catalogSearch={catalogSearch} />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<Navigate to="/corpora" replace />} />
      </Routes>
      {(error || (authorError && location.pathname !== '/login')) && <Alert variant="danger" className="request-error" role="alert">
        {error || authorError}
        {error && <Button variant="link" onClick={() => { dispatch(clearCorpusError()); if (location.pathname === '/corpora') dispatch(loadCorpora()) }}>Понятно{location.pathname === '/corpora' ? ' / Повторить' : ''}</Button>}
      </Alert>}
      <TabBar catalogSearch={catalogSearch} />
    </fieldset>
    {busy && <div className="loading-overlay" role="status" aria-label="Загрузка"><Spinner animation="border" /><span>Загрузка…</span></div>}
  </div>
}
