import { useEffect, useState } from 'react'
import './App.css'
import LooksBanner from './components/LooksBanner'
import Catalog from './components/Catalog'
import CartDrawer from './components/CartDrawer'
import Admin from './components/Admin'
import Institutional from './components/Institutional'
import Login from './components/auth/Login'
import Register from './components/auth/Register'
import AccessibilityWidget from './components/AccessibilityWidget'
import ForgotPassword from './components/auth/ForgotPassword'
import { StoreProvider, useStore, WHATSAPP, INSTAGRAM } from './store'
import React from 'react'

function Shell() {
  const { cart, favs } = useStore()
  const [authPage, setAuthPage] = useState<
    'login' | 'register' | 'forgot' | null
  >(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [cartOpen, setCartOpen] = useState(false)
  const [onlyFavs, setOnlyFavs] = useState(false)
  const [admin, setAdmin] = useState(location.hash === '#admin')

  const close = () => setMenuOpen(false)
  const count = cart.reduce((s, c) => s + c.qty, 0)

  const wa = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(
    'Olá! Vim pelo site da Solar Move.'
  )}`

  useEffect(() => {
    const h = () => setAdmin(location.hash === '#admin')
    window.addEventListener('hashchange', h)

    return () => window.removeEventListener('hashchange', h)
  }, [])

  // Abre a sacola/finalização do pedido quando clicar em "Comprar agora" no produto
  useEffect(() => {
    const handleOpenCheckout = () => {
      setCartOpen(true)
    }

    window.addEventListener('solar-open-checkout', handleOpenCheckout)
    return () => {
      window.removeEventListener('solar-open-checkout', handleOpenCheckout)
    }
  }, [])

  if (admin) return <Admin />
  if (authPage === 'login') {
    return (
      <Login
        onRegister={() => setAuthPage('register')}
        onForgotPassword={() => setAuthPage('forgot')}
        onBack={() => setAuthPage(null)}
        onLogin={() => {
          alert('O login será ativado quando conectarmos o backend.')
        }}
      />
    )
  }

  if (authPage === 'register') {
    return (
      <Register
        onLogin={() => setAuthPage('login')}
        onBack={() => setAuthPage(null)}
        onRegister={() => {
          alert('O cadastro será ativado quando conectarmos o backend.')
        }}
      />
    )
  }

  if (authPage === 'forgot') {
    return (
      <ForgotPassword
        onLogin={() => setAuthPage('login')}
        onBack={() => setAuthPage(null)}
        onSubmitEmail={() => {
          alert('A recuperação por e-mail será ativada no backend.')
        }}
      />
    )
  }
  return (
    <>
      <header className="solar-header">
        <a href="/" className="solar-brand" aria-label="Solar Move">
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
          <button
            className="icon-btn"
            onClick={() => setAuthPage('login')}
          >
            Minha conta
          </button>

          <a href="#admin" className="icon-btn">
            Administração
          </a>
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
          <span className="contact-eyebrow">ESTAMOS AQUI PARA VOCÊ</span>

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

      {/* RODAPÉ SOLAR MOVE */}
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
            <a
              href={wa}
              target="_blank"
              rel="noreferrer"
            >
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