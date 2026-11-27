import {
    createContext,
    useContext,
    useEffect,
    useState,
  } from 'react'
  import type { ReactNode } from 'react'
  
  import {
    customerRegister,
    adminRegister,
    loginUser,
    customerLogout,
    adminLogout,
  } from './services/auth'
  
  import {
    getProducts,
    createProduct,
    updateProduct,
    deleteProduct,
  } from './services/products'
  
  import type { ProductPayload } from './services/products'
  
  import {
    createOrder as createOrderApi,
    getMyOrders as getMyOrdersApi,
    getAllOrders as getAllOrdersApi,
    updateOrderStatus as updateOrderStatusApi,
    updatePaymentStatus as updatePaymentStatusApi,
    type ApiOrder,
  } from './services/orders'
  
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
  
  export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED'
  
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
    code?: string
    customerId?: string
    createdAt: string
    status: OrderStatus
    paymentStatus?: string
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
  }
  
  export type CustomerSession = {
    id: string
    name: string
    email: string
    phone: string
  }
  
  export type RegisterUserData = {
    name: string
    email: string
    phone: string
    password: string
  }
  
  export type AuthResult = {
    success: boolean
    message: string
    role?: 'ADMIN' | 'CUSTOMER'
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
  
  function mapApiOrderStatus(status: string): OrderStatus {
    switch (status?.toUpperCase()) {
      case 'CONFIRMED':
        return 'aguardando_pagamento'
      case 'PROCESSING':
        return 'em_preparacao'
      case 'SHIPPED':
        return 'enviado'
      case 'DELIVERED':
        return 'entregue'
      case 'CANCELLED':
        return 'cancelado'
      case 'PENDING':
      default:
        return 'aguardando_confirmacao'
    }
  }
  
  function mapOrderStatusToApi(
    status: OrderStatus,
  ): 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' {
    switch (status) {
      case 'aguardando_pagamento':
        return 'CONFIRMED'
      case 'pago':
      case 'em_preparacao':
        return 'PROCESSING'
      case 'enviado':
        return 'SHIPPED'
      case 'entregue':
        return 'DELIVERED'
      case 'cancelado':
        return 'CANCELLED'
      case 'aguardando_confirmacao':
      default:
        return 'PENDING'
    }
  }
  
  function mapApiOrderToOrder(
    apiOrder: ApiOrder,
    fallbackCustomer?: Partial<OrderCustomer>,
  ): Order {
    const addr = (apiOrder.shippingAddress ?? {}) as Record<string, string>
  
    return {
      id: apiOrder.id,
      code: apiOrder.code || apiOrder.id,
      customerId: apiOrder.userId,
      createdAt: apiOrder.createdAt,
      status: mapApiOrderStatus(apiOrder.status),
      paymentStatus: apiOrder.paymentStatus,
      customer: {
        name:
          addr.recipient ||
          addr.name ||
          apiOrder.customerName ||
          fallbackCustomer?.name ||
          '',
        phone:
          addr.phone ||
          apiOrder.customerPhone ||
          fallbackCustomer?.phone ||
          '',
        cep: addr.cep || addr.zipCode || fallbackCustomer?.cep || '',
        address:
          addr.address || addr.street || fallbackCustomer?.address || '',
        number: addr.number || fallbackCustomer?.number || '',
        complement: addr.complement || fallbackCustomer?.complement || '',
        neighborhood:
          addr.neighborhood || fallbackCustomer?.neighborhood || '',
        city: addr.city || fallbackCustomer?.city || '',
        state: addr.state || fallbackCustomer?.state || '',
        reference: addr.reference || fallbackCustomer?.reference || '',
      },
      items: (apiOrder.items ?? []).map(item => ({
        productId: item.productId,
        productName: item.name || item.product?.name || 'Produto',
        image: item.product?.images?.[0]?.url || '',
        price: Number(item.price),
        color: item.color ?? '',
        size: item.size ?? '',
        qty: Number(item.quantity),
      })),
      total: Number(apiOrder.total),
      stockDeducted: false,
    }
  }
  
  // ===== TIPOS DA LOJA =====
  
  type Ctx = {
    products: Product[]
    refreshProducts: () => Promise<void>
    saveProduct: (p: Product, categoryId: string) => Promise<boolean>
    removeProduct: (id: string) => Promise<boolean>
    addReview: (id: string, r: Review) => void
  
    cart: CartItem[]
    addToCart: (i: CartItem) => void
    setQty: (idx: number, q: number) => void
    clearCart: () => void
  
    favs: string[]
    toggleFav: (id: string) => void
  
    orders: Order[]
    placeOrder: (customer: OrderCustomer) => Promise<Order | null>
    loadMyOrders: () => Promise<void>
    loadAllOrders: () => Promise<void>
    updateOrderStatus: (id: string, status: OrderStatus) => Promise<boolean>
    updatePaymentStatus: (id: string, status: PaymentStatus) => Promise<boolean>
    removeOrder: (id: string) => void
  
    customers: CustomerAccount[]
    currentCustomer: CustomerSession | null
    isAdminAuthenticated: boolean
    setAdminSession: (authenticated: boolean) => void
    registerCustomer: (data: RegisterUserData) => Promise<AuthResult>
    registerAdmin: (data: RegisterUserData) => Promise<AuthResult>
    loginUserAccount: (email: string, password: string) => Promise<AuthResult>
    logoutCustomer: () => void
    logoutAdmin: () => void
  }
  
  const StoreCtx = createContext<Ctx>(null as unknown as Ctx)
  
  export const useStore = () => useContext(StoreCtx)
  
  // ===== PROVEDOR DA LOJA =====
  
  export function StoreProvider({ children }: { children: ReactNode }) {
    const [products, setProducts] = useState<Product[]>([])
    const [cart, setCart] = useState<CartItem[]>([])
    const [orders, setOrders] = useState<Order[]>([])
  
    const customers: CustomerAccount[] = []
  
    const [currentCustomer, setCurrentCustomer] =
      useState<CustomerSession | null>(null)
  
    const [isAdminAuthenticated, setIsAdminAuthenticated] =
      useState<boolean>(() => Boolean(sessionStorage.getItem('sm-admin-token')))
  
    const [favoriteLists, setFavoriteLists] =
      useState<Record<string, string[]>>({})
  
    const refreshProducts = async () => {
      const data = await getProducts()
      setProducts(data)
    }
  
    useEffect(() => {
      refreshProducts().catch(error => {
        console.error('Erro ao carregar produtos da API:', error)
      })
    }, [])
  
    const favs = currentCustomer
      ? favoriteLists[currentCustomer.id] ?? []
      : []
  
    const value: Ctx = {
      products,
      refreshProducts,
      cart,
      favs,
      orders,
      customers,
      currentCustomer,
      isAdminAuthenticated,
  
      setAdminSession: authenticated => {
        if (authenticated) {
          setCurrentCustomer(null)
        }
        setIsAdminAuthenticated(authenticated)
      },
  
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
  
        try {
          const user = await customerRegister({
            name,
            email,
            phone,
            password,
          })
  
          setCurrentCustomer({
            id: user.id,
            name: user.name,
            email: user.email,
            phone,
          })
          setIsAdminAuthenticated(false)
  
          return {
            success: true,
            message: 'Cadastro realizado com sucesso!',
            role: 'CUSTOMER',
          }
        } catch (error) {
          return {
            success: false,
            message:
              error instanceof Error
                ? error.message
                : 'Não foi possível realizar o cadastro.',
          }
        }
      },
  
      // ===== CADASTRO DE ADMIN =====
      registerAdmin: async data => {
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
  
        try {
          await adminRegister({
            name,
            email,
            phone,
            password,
          })
  
          setCurrentCustomer(null)
          setIsAdminAuthenticated(true)
  
          return {
            success: true,
            message: 'Conta de administrador criada com sucesso!',
            role: 'ADMIN',
          }
        } catch (error) {
          return {
            success: false,
            message:
              error instanceof Error
                ? error.message
                : 'Não foi possível criar a conta de administrador.',
          }
        }
      },
  
      // ===== LOGIN ÚNICO: ADMIN OU CUSTOMER =====
      loginUserAccount: async (email, password) => {
        const normalizedEmail = email.trim().toLowerCase()
  
        if (!normalizedEmail || !password) {
          return {
            success: false,
            message: 'Informe seu e-mail e sua senha.',
          }
        }
  
        try {
          const user = await loginUser(normalizedEmail, password)
  
          if (user.role === 'ADMIN') {
            setCurrentCustomer(null)
            setIsAdminAuthenticated(true)
  
            return {
              success: true,
              message: 'Login administrativo realizado com sucesso!',
              role: 'ADMIN',
            }
          }
  
          if (user.role === 'CUSTOMER') {
            setCurrentCustomer({
              id: user.id,
              name: user.name,
              email: user.email,
              phone: user.phone ?? '',
            })
            setIsAdminAuthenticated(false)
  
            return {
              success: true,
              message: 'Login realizado com sucesso!',
              role: 'CUSTOMER',
            }
          }
  
          return {
            success: false,
            message: 'Perfil de usuário inválido.',
          }
        } catch (error) {
          return {
            success: false,
            message:
              error instanceof Error
                ? error.message
                : 'Não foi possível realizar o login.',
          }
        }
      },
  
      logoutCustomer: () => {
        customerLogout()
        setCurrentCustomer(null)
      },
  
      logoutAdmin: () => {
        adminLogout()
        setIsAdminAuthenticated(false)
      },
  
      // ===== CADASTRAR OU EDITAR PRODUTO =====
      saveProduct: async (p, categoryId) => {
        try {
          const slug = p.name
            .trim()
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '')
  
          const images = (p.images?.length ? p.images : [p.image])
            .filter((url): url is string => Boolean(url))
            .map(url => {
              if (!url.startsWith('http://') && !url.startsWith('https://')) {
                throw new Error(
                  'As fotos precisam ser enviadas ao Cloudinary antes de salvar o produto.'
                )
              }
  
              return { url }
            })
  
          const inventories = p.colors.flatMap(color =>
            p.sizes.map(size => ({
              color: color.name,
              size,
              quantity: Number(p.stock?.[stockKey(color.name, size)] ?? 0),
            }))
          )
  
          const payload: ProductPayload = {
            name: p.name.trim(),
            slug,
            description: p.description.trim(),
            price: Number(p.price),
            categoryId,
            active: true,
            featured: false,
            images,
            colors: p.colors.map(color => ({
              name: color.name,
              hex: color.hex,
            })),
            inventories,
          }
  
          const exists = products.some(product => product.id === p.id)
  
          if (exists) {
            await updateProduct(p.id, payload)
          } else {
            await createProduct(payload)
          }
  
          await refreshProducts()
          return true
        } catch (error) {
          console.error('Erro ao salvar produto:', error)
          alert(error instanceof Error ? error.message : 'Erro ao salvar produto.')
          return false
        }
      },
  
      // ===== EXCLUIR PRODUTO =====
      removeProduct: async id => {
        try {
          await deleteProduct(id)
          await refreshProducts()
          return true
        } catch (error) {
          console.error('Erro ao excluir produto:', error)
          alert(error instanceof Error ? error.message : 'Erro ao excluir produto.')
          return false
        }
      },
  
      addReview: (id, r) => {
        setProducts(list =>
          list.map(p =>
            p.id === id
              ? { ...p, reviews: [r, ...p.reviews] }
              : p
          )
        )
      },
  
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
  
      clearCart: () => {
        setCart([])
      },
  
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
  
      // ===== ENVIAR PEDIDO PARA O BACKEND (MYSQL) =====
      placeOrder: async customerData => {
        if (cart.length === 0) {
          alert('Sua sacola está vazia.')
          return null
        }
  
        const payloadItems = cart.map(item => ({
          productId: item.productId,
          quantity: item.qty,
          color: item.color,
          size: item.size,
        }))
  
        const created = await createOrderApi({
          items: payloadItems,
          shippingAddress: {
            recipient: customerData.name,
            name: customerData.name,
            phone: customerData.phone,
            cep: customerData.cep,
            zipCode: customerData.cep,
            address: customerData.address,
            street: customerData.address,
            number: customerData.number,
            complement: customerData.complement,
            neighborhood: customerData.neighborhood,
            city: customerData.city,
            state: customerData.state,
            reference: customerData.reference,
          },
        })
  
        const mappedOrder = mapApiOrderToOrder(created, customerData)
        setOrders(prev => [mappedOrder, ...prev])
  
        try {
          await refreshProducts()
        } catch (err) {
          console.error('Erro ao atualizar estoque após pedido:', err)
        }
  
        return mappedOrder
      },
  
      loadMyOrders: async () => {
        const list = await getMyOrdersApi()
        setOrders(list.map(item => mapApiOrderToOrder(item)))
      },
  
      loadAllOrders: async () => {
        const list = await getAllOrdersApi()
        setOrders(list.map(item => mapApiOrderToOrder(item)))
      },
  
      updateOrderStatus: async (id, status) => {
        try {
          const found = orders.find(o => o.id === id || o.code === id)
          const targetId = found?.id ?? id
  
          const updated = await updateOrderStatusApi(
            targetId,
            mapOrderStatusToApi(status),
          )
          const mapped = mapApiOrderToOrder(updated)
  
          setOrders(prev =>
            prev.map(item =>
              item.id === targetId || item.code === id ? mapped : item
            )
          )
  
          await refreshProducts()
          return true
        } catch (error) {
          alert(
            error instanceof Error
              ? error.message
              : 'Não foi possível atualizar o status do pedido.'
          )
          return false
        }
      },
  
      updatePaymentStatus: async (id, status) => {
        try {
          const found = orders.find(o => o.id === id || o.code === id)
          const targetId = found?.id ?? id
  
          const updated = await updatePaymentStatusApi(targetId, status)
          const mapped = mapApiOrderToOrder(updated)
  
          setOrders(prev =>
            prev.map(item =>
              item.id === targetId || item.code === id ? mapped : item
            )
          )
  
          return true
        } catch (error) {
          alert(
            error instanceof Error
              ? error.message
              : 'Não foi possível atualizar o pagamento.'
          )
          return false
        }
      },
  
      removeOrder: id => {
        setOrders(current => current.filter(item => item.id !== id && item.code !== id))
      },
    }
  
    return (
      <StoreCtx.Provider value={value}>
        {children}
      </StoreCtx.Provider>
    )
  }