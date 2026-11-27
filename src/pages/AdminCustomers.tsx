import { useEffect, useState } from 'react'
import { apiRequest } from '../services/api' // ajuste o caminho se seu api.ts estiver em outra pasta
import { brl } from '../store'
import React from 'react'

interface CustomerOrder {
  id: number | string
  total: number
  status: string
  createdAt: string
}

interface Customer {
  id: number | string
  name: string
  email: string
  phone?: string | null
  createdAt: string
  orders?: CustomerOrder[]
}

export default function AdminCustomers() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selected, setSelected] = useState<Customer | null>(null)

  useEffect(() => {
    let active = true

    async function loadCustomers() {
      try {
        setLoading(true)
        setError('')
        const data = await apiRequest('/users', {}, 'admin')
        if (!active) return
        const list = Array.isArray(data) ? data : data?.data || []
        setCustomers(list)
      } catch (err) {
        if (!active) return
        setError(
          err instanceof Error
            ? err.message
            : 'Não foi possível carregar as clientes.'
        )
      } finally {
        if (active) setLoading(false)
      }
    }

    loadCustomers()

    return () => {
      active = false
    }
  }, [])

  if (loading) {
    return (
      <div className="admin-content-card">
        <div className="admin-empty-state">Carregando clientes...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="admin-content-card">
        <div className="admin-empty-state">{error}</div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="admin-page-heading">
        <div>
          <span className="solar-highlight">SOLAR MOVE</span>
          <h2>Clientes</h2>
          <p>
            {customers.length}{' '}
            {customers.length === 1
              ? 'cliente cadastrada'
              : 'clientes cadastradas'}
          </p>
        </div>
      </div>

      {customers.length === 0 ? (
        <div className="admin-content-card">
          <div className="admin-empty-state">
            Nenhuma cliente cadastrada até o momento.
          </div>
        </div>
      ) : (
        <div className="admin-content-card">
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Telefone</th>
                  <th>Cadastro</th>
                  <th>Pedidos</th>
                  <th>Total gasto</th>
                  <th>Histórico</th>
                </tr>
              </thead>
              <tbody>
                {customers.map(customer => {
                  const ordersList = customer.orders ?? []
                  const totalSpent = ordersList.reduce(
                    (sum, order) => sum + Number(order.total || 0),
                    0
                  )

                  return (
                    <tr key={customer.id}>
                      <td>
                        <div>
                          <strong>{customer.name}</strong>
                        </div>
                        <small>{customer.email}</small>
                      </td>
                      <td>{customer.phone || '—'}</td>
                      <td>
                        {customer.createdAt
                          ? new Date(customer.createdAt).toLocaleDateString('pt-BR')
                          : '—'}
                      </td>
                      <td>{ordersList.length}</td>
                      <td>
                        <strong>{brl(totalSpent)}</strong>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="ghost"
                          onClick={() => setSelected(customer)}
                        >
                          Ver pedidos
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selected && (
        <div className="admin-content-card">
          <div className="admin-section-heading">
            <h3>Histórico de compras — {selected.name}</h3>
            <button
              type="button"
              className="ghost"
              onClick={() => setSelected(null)}
            >
              Fechar
            </button>
          </div>

          {(selected.orders ?? []).length === 0 ? (
            <div className="admin-empty-state">
              Esta cliente ainda não realizou pedidos.
            </div>
          ) : (
            <div className="admin-finance-list">
              {(selected.orders ?? []).map(order => (
                <div className="admin-finance-row" key={order.id}>
                  <span>
                    <strong>Pedido #{order.id}</strong> ·{' '}
                    {order.createdAt
                      ? new Date(order.createdAt).toLocaleDateString('pt-BR')
                      : '—'}{' '}
                    ({order.status})
                  </span>
                  <strong>{brl(Number(order.total || 0))}</strong>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}