"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import { Play, XIcon } from "lucide-react"
import {
  AnimatePresence,
  motion,
  useReducedMotion,
  type MotionStyle,
} from "motion/react"

import { cn } from "@/lib/utils"

type AnimationStyle =
  | "from-bottom"
  | "from-center"
  | "from-top"
  | "from-left"
  | "from-right"
  | "fade"
  | "top-in-bottom-out"
  | "left-in-right-out"

interface HeroVideoProps {
  animationStyle?: AnimationStyle
  videoSrc: string
  thumbnailSrc: string
  thumbnailAlt?: string
  className?: string
  triggerStyle?: MotionStyle
}

const animationVariants = {
  "from-bottom": {
    initial: { y: "100%", opacity: 0 },
    animate: { y: 0, opacity: 1 },
    exit: { y: "100%", opacity: 0 },
  },
  "from-center": {
    initial: { scale: 0.5, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    exit: { scale: 0.5, opacity: 0 },
  },
  "from-top": {
    initial: { y: "-100%", opacity: 0 },
    animate: { y: 0, opacity: 1 },
    exit: { y: "-100%", opacity: 0 },
  },
  "from-left": {
    initial: { x: "-100%", opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: "-100%", opacity: 0 },
  },
  "from-right": {
    initial: { x: "100%", opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: "100%", opacity: 0 },
  },
  fade: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  },
  "top-in-bottom-out": {
    initial: { y: "-100%", opacity: 0 },
    animate: { y: 0, opacity: 1 },
    exit: { y: "100%", opacity: 0 },
  },
  "left-in-right-out": {
    initial: { x: "-100%", opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: "100%", opacity: 0 },
  },
}

export function HeroVideoDialog({
  animationStyle = "from-center",
  videoSrc,
  thumbnailSrc,
  thumbnailAlt = "Video thumbnail",
  className,
  triggerStyle,
}: HeroVideoProps) {
  const [isVideoOpen, setIsVideoOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const dialogRef = useRef<HTMLDivElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const prefersReducedMotion = useReducedMotion()
  const selectedAnimation = prefersReducedMotion
    ? animationVariants.fade
    : animationVariants[animationStyle]
  const isNativeVideo = /\.(mp4|webm|ogg)(\?.*)?$/i.test(videoSrc)

  useEffect(() => {
    if (!isVideoOpen) return
    const previousOverflow = document.body.style.overflow
    const trigger = triggerRef.current

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsVideoOpen(false)
    }

    document.body.style.overflow = "hidden"
    window.addEventListener("keydown", closeOnEscape)
    closeButtonRef.current?.focus()

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener("keydown", closeOnEscape)
      trigger?.focus()
    }
  }, [isVideoOpen])

  const keepFocusInDialog = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "Tab") return

    const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
      'button, video, iframe, [href], [tabindex]:not([tabindex="-1"])',
    )
    if (!focusable?.length) return

    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()
      first.focus()
    }
  }

  return (
    <div className={cn("relative", className)}>
      <motion.button
        ref={triggerRef}
        type="button"
        aria-label="Lire la démonstration de Plia"
        className="group relative block size-full cursor-pointer border-0 bg-transparent p-0"
        style={triggerStyle}
        onClick={() => setIsVideoOpen(true)}
      >
        <Image
          src={thumbnailSrc}
          alt={thumbnailAlt}
          width={1920}
          height={1080}
          priority
          className="size-full rounded-md border object-cover object-left-top shadow-lg transition-all duration-200 ease-out group-hover:brightness-[0.8]"
        />
        <div className="absolute inset-0 flex scale-[0.9] items-center justify-center rounded-2xl transition-all duration-200 ease-out group-hover:scale-100">
          <div className="bg-primary/10 flex size-28 items-center justify-center rounded-full backdrop-blur-md">
            <div
              className={`from-primary/30 to-primary relative flex size-20 scale-100 items-center justify-center rounded-full bg-linear-to-b shadow-md transition-all duration-200 ease-out group-hover:scale-[1.2]`}
            >
              <Play
                className="size-8 scale-100 fill-white text-white transition-transform duration-200 ease-out group-hover:scale-105"
                style={{
                  filter:
                    "drop-shadow(0 4px 3px rgb(0 0 0 / 0.07)) drop-shadow(0 2px 2px rgb(0 0 0 / 0.06))",
                }}
              />
            </div>
          </div>
        </div>
      </motion.button>
      <AnimatePresence>
        {isVideoOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            role="dialog"
            ref={dialogRef}
            aria-modal="true"
            aria-label="Démonstration de Plia"
            onKeyDown={keepFocusInDialog}
            onClick={() => setIsVideoOpen(false)}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-md"
          >
            <motion.div
              {...selectedAnimation}
              transition={prefersReducedMotion ? { duration: 0 } : { type: "spring", damping: 30, stiffness: 300 }}
              className="relative mx-4 aspect-video w-full max-w-4xl md:mx-0"
              onClick={(event) => event.stopPropagation()}
            >
              <motion.button
                ref={closeButtonRef}
                type="button"
                aria-label="Fermer la démonstration"
                onClick={() => setIsVideoOpen(false)}
                className="absolute -top-14 right-0 rounded-full bg-foreground/80 p-2 text-xl text-background ring-1 ring-background/30 backdrop-blur-md"
              >
                <XIcon className="size-5" />
              </motion.button>
              <div className="relative isolate z-1 size-full overflow-hidden rounded-2xl border-2 border-white">
                {isNativeVideo ? (
                  <video
                    src={videoSrc}
                    poster={thumbnailSrc}
                    className="size-full rounded-2xl bg-black object-contain"
                    controls
                    autoPlay={!prefersReducedMotion}
                    playsInline
                    tabIndex={0}
                    aria-label="Aperçu animé de Plia"
                  />
                ) : (
                  <iframe
                    src={videoSrc}
                    title="Démonstration de Plia"
                    className="mt-0 size-full rounded-2xl"
                    allowFullScreen
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  />
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
