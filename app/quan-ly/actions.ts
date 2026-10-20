'use server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function createStory() {
  const supabase = createClient()
  const slug = `truyen-${Date.now().toString(36)}`
  const { data, error } = await supabase
    .from('stories')
    .insert({ slug, title: 'Truyện chưa đặt tên' })
    .select('id')
    .single()
  if (error || !data) throw new Error(error?.message ?? 'Không tạo được truyện')
  redirect(`/quan-ly/${data.id}`)
}

export async function deleteStory(formData: FormData) {
  const id = String(formData.get('id'))
  const supabase = createClient()
  await supabase.from('stories').delete().eq('id', id)
  revalidatePath('/quan-ly')
}

export async function signOut() {
  const supabase = createClient()
  await supabase.auth.signOut()
  redirect('/')
}
