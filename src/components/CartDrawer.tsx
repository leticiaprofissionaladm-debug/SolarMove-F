import React, { useEffect, useState } from 'react'
import { useStore, brl, WHATSAPP } from '../store'

export default function CartDrawer({
    open,
    onClose,
    onOpen,
}: {
    open: boolean
    onClose: () => void
    onOpen?: () => void
}) {
    const {
        cart,
        products,
        setQty,
        clearCart,
        createOrder,
        currentCustomer,
    } = useStore()

    const [customer, setCustomer] = useState({
        name: currentCustomer?.name ?? '',
        phone: currentCustomer?.phone ?? '',
        cep: '',
        address: '',
        number: '',
        complement: '',
        neighborhood: '',
        city: '',
        state: '',
        reference: '',
    })

    const [cepStatus, setCepStatus] = useState('')
    const [loadingCep, setLoadingCep] = useState(false)
    const [submitting, setSubmitting] = useState(false)

    // Abre a sacola/finalização automaticamente quando clicar em "Comprar agora"
    useEffect(() => {
        const handleOpenCheckout = () => {
            if (onOpen) {
                onOpen()
            } else {
                window.dispatchEvent(new CustomEvent('solar-drawer-open'))
            }
        }

        window.addEventListener('solar-open-checkout', handleOpenCheckout)
        return () => {
            window.removeEventListener('solar-open-checkout', handleOpenCheckout)
        }
    }, [onOpen])

    // Preenche nome e telefone automaticamente se houver cliente logada e os campos estiverem vazios
    useEffect(() => {
        if (!currentCustomer) return
        setCustomer(prev => ({
            ...prev,
            name: prev.name || currentCustomer.name || '',
            phone: prev.phone || currentCustomer.phone || '',
        }))
    }, [currentCustomer])

    const lines = cart.flatMap((c, idx) => {
        const p = products.find(x => x.id === c.productId)
        if (!p) return []
        const thumbSrc = (p.images?.[0] || p.image || '').trim()
        return [{ ...c, idx, p, thumbSrc }]
    })

    const total = lines.reduce(
        (sum, item) => sum + item.p.price * item.qty,
        0
    )

    const updateCustomer = (
        field: keyof typeof customer,
        value: string
    ) => {
        setCustomer(prev => ({
            ...prev,
            [field]: value,
        }))
    }

    // CONSULTA AUTOMÁTICA DO CEP
    const handleCepChange = async (value: string) => {
        const digits = value.replace(/\D/g, '').slice(0, 8)

        const formattedCep = digits.replace(
            /^(\d{5})(\d)/,
            '$1-$2'
        )

        updateCustomer('cep', formattedCep)
        setCepStatus('')

        if (digits.length !== 8) {
            setLoadingCep(false)
            return
        }

        setLoadingCep(true)
        setCepStatus('Buscando endereço...')

        try {
            const response = await fetch(
                `https://viacep.com.br/ws/${digits}/json/`
            )

            if (!response.ok) {
                throw new Error('Erro na consulta do CEP')
            }

            const data = await response.json()

            if (data.erro) {
                setCepStatus('CEP não encontrado. Confira os números.')
                return
            }

            setCustomer(prev => ({
                ...prev,
                cep: formattedCep,
                address: data.logradouro || '',
                neighborhood: data.bairro || '',
                city: data.localidade || '',
                state: data.uf || '',
            }))

            setCepStatus('Endereço encontrado com sucesso!')
        } catch {
            setCepStatus(
                'Não foi possível consultar o CEP. Preencha o endereço manualmente.'
            )
        } finally {
            setLoadingCep(false)
        }
    }

    // VALIDAÇÃO DO FORMULÁRIO
    const formIsValid =
        customer.name.trim() !== '' &&
        customer.phone.trim() !== '' &&
        customer.cep.replace(/\D/g, '').length === 8 &&
        customer.address.trim() !== '' &&
        customer.number.trim() !== '' &&
        customer.neighborhood.trim() !== '' &&
        customer.city.trim() !== '' &&
        customer.state.trim() !== ''

    // MENSAGEM PARA O WHATSAPP
    const buildWhatsappUrl = (orderId: string) => {
        const text =
            'Olá! Vim pelo site da Solar Move e gostaria de finalizar meu pedido.\n\n' +
            `*CÓDIGO DO PEDIDO: ${orderId}*\n\n` +
            '*DADOS DA CLIENTE*\n' +
            `Nome: ${customer.name}\n` +
            `Telefone: ${customer.phone}\n\n` +
            '*ENDEREÇO DE ENTREGA*\n' +
            `CEP: ${customer.cep}\n` +
            `Rua: ${customer.address}, ${customer.number}\n` +
            `Complemento: ${customer.complement || 'Não informado'}\n` +
            `Bairro: ${customer.neighborhood}\n` +
            `Cidade: ${customer.city} - ${customer.state}\n` +
            `Referência: ${customer.reference || 'Não informada'}\n\n` +
            '*RESUMO DO PEDIDO*\n\n' +
            lines.map(item =>
                `• ${item.qty}x ${item.p.name}\n` +
                `  Cor: ${item.color}\n` +
                `  Tamanho: ${item.size}\n` +
                `  Subtotal: ${brl(item.p.price * item.qty)}`
            ).join('\n\n') +
            `\n\n*Total dos produtos: ${brl(total)}*\n\n` +
            'Gostaria de confirmar a disponibilidade e receber as informações de pagamento pelo PicPay e entrega.'

        return `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(text)}`
    }

    // FINALIZAR E REGISTRAR PEDIDO
    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault()

        if (
            !formIsValid ||
            lines.length === 0 ||
            loadingCep ||
            submitting
        ) {
            return
        }

        setSubmitting(true)

        try {
            const order = createOrder(customer, currentCustomer?.id)

            if (!order) {
                return
            }

            const whatsappUrl = buildWhatsappUrl(order.id)

            window.open(
                whatsappUrl,
                '_blank',
                'noopener,noreferrer'
            )

            clearCart()
            onClose()
        } catch (error) {
            console.error('Erro ao finalizar pedido:', error)
            alert('Não foi possível registrar o pedido. Tente novamente.')
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <>
            {open && (
                <div
                    className="overlay"
                    onClick={onClose}
                />
            )}

            <aside
                className={`drawer ${open ? 'open' : ''}`}
                aria-hidden={!open}
                aria-label="Sacola e finalização do pedido"
            >
                <header>
                    <h3>Sua sacola</h3>

                    <button
                        type="button"
                        className="x"
                        onClick={onClose}
                        aria-label="Fechar"
                    >
                        ×
                    </button>
                </header>

                {lines.length === 0 ? (
                    <p className="empty">
                        Sua sacola está vazia.
                    </p>
                ) : (
                    <>
                        {/* PRODUTOS DA SACOLA */}
                        <div className="d-list">
                            {lines.map(item => (
                                <div
                                    className="d-line"
                                    key={item.idx}
                                >
                                    <div
                                        className="d-thumb"
                                        style={{
                                            overflow: 'hidden',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            backgroundColor: '#eceae2',
                                        }}
                                    >
                                        {item.thumbSrc ? (
                                            <img
                                                src={item.thumbSrc}
                                                alt={item.p.name}
                                                style={{
                                                    width: '100%',
                                                    height: '100%',
                                                    objectFit: 'cover',
                                                    display: 'block',
                                                }}
                                            />
                                        ) : null}
                                    </div>

                                    <div>
                                        <b>{item.p.name}</b>

                                        <small>
                                            {item.color} · {item.size}
                                        </small>

                                        <div className="qty">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setQty(item.idx, item.qty - 1)
                                                }
                                                aria-label="Diminuir quantidade"
                                            >
                                                −
                                            </button>

                                            <span>{item.qty}</span>

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setQty(item.idx, item.qty + 1)
                                                }
                                                aria-label="Aumentar quantidade"
                                            >
                                                +
                                            </button>
                                        </div>
                                    </div>

                                    <span>
                                        {brl(item.p.price * item.qty)}
                                    </span>
                                </div>
                            ))}
                        </div>

                        {/* TOTAL */}
                        <div className="d-total">
                            <span>Total dos produtos</span>
                            <b>{brl(total)}</b>
                        </div>

                        {/* INFORMAÇÕES */}
                        <div className="checkout-info">
                            <strong>Finalize seu pedido</strong>

                            <p>
                                Preencha seus dados para enviar o pedido
                                à Solar Move pelo WhatsApp.
                            </p>
                        </div>

                        {/* FORMULÁRIO */}
                        <form
                            className="checkout-form"
                            onSubmit={handleSubmit}
                        >
                            <h4>Seus dados</h4>

                            <label>
                                Nome completo *

                                <input
                                    type="text"
                                    value={customer.name}
                                    onChange={e =>
                                        updateCustomer('name', e.target.value)
                                    }
                                    placeholder="Digite seu nome"
                                    autoComplete="name"
                                    required
                                />
                            </label>

                            <label>
                                WhatsApp *

                                <input
                                    type="tel"
                                    value={customer.phone}
                                    onChange={e =>
                                        updateCustomer('phone', e.target.value)
                                    }
                                    placeholder="(21) 99999-9999"
                                    autoComplete="tel"
                                    required
                                />
                            </label>

                            <h4>Endereço de entrega</h4>

                            {/* CEP AUTOMÁTICO */}
                            <label>
                                CEP *

                                <input
                                    type="text"
                                    value={customer.cep}
                                    onChange={e =>
                                        handleCepChange(e.target.value)
                                    }
                                    placeholder="00000-000"
                                    inputMode="numeric"
                                    autoComplete="postal-code"
                                    maxLength={9}
                                    required
                                />
                            </label>

                            {cepStatus && (
                                <p
                                    className={`cep-status ${
                                        cepStatus.includes('sucesso')
                                            ? 'success'
                                            : cepStatus.includes('Buscando')
                                                ? 'loading'
                                                : 'error'
                                    }`}
                                    role="status"
                                >
                                    {loadingCep && '⌛ '}
                                    {cepStatus}
                                </p>
                            )}

                            <label>
                                Rua ou avenida *

                                <input
                                    type="text"
                                    value={customer.address}
                                    onChange={e =>
                                        updateCustomer('address', e.target.value)
                                    }
                                    placeholder="Nome da rua ou avenida"
                                    autoComplete="street-address"
                                    required
                                />
                            </label>

                            <div className="checkout-grid">
                                <label>
                                    Número *

                                    <input
                                        type="text"
                                        value={customer.number}
                                        onChange={e =>
                                            updateCustomer('number', e.target.value)
                                        }
                                        placeholder="Nº"
                                        required
                                    />
                                </label>

                                <label>
                                    Complemento

                                    <input
                                        type="text"
                                        value={customer.complement}
                                        onChange={e =>
                                            updateCustomer('complement', e.target.value)
                                        }
                                        placeholder="Apto, bloco..."
                                    />
                                </label>
                            </div>

                            <label>
                                Bairro *

                                <input
                                    type="text"
                                    value={customer.neighborhood}
                                    onChange={e =>
                                        updateCustomer('neighborhood', e.target.value)
                                    }
                                    placeholder="Seu bairro"
                                    autoComplete="address-level3"
                                    required
                                />
                            </label>

                            <label>
                                Cidade *

                                <input
                                    type="text"
                                    value={customer.city}
                                    onChange={e =>
                                        updateCustomer('city', e.target.value)
                                    }
                                    placeholder="Sua cidade"
                                    autoComplete="address-level2"
                                    required
                                />
                            </label>

                            <label>
                                Estado *

                                <input
                                    type="text"
                                    value={customer.state}
                                    onChange={e =>
                                        updateCustomer('state', e.target.value.toUpperCase())
                                    }
                                    placeholder="UF"
                                    maxLength={2}
                                    autoComplete="address-level1"
                                    required
                                />
                            </label>

                            <label>
                                Ponto de referência

                                <input
                                    type="text"
                                    value={customer.reference}
                                    onChange={e =>
                                        updateCustomer('reference', e.target.value)
                                    }
                                    placeholder="Próximo a..."
                                />
                            </label>

                            {/* PAGAMENTO */}
                            <div className="checkout-payment">
                                <strong>Pagamento pelo PicPay</strong>

                                <p>
                                    O pagamento e a entrega serão combinados
                                    diretamente com a loja pelo WhatsApp.
                                </p>
                            </div>

                            {/* BOTÃO */}
                            <button
                                type="submit"
                                className="solar-button"
                                disabled={
                                    !formIsValid ||
                                    loadingCep ||
                                    lines.length === 0 ||
                                    submitting
                                }
                            >
                                {submitting
                                    ? 'Registrando pedido...'
                                    : 'Enviar pedido pelo WhatsApp'}
                            </button>
                        </form>

                        <button
                            type="button"
                            className="link"
                            onClick={clearCart}
                        >
                            Esvaziar sacola
                        </button>
                    </>
                )}
            </aside>
        </>
    )
}