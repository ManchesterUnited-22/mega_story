import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { signOut } from './actions'

export const dynamic = 'force-dynamic'

export default async function ManageLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/dang-nhap')

  const { data: author } = await supabase.from('authors').select('user_id').eq('user_id', user.id).maybeSingle()

  if (!author) {
    return (
      <main className="mx-auto max-w-2xl px-5 py-16">
        <h1 className="font-serif text-3xl font-semibold text-sea">Tài khoản chưa được cấp quyền tác giả</h1>
        <p className="mt-4 text-ink/80">
          Bạn đang đăng nhập bằng <b>{user.email}</b>. Để soạn bài, hãy chạy câu lệnh sau trong Supabase, mục SQL Editor:
        </p>
        <pre className="mt-4 overflow-x-auto rounded-sm bg-ink p-4 text-sm text-white">
          {`insert into public.authors (user_id) values ('${user.id}');`}
        </pre>
        <form action={signOut} className="mt-6">
          <button className="btn-ghost">Đăng xuất</button>
        </form>
      </main>
    )
  }
  return <>{children}</>
}
