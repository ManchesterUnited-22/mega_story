import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Editor from '@/components/Editor'
import type { Block, Story } from '@/lib/types'

export default async function EditPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: story } = await supabase.from('stories').select('*').eq('id', params.id).maybeSingle()
  if (!story) notFound()
  const { data: blocks } = await supabase.from('blocks').select('*').eq('story_id', params.id).order('position')
  return <Editor initialStory={story as Story} initialBlocks={(blocks ?? []) as Block[]} />
}
