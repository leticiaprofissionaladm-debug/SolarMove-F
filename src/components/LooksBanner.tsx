import { useEffect, useRef, useState } from 'react'
import type { CSSProperties, PointerEvent } from 'react'
import './LooksBanner.css'
import React from 'react'

// Fotos em proporção 3:4 (ex.: 1200x1600), de preferência com fundo liso.
const looks = [
  { name: 'Roxo e Preto', piece: 'Conjunto', image: '/looks/7eb6af22-0157-43bf-a3ae-429e5f95a501.jpeg', color: '#9BAA70' },
  { name: 'Marrom', piece: 'Short + top', image: '/looks/look-marrom.jpg', color: '#684438' },
  { name: 'Verde', piece: 'Top', image: '/looks/look-verde.jpg', color: '#172329' },
  { name: 'Branco', piece: 'Camisetas', image: '/looks/b8dbd17d-a425-4085-b344-c47d9eaed4d4.jpeg', color: '#DDA4C4' },
  { name: 'Preto e Bege', piece: 'Corta vento', image: '/looks/828fcde3-77ae-4383-918f-3487f960d224.jpeg', color: '#62B9C4' },
]

export default function LooksBanner() {
  const [active, setActive] = useState(0)
  const [paused, setPaused] = useState(false)
  const [lens, setLens] = useState<{ x: number; y: number; on: boolean }>({ x: 0, y: 0, on: false })
  const stageRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (paused) return
    const t = window.setInterval(() => setActive(c => (c + 1) % looks.length), 4500)
    return () => window.clearInterval(t)
  }, [paused])

  const moveLens = (e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== 'mouse' || !stageRef.current) return
    const r = stageRef.current.getBoundingClientRect()
    setLens({ x: e.clientX - r.left, y: e.clientY - r.top, on: true })
  }

  const current = looks[active]
  const r = stageRef.current?.getBoundingClientRect()
  const px = r ? (lens.x / r.width) * 100 : 50
  const py = r ? (lens.y / r.height) * 100 : 50

  return (
    <section className="hero" id="inicio" style={{ '--look': current.color } as CSSProperties}>
      <div className="hero-text">
        <p className="hero-kicker">Moda fitness</p>
        <h1>Roupa que acompanha cada movimento.</h1>
        <p className="hero-sub">
          Leggings, tops e conjuntos com caimento firme e tecido que não marca.
          Escolha uma cor na arara e veja o look de perto.
        </p>
        <a href="#colecao" className="solar-button">Ver a coleção</a>
      </div>

      <div className="hero-visual">
        <div
          className="stage"
          ref={stageRef}
          onPointerMove={moveLens}
          onPointerLeave={() => setLens(l => ({ ...l, on: false }))}
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          {looks.map((l, i) => (
            <div
              key={l.name}
              role="img"
              aria-label={`Look ${l.name}`}
              className={`stage-photo ${i === active ? 'on' : ''}`}
              style={{ backgroundColor: l.color, backgroundImage: `url(${l.image})` }}
            />
          ))}

          <div
            className={`lens ${lens.on ? 'on' : ''}`}
            style={{
              transform: `translate(${lens.x - 80}px, ${lens.y - 80}px)`,
              backgroundImage: `url(${current.image})`,
              backgroundPosition: `${px}% ${py}%`,
            }}
          />

          <div className="stage-caption">
            <strong>{current.name}</strong>
            <span>{current.piece}</span>
          </div>
        </div>

        <div className="rack" role="tablist" aria-label="Escolher look">
          <div className="rack-rail" />
          {looks.map((l, i) => (
            <button
              key={l.name}
              role="tab"
              aria-selected={i === active}
              className={`rack-item ${i === active ? 'on' : ''}`}
              onClick={() => setActive(i)}
              style={{ '--c': l.color } as CSSProperties}
            >
              <span className="rack-hook" />
              <span
                className="rack-thumb"
                style={{ backgroundColor: l.color, backgroundImage: `url(${l.image})` }}
              />
              <span className="rack-name">{l.name}</span>
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}