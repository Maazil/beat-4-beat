// @vitest-environment jsdom
import { render } from "@solidjs/testing-library";
import userEvent from "@testing-library/user-event";
import { createSignal } from "solid-js";
import { beforeAll, describe, expect, test, vi } from "vitest";
import type { Score } from "../model/score";
import Scoreboard from "./Scoreboard";

beforeAll(() => {
  // jsdom doesn't implement the Web Animations API used by the FLIP/pop effects.
  Element.prototype.animate = vi.fn(
    () => ({ cancel() {}, finished: Promise.resolve() }) as unknown as Animation,
  );
  // jsdom's confirm() throws "not implemented"; treat destructive prompts as confirmed.
  vi.stubGlobal(
    "confirm",
    vi.fn(() => true),
  );
});

const user = userEvent.setup();

/** Render with parent-owned scores + calls state, mirroring the real controlled usage. */
const renderScoreboard = (
  initial: Score[],
  currentRound?: number,
  initialCalls = ["Title", "Artist"],
) => {
  const [scores, setScores] = createSignal<Score[]>(initial);
  const [calls, setCalls] = createSignal<string[]>(initialCalls);
  const onUpdateScores = vi.fn((next: Score[]) => setScores(next));
  const onUpdateCalls = vi.fn((next: string[]) => setCalls(next));
  const result = render(() => (
    <Scoreboard
      scores={scores()}
      calls={calls()}
      currentRound={currentRound}
      onUpdateScores={onUpdateScores}
      onUpdateCalls={onUpdateCalls}
    />
  ));
  return { ...result, scores, calls, onUpdateScores, onUpdateCalls };
};

describe("Scoreboard", () => {
  test("adds a team through the inline form", async () => {
    const { getByText, getByPlaceholderText, getByRole, onUpdateScores } = renderScoreboard([]);

    await user.click(getByText("+ Add your first team"));
    await user.type(getByPlaceholderText("Team name…"), "Reds");
    await user.click(getByRole("button", { name: "Add" }));

    expect(onUpdateScores).toHaveBeenCalledWith([{ teamName: "Reds", rounds: [] }]);
  });

  test("awards a title point to the round in play", async () => {
    const { getByTitle, onUpdateScores } = renderScoreboard([{ teamName: "Reds", rounds: [] }], 0);

    await user.click(getByTitle("+1 Title"));

    expect(onUpdateScores).toHaveBeenCalledWith([{ teamName: "Reds", rounds: [{ Title: 1 }] }]);
  });

  test("awards a call to a different team (a steal)", async () => {
    const { getByLabelText, onUpdateScores } = renderScoreboard(
      [
        { teamName: "Reds", rounds: [{ Title: 1 }] },
        { teamName: "Blues", rounds: [] },
      ],
      0,
    );

    await user.click(getByLabelText("Award Artist point to Blues"));

    expect(onUpdateScores).toHaveBeenCalledWith([
      { teamName: "Reds", rounds: [{ Title: 1 }] },
      { teamName: "Blues", rounds: [{ Artist: 1 }] },
    ]);
  });

  test("award buttons are disabled with no round in play", () => {
    const { getAllByTitle } = renderScoreboard([{ teamName: "Reds", rounds: [] }]);
    const buttons = getAllByTitle("Play a song to start a round"); // Title +/- and Artist +/-
    expect(buttons).toHaveLength(4);
    buttons.forEach((b) => expect(b).toBeDisabled());
  });

  test("host adds a scoring call", async () => {
    const { getByText, getByPlaceholderText, onUpdateCalls } = renderScoreboard([]);

    await user.click(getByText("+ Call"));
    await user.type(getByPlaceholderText("e.g. Performance"), "Performance{Enter}");

    expect(onUpdateCalls).toHaveBeenCalledWith(["Title", "Artist", "Performance"]);
  });

  test("renaming a call carries its points across", async () => {
    const { getAllByTitle, getByRole, onUpdateCalls, onUpdateScores } = renderScoreboard(
      [{ teamName: "Reds", rounds: [{ Title: 1, Artist: 1 }] }],
      0,
    );

    await user.click(getAllByTitle("Rename call")[0]); // the "Title" call
    const input = getByRole("textbox", { name: "Call name" });
    await user.clear(input);
    await user.type(input, "Song{Enter}");

    expect(onUpdateCalls).toHaveBeenCalledWith(["Song", "Artist"]);
    expect(onUpdateScores).toHaveBeenCalledWith([
      { teamName: "Reds", rounds: [{ Artist: 1, Song: 1 }] },
    ]);
  });

  test("removing a call drops its points", async () => {
    const { getByLabelText, onUpdateCalls, onUpdateScores } = renderScoreboard(
      [{ teamName: "Reds", rounds: [{ Title: 1, Artist: 1 }] }],
      0,
    );

    await user.click(getByLabelText("Remove Artist call"));

    expect(onUpdateCalls).toHaveBeenCalledWith(["Title"]);
    expect(onUpdateScores).toHaveBeenCalledWith([{ teamName: "Reds", rounds: [{ Title: 1 }] }]);
  });

  test("reveals standings with totals on demand", async () => {
    const { getByRole, queryAllByText } = renderScoreboard(
      [{ teamName: "Reds", rounds: [{ Title: 2 }, { Title: 1 }] }],
      1,
    );

    // Totals stay hidden while playing.
    expect(queryAllByText("3")).toHaveLength(0);

    await user.click(getByRole("button", { name: /reveal standings/i }));

    expect(getByRole("button", { name: /hide standings/i })).toBeInTheDocument();
    // Total (2 + 1) now shown — in the row and the breakdown footer.
    expect(queryAllByText("3").length).toBeGreaterThan(0);
  });
});
