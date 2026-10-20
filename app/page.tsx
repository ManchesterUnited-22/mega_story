import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { SITE_TAGLINE } from '@/lib/config'
import Cover from '@/components/Cover'

export const dynamic = 'force-dynamic'

export default async function Home() {
  const supabase = createClient()
  const { data } = await supabase
    .from('stories')
    .select('id,slug,title,subtitle,intro_media_url,intro_media_type,published_at')
    .eq('status', 'published')
    .order('published_at', { ascending: false })
  const stories = data ?? []

  return (
    <main>
      <section className="mx-auto max-w-6xl px-5 pb-12 pt-10 md:pt-20">
        <h1 className="max-w-4xl font-serif text-5xl font-semibold leading-[1.05] tracking-tight text-sea md:text-8xl">
          Đọc chậm, cuộn xuống, đi tiếp.
        </h1>
        <p className="mt-6 max-w-xl text-lg text-ink/70">{SITE_TAGLINE}</p>
      </section>

      <section className="mx-auto max-w-6xl px-5 pb-24">
        {stories.length === 0 ? (
          <p className="border-t border-ink/15 pt-8 text-ink/70">
            Chưa có truyện nào được xuất bản.{' '}
            <Link href="/dang-nhap" className="font-medium text-sea underline">
              Đăng nhập
            </Link>{' '}
            để viết truyện đầu tiên.
          </p>
        ) : (
          <div className="grid gap-x-6 gap-y-12 md:grid-cols-2">
            {stories.map((s, i) => (
              <Link key={s.id} href={`/truyen/${s.slug}`} className={`group block ${i === 0 ? 'md:col-span-2' : ''}`}>
                <div className={`overflow-hidden rounded-sm bg-sea ${i === 0 ? 'aspect-[21/9]' : 'aspect-[4/3]'}`}>
                  <div className="h-full w-full transition duration-700 group-hover:scale-105">
                    <Cover url={s.intro_media_url} type={s.intro_media_type} />
                  </div>
                </div>
                <h2 className="mt-4 font-serif text-2xl font-semibold text-ink group-hover:text-sea md:text-3xl">{s.title}</h2>
                {s.subtitle && <p className="mt-1 line-clamp-2 text-ink/70">{s.subtitle}</p>}
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}
