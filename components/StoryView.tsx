'use client'
import { useRef } from 'react'
import Link from 'next/link'
import { motion, useReducedMotion, useScroll, useSpring, useTransform } from 'framer-motion'
import type { Block, Story } from '@/lib/types'
import { paragraphs, parseVideo } from '@/lib/utils'
import ShareButtons from './ShareButtons'

function Reveal({ children, className }: { children: React.ReactNode; className?: string }) {
  const reduce = useReducedMotion()
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, margin: '-10% 0px' }}
      transition={{ duration: 0.9, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  )
}

function ParallaxImage({ src, alt }: { src: string; alt: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const reduce = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const y = useTransform(scrollYProgress, [0, 1], ['-8%', '8%'])
  return (
    <div ref={ref} className="relative h-[60vh] w-full overflow-hidden bg-ink/10 md:h-[80vh]">
      <motion.img
        src={src}
        alt={alt}
        loading="lazy"
        className="absolute inset-0 h-full w-full object-cover"
        style={reduce ? undefined : { y, scale: 1.18 }}
      />
    </div>
  )
}

function Caption({ text }: { text?: string }) {
  if (!text) return null
  return <figcaption className="mx-auto mt-3 max-w-6xl px-5 text-sm italic text-ink/60">{text}</figcaption>
}

function BlockView({ block }: { block: Block }) {
  const c = block.content
  switch (block.type) {
    case 'paragraph':
      return (
        <Reveal className="mx-auto grid max-w-6xl gap-6 px-5 py-16 md:py-24 lg:grid-cols-[1fr_1.6fr] lg:gap-16">
          <div>
            {c.title && (
              <h2 className="font-serif text-3xl font-semibold leading-tight text-sea md:text-5xl lg:sticky lg:top-10">
                {c.title}
              </h2>
            )}
          </div>
          <div className="space-y-5 font-serif text-lg leading-[1.85] md:text-xl">
            {paragraphs(c.body ?? '').map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        </Reveal>
      )
    case 'image':
      if (!c.url) return null
      return (
        <figure className="py-4">
          <Reveal>
            <ParallaxImage src={c.url} alt={c.caption ?? ''} />
          </Reveal>
          <Caption text={c.caption} />
        </figure>
      )
    case 'gallery': {
      const images: { url: string; caption?: string }[] = c.images ?? []
      if (!images.length) return null
      return (
        <Reveal className="mx-auto max-w-6xl px-5 py-12">
          <div className="grid grid-cols-2 gap-2 md:grid-cols-3 md:gap-3">
            {images.map((im, i) => (
              <figure key={i} className={i % 5 === 0 ? 'col-span-2' : ''}>
                <img
                  src={im.url}
                  alt={im.caption ?? ''}
                  loading="lazy"
                  className="aspect-[4/3] h-full w-full object-cover"
                />
                {im.caption && <figcaption className="mt-1 text-xs italic text-ink/60">{im.caption}</figcaption>}
              </figure>
            ))}
          </div>
        </Reveal>
      )
    }
    case 'quote':
      if (!c.text) return null
      return (
        <Reveal className="mx-auto max-w-4xl px-5 py-20 md:py-32">
          <blockquote className="border-l-4 border-sun pl-6 md:pl-10">
            <p className="font-serif text-3xl font-medium leading-snug text-sea md:text-5xl">{c.text}</p>
            {c.author && <footer className="mt-5 text-sm text-ink/60">{c.author}</footer>}
          </blockquote>
        </Reveal>
      )
    case 'video': {
      if (!c.url) return null
      const v = parseVideo(c.url)
      return (
        <figure className="mx-auto max-w-5xl px-5 py-12">
          <Reveal>
            <div className="aspect-video w-full bg-ink">
              {v.kind === 'iframe' ? (
                <iframe src={v.src} className="h-full w-full" allow="fullscreen; picture-in-picture" loading="lazy" title={c.caption || 'Video'} />
              ) : (
                <video src={v.src} controls playsInline preload="metadata" className="h-full w-full" />
              )}
            </div>
          </Reveal>
          {c.caption && <figcaption className="mt-3 text-sm italic text-ink/60">{c.caption}</figcaption>}
        </figure>
      )
    }
  }
}

export default function StoryView({ story, blocks, isDraft }: { story: Story; blocks: Block[]; isDraft: boolean }) {
  const reduce = useReducedMotion()
  const { scrollYProgress } = useScroll()
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 30, mass: 0.3 })

  const heroRef = useRef<HTMLElement>(null)
  const { scrollYProgress: heroP } = useScroll({ target: heroRef, offset: ['start start', 'end start'] })
  const mediaY = useTransform(heroP, [0, 1], ['0%', '25%'])
  const textY = useTransform(heroP, [0, 1], ['0%', '-30%'])
  const textOpacity = useTransform(heroP, [0, 0.8], [1, 0])

  return (
    <article>
      <motion.div className="fixed inset-x-0 top-0 z-50 h-1 origin-left bg-sun" style={{ scaleX: progress }} />

      <section ref={heroRef} className="relative min-h-[88svh] overflow-hidden bg-ink">
        <motion.div className="absolute inset-0" style={reduce ? undefined : { y: mediaY, scale: 1.15 }}>
          {story.intro_media_url && story.intro_media_type === 'video' ? (
            <video src={story.intro_media_url} autoPlay muted loop playsInline className="h-full w-full object-cover" />
          ) : story.intro_media_url ? (
            <img src={story.intro_media_url} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-sea to-ink" />
          )}
        </motion.div>
        <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/20 to-ink/30" />
        <motion.div
          className="relative flex min-h-[88svh] flex-col justify-end px-5 pb-14 md:pb-24"
          style={reduce ? undefined : { y: textY, opacity: textOpacity }}
        >
          <div className="mx-auto w-full max-w-6xl">
            <h1 className="max-w-5xl font-serif text-5xl font-semibold leading-[1.02] tracking-tight text-white md:text-8xl">
              {story.title}
            </h1>
            {story.subtitle && <p className="mt-6 max-w-2xl text-lg text-white/85 md:text-xl">{story.subtitle}</p>}
          </div>
        </motion.div>
      </section>

      <div className="bg-mist">
        {blocks.map((b) => (
          <BlockView key={b.id} block={b} />
        ))}
      </div>

      <section className="bg-sea px-5 py-20 text-white md:py-32">
        <Reveal className="mx-auto max-w-3xl">
          {story.outro_text && (
            <div className="space-y-5 font-serif text-xl leading-[1.8] md:text-2xl">
              {paragraphs(story.outro_text).map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          )}
          {story.outro_thanks && <p className="mt-10 font-serif text-3xl font-semibold text-sun">{story.outro_thanks}</p>}
          <div className="mt-10">
            <ShareButtons title={story.title} />
          </div>
          <Link href="/" className="mt-10 inline-block text-sm text-white/70 underline hover:text-white">
            Xem các câu chuyện khác
          </Link>
        </Reveal>
      </section>

      {isDraft && (
        <div className="fixed inset-x-0 bottom-0 z-50 flex items-center justify-center gap-4 bg-sun px-4 py-3 text-sm font-medium text-ink">
          <span>Đang xem bản nháp. Chỉ bạn nhìn thấy trang này.</span>
          <Link href={`/quan-ly/${story.id}`} className="underline">
            Quay lại chỉnh sửa
          </Link>
        </div>
      )}
    </article>
  )
}
