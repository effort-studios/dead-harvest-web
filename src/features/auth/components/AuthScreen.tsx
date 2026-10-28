import { useState, type FormEvent } from 'react'
import { forgotPassword, resetPassword } from '../api'
import { AuthScene } from './AuthScene'
import { Button, Field, Input, Panel } from '@/shared/ui'
import { EyeIcon, EyeOffIcon } from '@/shared/ui/icons'

type Mode = 'login' | 'register' | 'forgot' | 'reset'

const TITLES: Record<Mode, string> = {
  login: 'Entrar',
  register: 'Criar conta',
  forgot: 'Esqueci minha senha',
  reset: 'Nova senha',
}

// Tela de login: é a primeira coisa que o jogador vê. Não existe jogo sem conta.
type Props = {
  onLogin: (email: string, password: string) => Promise<void>
  onRegister: (email: string, password: string, displayName: string) => Promise<void>
}

export function AuthScreen({ onLogin, onRegister }: Props) {

  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [code, setCode] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  function go(next: Mode) {
    setMode(next)
    setError(null)
    setNotice(null)
    setPassword('')
  }

  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      if (mode === 'login') await onLogin(email, password)
      else if (mode === 'register') await onRegister(email, password, displayName)
      else if (mode === 'forgot') {
        await forgotPassword(email)
        go('reset')
        setNotice('Se existir uma conta com este e-mail, enviamos um código de 6 dígitos. Ele vale 15 minutos.')
      } else {
        await resetPassword({ email, code, newPassword: password })
        setCode('')
        go('login')
        setNotice('Senha alterada! Entre com a senha nova.')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Algo deu errado')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="auth-screen">
      <AuthScene />
      <header className="auth-hero">
        <h1>
          <span>Dead</span> Harvest
        </h1>
        <p>Plante de dia. Sobreviva à noite.</p>
      </header>
      <Panel className="auth-card">
      <form onSubmit={submit}>
        {/* entrar e criar conta: o botão já diz o que faz; só a recuperação de senha precisa de título */}
        {(mode === 'forgot' || mode === 'reset') && <h2>{TITLES[mode]}</h2>}
        {(mode === 'login' || mode === 'register') && <h2>{mode === 'login' ? 'Bem-vindo de volta' : 'Comece sua fazenda'}</h2>}

        {notice && <p className="auth-notice">{notice}</p>}

        {mode === 'register' && (
          <Field label="Nome no jogo">
            <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} minLength={2} maxLength={30} required autoComplete="nickname" />
          </Field>
        )}

        <Field label="E-mail">
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" autoFocus />
        </Field>

        {mode === 'reset' && (
          <Field label="Código recebido por e-mail">
            <Input value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))} inputMode="numeric" pattern="\d{6}" placeholder="000000" required autoComplete="one-time-code" />
          </Field>
        )}

        {mode !== 'forgot' && (
          <Field label={mode === 'reset' ? 'Nova senha' : 'Senha'} hint={mode !== 'login' ? 'Pelo menos 8 caracteres.' : undefined}>
            <span className="password-field">
              <Input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={mode === 'login' ? 1 : 8}
                maxLength={128}
                required
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              />
              <button
                type="button"
                className="password-toggle"
                aria-label={showPassword ? 'Esconder senha' : 'Mostrar senha'}
                aria-pressed={showPassword}
                title={showPassword ? 'Esconder senha' : 'Mostrar senha'}
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOffIcon size={22} /> : <EyeIcon size={22} />}
              </button>
            </span>
          </Field>
        )}

        {error && <p className="auth-error" role="alert">{error}</p>}

        <Button type="submit" className="auth-submit" disabled={busy}>
          {busy ? 'Aguarde...' : mode === 'forgot' ? 'Enviar código' : TITLES[mode]}
        </Button>

        <div className="auth-links">
          {mode === 'login' && (
            <>
              <button type="button" onClick={() => go('register')}>Criar conta</button>
              <button type="button" onClick={() => go('forgot')}>Esqueci minha senha</button>
            </>
          )}
          {mode === 'register' && <button type="button" onClick={() => go('login')}>Já tenho conta</button>}
          {(mode === 'forgot' || mode === 'reset') && <button type="button" onClick={() => go('login')}>Voltar para o login</button>}
        </div>
      </form>
      </Panel>
    </div>
  )
}
