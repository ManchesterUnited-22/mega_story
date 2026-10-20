export default function Cover({ url, type }: { url: string | null; type: string | null }) {
  if (url && type === 'video')
    return <video className="h-full w-full object-cover" src={`${url}#t=0.5`} muted playsInline preload="metadata" />
  if (url) return <img className="h-full w-full object-cover" src={url} alt="" loading="lazy" />
  return <div className="h-full w-full bg-gradient-to-br from-sea to-tide" />
}
