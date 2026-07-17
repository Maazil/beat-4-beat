import { Component, createSignal, For, onMount, Show } from "solid-js";
import {
  generateRoomInvite,
  getRoomEditors,
  removeRoomEditor,
  revokeRoomInvite,
  type RoomEditor,
} from "../../../services/roomsService";

interface CoOwnerPanelProps {
  roomId: string;
  initialInviteToken: string | null;
  editorIds: string[];
}

/** Co-owner (medeier) management — edit mode, host only. */
const CoOwnerPanel: Component<CoOwnerPanelProps> = (props) => {
  const [editors, setEditors] = createSignal<RoomEditor[]>([]);
  const [inviteToken, setInviteToken] = createSignal<string | null>(props.initialInviteToken);
  const [inviteCopied, setInviteCopied] = createSignal(false);
  const [editorError, setEditorError] = createSignal<string | null>(null);
  const [editorBusy, setEditorBusy] = createSignal(false);

  onMount(async () => {
    if (props.editorIds.length === 0) return;
    try {
      setEditors(await getRoomEditors(props.roomId, props.editorIds));
    } catch (err) {
      console.error("Failed to load co-owners:", err);
      setEditorError("Could not load the co-owner list");
    }
  });

  const inviteLink = () => {
    const token = inviteToken();
    return token ? `${window.location.origin}/invite/${props.roomId}/${token}` : null;
  };

  const handleGenerateInvite = async () => {
    if (editorBusy()) return;

    setEditorBusy(true);
    setEditorError(null);
    try {
      setInviteToken(await generateRoomInvite(props.roomId));
      setInviteCopied(false);
    } catch (err) {
      setEditorError(err instanceof Error ? err.message : "Could not create the invite link");
    } finally {
      setEditorBusy(false);
    }
  };

  const handleRevokeInvite = async () => {
    if (editorBusy()) return;

    setEditorBusy(true);
    setEditorError(null);
    try {
      await revokeRoomInvite(props.roomId);
      setInviteToken(null);
      setInviteCopied(false);
    } catch (err) {
      setEditorError(err instanceof Error ? err.message : "Could not disable the link");
    } finally {
      setEditorBusy(false);
    }
  };

  const handleCopyInvite = async () => {
    const link = inviteLink();
    if (!link) return;

    try {
      await navigator.clipboard.writeText(link);
      setInviteCopied(true);
    } catch {
      setEditorError("Could not copy the link — select the text and copy it manually");
    }
  };

  const handleRemoveEditor = async (uid: string) => {
    setEditorBusy(true);
    setEditorError(null);
    try {
      await removeRoomEditor(props.roomId, uid);
      setEditors(editors().filter((e) => e.uid !== uid));
    } catch (err) {
      setEditorError(err instanceof Error ? err.message : "Could not remove the co-owner");
    } finally {
      setEditorBusy(false);
    }
  };

  return (
    <div class="mb-8 max-w-md rounded-2xl border border-line bg-surface p-4">
      <h3 class="font-display mb-1 font-bold text-ink">Co-owners</h3>
      <p class="mb-3 text-sm text-muted">
        Co-owners can edit the room, but not delete it or change the co-owner list.
      </p>

      {/* Existing co-owners */}
      <Show
        when={editors().length > 0}
        fallback={<p class="mb-3 text-sm text-muted/70">No co-owners yet.</p>}
      >
        <ul class="mb-3 space-y-1">
          <For each={editors()}>
            {(editor) => (
              <li class="flex items-center justify-between rounded-xl bg-night px-3 py-2 text-sm">
                <span class="min-w-0 truncate text-ink">
                  {editor.displayName || editor.email || editor.uid}
                </span>
                <button
                  type="button"
                  disabled={editorBusy()}
                  onClick={() => handleRemoveEditor(editor.uid)}
                  class="ml-3 shrink-0 text-muted transition hover:text-magenta-hot disabled:opacity-50"
                  title="Remove co-owner"
                >
                  ✕
                </button>
              </li>
            )}
          </For>
        </ul>
      </Show>

      {/* Invite link */}
      <Show
        when={inviteLink()}
        fallback={
          <button
            type="button"
            disabled={editorBusy()}
            onClick={handleGenerateInvite}
            class="rounded-full bg-beat px-4 py-2 text-sm font-bold text-night transition hover:bg-beat-bright disabled:cursor-not-allowed disabled:opacity-50"
          >
            Create invite link
          </button>
        }
      >
        <div class="flex gap-2">
          <input
            type="text"
            readOnly
            value={inviteLink() ?? ""}
            onFocus={(e) => e.currentTarget.select()}
            class="min-w-0 flex-1 rounded-xl border border-line bg-surface-2 px-3 py-2 font-mono text-sm text-ink outline-none focus:border-beat focus:ring-2 focus:ring-beat/20"
          />
          <button
            type="button"
            onClick={handleCopyInvite}
            class="shrink-0 rounded-full bg-beat px-4 py-2 text-sm font-bold text-night transition hover:bg-beat-bright"
          >
            {inviteCopied() ? "Copied!" : "Copy"}
          </button>
        </div>
        <div class="mt-2 flex gap-4 text-sm">
          <button
            type="button"
            disabled={editorBusy()}
            onClick={handleGenerateInvite}
            class="text-muted transition hover:text-ink disabled:opacity-50"
          >
            Create new link
          </button>
          <button
            type="button"
            disabled={editorBusy()}
            onClick={handleRevokeInvite}
            class="text-muted transition hover:text-magenta-hot disabled:opacity-50"
          >
            Disable link
          </button>
        </div>
        <p class="mt-2 text-xs text-muted/70">
          Anyone with the link can become a co-owner. Create a new link to invalidate shared ones.
        </p>
      </Show>

      <Show when={editorError()}>
        <p class="mt-2 text-sm text-magenta-hot">{editorError()}</p>
      </Show>
    </div>
  );
};

export default CoOwnerPanel;
