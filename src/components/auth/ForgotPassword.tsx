
import { useState } from 'react'
import React from 'react'
import './Auth.css'

type ForgotPasswordProps = {
  onSubmitEmail?: (email: string) => void
  onLogin?: () => void
  onBack?: () => void
}

export default function ForgotPassword({
  onSubmitEmail,
  onLogin,
  onBack,
}: ForgotPasswordProps) {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')

    if (!email.trim()) {
      setError('Informe seu endereço de e-mail.')
      return
    }

    onSubmitEmail?.(email.trim())
    setSent(true)
  }

  return (
    <main className="auth-page">
      <section className="auth-image">
        <img src="/logo.jpg" alt="Solar Move" />

        <div className="auth-image-content">
          <span>SOLAR MOVE</span>
          <h1>Estamos aqui<br />para ajudar.</h1>
          <p>
            Recupere seu acesso e continue acompanhando
            suas compras com a Solar Move.
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

          <span className="auth-eyebrow">RECUPERE SEU ACESSO</span>
          <h2>Esqueceu sua senha?</h2>

          {!sent ? (
            <>
              <p className="auth-description">
                Informe o e-mail utilizado no cadastro.
                Enviaremos as instruções para redefinir sua senha.
              </p>

              <form onSubmit={handleSubmit} className="auth-form">
                <label htmlFor="forgot-email">E-mail cadastrado</label>

                <input
                  id="forgot-email"
                  type="email"
                  placeholder="seuemail@exemplo.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                />

                {error && (
                  <p className="auth-error" role="alert">{error}</p>
                )}

                <button type="submit" className="auth-submit">
                  Solicitar recuperação
                </button>
              </form>
            </>
          ) : (
            <div className="auth-success" role="status">
              <div className="auth-success-icon">✓</div>
              <h3>Solicitação registrada!</h3>
              <p>
                A solicitação para <strong>{email}</strong> foi registrada.
                Quando a recuperação estiver integrada ao sistema,
                você receberá as instruções por e-mail.
              </p>
              <button
                type="button"
                className="auth-submit"
                onClick={onLogin}
              >
                Voltar para o login
              </button>
            </div>
          )}

          {!sent && (
            <p className="auth-register" style={{ marginTop: 30 }}>
              Lembrou sua senha?
              <button type="button" onClick={onLogin}>
                Fazer login
              </button>
            </p>
          )}

          <p className="auth-terms">
            Sua segurança é importante para nós.
          </p>
        </div>
      </section>
    </main>
  )
}
