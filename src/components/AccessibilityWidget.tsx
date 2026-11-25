import React, { useEffect, useRef, useState } from 'react'
import './AccessibilityWidget.css'

export type FontScale = 'normal' | 'large' | 'xlarge'
export type SiteLang = 'pt' | 'en' | 'es'

export interface AccessibilitySettings {
  fontScale: FontScale
  highContrast: boolean
  readableSpacing: boolean
  highlightLinks: boolean
  reduceMotion: boolean
  darkMode: boolean
  lang: SiteLang
}

const STORAGE_KEY = 'solar_move_accessibility_v1'

const DEFAULT_SETTINGS: AccessibilitySettings = {
  fontScale: 'normal',
  highContrast: false,
  readableSpacing: false,
  highlightLinks: false,
  reduceMotion: false,
  darkMode: false,
  lang: 'pt',
}

function loadSettings(): AccessibilitySettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_SETTINGS
    const parsed = JSON.parse(raw) as Partial<AccessibilitySettings>
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
    }
  } catch {
    return DEFAULT_SETTINGS
  }
}

function applySettingsToDocument(settings: AccessibilitySettings) {
  const html = document.documentElement

  // Escala de fonte via raiz para respeitar rem/em
  html.classList.remove('a11y-font-large', 'a11y-font-xlarge')
  if (settings.fontScale === 'large') {
    html.classList.add('a11y-font-large')
  } else if (settings.fontScale === 'xlarge') {
    html.classList.add('a11y-font-xlarge')
  }

  html.classList.toggle('a11y-high-contrast', settings.highContrast)
  html.classList.toggle('a11y-readable-spacing', settings.readableSpacing)
  html.classList.toggle('a11y-highlight-links', settings.highlightLinks)
  html.classList.toggle('a11y-reduce-motion', settings.reduceMotion)
  html.classList.toggle('a11y-dark-mode', settings.darkMode)

  html.lang =
    settings.lang === 'en' ? 'en' : settings.lang === 'es' ? 'es' : 'pt-BR'

  window.dispatchEvent(
    new CustomEvent('solar-lang-change', { detail: { lang: settings.lang } })
  )
}

interface AccessibilityWidgetProps {
  onLanguageChange?: (lang: SiteLang) => void
}

export default function AccessibilityWidget({
  onLanguageChange,
}: AccessibilityWidgetProps) {
  const [open, setOpen] = useState(false)
  const [settings, setSettings] = useState<AccessibilitySettings>(loadSettings)
  const [announcement, setAnnouncement] = useState('')

  const triggerRef = useRef<HTMLButtonElement | null>(null)
  const panelRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    applySettingsToDocument(settings)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
    } catch {
      // Ignora erro de storage bloqueado
    }
  }, [settings])

  // Fechar com Escape, clicar fora e devolver foco ao botão
  useEffect(() => {
    if (!open) return

    const firstFocusable = panelRef.current?.querySelector<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    firstFocusable?.focus()

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        setOpen(false)
        triggerRef.current?.focus()
      }
    }

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      if (
        panelRef.current &&
        !panelRef.current.contains(target) &&
        triggerRef.current &&
        !triggerRef.current.contains(target)
      ) {
        setOpen(false)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('mousedown', handleClickOutside)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [open])

  const announce = (msg: string) => {
    setAnnouncement('')
    requestAnimationFrame(() => setAnnouncement(msg))
  }

  const updateToggle = (
    key: keyof Pick<
      AccessibilitySettings,
      | 'highContrast'
      | 'readableSpacing'
      | 'highlightLinks'
      | 'reduceMotion'
      | 'darkMode'
    >,
    label: string
  ) => {
    setSettings(prev => {
      const nextValue = !prev[key]
      announce(`${label}: ${nextValue ? 'ativado' : 'desativado'}`)
      return { ...prev, [key]: nextValue }
    })
  }

  const cycleFontScale = (direction: 'increase' | 'decrease') => {
    const order: FontScale[] = ['normal', 'large', 'xlarge']
    setSettings(prev => {
      const idx = order.indexOf(prev.fontScale)
      const nextIdx =
        direction === 'increase'
          ? Math.min(order.length - 1, idx + 1)
          : Math.max(0, idx - 1)
      const nextScale = order[nextIdx]
      const labelMap: Record<FontScale, string> = {
        normal: '100% (padrão)',
        large: '112% (ampliada)',
        xlarge: '125% (grande)',
      }
      announce(`Tamanho da fonte alterado para ${labelMap[nextScale]}`)
      return { ...prev, fontScale: nextScale }
    })
  }

  const handleLangChange = (lang: SiteLang) => {
    setSettings(prev => ({ ...prev, lang }))
    onLanguageChange?.(lang)
    const names: Record<SiteLang, string> = {
      pt: 'Português',
      en: 'Inglês',
      es: 'Espanhol',
    }
    announce(`Idioma selecionado: ${names[lang]}`)
  }

  const handleReset = () => {
    setSettings(DEFAULT_SETTINGS)
    announce('Configurações de acessibilidade restauradas para o padrão.')
  }

  const handleTriggerLibras = () => {
    const librasBtn = document.querySelector<HTMLElement>(
      '[vw-access-button], .vw-access-button, [data-vw-access-button]'
    )
    if (librasBtn) {
      librasBtn.click()
      announce('Acionando tradutor VLibras.')
    } else {
      announce(
        'Widget VLibras não detectado nesta página. Verifique se o script do VLibras está carregado.'
      )
      alert(
        'Para ativar o intérprete em Libras, certifique-se de que o script do VLibras esteja incluído na página.'
      )
    }
  }

  const fontScalePercent =
    settings.fontScale === 'xlarge'
      ? '125%'
      : settings.fontScale === 'large'
        ? '112%'
        : '100%'

  return (
    <div className="a11y-widget-root">
      {/* Região viva para leitores de tela */}
      <span className="a11y-sr-only" role="status" aria-live="polite">
        {announcement}
      </span>

      {/* Botão flutuante principal */}
      <button
        ref={triggerRef}
        type="button"
        className="a11y-fab"
        aria-label="Abrir menu de acessibilidade"
        aria-expanded={open}
        aria-controls="a11y-drawer"
        onClick={() => setOpen(prev => !prev)}
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <circle cx="12" cy="4.5" r="2" fill="currentColor" />
          <path
            d="M4.5 8.5C7.2 9.3 9.7 9.7 12 9.7C14.3 9.7 16.8 9.3 19.5 8.5"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d="M12 9.7V14.5M12 14.5L8.5 20.5M12 14.5L15.5 20.5"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span className="a11y-fab-label">Acessibilidade</span>
      </button>

      {/* Painel de opções */}
      {open && (
        <div
          id="a11y-drawer"
          ref={panelRef}
          className="a11y-panel"
          role="dialog"
          aria-modal="false"
          aria-label="Opções de acessibilidade da Solar Move"
        >
          <div className="a11y-panel-header">
            <div>
              <span className="a11y-panel-eyebrow">SOLAR MOVE</span>
              <h3>Acessibilidade</h3>
            </div>

            <button
              type="button"
              className="a11y-close-btn"
              aria-label="Fechar menu de acessibilidade"
              onClick={() => {
                setOpen(false)
                triggerRef.current?.focus()
              }}
            >
              ✕
            </button>
          </div>

          <div className="a11y-panel-body">
            {/* Tamanho da fonte */}
            <div className="a11y-group">
              <div className="a11y-group-head">
                <span>Tamanho do texto</span>
                <strong>{fontScalePercent}</strong>
              </div>

              <div className="a11y-font-controls">
                <button
                  type="button"
                  className="a11y-step-btn"
                  disabled={settings.fontScale === 'normal'}
                  aria-label="Diminuir tamanho do texto"
                  onClick={() => cycleFontScale('decrease')}
                >
                  A−
                </button>

                <button
                  type="button"
                  className="a11y-step-btn"
                  disabled={settings.fontScale === 'xlarge'}
                  aria-label="Aumentar tamanho do texto"
                  onClick={() => cycleFontScale('increase')}
                >
                  A+
                </button>
              </div>
            </div>

            {/* Alternâncias visuais e de leitura */}
            <div className="a11y-toggles">
              <button
                type="button"
                className={`a11y-toggle-btn ${settings.highContrast ? 'is-active' : ''}`}
                aria-pressed={settings.highContrast}
                onClick={() => updateToggle('highContrast', 'Alto contraste')}
              >
                <span>Alto contraste</span>
                <small>{settings.highContrast ? 'Ativo' : 'Off'}</small>
              </button>

              <button
                type="button"
                className={`a11y-toggle-btn ${settings.readableSpacing ? 'is-active' : ''}`}
                aria-pressed={settings.readableSpacing}
                onClick={() =>
                  updateToggle('readableSpacing', 'Espaçamento de leitura')
                }
              >
                <span>Espaçamento de leitura</span>
                <small>{settings.readableSpacing ? 'Ativo' : 'Off'}</small>
              </button>

              <button
                type="button"
                className={`a11y-toggle-btn ${settings.highlightLinks ? 'is-active' : ''}`}
                aria-pressed={settings.highlightLinks}
                onClick={() => updateToggle('highlightLinks', 'Destacar links')}
              >
                <span>Destacar links</span>
                <small>{settings.highlightLinks ? 'Ativo' : 'Off'}</small>
              </button>

              <button
                type="button"
                className={`a11y-toggle-btn ${settings.reduceMotion ? 'is-active' : ''}`}
                aria-pressed={settings.reduceMotion}
                onClick={() =>
                  updateToggle('reduceMotion', 'Reduzir animações')
                }
              >
                <span>Reduzir animações</span>
                <small>{settings.reduceMotion ? 'Ativo' : 'Off'}</small>
              </button>

              <button
                type="button"
                className={`a11y-toggle-btn ${settings.darkMode ? 'is-active' : ''}`}
                aria-pressed={settings.darkMode}
                onClick={() => updateToggle('darkMode', 'Modo escuro')}
              >
                <span>Modo escuro</span>
                <small>{settings.darkMode ? 'Ativo' : 'Off'}</small>
              </button>
            </div>

            {/* Idioma */}
            <div className="a11y-group">
              <div className="a11y-group-head">
                <span>Idioma</span>
                <strong>{settings.lang.toUpperCase()}</strong>
              </div>

              <div className="a11y-lang-grid" role="group" aria-label="Selecionar idioma">
                {(
                  [
                    { id: 'pt', label: 'PT' },
                    { id: 'en', label: 'EN' },
                    { id: 'es', label: 'ES' },
                  ] as const
                ).map(item => (
                  <button
                    key={item.id}
                    type="button"
                    className={`a11y-lang-btn ${settings.lang === item.id ? 'is-active' : ''}`}
                    aria-pressed={settings.lang === item.id}
                    onClick={() => handleLangChange(item.id)}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* VLibras */}
            <button
              type="button"
              className="a11y-libras-btn"
              onClick={handleTriggerLibras}
            >
              <span>Intérprete de Libras (VLibras)</span>
              <small>Ativar</small>
            </button>
          </div>

          <div className="a11y-panel-footer">
            <button
              type="button"
              className="a11y-reset-btn"
              onClick={handleReset}
            >
              Restaurar padrão
            </button>
          </div>
        </div>
      )}
    </div>
  )
}