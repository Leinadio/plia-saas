"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { RotateCcw } from "lucide-react";
import styles from "./landing-demo.module.css";
import { videoFocus } from "./landing-video-focus";

const dimensions = {
  budgets: [1280, 720],
  transactions: [1280, 720],
  previsions: [1280, 720],
  depassements: [1280, 720],
  automatisation: [1280, 720],
} as const;

export function JourneyVideo({
  scene,
  description,
  active,
  seen,
}: {
  scene:
    | "budgets"
    | "transactions"
    | "previsions"
    | "depassements"
    | "automatisation";
  description: string;
  active: boolean;
  seen: boolean;
}) {
  const [width, height] = dimensions[scene];
  const ref = useRef<HTMLVideoElement>(null);
  const [failed, setFailed] = useState(false);
  const asset = `/videos/fonctionnalites/${scene}`;

  useEffect(() => {
    const video = ref.current;
    if (!video || failed) return;
    let frame: number | undefined;
    let lastPosition = "";
    const update = () => {
      const position = videoFocus(scene, video.currentTime);
      if (lastPosition !== position) {
        video.style.objectPosition = position;
        lastPosition = position;
      }
    };
    const nextFrame = () => {
      update();
      if (active && video.requestVideoFrameCallback)
        frame = video.requestVideoFrameCallback(nextFrame);
    };
    update();
    if (active && video.requestVideoFrameCallback)
      frame = video.requestVideoFrameCallback(nextFrame);
    video.addEventListener("timeupdate", update);
    video.addEventListener("seeked", update);
    return () => {
      if (frame !== undefined) video.cancelVideoFrameCallback(frame);
      video.removeEventListener("timeupdate", update);
      video.removeEventListener("seeked", update);
    };
  }, [scene, active, seen, failed]);

  useEffect(() => {
    const video = ref.current;
    if (!video || failed) return;
    let cancelled = false;
    if (active) {
      video.play().catch((error: unknown) => {
        if (
          !cancelled &&
          !(error instanceof DOMException && error.name === "AbortError")
        ) {
          setFailed(true);
        }
      });
    }
    return () => {
      cancelled = true;
      // Pause on removal as well as when visibility or the global control changes.
      if (active) video.pause();
    };
  }, [active, seen, failed]);

  return (
    <>
      {failed ? (
        <Image
          src={`${asset}.png`}
          alt={description}
          width={width}
          height={height}
          unoptimized
          className={styles.preview}
          style={{ objectPosition: videoFocus(scene, 0) }}
        />
      ) : (
        <video
          ref={ref}
          width={width}
          height={height}
          src={seen ? `${asset}.mp4` : undefined}
          poster={`${asset}.png`}
          className={styles.preview}
          style={{ objectPosition: videoFocus(scene, 0) }}
          aria-label={description}
          muted
          loop
          playsInline
          preload="none"
          onError={() => setFailed(true)}
        />
      )}
      {failed && (
        <button
          type="button"
          className={styles.retry}
          onClick={() => setFailed(false)}
        >
          <RotateCcw aria-hidden />
          Réessayer l’aperçu
        </button>
      )}
    </>
  );
}
