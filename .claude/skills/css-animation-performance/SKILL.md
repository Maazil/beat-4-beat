---
name: css-animation-performance
description: Use this skill whenever writing, reviewing, or optimizing CSS animations, transitions, or hover/scroll/loading effects. Ensures animations use GPU-accelerated properties (transform, opacity) instead of layout- or paint-triggering properties (width, height, top, left, margin, box-shadow, etc.), which cause jank on low-end devices. Trigger this for any task involving @keyframes, transition, animation-*, will-change, hover effects, page transitions, loading spinners, or any mention of "smooth animation," "performance," "jank," "60fps," or "GPU acceleration."
---

# CSS Animation Performance

## Core rule

The browser rendering pipeline has three stages: **Layout → Paint → Composite**.
Only two CSS properties can be animated by skipping straight to the Composite
stage (handled by the compositor thread / GPU, off the main thread):

- `transform` (translate, scale, rotate, and their 3D equivalents)
- `opacity`

Everything else forces a Layout recalculation and/or a repaint, which runs on
the main thread and is the primary cause of animation jank — especially on
mobile and low-end devices.

## Do this

```css
/* Move, scale, rotate: use transform, not top/left/width/height */
.card {
  transition:
    transform 0.3s ease-out,
    opacity 0.3s ease-in;
}
.card:hover {
  transform: translateY(-4px) scale(1.02);
  opacity: 0.9;
}

@keyframes slideIn {
  from {
    transform: translateX(-100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}
```

## Avoid this

Never animate or transition these — they trigger layout (reflow) and/or paint:

- `width`, `height`
- `top`, `left`, `right`, `bottom`
- `margin`, `padding`
- `border-width`
- `box-shadow` (animate sparingly if at all — it's paint-only but still costly)
- toggling `display` (use `opacity` + `visibility`, or `transform: scale(0)`, instead)

## Translation cheat sheet

| Instead of animating... | Use...                                              |
| ----------------------- | --------------------------------------------------- |
| `top` / `left`          | `transform: translate(x, y)`                        |
| `width` / `height`      | `transform: scale(x, y)`                            |
| `display: none/block`   | `opacity` + `visibility` (or `transform: scale(0)`) |
| showing/hiding          | `opacity: 0` → `opacity: 1`                         |

## `will-change`

`will-change: transform, opacity;` can hint the browser to promote an element
to its own compositor layer ahead of time. Use it sparingly and only on
elements that are about to animate — it consumes memory, and applying it
broadly or permanently can _hurt_ performance. Remove it (or apply/remove
dynamically) once the animation is done if the element won't animate again
soon.

## Quick checklist when reviewing/writing animation code

1. Does every `transition`/`animation` only touch `transform` and/or `opacity`?
2. If not, can the effect be re-expressed with `transform`/`opacity` (see
   cheat sheet above)?
3. Is `will-change` applied narrowly (not on every element, not left on
   permanently)?
4. Is `transition: all` avoided? (It's imprecise and can accidentally
   transition expensive properties.) Name the specific properties instead.

## Reference

Erin/Viget: "Animation Performance 101: Browser Under the Hood" —
https://www.viget.com/articles/animation-performance-101-browser-under-the-hood
