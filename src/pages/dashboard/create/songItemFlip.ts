/**
 * FLIP transitions for the song-item edit modal. The modal is Portal-rendered,
 * so it opens by animating out of the small board tile it was launched from and
 * closes by collapsing back into it. Both directions measure the delta between
 * the tile rect and the modal card's resting rect, then run the transform. When
 * no rect is available (tile scrolled off, card not mounted) they fall back to a
 * plain fade. Kept beside SongItemCard so the geometry math stays out of the
 * render logic — mirrors scoreboardFlip.ts.
 */

// The modal card carries this attribute so we can find it inside the Portal root.
const MODAL_CARD_SELECTOR = "[data-modal-card]";

type TransformKeyframe = {
  transform: string;
  opacity: number;
  borderRadius: string;
};

const RESTING_FRAME: TransformKeyframe = {
  transform: "translate(0, 0) scale(1)",
  opacity: 1,
  borderRadius: "0.75rem",
};

// The keyframe that overlaps the modal card onto the originating tile.
// Exported for unit testing of the geometry; not used outside this module.
export const tileFrame = (rect: DOMRect, modalRect: DOMRect): TransformKeyframe => {
  const dx = rect.left + rect.width / 2 - (modalRect.left + modalRect.width / 2);
  const dy = rect.top + rect.height / 2 - (modalRect.top + modalRect.height / 2);
  const scaleX = rect.width / modalRect.width;
  const scaleY = rect.height / modalRect.height;
  return {
    transform: `translate(${dx}px, ${dy}px) scale(${scaleX}, ${scaleY})`,
    opacity: 0,
    borderRadius: "0.5rem",
  };
};

export function animateModalEnter(el: Element, rect: DOMRect | null, done: () => void) {
  const modalCard = el.querySelector(MODAL_CARD_SELECTOR) as HTMLElement | null;
  if (!rect || !modalCard) {
    el.animate([{ opacity: 0 }, { opacity: 1 }], {
      duration: 200,
      easing: "ease-out",
    }).finished.then(done);
    return;
  }
  // Force layout so we can measure the modal's resting position
  const modalRect = modalCard.getBoundingClientRect();
  modalCard
    .animate([tileFrame(rect, modalRect), RESTING_FRAME], {
      duration: 280,
      easing: "cubic-bezier(0.32, 0.72, 0, 1)",
    })
    .finished.then(done);
}

export function animateModalExit(el: Element, rect: DOMRect | null, done: () => void) {
  const modalCard = el.querySelector(MODAL_CARD_SELECTOR) as HTMLElement | null;
  if (!rect || !modalCard) {
    el.animate([{ opacity: 1 }, { opacity: 0 }], {
      duration: 150,
      easing: "ease-in",
    }).finished.then(done);
    return;
  }
  const modalRect = modalCard.getBoundingClientRect();
  modalCard
    .animate([RESTING_FRAME, tileFrame(rect, modalRect)], {
      duration: 220,
      easing: "cubic-bezier(0.32, 0, 0.67, 0)",
    })
    .finished.then(done);
}
