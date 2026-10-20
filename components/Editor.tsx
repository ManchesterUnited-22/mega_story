'use client'
import { useMemo, useState } from 'react'
import Link from 'next/link'
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { createClient } from '@/lib/supabase/client'
import { BLOCK_LABELS, defaultContent, type Block, type BlockType, type Story } from '@/lib/types'
import { isVideoUrl, slugify } from '@/lib/utils'
import MediaField from './MediaField'
import BlockForm from './BlockForm'

function Sortable({ id, children }: { id: string; children: (handle: any) => React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })
  return (
    <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.6 : 1 }}>
      {children({ ...attributes, ...listeners })}
    </div>
  )
}

export default function Editor({ initialStory, initialBlocks }: { initialStory: Story; initialBlocks: Block[] }) {
  const supabase = useMemo(() => createClient(), [])
  const [story, setStory] = useState<Story>(initialStory)
  const [blocks, setBlocks] = useState<Block[]>(initialBlocks)
  const [dirty, setDirty] = useState(false)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const patchStory = (p: Partial<Story>) => {
    setStory((s) => ({ ...s, ...p }))
    setDirty(true)
  }
  const patchBlock = (id: string, p: Record<string, any>) => {
    setBlocks((bs) => bs.map((b) => (b.id === id ? { ...b, content: { ...b.content, ...p } } : b)))
    setDirty(true)
  }

  async function save(): Promise<boolean> {
    setBusy(true)
    setMsg('')
    const slug = slugify(story.slug) || story.slug
    const { error: e1 } = await supabase
      .from('stories')
      .update({
        slug,
        title: story.title,
        subtitle: story.subtitle,
        intro_media_url: story.intro_media_url || null,
        intro_media_type: story.intro_media_url ? story.intro_media_type : null,
        outro_text: story.outro_text,
        outro_thanks: story.outro_thanks,
      })
      .eq('id', story.id)
    if (e1) {
      setBusy(false)
      setMsg(e1.code === '23505' ? 'Đường dẫn (slug) này đã có truyện khác dùng.' : e1.message)
      return false
    }
    if (blocks.length) {
      const rows = blocks.map((b, i) => ({ id: b.id, story_id: story.id, type: b.type, content: b.content, position: i }))
      const { error: e2 } = await supabase.from('blocks').upsert(rows)
      if (e2) {
        setBusy(false)
        setMsg(e2.message)
        return false
      }
    }
    setStory((s) => ({ ...s, slug }))
    setDirty(false)
    setBusy(false)
    setMsg('Đã lưu.')
    return true
  }

  async function preview() {
    const w = window.open('about:blank', '_blank')
    const ok = dirty ? await save() : true
    if (ok && w) w.location.href = `/truyen/${slugify(story.slug) || story.slug}`
    else w?.close()
  }

  async function setStatus(next: 'draft' | 'published') {
    if (dirty && !(await save())) return
    const published_at = next === 'published' ? story.published_at ?? new Date().toISOString() : story.published_at
    const { error } = await supabase.from('stories').update({ status: next, published_at }).eq('id', story.id)
    if (error) return setMsg(error.message)
    setStory((s) => ({ ...s, status: next, published_at }))
    setMsg(next === 'published' ? 'Đã xuất bản. Người đọc đã thấy truyện này.' : 'Đã chuyển về bản nháp.')
  }

  async function addBlock(type: BlockType) {
    const { data, error } = await supabase
      .from('blocks')
      .insert({ story_id: story.id, type, content: defaultContent(type), position: blocks.length })
      .select()
      .single()
    if (error) return setMsg(error.message)
    setBlocks((b) => [...b, data as Block])
  }

  async function removeBlock(id: string) {
    if (!confirm('Xóa khối này?')) return
    const { error } = await supabase.from('blocks').delete().eq('id', id)
    if (error) return setMsg(error.message)
    setBlocks((b) => b.filter((x) => x.id !== id))
  }

  async function onDragEnd(e: DragEndEvent) {
    const { active, over } = e
    if (!over || active.id === over.id) return
    const from = blocks.findIndex((b) => b.id === active.id)
    const to = blocks.findIndex((b) => b.id === over.id)
    const next = arrayMove(blocks, from, to)
    setBlocks(next)
    const { error } = await supabase.rpc('reorder_blocks', { p_story: story.id, p_ids: next.map((b) => b.id) })
    if (error) setMsg(error.message)
  }

  const published = story.status === 'published'

  return (
    <main className="mx-auto max-w-3xl px-5 pb-40">
      <div className="flex items-center justify-between gap-3 py-4">
        <Link href="/quan-ly" className="text-sm text-ink/70 hover:text-sea">← Danh sách truyện</Link>
        <span className={`rounded-full px-3 py-1 text-xs font-medium ${published ? 'bg-sea text-white' : 'bg-sun/30 text-ink'}`}>
          {published ? 'Đã xuất bản' : 'Bản nháp'}
        </span>
      </div>

      <section className="space-y-4 border-t border-ink/15 pt-6">
        <h2 className="font-serif text-2xl font-semibold text-sea">Mở đầu</h2>
        <MediaField
          label="Video hoặc ảnh nền"
          accept="video/*,image/*"
          value={story.intro_media_url ?? ''}
          emptyText="Tải video lên"
          hint="Tệp .mp4/.webm hoặc ảnh. Link YouTube không dùng được làm nền."
          onChange={(url, mime) => patchStory({ intro_media_url: url, intro_media_type: mime ? (mime.startsWith('video') ? 'video' : 'image') : isVideoUrl(url) ? 'video' : 'image' })}
        />
        <div>
          <label className="label">Tiêu đề</label>
          <input className="input" value={story.title} onChange={(e) => patchStory({ title: e.target.value })} />
        </div>
        <div>
          <label className="label">Mô tả ngắn</label>
          <textarea className="input" rows={2} value={story.subtitle ?? ''} onChange={(e) => patchStory({ subtitle: e.target.value })} />
        </div>
        <div>
          <label className="label">Đường dẫn (slug)</label>
          <input className="input" value={story.slug} onChange={(e) => patchStory({ slug: e.target.value })} />
          <p className="mt-1 text-xs text-ink/60">Địa chỉ: /truyen/{slugify(story.slug) || '…'}</p>
        </div>
      </section>

      <section className="mt-10 border-t border-ink/15 pt-6">
        <h2 className="font-serif text-2xl font-semibold text-sea">Thân bài</h2>
        <p className="mb-4 text-sm text-ink/60">Kéo nút ⠿ để đổi thứ tự các khối.</p>

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-4">
              {blocks.map((b) => (
                <Sortable key={b.id} id={b.id}>
                  {(handle) => (
                    <div className="rounded-sm border border-ink/15 bg-white p-4">
                      <div className="mb-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <button type="button" aria-label="Kéo để đổi thứ tự" className="cursor-grab px-2 text-xl text-ink/50" {...handle}>
                            ⠿
                          </button>
                          <span className="text-sm font-semibold">{BLOCK_LABELS[b.type]}</span>
                        </div>
                        <button type="button" className="text-sm text-red-700 hover:underline" onClick={() => removeBlock(b.id)}>
                          Xóa khối
                        </button>
                      </div>
                      <BlockForm block={b} onChange={(p) => patchBlock(b.id, p)} />
                    </div>
                  )}
                </Sortable>
              ))}
            </div>
          </SortableContext>
        </DndContext>

        <div className="mt-5 flex flex-wrap gap-2">
          {(Object.keys(BLOCK_LABELS) as BlockType[]).map((t) => (
            <button key={t} type="button" className="btn-ghost" onClick={() => addBlock(t)}>
              + {BLOCK_LABELS[t]}
            </button>
          ))}
        </div>
      </section>

      <section className="mt-10 space-y-4 border-t border-ink/15 pt-6">
        <h2 className="font-serif text-2xl font-semibold text-sea">Kết bài</h2>
        <div>
          <label className="label">Lời tổng kết</label>
          <textarea className="input" rows={5} value={story.outro_text ?? ''} onChange={(e) => patchStory({ outro_text: e.target.value })} />
        </div>
        <div>
          <label className="label">Lời cảm ơn</label>
          <input className="input" value={story.outro_thanks ?? ''} onChange={(e) => patchStory({ outro_thanks: e.target.value })} />
        </div>
        <p className="text-xs text-ink/60">Nút chia sẻ Facebook, Zalo và sao chép liên kết tự động có ở cuối truyện.</p>
      </section>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-ink/15 bg-white/95 px-5 pt-3 backdrop-blur" style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom, 0px))' }}>
        <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-3">
          <span className="text-sm text-ink/70" aria-live="polite">{msg || (dirty ? 'Có thay đổi chưa lưu' : '')}</span>
          <div className="flex gap-2">
            <button className="btn-ghost" onClick={preview} disabled={busy}>Xem trước</button>
            <button className="btn-ghost" onClick={save} disabled={busy || !dirty}>{busy ? 'Đang lưu…' : 'Lưu'}</button>
            {published ? (
              <button className="btn-ghost" onClick={() => setStatus('draft')} disabled={busy}>Chuyển về nháp</button>
            ) : (
              <button className="btn-primary" onClick={() => setStatus('published')} disabled={busy}>Xuất bản</button>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
