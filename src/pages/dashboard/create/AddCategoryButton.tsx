import { Component } from "solid-js";

interface AddCategoryButtonProps {
  onClick: () => void;
  disabled?: boolean;
}

const AddCategoryButton: Component<AddCategoryButtonProps> = (props) => {
  return (
    <button
      type="button"
      onClick={() => props.onClick()}
      disabled={props.disabled}
      class="flex h-24 w-40 shrink-0 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-line bg-surface/60 text-muted transition hover:border-beat hover:bg-beat-soft/40 hover:text-beat disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-line disabled:hover:bg-surface/60 disabled:hover:text-muted md:h-38 md:w-56"
    >
      <svg class="h-10 w-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
      </svg>
      <span class="text-sm font-semibold">Add category</span>
    </button>
  );
};

export default AddCategoryButton;
