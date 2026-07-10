import { createSignal, onCleanup, onMount, type Component } from "solid-js";

/**
 * Interactive game-board sim for the landing hero ("Stage Night" redesign).
 * Demos the real game loop: pick a tile → snippet plays → title/artist points
 * (with steals) fly to a team → standings stay masked until the final reveal.
 *
 * The sim is self-contained imperative canvas code, deliberately kept outside
 * Solid's reactivity — no signals inside the rAF loop. Reference:
 * docs/landing-redesign/demo-a-stage-night.html
 */

const GOLD = "#EAC435";
const PERI = "#C6D8FF";
const MAG = "#C2158F";
const TEXT = "#FEF9FF";
const NAVY = "#02182B";

const CATS = ["ONE-HIT WONDERS", "MOVIE THEMES", "2000s POP", "SLOW JAMS", "COVER SONGS"];
const LEVELS = [100, 200, 300, 400];
const TEAM_DEFS = [
  { name: "VINYL VILLAINS", c: GOLD },
  { name: "KEY SMASHERS", c: PERI },
  { name: "BASS INVADERS", c: MAG },
];

const SPOT_MS = 850;
const PLAY_MS = 2500;
const AWARD_MS = 1050;
const REVEAL_MS = 5200;
const IDLE_MS = 4200;

type Phase = "idle" | "spot" | "play" | "award" | "reveal";

interface Tile {
  c: number;
  l: number;
  rev: boolean;
}

interface Team {
  name: string;
  c: string;
  score: number;
  disp: number;
  pulse: number;
  pulseT: number;
  cx: number;
  cy: number;
}

interface Flight {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  t0: number;
  dur: number;
  label: string;
  color: string;
}

interface ConfettiPiece {
  x: number;
  y: number;
  vx: number;
  vy: number;
  s: number;
  c: string;
  rot: number;
  vr: number;
}

interface Grid {
  pad: number;
  chipH: number;
  headerH: number;
  catH: number;
  gx: number;
  gy: number;
  gw: number;
  gh: number;
  cw: number;
  rh: number;
}

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

const SimBoard: Component = () => {
  const [hint, setHintText] = createSignal("your pick — click any tile");
  let cvs!: HTMLCanvasElement;

  onMount(() => {
    const ctx = cvs.getContext("2d");
    if (!ctx) return;

    const REDUCED = matchMedia("(prefers-reduced-motion: reduce)").matches;

    let W = 0;
    let H = 0;
    let raf: number | null = null;
    let visible = true;

    let tiles: Tile[] = [];
    let teams: Team[] = [];
    let flights: Flight[] = [];
    let confetti: ConfettiPiece[] = [];
    let phase: Phase = "idle";
    let phaseStart = 0;
    let cur: Tile | null = null;
    let revealStart = 0;
    let lastAction = 0;
    let userTouched = false;
    let mx = -1;
    let my = -1;

    const setHint = (s: string) => setHintText(s);

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const r = cvs.getBoundingClientRect();
      if (!r.width) return;
      W = r.width;
      H = r.height;
      cvs.width = Math.round(W * dpr);
      cvs.height = Math.round(H * dpr);
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (REDUCED && tiles.length) renderOnce(performance.now());
    }

    function reset(now: number) {
      tiles = [];
      for (let c = 0; c < CATS.length; c++)
        for (let l = 0; l < LEVELS.length; l++) tiles.push({ c, l, rev: false });
      teams = TEAM_DEFS.map((t) => ({
        name: t.name,
        c: t.c,
        score: 0,
        disp: 0,
        pulse: 0,
        pulseT: 0,
        cx: 0,
        cy: 0,
      }));
      flights = [];
      confetti = [];
      cur = null;
      phase = "idle";
      phaseStart = now;
      lastAction = now;
      setHint(userTouched ? "fresh board — your pick" : "your pick — click any tile");
    }

    // ── Layout helpers ─────────────────────────────────────────

    function grid(): Grid {
      const pad = Math.max(14, W * 0.02);
      const chipH = Math.max(30, H * 0.085);
      const headerH = chipH + pad * 1.5;
      const catH = Math.max(15, H * 0.052);
      const gx = pad;
      const gy = headerH + catH;
      const gw = W - pad * 2;
      const gh = H - gy - pad;
      const cw = gw / CATS.length;
      const rh = gh / LEVELS.length;
      return { pad, chipH, headerH, catH, gx, gy, gw, gh, cw, rh };
    }

    function tileRect(g: Grid, t: Tile) {
      const gap = Math.max(5, W * 0.007);
      return {
        x: g.gx + t.c * g.cw + gap / 2,
        y: g.gy + t.l * g.rh + gap / 2,
        w: g.cw - gap,
        h: g.rh - gap,
      };
    }

    function rr(x: number, y: number, w: number, h: number, r: number) {
      ctx!.beginPath();
      ctx!.roundRect(x, y, w, h, r);
    }

    // ── Drawing ────────────────────────────────────────────────

    function drawChips(g: Grid, now: number, reveal: boolean) {
      const c = ctx!;
      const n = teams.length;
      const gap = 10;
      const cw = Math.min(230, (W - g.pad * 2 - gap * (n - 1)) / n);
      const total = cw * n + gap * (n - 1);
      let x = (W - total) / 2;
      const y = g.pad * 0.9;
      for (const t of teams) {
        c.save();
        if (t.pulse > 0 && now - t.pulseT < 600) {
          c.shadowColor = t.c;
          c.shadowBlur = 18 * (1 - clamp01((now - t.pulseT) / 600));
        }
        c.fillStyle = "rgba(6,39,65,.9)";
        rr(x, y, cw, g.chipH, g.chipH / 2);
        c.fill();
        c.strokeStyle = t.c;
        c.globalAlpha = 0.8;
        c.lineWidth = 1.4;
        rr(x, y, cw, g.chipH, g.chipH / 2);
        c.stroke();
        c.globalAlpha = 1;
        c.restore();
        c.fillStyle = t.c;
        c.beginPath();
        c.arc(x + g.chipH * 0.55, y + g.chipH / 2, 4, 0, Math.PI * 2);
        c.fill();
        c.font = `500 ${Math.max(9, Math.min(11.5, W * 0.012))}px "Spline Sans Mono",monospace`;
        c.textAlign = "left";
        c.textBaseline = "middle";
        c.fillStyle = TEXT;
        c.fillText(t.name, x + g.chipH * 0.55 + 11, y + g.chipH / 2);
        c.textAlign = "right";
        if (reveal) {
          t.disp += (t.score - t.disp) * 0.08;
          c.fillStyle = t.c;
          c.fillText(String(Math.round(t.disp)), x + cw - 16, y + g.chipH / 2);
        } else {
          c.fillStyle = "rgba(198,216,255,.55)";
          c.fillText("•••", x + cw - 16, y + g.chipH / 2);
        }
        t.cx = x + cw - 30;
        t.cy = y + g.chipH / 2;
        x += cw + gap;
      }
    }

    function drawBoard(g: Grid, now: number) {
      const c = ctx!;
      c.font = `500 ${Math.max(8, Math.min(11, W * 0.0115))}px "Spline Sans Mono",monospace`;
      c.textAlign = "center";
      c.textBaseline = "middle";
      c.fillStyle = "rgba(198,216,255,.6)";
      for (let i = 0; i < CATS.length; i++)
        c.fillText(CATS[i], g.gx + i * g.cw + g.cw / 2, g.headerH + g.catH / 2, g.cw - 8);

      for (const t of tiles) {
        const r = tileRect(g, t);
        const active = cur === t && (phase === "spot" || phase === "play");
        const hover =
          !t.rev &&
          !active &&
          (phase === "idle" || phase === "award") &&
          mx >= r.x &&
          mx <= r.x + r.w &&
          my >= r.y &&
          my <= r.y + r.h;
        let lift = hover ? 3 : 0;
        if (active) lift = 3 * clamp01((now - phaseStart) / 300);
        const x = r.x;
        const y = r.y - lift;
        if (t.rev && !active) {
          c.fillStyle = "rgba(2,24,43,.5)";
          rr(x, y, r.w, r.h, 8);
          c.fill();
          c.strokeStyle = "rgba(198,216,255,.07)";
          c.lineWidth = 1;
          rr(x, y, r.w, r.h, 8);
          c.stroke();
          c.fillStyle = "rgba(198,216,255,.18)";
          c.font = `500 ${Math.max(10, r.h * 0.3)}px "Spline Sans Mono",monospace`;
          c.fillText("♪", x + r.w / 2, y + r.h / 2);
          continue;
        }
        if (active) {
          c.save();
          c.shadowColor = GOLD;
          c.shadowBlur = 26;
        }
        c.fillStyle = active ? "rgba(234,196,53,.13)" : hover ? "#0E3A5D" : "#0A314F";
        rr(x, y, r.w, r.h, 8);
        c.fill();
        if (active) c.restore();
        c.strokeStyle = active ? GOLD : hover ? "rgba(234,196,53,.75)" : "rgba(198,216,255,.16)";
        c.lineWidth = active ? 1.6 : hover ? 1.4 : 1;
        rr(x, y, r.w, r.h, 8);
        c.stroke();

        if (active && phase === "play") {
          // equalizer inside the tile
          const bars = 7;
          const bw = r.w / (bars * 1.9);
          const t2 = (now - phaseStart) / 1000;
          for (let i = 0; i < bars; i++) {
            const a = Math.abs(
              Math.sin(t2 * 7 + i * 1.7) * 0.6 + Math.sin(t2 * 13 + i * 0.9) * 0.4,
            );
            const bh = r.h * 0.55 * (0.25 + 0.75 * a);
            c.fillStyle = i % 3 === 2 ? MAG : GOLD;
            const bx = x + r.w / 2 + (i - bars / 2) * bw * 1.7;
            rr(bx, y + r.h * 0.78 - bh, bw, bh, 2);
            c.fill();
          }
          const p = clamp01((now - phaseStart) / PLAY_MS);
          c.fillStyle = "rgba(198,216,255,.25)";
          c.fillRect(x + 6, y + r.h - 5, r.w - 12, 2);
          c.fillStyle = GOLD;
          c.fillRect(x + 6, y + r.h - 5, (r.w - 12) * p, 2);
        } else {
          c.fillStyle = GOLD;
          c.globalAlpha = active ? 1 : 0.92;
          c.font = `500 ${Math.max(12, r.h * 0.32)}px "Spline Sans Mono",monospace`;
          c.fillText(String(LEVELS[t.l]), x + r.w / 2, y + r.h / 2);
          c.globalAlpha = 1;
        }
      }
    }

    function drawFlights(now: number) {
      const c = ctx!;
      c.textAlign = "center";
      c.textBaseline = "middle";
      flights = flights.filter((f) => now - f.t0 < f.dur);
      for (const f of flights) {
        const p = clamp01((now - f.t0) / f.dur);
        const e = 1 - Math.pow(1 - p, 3);
        const midX = (f.x0 + f.x1) / 2;
        const midY = Math.min(f.y0, f.y1) - 40;
        const x = (1 - e) * (1 - e) * f.x0 + 2 * (1 - e) * e * midX + e * e * f.x1;
        const y = (1 - e) * (1 - e) * f.y0 + 2 * (1 - e) * e * midY + e * e * f.y1;
        c.globalAlpha = p > 0.85 ? (1 - p) / 0.15 : 1;
        c.font = `500 ${Math.max(11, W * 0.013)}px "Spline Sans Mono",monospace`;
        c.fillStyle = f.color;
        const w = c.measureText(f.label).width + 18;
        rr(x - w / 2, y - 12, w, 24, 12);
        c.save();
        c.globalAlpha *= 0.92;
        c.fillStyle = NAVY;
        c.fill();
        c.restore();
        c.strokeStyle = f.color;
        c.lineWidth = 1.2;
        rr(x - w / 2, y - 12, w, 24, 12);
        c.stroke();
        c.fillStyle = f.color;
        c.fillText(f.label, x, y + 1);
        c.globalAlpha = 1;
      }
    }

    function drawReveal(now: number) {
      const c = ctx!;
      const p = clamp01((now - revealStart) / 500);
      c.fillStyle = `rgba(2,24,43,${0.86 * p})`;
      c.fillRect(0, 0, W, H);
      if (p < 1) return;
      const sorted = teams.slice().sort((a, b) => b.score - a.score);
      const max = Math.max(...teams.map((t) => t.score), 1);
      const bw = Math.min(460, W * 0.6);
      const bx = (W - bw) / 2;
      let y = H * 0.3;
      c.textAlign = "center";
      c.fillStyle = GOLD;
      c.font = `500 ${Math.max(10, W * 0.012)}px "Spline Sans Mono",monospace`;
      c.fillText("F I N A L   S T A N D I N G S", W / 2, H * 0.18);
      sorted.forEach((t, i) => {
        t.disp += (t.score - t.disp) * 0.06;
        const frac = t.disp / max;
        c.textAlign = "left";
        c.font = `500 ${Math.max(10, W * 0.0125)}px "Spline Sans Mono",monospace`;
        c.fillStyle = i === 0 ? GOLD : "rgba(198,216,255,.8)";
        c.fillText(`${i + 1}. ${t.name}`, bx, y - 9);
        c.textAlign = "right";
        c.fillText(String(Math.round(t.disp)), bx + bw, y - 9);
        c.fillStyle = "rgba(198,216,255,.12)";
        rr(bx, y, bw, 9, 5);
        c.fill();
        c.fillStyle = t.c;
        rr(bx, y, Math.max(9, bw * frac), 9, 5);
        c.fill();
        y += H * 0.14;
      });
      // confetti
      if (confetti.length === 0) {
        for (let i = 0; i < 90; i++)
          confetti.push({
            x: Math.random() * W,
            y: -20 - Math.random() * H * 0.6,
            vy: 60 + Math.random() * 90,
            vx: (Math.random() - 0.5) * 40,
            s: 3 + Math.random() * 4,
            c: [GOLD, MAG, PERI][i % 3],
            rot: Math.random() * 6,
            vr: (Math.random() - 0.5) * 4,
          });
      }
      for (const f of confetti) {
        f.y += f.vy / 60;
        f.x += f.vx / 60;
        f.rot += f.vr / 60;
        if (f.y > H + 20) {
          f.y = -20;
          f.x = Math.random() * W;
        }
        c.save();
        c.translate(f.x, f.y);
        c.rotate(f.rot);
        c.fillStyle = f.c;
        c.globalAlpha = 0.85;
        c.fillRect(-f.s / 2, -f.s / 2, f.s, f.s * 1.6);
        c.restore();
        c.globalAlpha = 1;
      }
    }

    // ── Game loop ──────────────────────────────────────────────

    function remaining() {
      return tiles.filter((t) => !t.rev);
    }

    function pickTile(t: Tile, byUser: boolean, now: number) {
      cur = t;
      phase = "spot";
      phaseStart = now;
      lastAction = now;
      if (byUser) {
        userTouched = true;
        setHint("listening… title + artist on the line");
      } else {
        setHint(
          userTouched
            ? "auto-pick — click a tile to take the next one"
            : "round in progress — click a tile to take over",
        );
      }
    }

    function award(now: number, animate: boolean) {
      if (!cur) return;
      const g = grid();
      const r = tileRect(g, cur);
      const pts = LEVELS[cur.l];
      const wi = Math.floor(Math.random() * teams.length);
      const winner = teams[wi];
      winner.score += pts;
      winner.pulse = 1;
      winner.pulseT = now + 300;
      if (animate)
        flights.push({
          x0: r.x + r.w / 2,
          y0: r.y + r.h / 2,
          x1: winner.cx,
          y1: winner.cy,
          t0: now,
          dur: 900,
          label: `+${pts} TITLE`,
          color: winner.c,
        });
      if (Math.random() < 0.35) {
        // artist point stolen by another team
        const si = (wi + 1 + Math.floor(Math.random() * (teams.length - 1))) % teams.length;
        const thief = teams[si];
        thief.score += pts;
        thief.pulse = 1;
        thief.pulseT = now + 520;
        if (animate)
          flights.push({
            x0: r.x + r.w / 2,
            y0: r.y + r.h / 2,
            x1: thief.cx,
            y1: thief.cy,
            t0: now + 240,
            dur: 950,
            label: `STEAL +${pts} ARTIST`,
            color: thief.c,
          });
      }
      cur.rev = true;
    }

    function step(now: number) {
      if (phase === "idle") {
        const left = remaining();
        if (!left.length) {
          phase = "reveal";
          revealStart = now;
          for (const t of teams) t.disp = 0;
          setHint("board cleared — the reveal");
          return;
        }
        if (now - lastAction > IDLE_MS)
          pickTile(left[Math.floor(Math.random() * left.length)], false, now);
      } else if (phase === "spot" && now - phaseStart > SPOT_MS) {
        phase = "play";
        phaseStart = now;
      } else if (phase === "play" && now - phaseStart > PLAY_MS) {
        award(now, true);
        phase = "award";
        phaseStart = now;
      } else if (phase === "award" && now - phaseStart > AWARD_MS) {
        phase = "idle";
        lastAction = now;
        cur = null;
        const left = remaining().length;
        if (left)
          setHint(userTouched ? `${left} tiles left — your pick` : "your pick — click any tile");
      } else if (phase === "reveal" && now - revealStart > REVEAL_MS) {
        reset(now);
      }
    }

    function renderOnce(now: number) {
      ctx!.clearRect(0, 0, W, H);
      const g = grid();
      drawChips(g, now, phase === "reveal");
      drawBoard(g, now);
      drawFlights(now);
      if (phase === "reveal") drawReveal(now);
    }

    function frame(now: number) {
      raf = null;
      if (!visible) return;
      step(now);
      renderOnce(now);
      raf = requestAnimationFrame(frame);
    }

    // ── Input ──────────────────────────────────────────────────

    function tileAt(px: number, py: number): Tile | null {
      const g = grid();
      for (const t of tiles) {
        const r = tileRect(g, t);
        if (px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h) return t;
      }
      return null;
    }

    cvs.addEventListener("pointermove", (e) => {
      const r = cvs.getBoundingClientRect();
      mx = e.clientX - r.x;
      my = e.clientY - r.y;
      const t = tileAt(mx, my);
      cvs.style.cursor =
        t && !t.rev && (phase === "idle" || phase === "award") ? "pointer" : "default";
    });
    cvs.addEventListener("pointerleave", () => {
      mx = my = -1;
      cvs.style.cursor = "default";
    });
    cvs.addEventListener("pointerdown", (e) => {
      const now = performance.now();
      if (REDUCED && phase === "reveal") {
        reset(now);
        renderOnce(now);
        return;
      }
      const r = cvs.getBoundingClientRect();
      const t = tileAt(e.clientX - r.x, e.clientY - r.y);
      if (!t || t.rev) return;
      if (REDUCED) {
        // no animation: resolve the round instantly and re-render a static frame
        userTouched = true;
        cur = t;
        award(now, false);
        cur = null;
        lastAction = now;
        if (remaining().length === 0) {
          phase = "reveal";
          revealStart = now - 500; // skip the fade so the standings render fully
          for (const tm of teams) tm.disp = tm.score;
          setHint("board cleared — the reveal (click to redeal)");
        } else {
          setHint(`${remaining().length} tiles left — your pick`);
        }
        renderOnce(now);
        return;
      }
      if (phase === "idle" || phase === "award") pickTile(t, true, now);
    });

    // ── Lifecycle ──────────────────────────────────────────────

    const ro = new ResizeObserver(resize);
    ro.observe(cvs);
    const io = new IntersectionObserver((es) => {
      visible = es[0].isIntersecting;
      if (visible && !raf && !REDUCED) raf = requestAnimationFrame(frame);
    });
    io.observe(cvs);
    const onVisibility = () => {
      visible = !document.hidden;
      if (visible && !raf && !REDUCED) raf = requestAnimationFrame(frame);
    };
    document.addEventListener("visibilitychange", onVisibility);

    resize();
    reset(performance.now());
    if (REDUCED) {
      renderOnce(performance.now());
      // repaint the static frame once the web fonts land (the rAF loop self-corrects)
      document.fonts?.ready.then(() => renderOnce(performance.now()));
    } else {
      raf = requestAnimationFrame(frame);
    }

    onCleanup(() => {
      if (raf !== null) cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
    });
  });

  return (
    <div class="sim-frame">
      <div class="sim-bar">
        <span class="led" style={{ background: "var(--magenta-hot)" }} />
        <span class="led" style={{ background: "var(--gold)" }} />
        <span class="led" style={{ background: "var(--peri)" }} />
        <span class="t">friday-night-showdown · {hint()}</span>
        <span class="sim-live">
          <span class="pulse" />
          LIVE
        </span>
      </div>
      <canvas
        ref={cvs}
        class="sim"
        aria-label="Interactive demo of a Beat 4 Beat game board: click a tile to play a round — a song snippet plays and points are awarded. Standings stay hidden until the final reveal. The board plays itself when idle."
      />
    </div>
  );
};

export default SimBoard;
