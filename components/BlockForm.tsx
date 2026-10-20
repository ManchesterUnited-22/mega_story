'use client'
import { useState } from 'react'
import type { Block } from '@/lib/types'
import { uploadMedia } from '@/lib/upload'
import MediaField from './MediaField'

type Gi = { url: string; caption?: string }

export default function BlockForm({ block, onChange }: { block: Block; onChange: (patch: Record<string, any>) => void }) {
  const c = block.content
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  async function addImages(files: FileList | null) {
    if (!files?.length) return
    setBusy(true)
    setErr('')
    const added: Gi[] = []
    for (const f of Array.from(files)) {
      const r = await uploadMedia(f)
      if (r.url) added.push({ url: r.url, caption: '' })
      else setErr(r.error ?? 'Lỗi tải lên')
    }
    onChange({ images: [...(c.images ?? []), ...added] })
    setBusy(false)
  }

  switch (block.type) {
    case 'paragraph':
      return (
        <div className="space-y-3">
          <div>
            <label className="label">Tiêu đề</label>
            <input className="input" value={c.title ?? ''} onChange={(e) => onChange({ title: e.target.value })} />
          </div>
          <div>
            <label className="label">Nội dung</label>
            <textarea className="input" rows={7} value={c.body ?? ''} onChange={(e) => onChange({ body: e.target.value })} />
            <p className="mt-1 text-xs text-ink/60">Xuống dòng để tách đoạn.</p>
          </div>
        </div>
      )
    case 'image':
      return (
        <div className="space-y-3">
          <MediaField label="Ảnh" accept="image/*" value={c.url ?? ''} onChange={(url) => onChange({ url })} />
          <div>
            <label className="label">Chú thích</label>
            <input className="input" value={c.caption ?? ''} onChange={(e) => onChange({ caption: e.target.value })} />
          </div>
        </div>
      )
    case 'gallery': {
      const images: Gi[] = c.images ?? []
      const set = (i: number, patch: Partial<Gi>) => onChange({ images: images.map((im, k) => (k === i ? { ...im, ...patch } : im)) })
      return (
        <div className="space-y-3">
          {images.map((im, i) => (
            <div key={i} className="flex items-center gap-3">
              <img src={im.url} alt="" className="h-16 w-20 shrink-0 object-cover" />
              <input className="input" placeholder="Chú thích (không bắt buộc)" value={im.caption ?? ''} onChange={(e) => set(i, { caption: e.target.value })} />
              <button type="button" className="btn-ghost" onClick={() => onChange({ images: images.filter((_, k) => k !== i) })}>
                Bỏ
              </button>
            </div>
          ))}
          <label className="btn-ghost cursor-pointer">
            {busy ? 'Đang tải…' : '+ Thêm ảnh (chọn nhiều ảnh được)'}
            <input type="file" accept="image/*" multiple className="sr-only" disabled={busy} onChange={(e) => addImages(e.target.files)} />
          </label>
          {err && <p className="text-xs text-red-700">{err}</p>}
        </div>
      )
    }
    case 'quote':
      return (
        <div className="space-y-3">
          <div>
            <label className="label">Câu trích</label>
            <textarea className="input" rows={3} value={c.text ?? ''} onChange={(e) => onChange({ text: e.target.value })} />
          </div>
          <div>
            <label className="label">Nguồn / người nói</label>
            <input className="input" value={c.author ?? ''} onChange={(e) => onChange({ author: e.target.value })} />
          </div>
        </div>
      )
    case 'video':
      return (
        <div className="space-y-3">
          <MediaField
            label="Video"
            accept="video/*"
            value={c.url ?? ''}
            onChange={(url) => onChange({ url })}
            placeholder="Dán link YouTube / Vimeo / .mp4, hoặc tải tệp lên"
            hint="Tệp tải lên tối đa 50MB. Video dài nên dùng link YouTube hoặc Vimeo."
          />
          <div>
            <label className="label">Chú thích</label>
            <input className="input" value={c.caption ?? ''} onChange={(e) => onChange({ caption: e.target.value })} />
          </div>
        </div>
      )
  }
}
