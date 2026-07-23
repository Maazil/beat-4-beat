/**
 * Element-ref FLIP + pop animations for the scoreboard rows. Rows register
 * their DOM node by team name; `withFlip` snapshots row positions, runs a
 * state mutation, then animates any row that moved. `popChip` bumps a team's
 * round-points chip when an award lands. Kept outside the component so the
 * animation bookkeeping doesn't clutter the render logic.
 */
export function createScoreboardFlip() {
  const rowEls = new Map<string, HTMLElement>();
  const chipEls = new Map<string, HTMLElement>();

  const registerRow = (name: string, el: HTMLElement) => rowEls.set(name, el);
  const registerChip = (name: string, el: HTMLElement) => chipEls.set(name, el);

  // Run a state change and FLIP-animate any rows that move
  const withFlip = (mutate: () => void) => {
    const prevTops = new Map<string, number>();
    rowEls.forEach((el, name) => {
      if (el.isConnected) prevTops.set(name, el.getBoundingClientRect().top);
      else rowEls.delete(name);
    });
    mutate();
    rowEls.forEach((el, name) => {
      const prevTop = prevTops.get(name);
      if (prevTop == null || !el.isConnected) return;
      const delta = prevTop - el.getBoundingClientRect().top;
      if (Math.abs(delta) < 2) return;
      el.animate([{ transform: `translateY(${delta}px)` }, { transform: "translateY(0)" }], {
        duration: 420,
        easing: "cubic-bezier(0.22, 1, 0.36, 1)",
      });
    });
  };

  const popChip = (name: string) => {
    chipEls
      .get(name)
      ?.animate(
        [
          { transform: "scale(1)" },
          { transform: "scale(1.35)", offset: 0.4 },
          { transform: "scale(1)" },
        ],
        { duration: 380, easing: "cubic-bezier(0.34, 1.56, 0.64, 1)" },
      );
  };

  return { registerRow, registerChip, withFlip, popChip };
}
