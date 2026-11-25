import { useMemo, useState } from 'react'
import React from 'react'
import { useStore, brl, stockKey } from '../store'
import type { Product, Color, OrderStatus } from '../store'
import '../Catalog.css'
import './Admin.css'

// Altere para o caminho real da sua logo (ex.: '/logo-solar.png' ou import logoImg from '../assets/logo.png')
const LOGO_SRC = '/logo.jpg'

const empty = {
  id: '',
  name: '',
  price: '',
  description: '',
  category: '',
  image: '',
  images: [] as string[],
  sizeGuide: '',
  colors: '',
  sizes: 'P, M, G',
  stock: {} as Record<string, string>,
}

const PASS = import.meta.env.VITE_ADMIN_PASS as string | undefined
const MAX_IMAGES = 5

type AdminTab =
  | 'visao-geral'
  | 'financeiro'
  | 'pedidos'
  | 'produtos'
  | 'clientes'
  | 'relatorios'

const statusLabels: Record<OrderStatus, string> = {
  aguardando_confirmacao: 'Aguardando confirmação',
  aguardando_pagamento: 'Aguardando pagamento',
  pago: 'Pago',
  em_preparacao: 'Em preparação',
  enviado: 'Enviado',
  entregue: 'Entregue',
  cancelado: 'Cancelado',
}

function getProductStockTotal(product: Product): number {
  return Object.values(product.stock ?? {}).reduce(
    (sum, quantity) => sum + quantity,
    0
  )
}

function parseColors(value: string): Color[] {
  return value
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)
    .map(s => {
      const [name, hex] = s.split(':')
      return {
        name: name.trim(),
        hex: (hex || '#999999').trim(),
      }
    })
}

export default function Admin() {
  const {
    products,
    saveProduct,
    removeProduct,
    orders,
    updateOrderStatus,
    removeOrder,
  } = useStore()

  const [ok, setOk] = useState(false)
  const [pw, setPw] = useState('')
  const [f, setF] = useState(empty)
  const [formOpen, setFormOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<AdminTab>('visao-geral')
  const [uploading, setUploading] = useState(false)

  // Filtros rápidos da tela administrativa
  const [productSearch, setProductSearch] = useState('')
  const [onlyLowStock, setOnlyLowStock] = useState(false)
  const [orderSearch, setOrderSearch] = useState('')
  const [orderStatusFilter, setOrderStatusFilter] = useState<'todos' | OrderStatus>('todos')

  const parsedColors = useMemo(() => parseColors(f.colors), [f.colors])

  const parsedSizes = useMemo(
    () =>
      f.sizes
        .split(',')
        .map(s => s.trim())
        .filter(Boolean),
    [f.sizes]
  )

  const galleryImages =
    f.images.length > 0 ? f.images : f.image ? [f.image] : []

  const sortedOrders = useMemo(
    () =>
      [...orders].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ),
    [orders]
  )

  // ===== INDICADORES DA LOJA =====

  const paidOrders = useMemo(
    () =>
      orders.filter(order =>
        ['pago', 'em_preparacao', 'enviado', 'entregue'].includes(order.status)
      ),
    [orders]
  )

  const confirmedRevenue = useMemo(
    () => paidOrders.reduce((total, order) => total + order.total, 0),
    [paidOrders]
  )

  const averageTicket = useMemo(
    () => (paidOrders.length > 0 ? confirmedRevenue / paidOrders.length : 0),
    [confirmedRevenue, paidOrders.length]
  )

  const pendingOrders = useMemo(
    () =>
      orders.filter(order =>
        ['aguardando_confirmacao', 'aguardando_pagamento'].includes(order.status)
      ),
    [orders]
  )

  const totalStock = useMemo(
    () => products.reduce((total, p) => total + getProductStockTotal(p), 0),
    [products]
  )

  const lowStockProducts = useMemo(
    () => products.filter(p => getProductStockTotal(p) <= 5),
    [products]
  )

  const filteredProducts = useMemo(() => {
    const query = productSearch.trim().toLowerCase()
    return products.filter(p => {
      const matchesQuery =
        !query ||
        p.name.toLowerCase().includes(query) ||
        p.category.toLowerCase().includes(query)
      const matchesStock = !onlyLowStock || getProductStockTotal(p) <= 5
      return matchesQuery && matchesStock
    })
  }, [products, productSearch, onlyLowStock])

  const filteredOrders = useMemo(() => {
    const query = orderSearch.trim().toLowerCase()
    return sortedOrders.filter(order => {
      const matchesStatus =
        orderStatusFilter === 'todos' || order.status === orderStatusFilter
      const matchesQuery =
        !query ||
        order.id.toLowerCase().includes(query) ||
        order.customer.name.toLowerCase().includes(query) ||
        order.customer.phone.toLowerCase().includes(query)
      return matchesStatus && matchesQuery
    })
  }, [sortedOrders, orderSearch, orderStatusFilter])

  const recentOrders = sortedOrders.slice(0, 5)

  const handleLogin = () => {
    if (PASS && pw === PASS) {
      setOk(true)
    } else {
      alert('Senha incorreta')
    }
  }

  if (!ok) {
    return (
      <div className="admin-login-wrapper">
        <div className="admin-login-box">
          <div className="admin-logo-wrap">
            <img src={LOGO_SRC} alt="Solar Move Moda Fitness" />
          </div>

          <span className="solar-highlight">SOLAR MOVE</span>
          <h2>Área administrativa</h2>
          <p>Insira sua senha para gerenciar a loja.</p>

          {!PASS && (
            <p className="err">
              Configure VITE_ADMIN_PASS no arquivo .env.
            </p>
          )}

          <input
            type="password"
            placeholder="Digite sua senha"
            value={pw}
            onChange={e => setPw(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') handleLogin()
            }}
          />

          <button
            type="button"
            className="solar-button"
            onClick={handleLogin}
          >
            Entrar no painel
          </button>

          <a href="#inicio">← Voltar à loja</a>
        </div>
      </div>
    )
  }

  // ===== EDITAR PRODUTO =====

  const edit = (p: Product) => {
    const images = p.images?.length
      ? p.images
      : p.image
        ? [p.image]
        : []

    setF({
      id: p.id,
      name: p.name,
      price: String(p.price),
      description: p.description,
      category: p.category,
      image: p.image,
      images,
      sizeGuide: p.sizeGuide ?? '',
      colors: p.colors.map(c => `${c.name}:${c.hex}`).join(', '),
      sizes: p.sizes.join(', '),
      stock: Object.fromEntries(
        Object.entries(p.stock ?? {}).map(([key, quantity]) => [
          key,
          String(quantity),
        ])
      ),
    })

    setFormOpen(true)
    setActiveTab('produtos')

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
  }

  // ===== ATUALIZAR ESTOQUE =====

  const updateStock = (key: string, value: string) => {
    setF(current => ({
      ...current,
      stock: {
        ...current.stock,
        [key]: value,
      },
    }))
  }

  // ===== REMOVER FOTO =====

  const removeImage = (index: number) => {
    const updatedImages = galleryImages.filter((_, i) => i !== index)

    setF(current => ({
      ...current,
      images: updatedImages,
      image: updatedImages[0] ?? '',
    }))
  }

  // ===== CADASTRAR OU ATUALIZAR PRODUTO =====

  const submit = () => {
    const price = Number(f.price.replace(',', '.'))

    if (!f.name.trim() || !Number.isFinite(price) || price <= 0) {
      alert('Informe um nome e um preço válido.')
      return
    }

    const finalImages = galleryImages.filter(Boolean)

    if (finalImages.length === 0) {
      alert('Adicione pelo menos uma foto do produto.')
      return
    }

    if (parsedColors.length === 0 || parsedSizes.length === 0) {
      alert('Informe pelo menos uma cor e um tamanho.')
      return
    }

    const stock: Record<string, number> = {}

    for (const color of parsedColors) {
      for (const size of parsedSizes) {
        const key = stockKey(color.name, size)
        const rawValue = f.stock[key] ?? '0'
        const quantity = Number(rawValue)

        if (
          rawValue.trim() === '' ||
          !Number.isInteger(quantity) ||
          quantity < 0
        ) {
          alert(`Informe um estoque válido para ${color.name} / ${size}.`)
          return
        }

        stock[key] = quantity
      }
    }

    const old = products.find(p => p.id === f.id)

    const saved = saveProduct({
      id: f.id || `p${Date.now()}`,
      name: f.name.trim(),
      price,
      description: f.description.trim(),
      category: f.category.trim(),
      image: finalImages[0],
      images: finalImages,
      sizeGuide: f.sizeGuide.trim(),
      reviews: old?.reviews ?? [],
      sizes: parsedSizes,
      colors: parsedColors,
      stock,
    })

    if (!saved) return

    setF(empty)
    setFormOpen(false)

    alert(
      old
        ? 'Produto atualizado com sucesso!'
        : 'Produto adicionado à loja!'
    )
  }

  // ===== COMPRIMIR IMAGEM =====

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (!file.type.startsWith('image/')) {
        reject(new Error('Selecione apenas arquivos de imagem.'))
        return
      }

      const reader = new FileReader()

      reader.onload = () => {
        const img = new Image()

        img.onload = () => {
          const canvas = document.createElement('canvas')

          const maxWidth = 700
          const maxHeight = 900

          const scale = Math.min(
            maxWidth / img.width,
            maxHeight / img.height,
            1
          )

          canvas.width = Math.round(img.width * scale)
          canvas.height = Math.round(img.height * scale)

          const ctx = canvas.getContext('2d')

          if (!ctx) {
            reject(new Error('Não foi possível processar a imagem.'))
            return
          }

          ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

          resolve(canvas.toDataURL('image/jpeg', 0.62))
        }

        img.onerror = () => {
          reject(new Error('Não foi possível carregar uma das imagens.'))
        }

        img.src = String(reader.result)
      }

      reader.onerror = () => {
        reject(new Error('Erro ao ler uma das imagens.'))
      }

      reader.readAsDataURL(file)
    })
  }

  // ===== ENVIAR VÁRIAS FOTOS =====

  const uploadImages = async (files: FileList | null) => {
    if (!files || files.length === 0) return

    const availableSlots = MAX_IMAGES - galleryImages.length

    if (availableSlots <= 0) {
      alert(`Você pode adicionar no máximo ${MAX_IMAGES} fotos por produto.`)
      return
    }

    const selectedFiles = Array.from(files).slice(0, availableSlots)

    if (files.length > availableSlots) {
      alert(
        `Foram selecionadas mais fotos do que o permitido. Serão adicionadas apenas ${availableSlots}.`
      )
    }

    setUploading(true)

    try {
      const compressedImages: string[] = []

      for (const file of selectedFiles) {
        const compressed = await compressImage(file)
        compressedImages.push(compressed)
      }

      setF(current => {
        const currentImages =
          current.images.length > 0
            ? current.images
            : current.image
              ? [current.image]
              : []

        const updatedImages = [
          ...currentImages,
          ...compressedImages,
        ].slice(0, MAX_IMAGES)

        return {
          ...current,
          images: updatedImages,
          image: updatedImages[0] ?? '',
        }
      })
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : 'Não foi possível adicionar as imagens.'
      )
    } finally {
      setUploading(false)
    }
  }

  // ===== ATUALIZAR STATUS DO PEDIDO =====

  const changeStatus = (id: string, status: OrderStatus) => {
    const updated = updateOrderStatus(id, status)

    if (!updated) {
      alert('Não foi possível atualizar o pedido. Verifique o estoque.')
    }
  }

  // ===== EXCLUIR PEDIDO =====

  const deleteOrder = (id: string) => {
    if (!confirm(`Deseja excluir o pedido ${id}?`)) return

    const removed = removeOrder(id)

    if (removed === false) {
      alert('Não foi possível excluir. Cancele o pedido antes de removê-lo.')
    }
  }

  // ===== MENU ADMINISTRATIVO =====

  const menuItems: { id: AdminTab; label: string; count?: number }[] = [
    { id: 'visao-geral', label: 'Visão geral' },
    { id: 'financeiro', label: 'Financeiro' },
    { id: 'pedidos', label: 'Pedidos', count: orders.length },
    { id: 'produtos', label: 'Produtos e estoque', count: products.length },
    { id: 'clientes', label: 'Clientes' },
    { id: 'relatorios', label: 'Relatórios' },
  ]

  const totalCombinations = parsedColors.length * parsedSizes.length

  return (
    <main className="admin wide">
      <div className="admin-shell">

        {/* MENU LATERAL */}

        <aside className="admin-sidebar">
          <div className="admin-sidebar-brand">
            <div className="admin-logo-wrap">
              <img src={LOGO_SRC} alt="Solar Move Moda Fitness" />
            </div>

            <div>
              <strong>SOLAR MOVE</strong>
              <small>MODA FITNESS</small>
            </div>
          </div>

          <span className="admin-sidebar-label">
            Gerenciamento
          </span>

          <nav className="admin-sidebar-nav">
            {menuItems.map(item => (
              <button
                type="button"
                key={item.id}
                className={activeTab === item.id ? 'active' : ''}
                onClick={() => {
                  setActiveTab(item.id)
                  setFormOpen(false)
                  setF(empty)
                }}
              >
                <span>{item.label}</span>

                {item.count !== undefined && (
                  <small>{item.count}</small>
                )}
              </button>
            ))}
          </nav>

          <div className="admin-sidebar-footer">
            <a href="#inicio">← Voltar para a loja</a>
          </div>
        </aside>

        {/* CONTEÚDO PRINCIPAL */}

        <section className="admin-main">

          {/* ===== VISÃO GERAL ===== */}

          {activeTab === 'visao-geral' && (
            <>
              <div className="admin-page-heading">
                <div>
                  <span className="solar-highlight">SOLAR MOVE</span>
                  <h2>Visão geral</h2>
                  <p>Acompanhe os principais números e pendências da loja.</p>
                </div>

                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    className="solar-button"
                    onClick={() => {
                      setActiveTab('produtos')
                      setF(empty)
                      setFormOpen(true)
                    }}
                  >
                    + Novo produto
                  </button>

                  <a href="#inicio" className="ghost">
                    Ver loja →
                  </a>
                </div>
              </div>

              <div className="admin-metric-grid">

                <article className="admin-metric-card">
                  <span>Faturamento confirmado</span>
                  <strong>{brl(confirmedRevenue)}</strong>
                  <small>{paidOrders.length} pedido(s) pago(s) ou concluído(s)</small>
                </article>

                <article className="admin-metric-card">
                  <span>Ticket médio</span>
                  <strong>{brl(averageTicket)}</strong>
                  <small>Média por pedido confirmado</small>
                </article>

                <article className="admin-metric-card">
                  <span>Aguardando atendimento</span>
                  <strong>{pendingOrders.length}</strong>
                  <small>De {orders.length} pedido(s) no total</small>
                </article>

                <article className="admin-metric-card">
                  <span>Produtos e estoque</span>
                  <strong>{products.length}</strong>
                  <small>{totalStock} unidade(s) disponíveis</small>
                </article>

              </div>

              <div className="admin-content-card">
                <div className="admin-section-heading">
                  <h3>Pedidos recentes</h3>

                  <button
                    type="button"
                    className="ghost"
                    onClick={() => setActiveTab('pedidos')}
                  >
                    Ver todos ({orders.length})
                  </button>
                </div>

                {recentOrders.length === 0 ? (
                  <div className="admin-empty-state">
                    Nenhum pedido registrado até o momento.
                  </div>
                ) : (
                  <div className="admin-table-wrap">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Pedido</th>
                          <th>Cliente</th>
                          <th>Data</th>
                          <th>Valor</th>
                          <th>Status</th>
                        </tr>
                      </thead>

                      <tbody>
                        {recentOrders.map(order => (
                          <tr key={order.id}>
                            <td><strong>{order.id}</strong></td>
                            <td>{order.customer.name}</td>
                            <td>
                              {new Date(order.createdAt).toLocaleDateString('pt-BR')}
                            </td>
                            <td><strong>{brl(order.total)}</strong></td>
                            <td>
                              <span className="admin-status-badge">
                                {statusLabels[order.status]}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="admin-content-card">
                <div className="admin-section-heading">
                  <h3>Atenção ao estoque (≤ 5 unidades)</h3>

                  <button
                    type="button"
                    className="ghost"
                    onClick={() => {
                      setOnlyLowStock(true)
                      setActiveTab('produtos')
                    }}
                  >
                    Filtrar estoque baixo
                  </button>
                </div>

                {lowStockProducts.length === 0 ? (
                  <div className="admin-empty-state">
                    Todos os produtos estão com estoque confortável.
                  </div>
                ) : (
                  <div className="admin-finance-list">
                    {lowStockProducts.map(product => {
                      const quantity = getProductStockTotal(product)

                      return (
                        <div className="admin-finance-row" key={product.id}>
                          <span>
                            <strong>{product.name}</strong>
                            {product.category ? ` · ${product.category}` : ''}
                          </span>
                          <strong className="admin-finance-negative">
                            {quantity === 0 ? 'Esgotado' : `${quantity} unidade(s)`}
                          </strong>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </>
          )}

          {/* ===== FINANCEIRO ===== */}

          {activeTab === 'financeiro' && (
            <>
              <div className="admin-page-heading">
                <div>
                  <span className="solar-highlight">SOLAR MOVE</span>
                  <h2>Financeiro</h2>
                  <p>Controle as entradas, saídas e o resultado da Solar Move.</p>
                </div>
              </div>

              <div className="admin-metric-grid">
                <article className="admin-metric-card">
                  <span>Entradas confirmadas</span>
                  <strong className="admin-finance-positive">{brl(confirmedRevenue)}</strong>
                  <small>Pedidos com pagamento confirmado</small>
                </article>

                <article className="admin-metric-card">
                  <span>Saídas registradas</span>
                  <strong>{brl(0)}</strong>
                  <small>Controle de despesas na próxima etapa</small>
                </article>

                <article className="admin-metric-card">
                  <span>Saldo antes das despesas</span>
                  <strong>{brl(confirmedRevenue)}</strong>
                  <small>Não representa o lucro líquido</small>
                </article>
              </div>

              <div className="admin-content-card">
                <h3>Movimentações financeiras</h3>

                <div className="admin-empty-state">
                  Ainda não existem lançamentos financeiros manuais.
                  <br />
                  Na próxima etapa vamos permitir registrar vendas,
                  compras de mercadorias, embalagens, fretes e outras despesas.
                </div>
              </div>

              <div className="admin-content-card">
                <h3>Importante</h3>
                <p>
                  O faturamento confirmado considera pedidos pagos,
                  em preparação, enviados ou entregues. Pedidos aguardando
                  confirmação ou pagamento não entram nesse valor.
                </p>
                <p style={{ marginBottom: 0 }}>
                  O lucro real só poderá ser calculado depois de registrar
                  os custos dos produtos e as demais despesas da loja.
                </p>
              </div>
            </>
          )}

          {/* ===== PEDIDOS ===== */}

          {activeTab === 'pedidos' && (
            <section className="admin-products admin-tab-content">

              <div className="admin-top">
                <div>
                  <h3>Pedidos recebidos ({filteredOrders.length} de {orders.length})</h3>
                  <p>Acompanhe as compras e atualize os pedidos das clientes.</p>
                </div>
              </div>

              {orders.length > 0 && (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                    gap: 12,
                    marginBottom: 20,
                  }}
                >
                  <input
                    placeholder="Buscar por código, cliente ou telefone..."
                    value={orderSearch}
                    onChange={e => setOrderSearch(e.target.value)}
                  />

                  <select
                    value={orderStatusFilter}
                    onChange={e =>
                      setOrderStatusFilter(e.target.value as 'todos' | OrderStatus)
                    }
                  >
                    <option value="todos">Todos os status</option>
                    {Object.entries(statusLabels).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {filteredOrders.length === 0 && (
                <div className="admin-empty-state">
                  Nenhum pedido encontrado com os filtros atuais.
                </div>
              )}

              <div className="admin-orders">
                {filteredOrders.map(order => {
                  const totalItems = order.items.reduce(
                    (sum, item) => sum + item.qty,
                    0
                  )

                  return (
                    <article className="admin-order-card" key={order.id}>

                      <div className="admin-order-header">
                        <div>
                          <span className="admin-order-code">
                            {order.id}
                          </span>

                          <small className="admin-order-date">
                            {new Date(order.createdAt).toLocaleString('pt-BR')} ·{' '}
                            <span className="admin-status-badge">
                              {statusLabels[order.status]}
                            </span>
                          </small>
                        </div>

                        <div style={{ textAlign: 'right' }}>
                          <strong className="admin-order-total">
                            {brl(order.total)}
                          </strong>
                          <small className="admin-order-date">
                            {totalItems} {totalItems === 1 ? 'peça' : 'peças'}
                          </small>
                        </div>
                      </div>

                      <div className="admin-order-section">
                        <h4>Dados do cliente</h4>

                        <div className="admin-order-customer">
                          <div className="admin-order-info">
                            <small>Nome</small>
                            <span>{order.customer.name}</span>
                          </div>

                          <div className="admin-order-info">
                            <small>Telefone</small>
                            <span>{order.customer.phone}</span>
                          </div>

                          <div className="admin-order-info">
                            <small>Endereço</small>
                            <span>
                              {order.customer.address}, {order.customer.number}
                              {order.customer.complement
                                ? ` - ${order.customer.complement}`
                                : ''}
                            </span>
                          </div>

                          <div className="admin-order-info">
                            <small>Bairro</small>
                            <span>{order.customer.neighborhood}</span>
                          </div>

                          <div className="admin-order-info">
                            <small>Cidade</small>
                            <span>
                              {order.customer.city} - {order.customer.state}
                            </span>
                          </div>

                          <div className="admin-order-info">
                            <small>CEP</small>
                            <span>{order.customer.cep}</span>
                          </div>

                          {order.customer.reference && (
                            <div className="admin-order-info">
                              <small>Referência</small>
                              <span>{order.customer.reference}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="admin-order-section">
                        <h4>Produtos do pedido</h4>

                        {order.items.map((item, index) => (
                          <div
                            className="admin-order-item"
                            key={`${item.productId}-${item.color}-${item.size}-${index}`}
                          >
                            <img
                              src={item.image}
                              alt={item.productName}
                            />

                            <div className="admin-order-item-info">
                              <strong>{item.productName}</strong>

                              <small>
                                Cor: {item.color} · Tamanho: {item.size}
                              </small>

                              <small>
                                Quantidade: {item.qty} · {brl(item.price)} cada
                              </small>

                              <strong>
                                {brl(item.price * item.qty)}
                              </strong>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="admin-order-controls">
                        <div className="admin-order-status">
                          <label>Status do pedido</label>

                          <select
                            value={order.status}
                            onChange={e =>
                              changeStatus(
                                order.id,
                                e.target.value as OrderStatus
                              )
                            }
                          >
                            {Object.entries(statusLabels).map(([value, label]) => (
                              <option key={value} value={value}>
                                {label}
                              </option>
                            ))}
                          </select>

                          {order.stockDeducted && (
                            <small>
                              Estoque já atualizado para este pedido.
                            </small>
                          )}
                        </div>

                        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                          {order.status === 'aguardando_confirmacao' && (
                            <button
                              type="button"
                              className="solar-button"
                              onClick={() => changeStatus(order.id, 'pago')}
                            >
                              Marcar como pago
                            </button>
                          )}

                          {order.status === 'pago' && (
                            <button
                              type="button"
                              className="ghost"
                              onClick={() =>
                                changeStatus(order.id, 'em_preparacao')
                              }
                            >
                              Iniciar preparação
                            </button>
                          )}

                          {order.status === 'em_preparacao' && (
                            <button
                              type="button"
                              className="ghost"
                              onClick={() => changeStatus(order.id, 'enviado')}
                            >
                              Marcar como enviado
                            </button>
                          )}

                          <button
                            type="button"
                            className="admin-order-delete"
                            onClick={() => deleteOrder(order.id)}
                          >
                            Excluir pedido
                          </button>
                        </div>
                      </div>

                    </article>
                  )
                })}
              </div>
            </section>
          )}

          {/* ===== PRODUTOS E ESTOQUE ===== */}

          {activeTab === 'produtos' && (
            <section className="admin-products admin-tab-content">

              <div className="admin-top">
                <div>
                  <h3>Gerenciamento de produtos</h3>
                  <p>Cadastre, edite e controle o estoque da loja.</p>
                </div>

                <button
                  type="button"
                  className="solar-button"
                  onClick={() => {
                    if (formOpen) {
                      setFormOpen(false)
                      setF(empty)
                    } else {
                      setF(empty)
                      setFormOpen(true)
                    }
                  }}
                >
                  {formOpen ? 'Fechar formulário' : '+ Adicionar produto'}
                </button>
              </div>

              {/* FORMULÁRIO */}

              {formOpen && (
                <section className="a-form">
                  <h3>
                    {f.id ? 'Editar produto' : 'Cadastrar novo produto'}
                  </h3>

                  <label>Nome do produto</label>
                  <input
                    placeholder="Ex.: Legging Solar"
                    value={f.name}
                    onChange={e => setF({ ...f, name: e.target.value })}
                  />

                  <label>Preço</label>
                  <input
                    placeholder="Ex.: 129,90"
                    value={f.price}
                    onChange={e => setF({ ...f, price: e.target.value })}
                  />

                  <label>Categoria</label>
                  <input
                    placeholder="Leggings, Tops, Conjuntos..."
                    value={f.category}
                    onChange={e => setF({ ...f, category: e.target.value })}
                  />

                  <label>Descrição</label>
                  <textarea
                    placeholder="Descreva o produto..."
                    value={f.description}
                    onChange={e => setF({ ...f, description: e.target.value })}
                  />

                  <label>Cores (Nome:#HEX)</label>
                  <input
                    placeholder="Oliva:#2E3514, Areia:#C5A467, Marrom:#6E473B"
                    value={f.colors}
                    onChange={e => setF({ ...f, colors: e.target.value })}
                  />

                  <label>Tamanhos</label>
                  <input
                    placeholder="P, M, G, GG"
                    value={f.sizes}
                    onChange={e => setF({ ...f, sizes: e.target.value })}
                  />

                  {/* ESTOQUE */}

                  <div className="stock-editor">
                    <h3>
                      Estoque por cor e tamanho
                      {totalCombinations > 0 ? ` (${totalCombinations} variações)` : ''}
                    </h3>
                    <p>
                      Informe quantas unidades estão disponíveis em cada opção.
                    </p>

                    {parsedColors.length === 0 || parsedSizes.length === 0 ? (
                      <p>Preencha primeiro as cores e os tamanhos.</p>
                    ) : (
                      parsedColors.map(color => (
                        <div className="stock-color" key={color.name}>
                          <h4>
                            <span
                              className="stock-color-dot"
                              style={{ backgroundColor: color.hex }}
                            />
                            {color.name}
                          </h4>

                          <div className="stock-grid">
                            {parsedSizes.map(size => {
                              const key = stockKey(color.name, size)

                              return (
                                <div className="stock-field" key={key}>
                                  <label>{size}</label>

                                  <input
                                    type="number"
                                    min="0"
                                    step="1"
                                    value={f.stock[key] ?? '0'}
                                    onChange={e =>
                                      updateStock(key, e.target.value)
                                    }
                                  />
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* GALERIA DE FOTOS */}

                  <div className="admin-gallery-editor">
                    <h3>Fotos do produto</h3>
                    <p>
                      Adicione até {MAX_IMAGES} fotos. A primeira será a imagem principal.
                    </p>

                    <label>Enviar fotos do computador</label>

                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      disabled={uploading || galleryImages.length >= MAX_IMAGES}
                      onChange={e => {
                        uploadImages(e.target.files)
                        e.currentTarget.value = ''
                      }}
                    />

                    {uploading && (
                      <p>Processando fotos, aguarde...</p>
                    )}

                    <div className="admin-gallery-preview">
                      {galleryImages.map((src, index) => (
                        <div
                          className="admin-gallery-item"
                          key={`${index}-${src.slice(0, 30)}`}
                        >
                          <img
                            src={src}
                            alt={`Foto ${index + 1} do produto`}
                          />

                          {index === 0 && (
                            <span className="admin-gallery-main">
                              Principal
                            </span>
                          )}

                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            aria-label={`Remover foto ${index + 1}`}
                          >
                            Remover
                          </button>
                        </div>
                      ))}
                    </div>

                    <small>
                      {galleryImages.length} de {MAX_IMAGES} fotos adicionadas.
                    </small>
                  </div>

                  {/* GUIA DE MEDIDAS */}

                  <div className="admin-size-guide">
                    <h3>Guia de medidas</h3>
                    <p>
                      Informe as medidas reais fornecidas pela loja para cada tamanho.
                    </p>

                    <textarea
                      rows={5}
                      placeholder={'Exemplo:\nP — Cintura: 60 a 68 cm | Quadril: 86 a 94 cm\nM — Cintura: 69 a 76 cm | Quadril: 95 a 102 cm\nG — Cintura: 77 a 84 cm | Quadril: 103 a 110 cm'}
                      value={f.sizeGuide}
                      onChange={e =>
                        setF({ ...f, sizeGuide: e.target.value })
                      }
                    />
                  </div>

                  <div className="admin-form-actions">
                    <button
                      type="button"
                      className="solar-button"
                      onClick={submit}
                      disabled={uploading}
                    >
                      {f.id ? 'Salvar alterações' : 'Cadastrar produto'}
                    </button>

                    <button
                      type="button"
                      className="ghost"
                      onClick={() => {
                        setF(empty)
                        setFormOpen(false)
                      }}
                    >
                      Cancelar
                    </button>
                  </div>
                </section>
              )}

              {/* FILTROS E LISTA DE PRODUTOS */}

              <div className="admin-product-list">
                <div className="admin-section-heading">
                  <h3>
                    Produtos cadastrados ({filteredProducts.length} de {products.length})
                  </h3>

                  {products.length > 0 && (
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                      <input
                        style={{ width: 240 }}
                        placeholder="Buscar produto ou categoria..."
                        value={productSearch}
                        onChange={e => setProductSearch(e.target.value)}
                      />

                      <button
                        type="button"
                        className={onlyLowStock ? 'solar-button' : 'ghost'}
                        onClick={() => setOnlyLowStock(prev => !prev)}
                      >
                        {onlyLowStock ? 'Mostrando estoque baixo' : 'Estoque baixo (≤ 5)'}
                      </button>
                    </div>
                  )}
                </div>

                {filteredProducts.length === 0 && (
                  <div className="admin-empty-state">
                    Nenhum produto encontrado.
                  </div>
                )}

                {filteredProducts.map(p => {
                  const productStock = getProductStockTotal(p)

                  return (
                    <article className="a-row" key={p.id}>
                      <img
                        src={p.image}
                        alt={p.name}
                        className="d-thumb"
                      />

                      <div className="admin-product-info">
                        <b>{p.name}</b>
                        <small>{p.category || 'Sem categoria'} · {brl(p.price)}</small>
                        <small
                          className={
                            productStock <= 5 ? 'admin-finance-negative' : ''
                          }
                        >
                          Estoque total: {productStock === 0 ? 'Esgotado' : `${productStock} unidade(s)`}
                        </small>
                        <small>
                          {p.colors.length} cor(es) · {p.sizes.length} tamanho(s) · {p.images?.length ?? 1} foto(s)
                        </small>
                      </div>

                      <button
                        type="button"
                        className="ghost"
                        onClick={() => edit(p)}
                      >
                        Editar
                      </button>

                      <button
                        type="button"
                        className="link"
                        onClick={() => {
                          if (confirm(`Excluir "${p.name}"?`)) {
                            removeProduct(p.id)
                          }
                        }}
                      >
                        Excluir
                      </button>
                    </article>
                  )
                })}
              </div>

            </section>
          )}

          {/* ===== CLIENTES ===== */}

          {activeTab === 'clientes' && (
            <>
              <div className="admin-page-heading">
                <div>
                  <span className="solar-highlight">SOLAR MOVE</span>
                  <h2>Clientes</h2>
                  <p>Área para acompanhar os cadastros e o relacionamento com as clientes.</p>
                </div>
              </div>

              <div className="admin-content-card">
                <h3>Gestão de clientes</h3>
                <div className="admin-empty-state">
                  A próxima etapa será conectar os cadastros das clientes
                  aos pedidos para mostrar histórico de compras e informações
                  de cada conta.
                </div>
              </div>
            </>
          )}

          {/* ===== RELATÓRIOS ===== */}

          {activeTab === 'relatorios' && (
            <>
              <div className="admin-page-heading">
                <div>
                  <span className="solar-highlight">SOLAR MOVE</span>
                  <h2>Relatórios</h2>
                  <p>Indicadores para acompanhar o desempenho da Solar Move.</p>
                </div>
              </div>

              <div className="admin-content-card">
                <h3>Resumo atual</h3>

                <div className="admin-finance-list">
                  <div className="admin-finance-row">
                    <span>Total de pedidos</span>
                    <strong>{orders.length}</strong>
                  </div>

                  <div className="admin-finance-row">
                    <span>Pedidos com pagamento confirmado</span>
                    <strong>{paidOrders.length}</strong>
                  </div>

                  <div className="admin-finance-row">
                    <span>Faturamento confirmado</span>
                    <strong>{brl(confirmedRevenue)}</strong>
                  </div>

                  <div className="admin-finance-row">
                    <span>Ticket médio</span>
                    <strong>{brl(averageTicket)}</strong>
                  </div>

                  <div className="admin-finance-row">
                    <span>Produtos cadastrados</span>
                    <strong>{products.length}</strong>
                  </div>

                  <div className="admin-finance-row">
                    <span>Unidades em estoque</span>
                    <strong>{totalStock}</strong>
                  </div>
                </div>
              </div>

              <div className="admin-content-card">
                <h3>Relatórios detalhados</h3>
                <div className="admin-empty-state">
                  Os gráficos de vendas, despesas e lucratividade serão
                  adicionados depois que o controle financeiro estiver pronto.
                </div>
              </div>
            </>
          )}

        </section>
      </div>
    </main>
  )
}