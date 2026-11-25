import React from 'react'
import { WHATSAPP } from '../store'

const whatsappLink = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(
  'Olá! Tenho uma dúvida sobre a Solar Move.'
)}`

const faqs = [
  {
    question: 'Como faço meu pedido?',
    answer:
      'Escolha os produtos, selecione cor e tamanho, adicione à sacola e finalize a solicitação pelo WhatsApp.'
  },
  {
    question: 'Como funciona o pagamento?',
    answer:
      'O pagamento é combinado diretamente pelo WhatsApp. A equipe confirma os detalhes e envia as orientações para pagar pelo PicPay.'
  },
  {
    question: 'Qual é o prazo e o valor da entrega?',
    answer:
      'O prazo, a forma de entrega e o valor do frete são informados durante o atendimento, antes da confirmação da compra.'
  },
  {
    question: 'Posso trocar ou devolver um produto?',
    answer:
      'Sim. As solicitações seguem os direitos previstos na legislação brasileira e as orientações da nossa política de trocas e devoluções.'
  },
  {
    question: 'Como falo com a Solar Move?',
    answer:
      'Chame nossa equipe pelo WhatsApp. Você também pode acompanhar novidades no Instagram @solarmovefitness.'
  }
]

export default function Institutional() {
  return (
    <section className="sm-institutional" id="perguntas-frequentes">
      <div className="sm-institutional-inner">
        <div className="sm-institutional-heading">
          <span className="sm-institutional-eyebrow">PRECISA DE AJUDA?</span>
          <h2>
            Como podemos <em>ajudar?</em>
          </h2>
          <p>
            Tire suas dúvidas sobre pedidos, pagamentos e entregas.
          </p>
        </div>

        <div className="sm-faq-list">
          {faqs.map((faq) => (
            <details className="sm-faq-item" key={faq.question}>
              <summary>
                <span>{faq.question}</span>
                <span className="sm-faq-icon" aria-hidden="true">+</span>
              </summary>
              <p>{faq.answer}</p>
            </details>
          ))}
        </div>

        <div className="sm-faq-contact">
          <div>
            <span>AINDA PRECISA DE AJUDA?</span>
            <h3>Fale com a gente.</h3>
            <p>Estamos disponíveis para ajudar com seu pedido.</p>
          </div>
          <a href={whatsappLink} target="_blank" rel="noreferrer">
            Falar pelo WhatsApp
          </a>
        </div>

        <div className="sm-legal-area">
          <div className="sm-legal-heading">
            <span className="sm-institutional-eyebrow">CONHEÇA A LOJA</span>
            <h2>Informações institucionais</h2>
          </div>

          <div className="sm-legal-grid">
            <article className="sm-legal-card" id="sobre-a-loja">
              <h3>Sobre a Solar Move</h3>
              <p>
                A Solar Move acredita que movimento é liberdade. Nossa proposta
                é acompanhar mulheres com peças que unem conforto, estilo e confiança.
              </p>
              <a href="#sobre">Conheça nossa história</a>
            </article>

            <details className="sm-legal-card" id="politica-privacidade">
              <summary>Política de Privacidade</summary>
              <div>
                <p>
                  As informações fornecidas pelo cliente, como nome, telefone,
                  endereço e dados do pedido, são utilizadas para atendimento e
                  organização das solicitações de compra.
                </p>
                <p>
                  O carrinho e algumas funcionalidades podem utilizar o
                  armazenamento local do navegador. Essas informações não são
                  sincronizadas automaticamente entre dispositivos.
                </p>
                <p>
                  Para solicitar informações, correções ou exercer direitos
                  previstos na LGPD, entre em contato pelo WhatsApp da loja.
                </p>
              </div>
            </details>

            <details className="sm-legal-card" id="termos-de-uso">
              <summary>Termos de Uso</summary>
              <div>
                <p>
                  Ao utilizar o site, o visitante deve fornecer informações
                  corretas ao solicitar um pedido e utilizar as funcionalidades
                  de forma adequada.
                </p>
                <p>
                  Os pedidos dependem da confirmação de disponibilidade,
                  valores e condições pela equipe da Solar Move.
                </p>
                <p>
                  As condições de pagamento e entrega serão informadas antes
                  da conclusão da compra. Aplicam-se os direitos previstos na
                  legislação brasileira.
                </p>
              </div>
            </details>

            <details className="sm-legal-card" id="trocas-devolucoes">
              <summary>Trocas e Devoluções</summary>
              <div>
                <p>
                  Para solicitar troca ou devolução, entre em contato pelo
                  WhatsApp da Solar Move e informe os dados do pedido.
                </p>
                <p>
                  Nas compras realizadas fora do estabelecimento comercial,
                  aplica-se o direito de arrependimento no prazo e nas
                  condições previstos no artigo 49 do Código de Defesa do
                  Consumidor.
                </p>
                <p>
                  Produtos com defeito serão tratados conforme os direitos
                  e prazos previstos na legislação.
                </p>
              </div>
            </details>
          </div>
        </div>
      </div>
    </section>
  )
}
