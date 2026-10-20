'use client'
import { useState } from 'react'
import { uploadMedia } from '@/lib/upload'
import { isVideoUrl } from '@/lib/utils'

export default function MediaField({
  label,
  value,
  onChange,
  accept,
  placeholder,
  hint,
  emptyText,
}: {
  label: string
  value: string
  onChange: (url: string, mime?: string) => void
  accept: string
  placeholder?: string
  hint?: string
  emptyText?: string
}) {
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  async function pick(file?: File) {
    if (!file) return
    setBusy(true)
    setErr('')
    const r = await uploadMedia(file)
    setBusy(false)
    if (r.error) setErr(r.error)
    else if (r.url) onChange(r.url, file.type)
  }

  return (
    <div>
      <span className="label">{label}</span>
      <div className="mb-2 flex aspect-video max-h-48 items-center justify-center overflow-hidden rounded-sm border border-dashed border-ink/30 bg-white text-sm text-ink/50">
        {value ? (
          isVideoUrl(value) && !/youtube|youtu\.be|vimeo/i.test(value) ? (
            <video src={value} className="h-full w-full object-cover" muted />
          ) : /youtube|youtu\.be|vimeo/i.test(value) ? (
            <span>Video liên kết ngoài</span>
          ) : (
            <img src={value} alt="" className="h-full w-full object-cover" />
          )
        ) : (
          <span>{emptyText ?? 'Chưa có tệp'}</span>
        )}
      </div>
      <div className="flex gap-2">
        <input
          className="input"
          value={value}
          placeholder={placeholder ?? 'Dán đường dẫn, hoặc tải tệp lên'}
          onChange={(e) => onChange(e.target.value)}
        />
        <label className="btn-ghost cursor-pointer whitespace-nowrap">
          {busy ? 'Đang tải…' : 'Tải lên'}
          <input type="file" accept={accept} className="sr-only" disabled={busy} onChange={(e) => pick(e.target.files?.[0])} />
        </label>
        {value && (
          <button type="button" className="btn-ghost" onClick={() => onChange('')}>
            Xóa
          </button>
        )}
      </div>
      {hint && <p className="mt-1 text-xs text-ink/60">{hint}</p>}
      {err && <p className="mt-1 text-xs text-red-700">{err}</p>}
    </div>
  )
}
