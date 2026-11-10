import { useState } from 'react'
import { Alert, Button, Form } from 'react-bootstrap'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAppSelector, useAppStore } from '../store/hooks'
import { loginAuthor } from '../store/auth'

export function LoginPage() {
  const [login, setLogin] = useState('')
  const [password, setPassword] = useState('')
  const store = useAppStore()
  const navigate = useNavigate()
  const { isAuthenticated, error } = useAppSelector(state => state.author)
  if (isAuthenticated) return <Navigate to="/corpora" replace />
  return <main className="form-page" aria-label="Авторизация">
    <h1>Вход</h1>
    {error && <Alert variant="danger">{error}</Alert>}
    <Form onSubmit={async event => {
      event.preventDefault()
      if (await loginAuthor(store, { login: login.trim(), password })) navigate('/corpora', { replace: true })
    }}>
      <Form.Group controlId="author-login"><Form.Label>Логин</Form.Label><Form.Control required maxLength={25} autoComplete="username" value={login} onChange={event => setLogin(event.target.value)} /></Form.Group>
      <Form.Group controlId="author-password"><Form.Label>Пароль</Form.Label><Form.Control required type="password" autoComplete="current-password" value={password} onChange={event => setPassword(event.target.value)} /></Form.Group>
      <Button type="submit" disabled={!login.trim() || !password}>Войти</Button>
    </Form>
  </main>
}
