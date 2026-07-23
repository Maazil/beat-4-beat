import { Component, createSignal, Show } from "solid-js";

interface AddTeamFormProps {
  /** Tunes the empty-state label ("first team" vs "team"). */
  hasTeams: boolean;
  /** Parent applies name de-duplication and the FLIP animation. */
  onAdd: (name: string) => void;
}

/** Inline "add team" control, pinned below the standings. Owns its open/draft state. */
const AddTeamForm: Component<AddTeamFormProps> = (props) => {
  const [isAdding, setIsAdding] = createSignal(false);
  const [name, setName] = createSignal("");

  const submit = () => {
    const trimmed = name().trim();
    if (!trimmed) return;
    props.onAdd(trimmed);
    setName("");
  };

  return (
    <div style={{ order: 9999 }}>
      <Show
        when={isAdding()}
        fallback={
          <button
            type="button"
            onClick={() => setIsAdding(true)}
            class="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-line px-3 py-2.5 text-sm font-semibold text-muted transition hover:border-beat hover:text-beat"
          >
            + {props.hasTeams ? "Add team" : "Add your first team"}
          </button>
        }
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
          class="flex gap-2"
        >
          <input
            type="text"
            value={name()}
            onInput={(e) => setName(e.currentTarget.value)}
            onKeyDown={(e) => e.key === "Escape" && setIsAdding(false)}
            placeholder="Team name…"
            maxLength={24}
            class="flex-1 rounded-xl border border-line bg-surface-2 px-3 py-2 text-sm text-ink placeholder:text-muted/60 outline-none focus:border-beat focus:ring-2 focus:ring-beat/20"
            autofocus
          />
          <button
            type="submit"
            disabled={!name().trim()}
            class="rounded-full bg-beat px-5 py-2 text-sm font-bold text-night transition hover:bg-beat-bright disabled:opacity-50"
          >
            Add
          </button>
          <button
            type="button"
            onClick={() => {
              setIsAdding(false);
              setName("");
            }}
            class="rounded-full border border-line px-4 py-2 text-sm font-semibold text-muted transition hover:border-beat hover:text-beat"
          >
            Done
          </button>
        </form>
      </Show>
    </div>
  );
};

export default AddTeamForm;
