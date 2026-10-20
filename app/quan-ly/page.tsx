import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import ConfirmButton from '@/components/ConfirmButton'
import { createStory, deleteStory, signOut } from './actions'

export default async function ManagePage() {
  const supabase = createClient()
  const { data } = await supabase
    .from('stories')
    .select('id,slug,title,status,updated_at')
    .order('updated_at', { ascending: false })
  const stories = data ?? []

  return (
    <main className="mx-auto max-w-3xl px-5 pb-24">
      <div className="flex flex-wrap items-center justify-between gap-3 py-6">
        <h1 className="font-serif text-4xl font-semibold text-sea">Truyện của bạn</h1>
        <div className="flex gap-2">
          <form action={createStory}>
            <button className="btn-primary">+ Viết truyện mới</button>
          </form>
          <form action={signOut}>
            <button className="btn-ghost">Đăng xuất</button>
          </form>
        </div>
      </div>

      {stories.length === 0 ? (
        <p className="border-t border-ink/15 pt-6 text-ink/70">Chưa có truyện nào. Bấm “Viết truyện mới” để bắt đầu.</p>
      ) : (
        <ul className="divide-y divide-ink/15 border-y border-ink/15">
          {stories.map((s) => (
            <li key={s.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
              <div className="min-w-0">
                <p className="truncate font-serif text-xl font-semibold">{s.title}</p>
                <p className="mt-1 text-xs text-ink/60">
                  <span className={`mr-2 rounded-full px-2 py-0.5 font-medium ${s.status === 'published' ? 'bg-sea text-white' : 'bg-sun/30 text-ink'}`}>
                    {s.status === 'published' ? 'Đã xuất bản' : 'Bản nháp'}
                  </span>
                  /truyen/{s.slug}
                </p>
              </div>
              <div className="flex gap-2">
                <Link href={`/quan-ly/${s.id}`} className="btn-ghost">Sửa</Link>
                <Link href={`/truyen/${s.slug}`} className="btn-ghost">Xem</Link>
                <form action={deleteStory}>
                  <input type="hidden" name="id" value={s.id} />
                  <ConfirmButton message={`Xóa truyện “${s.title}”? Không thể khôi phục.`} className="btn-danger">
                    Xóa
                  </ConfirmButton>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}
