import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { SITE_NAME } from '@/lib/config'

export default async function Header() {
  const {
    data: { user },
  } = await createClient().auth.getUser()
  return (
    <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
      <Link href="/" className="font-serif text-2xl font-semibold tracking-tight text-sea">
        {SITE_NAME}
      </Link>
      <Link href={user ? '/quan-ly' : '/dang-nhap'} className="text-sm font-medium text-ink/70 hover:text-sea">
        {user ? 'Quản lý' : 'Đăng nhập'}
      </Link>
    </header>
  )
}
