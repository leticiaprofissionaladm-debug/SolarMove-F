
import { createContext, useContext, useRef, useState } from 'react'
import type { ReactNode } from 'react'

// ===== CONFIGURAÇÕES DA LOJA =====
export const WHATSAPP = '5521974909797'
export const INSTAGRAM = 'https://instagram.com/solarmovefitness'

export const stockKey = (color: string, size: string) =>
    `${color}::${size}`

// ===== TIPOS =====

export type Color = {
    name: string
    hex: string
}

export type Review = {
    name: string
    rating: number
    text: string
    date: string
}

export type Product = {
    id: string
    name: string
    price: number
    description: string
    category: string
    image: string
    images?: string[]
    sizeGuide?: string
    colors: Color[]
    sizes: string[]
    reviews: Review[]
    stock?: Record<string, number>
}

export type CartItem = {
    productId: string
    color: string
    size: string
    qty: number
}

export type OrderStatus =
    | 'aguardando_confirmacao'
    | 'aguardando_pagamento'
    | 'pago'
    | 'em_preparacao'
    | 'enviado'
    | 'entregue'
    | 'cancelado'

export type OrderCustomer = {
    name: string
    phone: string
    cep: string
    address: string
    number: string
    complement: string
    neighborhood: string
    city: string
    state: string
    reference: string
}

export type OrderItem = {
    productId: string
    productName: string
    image: string
    price: number
    color: string
    size: string
    qty: number
}

export type Order = {
    id: string
    customerId?: string
    createdAt: string
    status: OrderStatus
    customer: OrderCustomer
    items: OrderItem[]
    total: number
    stockDeducted: boolean
}

export type CustomerAccount = {
    id: string
    name: string
    email: string
    phone: string
    passwordHash: string
    passwordSalt: string
}

export type CustomerSession = {
    id: string
    name: string
    email: string
    phone: string
}

export type RegisterCustomerData = {
    name: string
    email: string
    phone: string
    password: string
}

export type AuthResult = {
    success: boolean
    message: string
}

// ===== FUNÇÕES AUXILIARES =====

export const brl = (n: number) =>
    n.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    })

export const avg = (p: Product) =>
    p.reviews.length
        ? p.reviews.reduce((s, r) => s + r.rating, 0) / p.reviews.length
        : 0

// ===== PRODUTOS INICIAIS =====

const seed: Product[] = [
    {
        id: 'p1',
        name: 'Legging Cintura Alta',
        price: 129.9,
        category: 'Leggings',
        description: 'Tecido firme que não marca nem fica transparente. Cós alto que não enrola.',
        image: '/looks/look-verde.jpg',
        sizes: ['P', 'M', 'G'],
        colors: [
            { name: 'Verde Oliva', hex: '#9BAA70' },
            { name: 'Preto', hex: '#172329' },
        ],
        reviews: [],
        stock: {},
    },
    {
        id: 'p2',
        name: 'Top Sustentação',
        price: 89.9,
        category: 'Tops',
        description: 'Média sustentação, bojo removível e alças que não escorregam.',
        image: '/looks/look-rosa.jpg',
        sizes: ['P', 'M', 'G'],
        colors: [
            { name: 'Rosa', hex: '#DDA4C4' },
            { name: 'Marrom', hex: '#684438' },
        ],
        reviews: [],
        stock: {},
    },
    {
        id: 'p3',
        name: 'Conjunto Move',
        price: 199.9,
        category: 'Conjuntos',
        description: 'Top e legging no mesmo tom. Conforto do treino ao café depois.',
        image: '/looks/look-azul.jpg',
        sizes: ['P', 'M', 'G', 'GG'],
        colors: [
            { name: 'Azul Turquesa', hex: '#62B9C4' },
        ],
        reviews: [],
        stock: {},
    },
]

// ===== SALVAMENTO LOCAL =====

function usePersist<T>(key: string, init: T) {
    const [v, setV] = useState<T>(() => {
        try {
            const saved = localStorage.getItem(key)
            return saved ? (JSON.parse(saved) as T) : init
        } catch (error) {
            console.error(`Erro ao carregar ${key}:`, error)
            return init
        }
    })

    const valueRef = useRef(v)

    const setPersisted = (next: T | ((prev: T) => T)): boolean => {
        const nextValue =
            typeof next === 'function'
                ? (next as (prev: T) => T)(valueRef.current)
                : next

        try {
            localStorage.setItem(key, JSON.stringify(nextValue))
            valueRef.current = nextValue
            setV(nextValue)
            return true
        } catch (error) {
            console.error(`Erro ao salvar ${key}:`, error)

            alert(
                'Não foi possível salvar os dados. O armazenamento do navegador pode estar cheio. Reduza o tamanho das imagens.'
            )

            return false
        }
    }

    return [v, setPersisted] as const
}

// ===== SENHA: HASH LOCAL PARA PROTÓTIPO =====

function createSalt() {
    const bytes = crypto.getRandomValues(new Uint8Array(16))

    return Array.from(bytes)
        .map(byte => byte.toString(16).padStart(2, '0'))
        .join('')
}

async function hashPassword(password: string, salt: string) {
    const data = new TextEncoder().encode(`${salt}:${password}`)
    const hash = await crypto.subtle.digest('SHA-256', data)

    return Array.from(new Uint8Array(hash))
        .map(byte => byte.toString(16).padStart(2, '0'))
        .join('')
}

// ===== TIPOS DA LOJA =====

type Ctx = {
    products: Product[]
    saveProduct: (p: Product) => boolean
    removeProduct: (id: string) => void
    addReview: (id: string, r: Review) => void

    cart: CartItem[]
    addToCart: (i: CartItem) => void
    setQty: (idx: number, q: number) => void
    clearCart: () => void

    favs: string[]
    toggleFav: (id: string) => void

    orders: Order[]
    createOrder: (customer: OrderCustomer, customerId?: string) => Order | null
    updateOrderStatus: (id: string, status: OrderStatus) => boolean
    removeOrder: (id: string) => void

    customers: CustomerAccount[]
    currentCustomer: CustomerSession | null
    registerCustomer: (data: RegisterCustomerData) => Promise<AuthResult>
    loginCustomer: (email: string, password: string) => Promise<AuthResult>
    logoutCustomer: () => void
}

const StoreCtx = createContext<Ctx>(null as unknown as Ctx)

export const useStore = () => useContext(StoreCtx)

// ===== PROVEDOR DA LOJA =====

export function StoreProvider({ children }: { children: ReactNode }) {
    const [products, setProducts] = usePersist<Product[]>('sm-products', seed)
    const [cart, setCart] = usePersist<CartItem[]>('sm-cart', [])
    const [orders, setOrders] = usePersist<Order[]>('sm-orders', [])

    const [customers, setCustomers] = usePersist<CustomerAccount[]>(
        'sm-customers',
        []
    )

    const [currentCustomer, setCurrentCustomer] =
        usePersist<CustomerSession | null>('sm-customer-session', null)

    const [favoriteLists, setFavoriteLists] = usePersist<Record<string, string[]>>(
        'sm-customer-favs',
        {}
    )

    const favs = currentCustomer
        ? favoriteLists[currentCustomer.id] ?? []
        : []

    const value: Ctx = {
        products,
        cart,
        favs,
        orders,
        customers,
        currentCustomer,

        // ===== CADASTRO DE CLIENTE =====
        registerCustomer: async data => {
            const name = data.name.trim()
            const email = data.email.trim().toLowerCase()
            const phone = data.phone.trim()
            const password = data.password

            if (!name || !email || !phone || !password) {
                return {
                    success: false,
                    message: 'Preencha todos os campos.',
                }
            }

            if (password.length < 8) {
                return {
                    success: false,
                    message: 'A senha precisa ter pelo menos 8 caracteres.',
                }
            }

            const emailExists = customers.some(
                customer => customer.email.toLowerCase() === email
            )

            if (emailExists) {
                return {
                    success: false,
                    message: 'Este e-mail já possui cadastro.',
                }
            }

            try {
                const passwordSalt = createSalt()
                const passwordHash = await hashPassword(password, passwordSalt)

                const newCustomer: CustomerAccount = {
                    id: `SMC-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
                    name,
                    email,
                    phone,
                    passwordHash,
                    passwordSalt,
                }

                const saved = setCustomers(current => [
                    ...current,
                    newCustomer,
                ])

                if (!saved) {
                    return {
                        success: false,
                        message: 'Não foi possível salvar seu cadastro.',
                    }
                }

                const session: CustomerSession = {
                    id: newCustomer.id,
                    name: newCustomer.name,
                    email: newCustomer.email,
                    phone: newCustomer.phone,
                }

                if (!setCurrentCustomer(session)) {
                    return {
                        success: false,
                        message: 'Cadastro realizado, mas não foi possível iniciar sua sessão.',
                    }
                }

                return {
                    success: true,
                    message: 'Cadastro realizado com sucesso!',
                }
            } catch (error) {
                console.error('Erro ao cadastrar cliente:', error)

                return {
                    success: false,
                    message: 'Não foi possível realizar o cadastro.',
                }
            }
        },

        // ===== LOGIN DE CLIENTE =====
        loginCustomer: async (email, password) => {
            const normalizedEmail = email.trim().toLowerCase()

            if (!normalizedEmail || !password) {
                return {
                    success: false,
                    message: 'Informe seu e-mail e sua senha.',
                }
            }

            const customer = customers.find(
                item => item.email.toLowerCase() === normalizedEmail
            )

            if (!customer) {
                return {
                    success: false,
                    message: 'E-mail ou senha incorretos.',
                }
            }

            try {
                const passwordHash = await hashPassword(
                    password,
                    customer.passwordSalt
                )

                if (passwordHash !== customer.passwordHash) {
                    return {
                        success: false,
                        message: 'E-mail ou senha incorretos.',
                    }
                }

                const session: CustomerSession = {
                    id: customer.id,
                    name: customer.name,
                    email: customer.email,
                    phone: customer.phone,
                }

                if (!setCurrentCustomer(session)) {
                    return {
                        success: false,
                        message: 'Não foi possível iniciar sua sessão.',
                    }
                }

                return {
                    success: true,
                    message: 'Login realizado com sucesso!',
                }
            } catch (error) {
                console.error('Erro ao entrar na conta:', error)

                return {
                    success: false,
                    message: 'Não foi possível realizar o login.',
                }
            }
        },

        // ===== SAIR DA CONTA =====
        logoutCustomer: () => {
            setCurrentCustomer(null)
        },

        // ===== CADASTRAR OU EDITAR PRODUTO =====
        saveProduct: p => {
            const updatedProducts = products.some(x => x.id === p.id)
                ? products.map(x => x.id === p.id ? p : x)
                : [...products, p]

            return setProducts(updatedProducts)
        },

        // ===== EXCLUIR PRODUTO =====
        removeProduct: id => {
            setProducts(list => list.filter(x => x.id !== id))
        },

        // ===== ADICIONAR AVALIAÇÃO =====
        addReview: (id, r) => {
            setProducts(list =>
                list.map(p =>
                    p.id === id
                        ? { ...p, reviews: [r, ...p.reviews] }
                        : p
                )
            )
        },

        // ===== ADICIONAR À SACOLA =====
        addToCart: i => {
            const product = products.find(p => p.id === i.productId)

            if (!product) {
                alert('Produto não encontrado.')
                return
            }

            const key = stockKey(i.color, i.size)
            const available = product.stock?.[key] ?? 0

            const existing = cart.find(
                x =>
                    x.productId === i.productId &&
                    x.color === i.color &&
                    x.size === i.size
            )

            const requested = (existing?.qty ?? 0) + i.qty

            if (requested > available) {
                alert(
                    available === 0
                        ? 'Este produto está esgotado nessa cor e tamanho.'
                        : `Estoque disponível: ${available} unidade(s).`
                )
                return
            }

            setCart(c => {
                const k = c.findIndex(
                    x =>
                        x.productId === i.productId &&
                        x.color === i.color &&
                        x.size === i.size
                )

                return k < 0
                    ? [...c, i]
                    : c.map((x, n) =>
                        n === k
                            ? { ...x, qty: x.qty + i.qty }
                            : x
                    )
            })
        },

        // ===== ALTERAR QUANTIDADE NA SACOLA =====
        setQty: (idx, q) => {
            const item = cart[idx]

            if (q > 0 && item) {
                const product = products.find(
                    p => p.id === item.productId
                )

                const available = product?.stock?.[
                    stockKey(item.color, item.size)
                ] ?? 0

                if (q > available) {
                    alert(`Estoque disponível: ${available} unidade(s).`)
                    return
                }
            }

            setCart(c =>
                q <= 0
                    ? c.filter((_, n) => n !== idx)
                    : c.map((x, n) =>
                        n === idx ? { ...x, qty: q } : x
                    )
            )
        },

        // ===== ESVAZIAR SACOLA =====
        clearCart: () => {
            setCart([])
        },

        // ===== FAVORITOS POR CLIENTE =====
        toggleFav: id => {
            if (!currentCustomer) {
                alert('Entre na sua conta para adicionar favoritos.')
                return
            }

            setFavoriteLists(current => {
                const customerFavs = current[currentCustomer.id] ?? []

                const updatedFavs = customerFavs.includes(id)
                    ? customerFavs.filter(item => item !== id)
                    : [...customerFavs, id]

                return {
                    ...current,
                    [currentCustomer.id]: updatedFavs,
                }
            })
        },

        // ===== CRIAR PEDIDO =====
        createOrder: (customer, customerId) => {
            if (cart.length === 0) {
                alert('Sua sacola está vazia.')
                return null
            }

            const items: OrderItem[] = []

            for (const cartItem of cart) {
                const product = products.find(
                    p => p.id === cartItem.productId
                )

                if (!product) {
                    alert('Um dos produtos da sacola não foi encontrado.')
                    return null
                }

                const available = product.stock?.[
                    stockKey(cartItem.color, cartItem.size)
                ] ?? 0

                if (cartItem.qty > available) {
                    alert(
                        `Estoque insuficiente para ${product.name} (${cartItem.color}, tamanho ${cartItem.size}). Disponível: ${available}.`
                    )
                    return null
                }

                items.push({
                    productId: product.id,
                    productName: product.name,
                    image: product.image,
                    price: product.price,
                    color: cartItem.color,
                    size: cartItem.size,
                    qty: cartItem.qty,
                })
            }

            const order: Order = {
                id: `SM-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
                customerId,
                createdAt: new Date().toISOString(),
                status: 'aguardando_confirmacao',
                customer,
                items,
                total: items.reduce(
                    (sum, item) => sum + item.price * item.qty,
                    0
                ),
                stockDeducted: false,
            }

            const saved = setOrders(current => [...current, order])

            return saved ? order : null
        },

        // ===== ATUALIZAR STATUS DO PEDIDO =====
        updateOrderStatus: (id, status) => {
            const order = orders.find(item => item.id === id)

            if (!order) {
                alert('Pedido não encontrado.')
                return false
            }

            const shouldDeduct =
                status === 'pago' && !order.stockDeducted

            const shouldRestore =
                status === 'cancelado' && order.stockDeducted

            let updatedProducts = products

            if (shouldDeduct || shouldRestore) {
                const stockChanges = new Map<string, number>()

                order.items.forEach(item => {
                    const key = `${item.productId}::${stockKey(item.color, item.size)}`
                    stockChanges.set(
                        key,
                        (stockChanges.get(key) ?? 0) + item.qty
                    )
                })

                for (const [key, quantity] of stockChanges) {
                    const separator = key.indexOf('::')
                    const productId = key.slice(0, separator)
                    const stockId = key.slice(separator + 2)

                    const product = updatedProducts.find(
                        p => p.id === productId
                    )

                    if (!product) {
                        alert('Não foi possível atualizar o estoque: produto não encontrado.')
                        return false
                    }

                    const currentStock = product.stock?.[stockId] ?? 0

                    if (shouldDeduct && currentStock < quantity) {
                        alert(
                            `Estoque insuficiente para ${product.name}. Confira o estoque antes de marcar como pago.`
                        )
                        return false
                    }
                }

                updatedProducts = updatedProducts.map(product => {
                    const nextStock = { ...(product.stock ?? {}) }

                    order.items
                        .filter(item => item.productId === product.id)
                        .forEach(item => {
                            const key = stockKey(item.color, item.size)
                            const current = nextStock[key] ?? 0

                            nextStock[key] = shouldDeduct
                                ? current - item.qty
                                : current + item.qty
                        })

                    return { ...product, stock: nextStock }
                })

                if (!setProducts(updatedProducts)) {
                    return false
                }
            }

            const updatedOrders = orders.map(item =>
                item.id === id
                    ? {
                        ...item,
                        status,
                        stockDeducted: shouldDeduct
                            ? true
                            : shouldRestore
                                ? false
                                : item.stockDeducted,
                    }
                    : item
            )

            if (!setOrders(updatedOrders)) {
                if (shouldDeduct || shouldRestore) {
                    setProducts(products)
                }
                return false
            }

            return true
        },

        // ===== EXCLUIR PEDIDO =====
        removeOrder: id => {
            const order = orders.find(item => item.id === id)

            if (order?.stockDeducted) {
                alert('Não é possível excluir um pedido com estoque já movimentado. Cancele o pedido para devolver os itens ao estoque.')
                return
            }

            setOrders(current => current.filter(item => item.id !== id))
        },
    }

    return (
        <StoreCtx.Provider value={value}>
            {children}
        </StoreCtx.Provider>
    )
}
