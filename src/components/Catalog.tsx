
import { useState } from 'react'
import React from 'react'
import { useStore, brl, avg, WHATSAPP, stockKey } from '../store'
import type { Product } from '../store'
import '../Catalog.css'

function FilterIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      style={{
        display: 'inline-block',
        verticalAlign: 'middle',
        flexShrink: 0,
      }}
    >
      <path
        d="M3 5H21L14 13.2V19L10 21V13.2L3 5Z"
        fill="#C5A467"
        stroke="#2E3514"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function Stars({
  value,
  onPick,
}: {
  value: number
  onPick?: (n: number) => void
}) {
  return (
    <span className="stars" aria-label={`${value.toFixed(1)} de 5 estrelas`}>
      {[1, 2, 3, 4, 5].map(n =>
        onPick ? (
          <button
            type="button"
            key={n}
            className={n <= value ? 'on' : ''}
            onClick={() => onPick(n)}
            aria-label={`${n} estrelas`}
          >
            ★
          </button>
        ) : (
          <span key={n} className={n <= Math.round(value) ? 'on' : ''}>
            ★
          </span>
        )
      )}
    </span>
  )
}

/* =========================================
   MODAL DE DETALHES DO PRODUTO
========================================= */

function Modal({
  p,
  onClose,
  onBuyNow,
}: {
  p: Product
  onClose: () => void
  onBuyNow?: () => void
}) {
  const {
    addToCart,
    addReview,
    favs,
    toggleFav,
    orders,
    currentCustomer,
  } = useStore()

  // Proteção para campos que podem vir null da API
  const colors = p.colors ?? []
  const sizes = p.sizes ?? []
  const reviews = p.reviews ?? []
  const stock = p.stock ?? {}
  const productImages = p.images ?? []

  const [color, setColor] = useState(colors[0]?.name ?? '')
  const [size, setSize] = useState(sizes[0] ?? '')
  const [added, setAdded] = useState(false)
  const [selectedImage, setSelectedImage] = useState(0)

  const [rv, setRv] = useState({
    name: currentCustomer?.name ?? '',
    rating: 5,
    text: '',
  })

  const fav = favs.includes(p.id)

  const canReview = Boolean(
    currentCustomer &&
      orders.some(
        order =>
          order.status === 'entregue' &&
          order.items.some(item => item.productId === p.id) &&
          (order.customerId
            ? order.customerId === currentCustomer.id
            : order.customer.name.trim().toLowerCase() ===
              currentCustomer.name.trim().toLowerCase())
      )
  )

  const images = Array.from(
    new Set(
      [...productImages, p.image]
        .filter((img): img is string => typeof img === 'string')
        .map(img => img.trim())
        .filter(img => img.length > 0)
    )
  )

  const currentImage = images[selectedImage] ?? p.image

  const available = stock[stockKey(color, size)] ?? 0
  const hasStock = available > 0

  const wa = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(
    `Olá! Tenho interesse em: ${p.name} (${color}, tam. ${size})`
  )}`

  const previousImage = () => {
    setSelectedImage(current =>
      current === 0 ? images.length - 1 : current - 1
    )
  }

  const nextImage = () => {
    setSelectedImage(current =>
      current === images.length - 1 ? 0 : current + 1
    )
  }

  const send = () => {
    if (!canReview) {
      alert(
        'Os comentários ficam disponíveis apenas após o recebimento do pedido.'
      )
      return
    }

    const authorName = (rv.name || currentCustomer?.name || '').trim()

    if (!authorName || !rv.text.trim()) {
      alert('Preencha seu nome e comentário.')
      return
    }

    addReview(p.id, {
      name: authorName,
      rating: rv.rating,
      text: rv.text.trim(),
      date: new Date().toLocaleDateString('pt-BR'),
    })

    setRv({
      name: currentCustomer?.name ?? '',
      rating: 5,
      text: '',
    })

    alert('Comentário publicado!')
  }

  const chooseColor = (name: string) => {
    setColor(name)
    setAdded(false)
  }

  const chooseSize = (name: string) => {
    setSize(name)
    setAdded(false)
  }

  const handleAdd = (): boolean => {
    if (!hasStock) {
      alert('Essa combinação de cor e tamanho está esgotada.')
      return false
    }

    addToCart({
      productId: p.id,
      color,
      size,
      qty: 1,
    })

    setAdded(true)
    return true
  }

  const handleBuyNowClick = () => {
    const ok = handleAdd()
    if (!ok) return

    onClose()

    if (onBuyNow) {
      onBuyNow()
    } else {
      window.dispatchEvent(new CustomEvent('solar-open-checkout'))
    }
  }

  return (
    <div className="overlay" onClick={onClose}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label={p.name}
        onClick={e => e.stopPropagation()}
      >
        <button
          type="button"
          className="x"
          onClick={onClose}
          aria-label="Fechar"
        >
          ×
        </button>

        {/* GALERIA DE FOTOS */}
        <div className="m-gallery">
          <div
            className="m-img"
            style={{
              backgroundImage: currentImage
                ? `url("${currentImage}")`
                : 'none',
            }}
            role="img"
            aria-label={`${p.name} - foto ${selectedImage + 1}`}
          />

          {images.length > 1 && (
            <>
              <button
                type="button"
                className="gallery-arrow gallery-prev"
                onClick={previousImage}
                aria-label="Foto anterior"
                title="Foto anterior"
              >
                ‹
              </button>

              <button
                type="button"
                className="gallery-arrow gallery-next"
                onClick={nextImage}
                aria-label="Próxima foto"
                title="Próxima foto"
              >
                ›
              </button>
            </>
          )}

          <span className="m-image-count">
            {images.length > 0 ? selectedImage + 1 : 0} / {images.length}
          </span>
        </div>

        {/* INFORMAÇÕES DO PRODUTO */}
        <div className="m-info">
          <h3>{p.name}</h3>

          <div className="m-rate">
            <Stars value={avg(p)} />
            <small>
              {reviews.length
                ? `${avg(p).toFixed(1)} (${reviews.length})`
                : 'Sem avaliações'}
            </small>
          </div>

          <p className="price">{brl(p.price)}</p>

          <p>{p.description}</p>

          {/* CORES */}
          {colors.length > 0 && (
            <>
              <b>Cor: {color}</b>

              <div className="opts">
                {colors.map(c => {
                  const colorHasStock = sizes.some(
                    s => (stock[stockKey(c.name, s)] ?? 0) > 0
                  )

                  return (
                    <button
                      type="button"
                      key={c.name}
                      className={`dot ${
                        c.name === color ? 'on' : ''
                      } ${!colorHasStock ? 'out-of-stock' : ''}`}
                      style={{ background: c.hex }}
                      onClick={() => chooseColor(c.name)}
                      aria-label={`${c.name}${
                        !colorHasStock ? ' esgotado' : ''
                      }`}
                      aria-pressed={c.name === color}
                      title={!colorHasStock ? `${c.name} esgotado` : c.name}
                    />
                  )
                })}
              </div>
            </>
          )}

          {/* TAMANHOS */}
          {sizes.length > 0 && (
            <>
              <b>Tamanho</b>

              <div className="opts">
                {sizes.map(s => {
                  const quantity = stock[stockKey(color, s)] ?? 0
                  const unavailable = quantity <= 0

                  return (
                    <button
                      type="button"
                      key={s}
                      className={`size ${
                        s === size ? 'on' : ''
                      } ${unavailable ? 'out-of-stock' : ''}`}
                      onClick={() => chooseSize(s)}
                      aria-pressed={s === size}
                      title={
                        unavailable
                          ? 'Esgotado'
                          : `${quantity} disponível(is)`
                      }
                    >
                      {s}
                    </button>
                  )
                })}
              </div>
            </>
          )}

          {/* ESTOQUE */}
          <div
            className={`stock-message ${
              hasStock ? 'available' : 'unavailable'
            }`}
          >
            {hasStock
              ? `${available} unidade(s) disponível(is)`
              : 'Produto esgotado nesta opção'}
          </div>

          {/* GUIA DE MEDIDAS */}
          {p.sizeGuide?.trim() && (
            <details className="size-guide">
              <summary>Guia de medidas e tamanhos</summary>
              <p>{p.sizeGuide}</p>
            </details>
          )}

          {/* AÇÕES */}
          <div className="m-actions">
            <button
              type="button"
              className="solar-button"
              onClick={handleBuyNowClick}
              disabled={!hasStock}
            >
              {hasStock ? 'Comprar agora' : 'Esgotado'}
            </button>

            <button
              type="button"
              className="ghost"
              onClick={handleAdd}
              disabled={!hasStock}
            >
              {!hasStock
                ? 'Esgotado'
                : added
                  ? 'Adicionado à sacola ✓'
                  : 'Adicionar à sacola'}
            </button>

            <button
              type="button"
              className={`ghost ${fav ? 'on' : ''}`}
              onClick={() => toggleFav(p.id)}
            >
              {fav ? '♥ Favoritado' : '♡ Favoritar'}
            </button>

            <a
              className="ghost"
              href={wa}
              target="_blank"
              rel="noreferrer"
            >
              Tirar dúvida no WhatsApp
            </a>
          </div>

          {/* AVALIAÇÕES */}
          <h4>Comentários de clientes</h4>

          {canReview ? (
            <div className="rv-form">
              <input
                placeholder="Seu nome"
                value={rv.name}
                onChange={e =>
                  setRv({ ...rv, name: e.target.value })
                }
              />

              <Stars
                value={rv.rating}
                onPick={n => setRv({ ...rv, rating: n })}
              />

              <textarea
                placeholder="Conte como foi sua experiência ao receber o produto"
                value={rv.text}
                onChange={e =>
                  setRv({ ...rv, text: e.target.value })
                }
              />

              <button
                type="button"
                className="ghost"
                onClick={send}
              >
                Publicar comentário
              </button>
            </div>
          ) : (
            <p
              style={{
                fontSize: 12.5,
                color: '#77786c',
                background: '#f7f5f0',
                padding: '10px 12px',
                borderRadius: 6,
                border: '1px solid #e9e7df',
              }}
            >
              Avaliações liberadas apenas para clientes que já receberam o
              pedido em casa.
            </p>
          )}

          {reviews.map((r, i) => (
            <div className="rv" key={i}>
              <Stars value={r.rating} />
              <b>{r.name}</b>
              <small>{r.date}</small>
              <p>{r.text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* =========================================
   CATÁLOGO DE PRODUTOS
========================================= */

type PriceFilter = 'all' | 'under-100' | '100-150' | 'over-150'

export default function Catalog({
  onlyFavs,
  setOnlyFavs,
  onBuyNow,
}: {
  onlyFavs: boolean
  setOnlyFavs: (v: boolean) => void
  onBuyNow?: () => void
}) {
  const { products, favs, toggleFav } = useStore()

  const [filterOpen, setFilterOpen] = useState(false)
  const [cat, setCat] = useState('Todos')
  const [selectedColor, setSelectedColor] = useState('Todas')
  const [priceRange, setPriceRange] = useState<PriceFilter>('all')
  const [openId, setOpenId] = useState<string | null>(null)

  // Proteção para produtos e campos que podem vir null da API
  const safeProducts = products ?? []
  const safeFavs = favs ?? []

  const cats = [
    'Todos',
    ...Array.from(
      new Set(safeProducts.map(p => p.category).filter(Boolean))
    ),
  ]

  const uniqueColors = Array.from(
    new Map(
      safeProducts
        .flatMap(p => p.colors ?? [])
        .filter(Boolean)
        .map(c => [c.name, c])
    ).values()
  )

  const matchesPrice = (price: number) => {
    if (priceRange === 'under-100') return price <= 100
    if (priceRange === '100-150') return price > 100 && price <= 150
    if (priceRange === 'over-150') return price > 150
    return true
  }

  const list = safeProducts.filter(p => {
    const matchesCat = cat === 'Todos' || p.category === cat
    const matchesFav = !onlyFavs || safeFavs.includes(p.id)
    const matchesColor =
      selectedColor === 'Todas' ||
      (p.colors ?? []).some(c => c.name === selectedColor)

    return (
      matchesCat &&
      matchesFav &&
      matchesColor &&
      matchesPrice(p.price)
    )
  })

  const activeFilterCount =
    (cat !== 'Todos' ? 1 : 0) +
    (selectedColor !== 'Todas' ? 1 : 0) +
    (priceRange !== 'all' ? 1 : 0)

  const clearFilters = () => {
    setCat('Todos')
    setSelectedColor('Todas')
    setPriceRange('all')
    setOnlyFavs(false)
  }

  const open = safeProducts.find(p => p.id === openId)

  return (
    <section id="colecao" className="collection-section">
      <h2>Nossa coleção</h2>

      <p className="section-lead">
        Peças para o treino e para o resto do dia.
      </p>

      {/* BARRA PRINCIPAL */}
      <div className="chips">
        <button
          type="button"
          className={filterOpen || activeFilterCount > 0 ? 'on' : ''}
          onClick={() => setFilterOpen(prev => !prev)}
          aria-expanded={filterOpen}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <FilterIcon size={15} />
          <span>Filtro</span>

          {activeFilterCount > 0 && (
            <span
              style={{
                background: '#c5a467',
                color: '#2e3514',
                borderRadius: 999,
                padding: '1px 7px',
                fontSize: 11,
                fontWeight: 700,
              }}
            >
              {activeFilterCount}
            </span>
          )}

          <span style={{ fontSize: 11 }}>
            {filterOpen ? '▲' : '▼'}
          </span>
        </button>

        <button
          type="button"
          className={onlyFavs ? 'on' : ''}
          onClick={() => setOnlyFavs(!onlyFavs)}
        >
          ♥ Favoritos ({safeFavs.length})
        </button>

        {(activeFilterCount > 0 || onlyFavs) && (
          <button
            type="button"
            onClick={clearFilters}
            style={{
              padding: '6px 12px',
              borderRadius: 999,
              fontSize: 12,
              cursor: 'pointer',
              border: '1px solid #c5a467',
              background: 'transparent',
              color: '#2e3514',
              fontWeight: 600,
            }}
          >
            Limpar
          </button>
        )}
      </div>

      {/* OPÇÕES DE FILTRO */}
      {filterOpen && (
        <div
          style={{
            margin: '14px 0 22px',
            padding: 16,
            borderRadius: 8,
            background: '#f7f5f0',
            border: '1px solid #e6e2d6',
            display: 'grid',
            gap: 14,
          }}
        >
          {/* CATEGORIA */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <span
              style={{
                fontSize: 12.5,
                fontWeight: 700,
                color: '#2e3514',
                minWidth: 72,
              }}
            >
              Modelo:
            </span>

            {cats.map(c => (
              <button
                key={c}
                type="button"
                onClick={() => setCat(c)}
                style={{
                  padding: '5px 12px',
                  borderRadius: 999,
                  fontSize: 12,
                  cursor: 'pointer',
                  border:
                    cat === c
                      ? '1px solid #2e3514'
                      : '1px solid #d7d2c4',
                  background: cat === c ? '#2e3514' : '#ffffff',
                  color: cat === c ? '#f3efe6' : '#2e3514',
                  fontWeight: cat === c ? 700 : 500,
                }}
              >
                {c}
              </button>
            ))}
          </div>

          {/* VALOR */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <span
              style={{
                fontSize: 12.5,
                fontWeight: 700,
                color: '#2e3514',
                minWidth: 72,
              }}
            >
              Valor:
            </span>

            {(
              [
                { id: 'all', label: 'Todos' },
                { id: 'under-100', label: 'Até R$ 100' },
                { id: '100-150', label: 'R$ 100 – R$ 150' },
                { id: 'over-150', label: 'Acima de R$ 150' },
              ] as { id: PriceFilter; label: string }[]
            ).map(opt => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setPriceRange(opt.id)}
                style={{
                  padding: '5px 12px',
                  borderRadius: 999,
                  fontSize: 12,
                  cursor: 'pointer',
                  border:
                    priceRange === opt.id
                      ? '1px solid #2e3514'
                      : '1px solid #d7d2c4',
                  background:
                    priceRange === opt.id ? '#2e3514' : '#ffffff',
                  color:
                    priceRange === opt.id ? '#f3efe6' : '#2e3514',
                  fontWeight: priceRange === opt.id ? 700 : 500,
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* COR */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <span
              style={{
                fontSize: 12.5,
                fontWeight: 700,
                color: '#2e3514',
                minWidth: 72,
              }}
            >
              Cor:
            </span>

            <button
              type="button"
              onClick={() => setSelectedColor('Todas')}
              style={{
                padding: '5px 12px',
                borderRadius: 999,
                fontSize: 12,
                cursor: 'pointer',
                border:
                  selectedColor === 'Todas'
                    ? '1px solid #2e3514'
                    : '1px solid #d7d2c4',
                background:
                  selectedColor === 'Todas' ? '#2e3514' : '#ffffff',
                color:
                  selectedColor === 'Todas' ? '#f3efe6' : '#2e3514',
                fontWeight: selectedColor === 'Todas' ? 700 : 500,
              }}
            >
              Todas
            </button>

            {uniqueColors.map(c => {
              const active = selectedColor === c.name

              return (
                <button
                  key={c.name}
                  type="button"
                  onClick={() =>
                    setSelectedColor(active ? 'Todas' : c.name)
                  }
                  aria-pressed={active}
                  title={c.name}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '5px 11px',
                    borderRadius: 999,
                    fontSize: 12,
                    cursor: 'pointer',
                    border: active
                      ? '1.5px solid #2e3514'
                      : '1px solid #d7d2c4',
                    background: active ? '#eceee4' : '#ffffff',
                    color: '#2e3514',
                    fontWeight: active ? 700 : 500,
                  }}
                >
                  <span
                    style={{
                      width: 11,
                      height: 11,
                      borderRadius: '50%',
                      background: c.hex,
                      border: '1px solid rgba(0,0,0,0.2)',
                      display: 'inline-block',
                    }}
                  />
                  {c.name}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {list.length === 0 && (
        <p className="empty">
          {onlyFavs
            ? 'Você ainda não favoritou nenhuma peça.'
            : 'Nenhuma peça encontrada com esses filtros.'}
        </p>
      )}

      {/* PRODUTOS */}
      <div className="p-grid">
        {list.map(p => {
          const colors = p.colors ?? []
          const reviews = p.reviews ?? []
          const stock = p.stock ?? {}

          const totalStock = Object.values(stock).reduce(
            (sum, quantity) => sum + (Number(quantity) || 0),
            0
          )

          const cover = p.images?.[0] || p.image

          return (
            <article className="p-card" key={p.id}>
              <button
                type="button"
                className="p-img"
                style={{
                  backgroundImage: cover
                    ? `url("${cover}")`
                    : 'none',
                }}
                onClick={() => setOpenId(p.id)}
                aria-label={`Ver ${p.name}`}
              />

              <button
                type="button"
                className={`fav ${
                  safeFavs.includes(p.id) ? 'on' : ''
                }`}
                onClick={() => toggleFav(p.id)}
                aria-label="Favoritar"
                aria-pressed={safeFavs.includes(p.id)}
              >
                {safeFavs.includes(p.id) ? '♥' : '♡'}
              </button>

              <h3>{p.name}</h3>

              <div className="m-rate">
                <Stars value={avg(p)} />
                <small>({reviews.length})</small>
              </div>

              <div className="p-foot">
                <span className="price">{brl(p.price)}</span>

                <span className="dots">
                  {colors.map(c => (
                    <i
                      key={c.name}
                      style={{ background: c.hex }}
                      title={c.name}
                    />
                  ))}
                </span>
              </div>

              <p
                className={`product-stock ${
                  totalStock > 0 ? 'available' : 'unavailable'
                }`}
              >
                {totalStock > 0 ? 'Disponível' : 'Esgotado'}
              </p>

              <button
                type="button"
                className="product-details-button"
                onClick={() => setOpenId(p.id)}
              >
                Ver detalhes
              </button>
            </article>
          )
        })}
      </div>

      {/* MODAL */}
      {open && (
        <Modal
          key={open.id}
          p={open}
          onClose={() => setOpenId(null)}
          onBuyNow={onBuyNow}
        />
      )}
    </section>
  )
}
