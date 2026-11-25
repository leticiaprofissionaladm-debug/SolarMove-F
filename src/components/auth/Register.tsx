
import { useState } from 'react'
import React from 'react'
import './Auth.css'

type RegisterProps = {
  onRegister?: (data: {
    name: string
    email: string
    phone: string
    password: string
  }) => void
  onLogin?: () => void
  onBack?: () => void
}

export default function Register({
  onRegister,
  onLogin,
  onBack,
}: RegisterProps) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')

    if (password.length < 8) {
      setError('A senha precisa ter pelo menos 8 caracteres.')
      return
    }

    if (password !== confirmPassword) {
      setError('As senhas não coincidem.')
      return
    }

    onRegister?.({
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      password,
    })
  }

  return (
    <main className="auth-page">
      <section className="auth-image">
        <img src="/logo.jpg" alt="Solar Move" />

        <div className="auth-image-content">
          <span>SOLAR MOVE</span>
          <h1>Faça parte<br />desse movimento.</h1>
          <p>
            Crie sua conta e tenha uma experiência ainda mais completa
            com a Solar Move.
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

          <span className="auth-eyebrow">VENHA PARA A SOLAR MOVE</span>
          <h2>Crie sua conta</h2>
          <p className="auth-description">
            Preencha seus dados para começar.
          </p>

          <form onSubmit={handleSubmit} className="auth-form">
            <label htmlFor="register-name">Nome completo</label>
            <input
              id="register-name"
              type="text"
              placeholder="Digite seu nome"
              value={name}
              onChange={e => setName(e.target.value)}
              autoComplete="name"
              required
            />

            <label htmlFor="register-email">E-mail</label>
            <input
              id="register-email"
              type="email"
              placeholder="seuemail@exemplo.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              autoComplete="email"
              required
            />

            <label htmlFor="register-phone">Telefone / WhatsApp</label>
            <input
              id="register-phone"
              type="tel"
              placeholder="(21) 99999-9999"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              autoComplete="tel"
              required
            />

            <label htmlFor="register-password">Senha</label>
            <div className="auth-password-field">
              <input
                id="register-password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Mínimo de 8 caracteres"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete="new-password"
                minLength={8}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? 'Ocultar' : 'Mostrar'}
              </button>
            </div>

            <label htmlFor="register-confirm">
              Confirmar senha
            </label>
            <input
              id="register-confirm"
              type={showPassword ? 'text' : 'password'}
              placeholder="Digite a senha novamente"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              required
            />

            {error && (
              <p className="auth-error" role="alert">{error}</p>
            )}

            <button type="submit" className="auth-submit">
              Criar minha conta
            </button>
          </form>

          <p className="auth-register" style={{ marginTop: 25 }}>
            Já possui uma conta?
            <button type="button" onClick={onLogin}>
              Fazer login
            </button>
          </p>

          <p className="auth-terms">
            Seus dados serão utilizados para gerenciar sua conta
            e suas compras na Solar Move.
          </p>
        </div>
      </section>
    </main>
  )
}
