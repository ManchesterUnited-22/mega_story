'use client'
import { useState } from 'react'

export default function ShareButtons({ title }: { title: string }) {
  const [copied, setCopied] = useState(false)
  const url = () => window.location.origin + window.location.pathname

  const open = (base: string) => window.open(base + encodeURIComponent(url()), '_blank', 'noopener,width=640,height=560')

  async function copy() {
    try {
      await navigator.clipboard.writeText(url())
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      window.prompt('Sao chép liên kết:', url())
    }
  }

  const cls = 'rounded-sm border border-white/40 px-4 py-2 text-sm font-medium text-white transition hover:bg-white hover:text-sea'
  return (
    <div className="flex flex-wrap gap-3" aria-label={`Chia sẻ: ${title}`}>
      <button className={cls} onClick={() => open('https://www.facebook.com/sharer/sharer.php?u=')}>
        Chia sẻ Facebook
      </button>
      <button className={cls} onClick={() => open('https://sp.zalo.me/plugins/share?url=')}>
        Chia sẻ Zalo
      </button>
      <button className={cls} onClick={copy}>
        {copied ? 'Đã sao chép' : 'Sao chép liên kết'}
      </button>
    </div>
  )
}
