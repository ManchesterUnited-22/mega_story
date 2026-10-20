import { createClient } from '@/lib/supabase/client'

const MAX_MB = 50

export async function uploadMedia(file: File): Promise<{ url?: string; error?: string }> {
  if (file.size > MAX_MB * 1024 * 1024) {
    return { error: `File lớn hơn ${MAX_MB}MB. Hãy nén nhỏ lại hoặc dán link video (YouTube/Vimeo).` }
  }
  const supabase = createClient()
  const ext = file.name.split('.').pop()?.toLowerCase() || 'bin'
  const path = `uploads/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
  const { error } = await supabase.storage
    .from('story-media')
    .upload(path, file, { cacheControl: '31536000', contentType: file.type })
  if (error) return { error: error.message }
  const { data } = supabase.storage.from('story-media').getPublicUrl(path)
  return { url: data.publicUrl }
}
