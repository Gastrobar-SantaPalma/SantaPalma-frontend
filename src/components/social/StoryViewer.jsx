import { useEffect, useMemo, useState } from "react";

const STORY_DURATION_MS = 5000;

function getStoryImage(story) {
  return story?.image_url || story?.imageUrl || story?.media_url || story?.url || story?.foto || "";
}

export default function StoryViewer({ isOpen, user, stories = [], onClose }) {
  const [index, setIndex] = useState(0);
  const [touchStartX, setTouchStartX] = useState(null);

  const safeStories = useMemo(() => (Array.isArray(stories) ? stories : []), [stories]);

  useEffect(() => {
    if (!isOpen) return;
    setIndex(0);
  }, [isOpen, user?.user_id]);

  useEffect(() => {
    if (!isOpen || !safeStories.length) return;

    const timeoutId = setTimeout(() => {
      setIndex((prev) => {
        if (prev >= safeStories.length - 1) {
          onClose?.();
          return prev;
        }
        return prev + 1;
      });
    }, STORY_DURATION_MS);

    return () => clearTimeout(timeoutId);
  }, [index, isOpen, onClose, safeStories.length]);

  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (event) => {
      if (event.key === "Escape") onClose?.();
      if (event.key === "ArrowRight") {
        setIndex((prev) => Math.min(prev + 1, safeStories.length - 1));
      }
      if (event.key === "ArrowLeft") {
        setIndex((prev) => Math.max(prev - 1, 0));
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose, safeStories.length]);

  if (!isOpen || !user) return null;

  const currentStory = safeStories[index];

  const goNext = () => {
    if (index >= safeStories.length - 1) {
      onClose?.();
      return;
    }
    setIndex((prev) => prev + 1);
  };

  const goPrev = () => setIndex((prev) => Math.max(prev - 1, 0));

  const onTouchStart = (event) => setTouchStartX(event.changedTouches[0]?.clientX ?? null);

  const onTouchEnd = (event) => {
    const touchEndX = event.changedTouches[0]?.clientX ?? null;
    if (touchStartX == null || touchEndX == null) return;

    const delta = touchEndX - touchStartX;
    if (delta > 40) goPrev();
    if (delta < -40) goNext();
    setTouchStartX(null);
  };

  return (
    <div
      className="fixed inset-0 z-[90] bg-black text-white"
      role="dialog"
      aria-modal="true"
      aria-label={`Historias de ${user.nombre}`}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <div className="mx-auto flex h-full w-full max-w-md flex-col">
        <div className="flex gap-1 px-3 pt-3">
          {safeStories.map((story, storyIndex) => (
            <div key={story.story_id || story.id || storyIndex} className="h-1 flex-1 overflow-hidden rounded bg-white/25">
              <div
                className={`h-full bg-white transition-all ${
                  storyIndex < index ? "w-full" : storyIndex === index ? "w-1/2" : "w-0"
                }`}
              />
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between px-4 pb-2 pt-3">
          <p className="text-sm font-semibold">{user.nombre}</p>
          <button type="button" onClick={onClose} className="rounded-full bg-white/20 px-3 py-1 text-xs font-medium">
            Cerrar
          </button>
        </div>

        <div className="relative flex-1">
          {currentStory ? (
            <img
              src={getStoryImage(currentStory)}
              alt={currentStory.caption || `Historia de ${user.nombre}`}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center px-6 text-center text-sm text-white/80">
              Este usuario no tiene historias disponibles.
            </div>
          )}

          <button type="button" onClick={goPrev} className="absolute inset-y-0 left-0 w-1/2" aria-label="Historia anterior" />
          <button type="button" onClick={goNext} className="absolute inset-y-0 right-0 w-1/2" aria-label="Siguiente historia" />
        </div>
      </div>
    </div>
  );
}