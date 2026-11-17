import { Pause, Play } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * One clip at a time, with a poster and a manual play control. It autoplays
 * only when the preference is on and reduced motion is off, always muted, and
 * it pauses as soon as it leaves the screen.
 */
export default function CookingClip({ clip, autoplay = false, className }) {
  const videoRef = useRef(null);
  const boxRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(media.matches);
    const onChange = (event) => setReduced(event.matches);
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    const box = boxRef.current;
    if (!video || !box) return undefined;
    if (!autoplay || reduced) {
      video.pause();
      return undefined;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) video.play().catch(() => {});
        else video.pause();
      },
      { threshold: 0.4 },
    );
    observer.observe(box);
    return () => observer.disconnect();
  }, [autoplay, reduced]);

  const toggle = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) video.play().catch(() => {});
    else video.pause();
  };

  return (
    <section className={cn("mt-9", className)}>
      <div ref={boxRef} className="relative overflow-hidden rounded-[8px] bg-secondary">
        <video
          ref={videoRef}
          src={clip.videoUrl}
          poster={clip.posterUrl}
          muted
          playsInline
          loop
          preload="none"
          aria-label={clip.title}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          className="aspect-[16/9] w-full object-cover"
        />
        <button
          type="button"
          onClick={toggle}
          aria-label={playing ? `Pause ${clip.title}` : `Play ${clip.title}`}
          className="absolute bottom-3 right-3 flex h-10 w-10 items-center justify-center rounded-full bg-background/90 text-ink shadow-sm backdrop-blur"
        >
          {playing ? <Pause className="h-4 w-4" strokeWidth={2.4} /> : <Play className="ml-0.5 h-4 w-4" strokeWidth={2.4} />}
        </button>
      </div>
      <p className="mt-2 text-[13px] font-medium leading-snug">{clip.title}</p>
      <p className="mt-0.5 text-[13px] leading-relaxed text-ink-mid">{clip.job}</p>
    </section>
  );
}