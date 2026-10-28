import { Button, Nav, Navbar } from 'react-bootstrap'
import { Link } from 'react-router-dom'
import { CORPORA_MOCK } from '../modules/mock'

interface Props { isFeed: boolean; catalogSearch: string }

export function TabBar({ isFeed, catalogSearch }: Props) {
  return <Navbar as="nav" className="navbar" aria-label="Основная навигация">
    <Nav className="tab-items">
      <Nav.Link as={Link} to={`/corpora/${CORPORA_MOCK[0].id}`} state={{ catalogSearch }} className={`nav-item ${isFeed ? 'active' : ''}`} aria-current={isFeed ? 'page' : undefined}>Лента</Nav.Link>
      <Button disabled className="nav-item" title="Добавление доступно в следующих лабораторных">Добавить</Button>
      <Nav.Link as={Link} to={`/corpora${catalogSearch}`} className={`nav-item ${!isFeed ? 'active' : ''}`} aria-current={!isFeed ? 'page' : undefined}>Плитка</Nav.Link>
      <Button disabled className="nav-item" title="Вход доступен в следующих лабораторных">Вход</Button>
    </Nav>
  </Navbar>
}
