import { useEffect, useState } from 'react'
import React from 'react'
import './App.css'

import LooksBanner from './components/LooksBanner'
import Catalog from './components/Catalog'
import CartDrawer from './components/CartDrawer'
import Admin from './components/Admin'
import Institutional from './components/Institutional'
import Login from './components/auth/Login'
import Register from './components/auth/Register'
import ForgotPassword from './components/auth/ForgotPassword'
import AccessibilityWidget from './components/AccessibilityWidget'

import {
  StoreProvider,
  useStore,
  brl,
  WHATSAPP,
  INSTAGRAM,
} from './store'
import type { OrderStatus } from './store'

const customerOrderStatusLabels: Record<OrderStatus, string> = {
  aguardando_confirmacao: 'Aguardando confirmação',
  aguardando_pagamento: 'Aguardando pagamento',
  pago: 'Pago',
  em_preparacao: 'Em preparação',
  enviado: 'Enviado',
  entregue: 'Entregue',
  cancelado: 'Cancelado',
}

function clearHashCleanly() {
  window.history.replaceState(
    null,
    '',
    window.location.pathname + window.location.search
  )
}

function Shell() {
  const {
    cart,
    favs,
    orders,
    loadMyOrders,
    currentCustomer,
    isAdminAuthenticated,
    loginUserAccount,
    registerCustomer,
    registerAdmin,
    logoutCustomer,
  } = useStore()

  const [authPage, setAuthPage] = useState<
    'login' | 'register' | 'forgot' | null
  >(null)

  const [registerRole, setRegisterRole] = useState<'CUSTOMER' | 'ADMIN'>(
    'CUSTOMER'
  )

  const [menuOpen, setMenuOpen] = useState(false)
  const [cartOpen, setCartOpen] = useState(false)
  const [ordersOpen, setOrdersOpen] = useState(false)
  const [onlyFavs, setOnlyFavs] = useState(false)
  const [viewingStore, setViewingStore] = useState(false)

  const [admin, setAdmin] = useState(
    () => window.location.hash === '#admin'
  )

  const close = () => setMenuOpen(false)

  const count = cart.reduce((sum, item) => sum + item.qty, 0)

  const myOrders = currentCustomer
    ? [...orders].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() -
          new Date(a.createdAt).getTime()
      )
    : []

  const wa = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(
    'Olá! Vim pelo site da Solar Move.'
  )}`

  useEffect(() => {
    if (!currentCustomer) return

    loadMyOrders().catch(error => {
      console.error('Erro ao carregar pedidos da cliente:', error)
    })
  }, [currentCustomer])

  useEffect(() => {
    if (
      isAdminAuthenticated &&
      window.location.hash === '#admin' &&
      !viewingStore
    ) {
      setAdmin(true)
      setAuthPage(null)
    }
  }, [isAdminAuthenticated, viewingStore])

  useEffect(() => {
    const handleHashChange = () => {
      const isAdminHash = window.location.hash === '#admin'
      if (isAdminHash) {
        setViewingStore(false)
        setAdmin(true)
        setAuthPage(null)
      } else {
        setAdmin(false)
      }
    }

    window.addEventListener('hashchange', handleHashChange)

    return () => {
      window.removeEventListener('hashchange', handleHashChange)
    }
  }, [])

  useEffect(() => {
    const handleOpenCheckout = () => {
      setCartOpen(true)
    }

    window.addEventListener('solar-open-checkout', handleOpenCheckout)

    return () => {
      window.removeEventListener(
        'solar-open-checkout',
        handleOpenCheckout
      )
    }
  }, [])

  const applyAuthResult = (result: {
    success: boolean
    message: string
    role?: 'ADMIN' | 'CUSTOMER'
  }) => {
    if (!result.success) {
      alert(result.message)
      return
    }

    setAuthPage(null)

    if (result.role === 'ADMIN') {
      setViewingStore(false)
      window.location.hash = '#admin'
      setAdmin(true)
      alert(result.message)
      return
    }

    setViewingStore(false)
    clearHashCleanly()
    setAdmin(false)
    alert(result.message)
  }

  const handleLogin = async (email: string, password: string) => {
    const result = await loginUserAccount(email, password)
    applyAuthResult(result)
  }

  const handleRegister = async (data: {
    name: string
    email: string
    phone: string
    password: string
  }) => {
    const result =
      registerRole === 'ADMIN'
        ? await registerAdmin(data)
        : await registerCustomer(data)

    applyAuthResult(result)
  }

  const handleForgotPassword = (_email: string) => {
    alert(
      'A recuperação de senha ainda precisa ser configurada no backend.'
    )
  }

  const handleExitAdmin = () => {
    clearHashCleanly()
    setAdmin(false)
    setViewingStore(true)
  }

  const handleOpenAdminFromStore = () => {
    setViewingStore(false)
    setAuthPage(null)
    setAdmin(true)
    if (window.location.hash !== '#admin') {
      window.location.hash = '#admin'
    }
  }

  const handleOpenMyOrders = () => {
    setOrdersOpen(true)
    if (currentCustomer) {
      loadMyOrders().catch(error => {
        console.error('Erro ao atualizar meus pedidos:', error)
      })
    }
  }

  if (admin && !viewingStore) {
    return <Admin onBackToStore={handleExitAdmin} />
  }

  if (authPage === 'login') {
    return (
      <Login
        onLogin={handleLogin}
        onRegister={() => {
          setRegisterRole('CUSTOMER')
          setAuthPage('register')
        }}
        onForgotPassword={() => setAuthPage('forgot')}
        onBack={() => setAuthPage(null)}
      />
    )
  }

  if (authPage === 'register') {
    return (
      <Register
        onRegister={handleRegister}
        onLogin={() => setAuthPage('login')}
        onBack={() => setAuthPage(null)}
      />
    )
  }

  if (authPage === 'forgot') {
    return (
      <ForgotPassword
        onLogin={() => setAuthPage('login')}
        onBack={() => setAuthPage('login')}
        onSubmitEmail={handleForgotPassword}
      />
    )
  }

  return (
    <>
      <header className="solar-header">
        <a href="#inicio" className="solar-brand" aria-label="Solar Move">
          <img src="/logo.jpg" alt="Solar Move, moda fitness" />
        </a>

        <nav className={menuOpen ? 'nav-menu active' : 'nav-menu'}>
          <a href="#inicio" onClick={close}>Início</a>
          <a href="#colecao" onClick={close}>Coleção</a>
          <a href="#sobre" onClick={close}>Sobre nós</a>
          <a href="#contato" onClick={close}>Contato</a>
        </nav>

        <div className="header-actions">
          <a
            href="#colecao"
            className="icon-btn"
            onClick={() => setOnlyFavs(true)}
          >
            ♥ <b>{favs.length}</b>
          </a>

          <button
            className="icon-btn"
            onClick={() => setCartOpen(true)}
          >
            Sacola <b>{count}</b>
          </button>

          <button
            className="menu-toggle"
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Abrir menu"
            aria-expanded={menuOpen}
          >
            ☰
          </button>

          {isAdminAuthenticated ? (
            <button
              className="icon-btn"
              type="button"
              onClick={handleOpenAdminFromStore}
              title="Voltar ao painel administrativo"
            >
              Painel Admin
            </button>
          ) : currentCustomer ? (
            <>
              <button
                className="icon-btn"
                type="button"
                onClick={handleOpenMyOrders}
              >
                Meus pedidos <b>{myOrders.length}</b>
              </button>

              <button
                className="icon-btn"
                type="button"
                onClick={() => {
                  setOrdersOpen(false)
                  logoutCustomer()
                  alert('Você saiu da sua conta.')
                }}
                title="Sair da conta"
              >
                Sair ({currentCustomer.name.split(' ')[0]})
              </button>
            </>
          ) : (
            <button
              className="icon-btn"
              type="button"
              onClick={() => setAuthPage('login')}
            >
              Minha conta
            </button>
          )}
        </div>
      </header>

      <main>
        <LooksBanner />

        <Catalog
          onlyFavs={onlyFavs}
          setOnlyFavs={setOnlyFavs}
          onBuyNow={() => setCartOpen(true)}
        />

        {/* SOBRE A MARCA */}
        <section id="sobre" className="about-section">
          <div className="about-inner">
            <span className="about-eyebrow">
              A ESSÊNCIA SOLAR MOVE
            </span>

            <h2>
              Movimento é <em>liberdade.</em>
            </h2>

            <p className="about-description">
              A Solar Move nasceu para acompanhar mulheres que encontram
              no movimento uma forma de expressar sua força e personalidade.
              Peças que unem conforto, estilo e confiança para você se sentir
              bem em cada momento do seu dia.
            </p>

            <div className="brand-values">
              <article className="brand-value">
                <span className="value-number">01</span>
                <h3>Conforto</h3>
                <p>Liberdade para se movimentar e aproveitar cada momento.</p>
              </article>

              <article className="brand-value">
                <span className="value-number">02</span>
                <h3>Estilo</h3>
                <p>Looks que acompanham sua personalidade e seu ritmo.</p>
              </article>

              <article className="brand-value">
                <span className="value-number">03</span>
                <h3>Confiança</h3>
                <p>Sinta-se bem com você em todos os movimentos.</p>
              </article>
            </div>
          </div>
        </section>

        {/* CHAMADA PARA A COLEÇÃO */}
        <section className="brand-cta">
          <div>
            <span>SOLAR MOVE COLLECTION</span>
            <h2>Seu movimento, seu estilo.</h2>
            <p>
              Descubra peças para acompanhar você dentro e fora dos treinos.
            </p>
          </div>

          <a href="#colecao" className="cta-button">
            Explorar coleção
          </a>
        </section>

        <Institutional />

        {/* CONTATO */}
        <section id="contato" className="contact-section">
          <span className="contact-eyebrow">
            ESTAMOS AQUI PARA VOCÊ
          </span>

          <h2>Vamos conversar?</h2>

          <p className="section-lead">
            Precisa de ajuda com tamanhos, cores ou informações sobre
            nossos produtos? Entre em contato com a Solar Move.
          </p>

          <div className="contact-btns">
            <a
              className="solar-button"
              href={wa}
              target="_blank"
              rel="noreferrer"
            >
              Fale pelo WhatsApp
            </a>

            <a
              className="ghost"
              href={INSTAGRAM}
              target="_blank"
              rel="noreferrer"
            >
              Conheça nosso Instagram
            </a>
          </div>
        </section>
      </main>

      {/* RODAPÉ */}
      <footer className="sm-footer">
        <div className="sm-footer-content">
          <div className="sm-footer-brand">
            <a href="#inicio" aria-label="Voltar ao início">
              <img src="/logo.jpg" alt="Solar Move" />
            </a>

            <p>Movimente-se com estilo.</p>

            <a
              href={INSTAGRAM}
              target="_blank"
              rel="noreferrer"
              className="sm-footer-instagram"
            >
              @solarmovefitness
            </a>
          </div>

          <div className="sm-footer-column">
            <h3>INSTITUCIONAL</h3>
            <a href="#sobre">Sobre a Solar Move</a>
            <a href="#politica-privacidade">Política de Privacidade</a>
            <a href="#termos-de-uso">Termos de Uso</a>
            <a href="#trocas-devolucoes">Trocas e Devoluções</a>
          </div>

          <div className="sm-footer-column">
            <h3>ATENDIMENTO</h3>
            <a href="#perguntas-frequentes">Perguntas frequentes</a>
            <a href="#contato">Fale conosco</a>
            <a href={wa} target="_blank" rel="noreferrer">
              WhatsApp
            </a>
          </div>
        </div>

        <div className="sm-footer-bottom">
          <span>
            © {new Date().getFullYear()} Solar Move. Todos os direitos reservados.
          </span>

          <a href="#inicio">Voltar ao início ↑</a>
        </div>
      </footer>

      <a
        className="wa-float"
        href={wa}
        target="_blank"
        rel="noreferrer"
      >
        WhatsApp
      </a>

      <CartDrawer
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        onOpen={() => setCartOpen(true)}
      />

      {ordersOpen && currentCustomer && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.55)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
            zIndex: 999,
          }}
          onClick={() => setOrdersOpen(false)}
        >
          <div
            style={{
              background: '#fff',
              color: '#18181b',
              width: '100%',
              maxWidth: 640,
              maxHeight: '85vh',
              overflowY: 'auto',
              borderRadius: 12,
              padding: 24,
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.25)',
            }}
            onClick={e => e.stopPropagation()}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
                marginBottom: 16,
                borderBottom: '1px solid #e4e4e7',
                paddingBottom: 12,
              }}
            >
              <div>
                <h3 style={{ margin: 0 }}>Meus pedidos</h3>
                <small style={{ color: '#52525b' }}>
                  {currentCustomer.name}
                </small>
              </div>

              <button
                type="button"
                className="ghost"
                onClick={() => setOrdersOpen(false)}
              >
                Fechar
              </button>
            </div>

            {myOrders.length === 0 ? (
              <p style={{ color: '#52525b', margin: '16px 0' }}>
                Você ainda não realizou nenhum pedido por aqui.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {myOrders.map(order => (
                  <article
                    key={order.id}
                    style={{
                      border: '1px solid #e4e4e7',
                      borderRadius: 10,
                      padding: 14,
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'baseline',
                        gap: 8,
                        marginBottom: 8,
                      }}
                    >
                      <strong>{order.code || order.id}</strong>
                      <span>
                        {customerOrderStatusLabels[order.status] ??
                          order.status}
                      </span>
                    </div>

                    <div
                      style={{
                        fontSize: 13,
                        color: '#52525b',
                        marginBottom: 10,
                      }}
                    >
                      {new Date(order.createdAt).toLocaleString('pt-BR')} ·{' '}
                      <strong>{brl(order.total)}</strong>
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 6,
                        fontSize: 14,
                      }}
                    >
                      {order.items.map((item, idx) => (
                        <div
                          key={`${item.productId}-${item.color}-${item.size}-${idx}`}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            gap: 8,
                          }}
                        >
                          <span>
                            {item.qty}x {item.productName} ({item.color},{' '}
                            {item.size})
                          </span>
                          <span>{brl(item.price * item.qty)}</span>
                        </div>
                      ))}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}

export default function App() {
  return (
    <>
      <StoreProvider>
        <Shell />
      </StoreProvider>

      <AccessibilityWidget />
    </>
  )
}