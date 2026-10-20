'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()
  const [mode, setMode] = useState<'in' | 'up'>('in')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setMsg('')
    if (mode === 'in') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setMsg('Email hoặc mật khẩu không đúng.')
      else {
        router.push('/quan-ly')
        router.refresh()
      }
    } else {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${location.origin}/auth/callback` },
      })
      if (error) setMsg(error.message)
      else if (data.session) {
        router.push('/quan-ly')
        router.refresh()
      } else setMsg('Đã gửi email xác nhận. Hãy mở email và bấm vào liên kết để hoàn tất.')
    }
    setBusy(false)
  }

  async function google() {
    await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: `${location.origin}/auth/callback` } })
  }

  return (
    <main className="mx-auto max-w-sm px-5 py-16">
      <h1 className="font-serif text-4xl font-semibold text-sea">{mode === 'in' ? 'Đăng nhập' : 'Tạo tài khoản'}</h1>
      <p className="mt-2 text-sm text-ink/70">Dành cho tác giả. Người đọc không cần đăng nhập.</p>

      <button onClick={google} className="btn-ghost mt-8 w-full">
        Tiếp tục với Google
      </button>
      <div className="my-6 border-t border-ink/15" />

      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="label" htmlFor="email">Email</label>
          <input id="email" type="email" required className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div>
          <label className="label" htmlFor="pw">Mật khẩu</label>
          <input id="pw" type="password" required minLength={6} className="input" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        {msg && <p className="text-sm text-red-700">{msg}</p>}
        <button className="btn-primary w-full" disabled={busy}>
          {busy ? 'Đang xử lý…' : mode === 'in' ? 'Đăng nhập' : 'Đăng ký'}
        </button>
      </form>

      <button className="mt-6 text-sm text-sea underline" onClick={() => { setMode(mode === 'in' ? 'up' : 'in'); setMsg('') }}>
        {mode === 'in' ? 'Chưa có tài khoản? Đăng ký' : 'Đã có tài khoản? Đăng nhập'}
      </button>
    </main>
  )
}
