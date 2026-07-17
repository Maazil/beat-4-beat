import { Meta, Title } from "@solidjs/meta";
import { useNavigate } from "@solidjs/router";
import type { Component } from "solid-js";
import SimBoard from "../components/landing/SimBoard";
import "./stage-night.css";

const App: Component = () => {
  const navigate = useNavigate();

  return (
    <>
      <Title>Beat 4 Beat — The music quiz party game</Title>
      <Meta
        name="description"
        content="Beat 4 Beat is the ultimate music quiz party game. Fill game boards with your favorite Spotify songs, gather your friends, guess the track, and beat the room."
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
                <a href="#how">How it plays</a>
                <a href="#features">Features</a>
                <a
                  href="/host-guide"
                  onClick={(e) => {
                    e.preventDefault();
                    navigate("/host-guide");
                  }}
                >
                  Host setup
                </a>
                <a
                  href="/market"
                  onClick={(e) => {
                    e.preventDefault();
                    navigate("/market");
                  }}
                >
                  Marketplace
                </a>
                <button type="button" class="btn-signin" onClick={() => navigate("/login")}>
                  Sign in
                </button>
              </div>
            </nav>

            <header class="hero">
              <span class="badge">
                <span class="dot" />
                NEW · A MARKETPLACE OF PUBLIC BOARDS
              </span>
              <h1>
                Guess the track. <span class="glow">Beat the room.</span>
              </h1>
              <p class="sub">
                The music quiz party game. Fill a game board with your favorite Spotify songs,
                gather your friends, and find out who really knows their music — first to name the
                tune takes the points.
              </p>
              <div class="ctas">
                <button type="button" class="btn btn-gold" onClick={() => navigate("/login")}>
                  Start a game
                </button>
                <button type="button" class="btn btn-ghost" onClick={() => navigate("/market")}>
                  Explore public boards
                </button>
              </div>
              <p class="hero-note">Free to play · runs in the browser · nothing to install</p>

              <SimBoard />
            </header>

            <section id="how">
              <p class="eyebrow">How a round works</p>
              <h2>Four beats to every game night</h2>
              <div class="steps">
                <div class="step">
                  <span class="num mono">STEP 1</span>
                  <h3>Build your board</h3>
                  <p>
                    Pick your categories and place your Spotify songs on the board, one by one —
                    every tile hides a track.
                  </p>
                </div>
                <div class="step">
                  <span class="num mono">STEP 2</span>
                  <h3>Pick a tile, hit play</h3>
                  <p>
                    Teams take turns choosing which song to open. The host controls the snippet —
                    nobody touches the aux.
                  </p>
                </div>
                <div class="step">
                  <span class="num mono">STEP 3</span>
                  <h3>Shout it out</h3>
                  <p>
                    Title and artist score separately. Miss the artist? Another team can steal that
                    point right off your round.
                  </p>
                </div>
                <div class="step">
                  <span class="num mono">STEP 4</span>
                  <h3>Reveal the standings</h3>
                  <p>
                    Totals stay hidden while you play. One reveal at the end, maximum drama, one
                    winner.
                  </p>
                </div>
              </div>
            </section>

            <section id="features">
              <p class="eyebrow">Built for the living room</p>
              <h2>Everything a host needs, nothing they don't</h2>
              <div class="features">
                <div class="feat">
                  {/* Brand color, not a Stage Night token: the icon reads as Spotify. */}
                  <div class="ic" style={{ background: "rgba(29, 185, 84, 0.14)" }}>
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                      <circle cx="10" cy="10" r="8" stroke="#1DB954" stroke-width="1.6" />
                      <path
                        d="M6.5 8.2c2.6-.8 5-.6 7 .6M7 11c2-.6 3.8-.4 5.4.5"
                        stroke="#1DB954"
                        stroke-width="1.5"
                        stroke-linecap="round"
                      />
                    </svg>
                  </div>
                  <h3>Boards built song by song</h3>
                  <p>
                    Search Spotify and place each track on the board yourself. No Spotify link?
                    YouTube playback fills the gaps.
                  </p>
                </div>
                <div class="feat">
                  <div class="ic">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                      <rect
                        x="2"
                        y="4"
                        width="11"
                        height="9"
                        rx="1.5"
                        stroke="#C2158F"
                        stroke-width="1.6"
                      />
                      <rect
                        x="13.5"
                        y="8"
                        width="4.5"
                        height="8"
                        rx="1.2"
                        stroke="#C2158F"
                        stroke-width="1.6"
                      />
                    </svg>
                  </div>
                  <h3>Live on every screen</h3>
                  <p>
                    Rooms sync in real time. Put the board on the TV, run the controls from your
                    phone.
                  </p>
                </div>
                <div class="feat">
                  <div class="ic">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                      <path
                        d="M3 7l7-4 7 4-7 4-7-4Z"
                        stroke="#C6D8FF"
                        stroke-width="1.5"
                        stroke-linejoin="round"
                      />
                      <path
                        d="M3 7v6l7 4 7-4V7"
                        stroke="#C6D8FF"
                        stroke-width="1.5"
                        stroke-linejoin="round"
                      />
                    </svg>
                  </div>
                  <h3>A marketplace of boards</h3>
                  <p>
                    Short on prep time? Grab a public board, duplicate it to your dashboard, and
                    remix the categories.
                  </p>
                </div>
                <div class="feat">
                  <div class="ic">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                      <path
                        d="M4 16V9M10 16V4M16 16v-6"
                        stroke="#EAC435"
                        stroke-width="1.8"
                        stroke-linecap="round"
                      />
                    </svg>
                  </div>
                  <h3>Title + artist scoring</h3>
                  <p>
                    Every song is worth two calls — title and artist. Nail one, fumble the other,
                    and a rival team can steal it.
                  </p>
                </div>
                <div class="feat">
                  <div class="ic">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                      <rect
                        x="3"
                        y="8"
                        width="14"
                        height="9"
                        rx="2"
                        stroke="#C2158F"
                        stroke-width="1.6"
                      />
                      <path d="M7 8V6a3 3 0 0 1 6 0v2" stroke="#C2158F" stroke-width="1.6" />
                    </svg>
                  </div>
                  <h3>Standings stay secret</h3>
                  <p>
                    No live leaderboard to kill the tension. Scores stay masked until the host hits
                    reveal.
                  </p>
                </div>
                <div class="feat">
                  {/* Brand color, not a Stage Night token: the play badge reads as YouTube. */}
                  <div class="ic" style={{ background: "rgba(255, 0, 51, 0.14)" }}>
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                      <path
                        d="M6 4.5v11l9-5.5-9-5.5Z"
                        stroke="#FF0033"
                        stroke-width="1.6"
                        stroke-linejoin="round"
                      />
                    </svg>
                  </div>
                  <h3>The host runs the show</h3>
                  <p>
                    Start and stop snippets, set the start time on tricky intros, award points, keep
                    the chaos on the rails.
                  </p>
                </div>
              </div>
            </section>
          </div>

          <div class="cta-band">
            <div class="cta-inner wrap">
              <p class="eyebrow">Tonight's the night</p>
              <h2>Your playlists are already a game. Deal the board.</h2>
              <p class="lede">
                Sign in with Google, build your first board in minutes, and settle who really knows
                their music.
              </p>
              <div class="ctas">
                <button type="button" class="btn btn-gold" onClick={() => navigate("/login")}>
                  Start playing free
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
              <a
                href="/host-guide"
                onClick={(e) => {
                  e.preventDefault();
                  navigate("/host-guide");
                }}
              >
                How to set up for the host
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

export default App;
