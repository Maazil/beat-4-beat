import { Meta, Title } from "@solidjs/meta";
import { useNavigate } from "@solidjs/router";
import type { Component } from "solid-js";
import "../stage-night.css";
import "./host-guide.css";

const HostGuide: Component = () => {
  const navigate = useNavigate();

  return (
    <>
      <Title>How to set up for the host — Beat 4 Beat</Title>
      <Meta
        name="description"
        content="Everything a Beat 4 Beat host needs: build a board, connect Spotify Premium or use YouTube, put the game on a TV or projector, and pick the music setup that fits your night."
      />

      <div class="stage-night">
        <div class="stage-glow" aria-hidden="true" />
        <main>
          <div class="wrap">
            <nav>
              <a class="wordmark" href="/">
                <span class="tick" />
                BEAT 4 BEAT
              </a>
              <div class="navlinks">
                <a href="#prep">Before the party</a>
                <a href="#setups">Music setups</a>
                <a href="#run">Run the night</a>
                <button type="button" class="btn-signin" onClick={() => navigate("/login")}>
                  Sign in
                </button>
              </div>
            </nav>

            <header class="guide-hero">
              <span class="badge">
                <span class="dot" />
                THE HOST HANDBOOK
              </span>
              <h1>
                Set the stage. <span class="glow">Run the show.</span>
              </h1>
              <p class="sub">
                Ten minutes of prep is all it takes: build a board, sort your music, get the game on
                the big screen, and decide how the sound flows. Here's the full walkthrough.
              </p>
            </header>

            <section id="prep">
              <p class="eyebrow">Before the party</p>
              <h2>Four things to sort ahead of game night</h2>
              <div class="steps guide-steps">
                <div class="step">
                  <span class="num mono">PREP 1</span>
                  <h3>Build your board</h3>
                  <p>
                    Sign in with Google, head to your dashboard, and create a board. Add categories
                    and drop a song on every tile — paste Spotify links for the best experience, or
                    YouTube links where Spotify doesn't have the track. Set a start time on songs
                    with slow intros. Short on time? Duplicate a public board from the marketplace
                    and remix it.
                  </p>
                </div>
                <div class="step">
                  <span class="num mono">PREP 2</span>
                  <h3>Sort your music source</h3>
                  <p>
                    With a <strong>Spotify Premium</strong> account, connect Spotify from the play
                    view and songs fire automatically when tiles are revealed — you pick which
                    device they play on. No Premium? Songs with YouTube links play in a built-in
                    player right in the browser, no account needed.
                  </p>
                </div>
                <div class="step">
                  <span class="num mono">PREP 3</span>
                  <h3>Put the game on the big screen</h3>
                  <p>
                    Connect your computer to a TV or projector with a compatible cable (HDMI, USB-C
                    to HDMI) or wireless mirroring (AirPlay, Chromecast). Anything that can show
                    your computer screen works — the game runs in the browser. Mirror the display
                    and put the browser in fullscreen.
                  </p>
                </div>
                <div class="step">
                  <span class="num mono">PREP 4</span>
                  <h3>Wire up the sound</h3>
                  <p>
                    The music needs to reach a proper speaker. Decide what feeds it: the computer
                    (simplest — TV or speaker plugged straight in) or your phone (most flexible —
                    control the music from anywhere in the room). The setups below cover both.
                  </p>
                </div>
              </div>
            </section>

            <section id="setups">
              <p class="eyebrow">Pick your music setup</p>
              <h2>Three ways to run the sound</h2>
              <p class="lede">
                Every setup plays the song the moment a tile is revealed. The difference is where
                the audio comes out and where you control it from — pick by how your speaker is
                connected and how mobile you want to be.
              </p>
              <div class="features">
                <div class="feat">
                  <span class="setup-tag">Setup A · Simplest</span>
                  <h3>Everything from the computer</h3>
                  <p class="setup-when">
                    <span class="mono">Best when</span> — one host at the keyboard, and the speaker
                    or TV audio is plugged into the computer.
                  </p>
                  <ul class="guide-list">
                    <li>Open your board's play view and connect Spotify (Premium).</li>
                    <li>In the device picker, choose this computer as the playback device.</li>
                    <li>
                      Reveal a tile — the song plays instantly. Pause, resume, and scrub from the
                      game's now-playing bar.
                    </li>
                    <li>
                      Everything runs inside the browser, so the mirrored screen never shows
                      anything but the game.
                    </li>
                  </ul>
                </div>
                <div class="feat">
                  <span class="setup-tag">Setup B · Recommended</span>
                  <h3>Phone as the music remote</h3>
                  <p class="setup-when">
                    <span class="mono">Best when</span> — you want to walk the room and keep full
                    control of the music from your pocket.
                  </p>
                  <ul class="guide-list">
                    <li>
                      Install the Spotify app on <strong>both</strong> the computer and your phone,
                      logged into the <strong>same Premium account</strong>, preferably on the same
                      Wi-Fi.
                    </li>
                    <li>Pick either device as the playback device in the game.</li>
                    <li>
                      Reveal a tile and the song plays — then pause, skip, or continue from the
                      phone's Spotify app whenever it's smoother. Spotify keeps every device in
                      sync.
                    </li>
                    <li>
                      Because the phone is the remote, you can mirror your entire screen without
                      ever exposing a Spotify window — no screen-splitting needed.
                    </li>
                  </ul>
                </div>
                <div class="feat">
                  <span class="setup-tag">Setup C · Phone speaker</span>
                  <h3>Speaker hangs off the phone</h3>
                  <p class="setup-when">
                    <span class="mono">Best when</span> — the speaker is Bluetooth-paired to your
                    phone, or the computer can't reach it.
                  </p>
                  <ul class="guide-list">
                    <li>
                      Same requirement as Setup B: Spotify app on both devices, same Premium
                      account. That's what lets the computer hand playback to the phone.
                    </li>
                    <li>In the game's device picker, choose your phone.</li>
                    <li>
                      Reveal tiles from the computer as usual — the music comes out of the phone and
                      into the speaker, while the board stays fullscreen on the big screen.
                    </li>
                    <li>Control the flow from the game or straight from the phone — both work.</li>
                  </ul>
                </div>
              </div>
              <div class="guide-note">
                <strong>No Premium?</strong> Fill your tiles with YouTube links instead. They play
                in an embedded player inside the game, and the audio comes out of the computer — so
                plug the speaker into the computer and you're set. You can mix both: Spotify where
                you have it, YouTube for the gaps.
              </div>
              <div class="guide-note">
                <strong>Device not showing up?</strong> Spotify only lists devices it can see: open
                the Spotify app on that device, tap play on anything for a second, then hit Refresh
                in the game's device picker. Keeping both devices on the same network makes the
                handoff reliable.
              </div>
            </section>

            <section id="run">
              <p class="eyebrow">Run the night</p>
              <h2>The two-host playbook</h2>
              <p class="lede">
                Beat 4 Beat runs fine solo with Setup A, but with two hosts the night flows better —
                one runs the board, one works the room.
              </p>
              <div class="steps guide-steps">
                <div class="step">
                  <span class="num mono">HOST 1 · AT THE KEYS</span>
                  <h3>Runs the board</h3>
                  <p>
                    Writes the team names, reveals the tiles teams pick (the song fires
                    automatically), awards title and artist points — including steals — and keeps
                    the standings hidden until the final reveal.
                  </p>
                </div>
                <div class="step">
                  <span class="num mono">HOST 2 · ON THE FLOOR</span>
                  <h3>Works the room</h3>
                  <p>
                    Keeps the turn order honest, hypes the teams, and carries the phone as the music
                    remote (Setup B) — pausing the track the moment someone shouts an answer,
                    replaying the intro when the room demands it.
                  </p>
                </div>
              </div>
            </section>
          </div>

          <div class="cta-band">
            <div class="cta-inner wrap">
              <p class="eyebrow">Sound check done</p>
              <h2>The board's ready when you are.</h2>
              <p class="lede">
                Sign in with Google, build your first board in minutes, and settle who really knows
                their music.
              </p>
              <div class="ctas">
                <button type="button" class="btn btn-gold" onClick={() => navigate("/login")}>
                  Start a game
                </button>
                <button type="button" class="btn btn-ghost" onClick={() => navigate("/market")}>
                  Browse the marketplace
                </button>
              </div>
            </div>
          </div>
          <footer>
            <div class="wrap foot">
              <a class="wordmark" href="/">
                <span class="tick" />
                BEAT 4 BEAT
              </a>
              <span>Made by Matthew Ling</span>
              <span>Made for game night · free to play</span>
            </div>
          </footer>
        </main>
      </div>
    </>
  );
};

export default HostGuide;
