
import { useState } from 'react'
import React from 'react'
import './Auth.css'

type LoginProps = {
  onLogin?: (email: string, password: string) => void
  onRegister?: () => void
  onForgotPassword?: () => void
  onBack?: () => void
}

export default function Login({
  onLogin,
  onRegister,
  onForgotPassword,
  onBack,
}: LoginProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')

    if (!email.trim() || !password) {
      setError('Preencha seu e-mail e sua senha.')
      return
    }

    onLogin?.(email.trim(), password)
  }

  return (
    <main className="auth-page">
      <section className="auth-image">
        <img src="/logo.jpg" alt="Solar Move" />

        <div className="auth-image-content">
          <span>SOLAR MOVE</span>
          <h1>Seu movimento,<br />seu estilo.</h1>
          <p>
            Entre para sua conta e acompanhe sua jornada com a gente.
          </p>
        </div>
      </section>

      <section className="auth-content">
        <div className="auth-form-container">
          <button
            type="button"
            className="auth-back"
            onClick={onBack}
          >
            ← Voltar para a loja
          </button>

          <span className="auth-eyebrow">BEM-VINDA DE VOLTA</span>
          <h2>Entre na sua conta</h2>
          <p className="auth-description">
            Acesse sua conta para acompanhar seus pedidos e aproveitar
            sua experiência Solar Move.
          </p>

          <form onSubmit={handleSubmit} className="auth-form">
            <label htmlFor="login-email">E-mail</label>
            <input
              id="login-email"
              type="email"
              placeholder="seuemail@exemplo.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              autoComplete="email"
              required
            />

            <div className="auth-password-heading">
              <label htmlFor="login-password">Senha</label>
              <button
                type="button"
                onClick={onForgotPassword}
                className="auth-text-button"
              >
                Esqueceu a senha?
              </button>
            </div>

            <div className="auth-password-field">
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Digite sua senha"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
              >
                {showPassword ? 'Ocultar' : 'Mostrar'}
              </button>
            </div>

            {error && (
              <p className="auth-error" role="alert">{error}</p>
            )}

            <button type="submit" className="auth-submit">
              Entrar na minha conta
            </button>
          </form>

          <div className="auth-divider">
            <span>OU</span>
          </div>

          <p className="auth-register">
            Ainda não tem uma conta?
            <button type="button" onClick={onRegister}>
              Criar minha conta
            </button>
          </p>

          <p className="auth-terms">
            Ao continuar, você concorda com os termos e a política
            de privacidade da Solar Move.
          </p>
        </div>
      </section>
    </main>
  )
}
