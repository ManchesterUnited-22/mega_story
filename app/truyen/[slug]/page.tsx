import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import StoryView from '@/components/StoryView'
import type { Block, Story } from '@/lib/types'

export const dynamic = 'force-dynamic'

async function getStory(slug: string) {
  const supabase = createClient()
  const { data } = await supabase.from('stories').select('*').eq('slug', slug).maybeSingle()
  return { supabase, story: data as Story | null }
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const { story } = await getStory(params.slug)
  if (!story) return { title: 'Không tìm thấy truyện' }
  const image = story.intro_media_type === 'image' && story.intro_media_url ? [story.intro_media_url] : undefined
  return {
    title: story.title,
    description: story.subtitle ?? undefined,
    openGraph: { title: story.title, description: story.subtitle ?? undefined, images: image, type: 'article' },
    twitter: { card: image ? 'summary_large_image' : 'summary' },
  }
}

export default async function StoryPage({ params }: { params: { slug: string } }) {
  const { supabase, story } = await getStory(params.slug)
  if (!story) notFound()
  const { data } = await supabase.from('blocks').select('*').eq('story_id', story.id).order('position')
  return <StoryView story={story} blocks={(data ?? []) as Block[]} isDraft={story.status !== 'published'} />
}
