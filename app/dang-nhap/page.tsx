'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const supabase = createClient()
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('loi')) {
      setMsg('Không đăng nhập được. Tài khoản này chưa được cấp quyền truy cập.')
    }
  }, [])

  async function google() {
    setBusy(true)
    setMsg('')
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${location.origin}/auth/callback` },
    })
    if (error) {
      setMsg('Không kết nối được với Google. Hãy thử lại.')
      setBusy(false)
    }
  }

  return (
    <main className="mx-auto max-w-sm px-5 py-16">
      <h1 className="font-serif text-4xl font-semibold text-sea">Đăng nhập</h1>
      <p className="mt-2 text-sm text-ink/70">Dành riêng cho tác giả.</p>

      <button onClick={google} disabled={busy} className="btn-primary mt-8 w-full">
        {busy ? 'Đang chuyển đến Google…' : 'Tiếp tục với Google'}
      </button>
      {msg && <p className="mt-4 text-sm text-red-700">{msg}</p>}
    </main>
  )
}