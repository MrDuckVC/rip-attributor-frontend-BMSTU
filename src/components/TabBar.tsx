import { Button, Nav, Navbar } from 'react-bootstrap'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAppSelector, useAppStore } from '../store/hooks'
import { logoutAuthor } from '../store/auth'

export function TabBar({ catalogSearch }: { catalogSearch: string }) {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const store = useAppStore()
  const authenticated = useAppSelector(state => state.author.isAuthenticated)
  const feed = pathname.startsWith('/corpora/') && pathname !== '/corpora/add'
  return <Navbar as="nav" className="navbar" aria-label="Основная навигация">
    <Nav className="tab-items">
      <Nav.Link as={Link} to="/corpora/feed" state={{ catalogSearch }} className={`nav-item ${feed ? 'active' : ''}`} aria-current={feed ? 'page' : undefined}>Лента</Nav.Link>
      {authenticated
        ? <Nav.Link as={Link} to="/corpora/add" className={`nav-item ${pathname === '/corpora/add' ? 'active' : ''}`}>Добавить</Nav.Link>
        : <Button disabled className="nav-item" title="Добавление доступно после входа">Добавить</Button>}
      <Nav.Link as={Link} to={`/corpora${catalogSearch}`} className={`nav-item ${pathname === '/corpora' ? 'active' : ''}`}>Плитка</Nav.Link>
      {authenticated
        ? <Button className="nav-item" onClick={async () => { if (await logoutAuthor(store)) navigate('/corpora') }}>Выход</Button>
        : <Nav.Link as={Link} to="/login" className={`nav-item ${pathname === '/login' ? 'active' : ''}`}>Вход</Nav.Link>}
    </Nav>
  </Navbar>
}
