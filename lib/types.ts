export type BlockType = 'paragraph' | 'image' | 'gallery' | 'quote' | 'video'

export interface Block {
  id: string
  story_id: string
  type: BlockType
  content: Record<string, any>
  position: number
}

export interface Story {
  id: string
  slug: string
  title: string
  subtitle: string | null
  intro_media_url: string | null
  intro_media_type: 'image' | 'video' | null
  outro_text: string | null
  outro_thanks: string | null
  status: 'draft' | 'published'
  published_at: string | null
}

export const BLOCK_LABELS: Record<BlockType, string> = {
  paragraph: 'Đoạn văn',
  image: 'Ảnh lớn',
  gallery: 'Thư viện ảnh',
  quote: 'Trích dẫn',
  video: 'Video',
}

export function defaultContent(type: BlockType): Record<string, any> {
  switch (type) {
    case 'paragraph': return { title: '', body: '' }
    case 'image': return { url: '', caption: '' }
    case 'gallery': return { images: [] }
    case 'quote': return { text: '', author: '' }
    case 'video': return { url: '', caption: '' }
  }
}
