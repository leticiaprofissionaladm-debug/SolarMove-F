import React from 'react'
import type { Order, OrderStatus } from '../../store'
import { brl } from '../../store'
import './Auth.css'

type AccountProps = {
  name: string
  email: string
  phone: string
  orders: Order[]
  onLogout?: () => void
  onBack?: () => void
  onReviewProduct?: (productId: string) => void
}

const statusLabels: Record<OrderStatus, string> = {
  aguardando_confirmacao: 'Aguardando confirmação',
  aguardando_pagamento: 'Aguardando pagamento',
  pago: 'Pagamento confirmado',
  em_preparacao: 'Em preparação',
  enviado: 'A caminho',
  entregue: 'Entregue em casa',
  cancelado: 'Cancelado',
}

const trackingSteps: { key: OrderStatus; label: string }[] = [
  { key: 'pago', label: 'Confirmado' },
  { key: 'em_preparacao', label: 'Em preparação' },
  { key: 'enviado', label: 'A caminho' },
  { key: 'entregue', label: 'Entregue' },
]

export default function Account({
  name,
  email,
  phone,
  orders,
  onLogout,
  onBack,
  onReviewProduct,
}: AccountProps) {
  return (
    <main className="account-page">
      <header className="account-header">
        <a href="/" className="account-logo">
          <img src="/logo.jpg" alt="Solar Move" />
        </a>

        <div>
          <button
            type="button"
            className="account-header-button"
            onClick={onBack}
          >
            Voltar à loja
          </button>
          <button
            type="button"
            className="account-header-button logout"
            onClick={onLogout}
          >
            Sair da conta
          </button>
        </div>
      </header>

      <section className="account-welcome">
        <span className="auth-eyebrow">ÁREA DO CLIENTE</span>
        <h1>Olá, {name.split(' ')[0]}!</h1>
        <p>Bem-vinda ao seu espaço exclusivo Solar Move.</p>
      </section>

      <div className="account-content">
        <section className="account-card">
          <div className="account-card-heading">
            <div>
              <span className="auth-eyebrow">SEUS DADOS</span>
              <h2>Meu perfil</h2>
            </div>
            <span className="account-profile-icon">SM</span>
          </div>

          <div className="account-info">
            <div>
              <span>Nome completo</span>
              <strong>{name}</strong>
            </div>

            <div>
              <span>E-mail</span>
              <strong>{email}</strong>
            </div>

            <div>
              <span>Telefone</span>
              <strong>{phone || 'Não informado'}</strong>
            </div>
          </div>

          <p className="account-note">
            A edição dos dados estará disponível após a integração
            com o backend.
          </p>
        </section>

        <section className="account-card">
          <div className="account-card-heading">
            <div>
              <span className="auth-eyebrow">ACOMPANHE SUAS COMPRAS</span>
              <h2>Meus pedidos</h2>
            </div>
            <span className="account-order-count">
              {orders.length} {orders.length === 1 ? 'pedido' : 'pedidos'}
            </span>
          </div>

          {orders.length === 0 ? (
            <div className="account-empty">
              <span>♡</span>
              <h3>Você ainda não tem pedidos</h3>
              <p>
                Quando realizar sua primeira compra, ela aparecerá aqui.
              </p>
              <button
                type="button"
                className="auth-submit"
                onClick={onBack}
              >
                Explorar coleção
              </button>
            </div>
          ) : (
            <div className="account-orders">
              {orders.map(order => {
                const activeStepIndex = trackingSteps.findIndex(
                  s => s.key === order.status
                )

                return (
                  <article className="account-order" key={order.id}>
                    <div className="account-order-top">
                      <strong>{order.id}</strong>
                      <span className={`order-status status-${order.status}`}>
                        {statusLabels[order.status] ?? order.status}
                      </span>
                    </div>

                    <p>
                      {new Date(order.createdAt).toLocaleDateString('pt-BR')}
                    </p>

                    {/* LINHA DE ACOMPANHAMENTO DO PEDIDO */}
                    {order.status !== 'cancelado' && (
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(4, 1fr)',
                          gap: 6,
                          margin: '12px 0 14px',
                        }}
                      >
                        {trackingSteps.map((step, idx) => {
                          const reached =
                            activeStepIndex >= 0 && idx <= activeStepIndex
                          return (
                            <div
                              key={step.key}
                              style={{
                                padding: '6px 4px',
                                borderRadius: 4,
                                textAlign: 'center',
                                fontSize: 10.5,
                                fontWeight: reached ? 700 : 500,
                                background: reached ? '#eceee4' : '#f7f6f1',
                                color: reached ? '#2e3514' : '#8c8878',
                                border: reached
                                  ? '1px solid #c5a467'
                                  : '1px solid #e9e7df',
                              }}
                            >
                              {step.label}
                            </div>
                          )
                        })}
                      </div>
                    )}

                    {/* ITENS DO PEDIDO + AVALIAÇÃO QUANDO ENTREGUE */}
                    <div
                      style={{
                        display: 'grid',
                        gap: 8,
                        marginBottom: 12,
                      }}
                    >
                      {order.items.map((item, idx) => (
                        <div
                          key={`${item.productId}-${item.color}-${item.size}-${idx}`}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            gap: 10,
                            fontSize: 12,
                          }}
                        >
                          <span>
                            {item.qty}x {item.productName} ({item.color},{' '}
                            {item.size})
                          </span>

                          {order.status === 'entregue' && (
                            <button
                              type="button"
                              className="auth-text-button"
                              onClick={() => {
                                if (onReviewProduct) {
                                  onReviewProduct(item.productId)
                                } else {
                                  window.location.hash = '#colecao'
                                }
                              }}
                            >
                              Avaliar peça
                            </button>
                          )}
                        </div>
                      ))}
                    </div>

                    <div className="account-order-bottom">
                      <span>
                        {order.items.reduce((sum, item) => sum + item.qty, 0)}
                        {' '}item(ns)
                      </span>
                      <strong>{brl(order.total)}</strong>
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  )
}