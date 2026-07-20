// @vitest-environment jsdom
import { render } from "@solidjs/testing-library";
import userEvent from "@testing-library/user-event";
import { createSignal } from "solid-js";
import { beforeAll, describe, expect, test, vi } from "vitest";
import type { Score } from "../model/score";
import Scoreboard from "./Scoreboard";

// jsdom doesn't implement the Web Animations API used by the FLIP/pop effects.
beforeAll(() => {
  Element.prototype.animate = vi.fn(
    () => ({ cancel() {}, finished: Promise.resolve() }) as unknown as Animation,
  );
});

const user = userEvent.setup();

/** Render with parent-owned scores state, mirroring the real controlled usage. */
const renderScoreboard = (initial: Score[], currentRound?: number) => {
  const [scores, setScores] = createSignal<Score[]>(initial);
  const onUpdateScores = vi.fn((next: Score[]) => setScores(next));
  const result = render(() => (
    <Scoreboard scores={scores()} currentRound={currentRound} onUpdateScores={onUpdateScores} />
  ));
  return { ...result, scores, onUpdateScores };
};

describe("Scoreboard", () => {
  test("adds a team through the inline form", async () => {
    const { getByText, getByPlaceholderText, getByRole, onUpdateScores } = renderScoreboard([]);

    await user.click(getByText("+ Add your first team"));
    await user.type(getByPlaceholderText("Team name…"), "Reds");
    await user.click(getByRole("button", { name: "Add" }));

    expect(onUpdateScores).toHaveBeenCalledWith([{ teamName: "Reds", roundPoints: [] }]);
  });

  test("awards a point to the round in play", async () => {
    const { getByTitle, onUpdateScores } = renderScoreboard(
      [{ teamName: "Reds", roundPoints: [] }],
      0,
    );

    await user.click(getByTitle("+1 point this round"));

    expect(onUpdateScores).toHaveBeenCalledWith([{ teamName: "Reds", roundPoints: [1] }]);
  });

  test("point buttons are disabled with no round in play", () => {
    const { getAllByTitle } = renderScoreboard([{ teamName: "Reds", roundPoints: [] }]);
    const buttons = getAllByTitle("Play a song to start a round"); // the +/- pair
    expect(buttons).toHaveLength(2);
    buttons.forEach((b) => expect(b).toBeDisabled());
  });

  test("reveals standings with totals on demand", async () => {
    const { getByRole, queryAllByText } = renderScoreboard(
      [{ teamName: "Reds", roundPoints: [2, 1] }],
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
