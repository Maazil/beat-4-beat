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
      class="flex h-48 w-40 shrink-0 flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-neutral-300 bg-neutral-100/50 text-neutral-500 transition hover:border-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-neutral-300 disabled:hover:bg-neutral-100/50 disabled:hover:text-neutral-500"
    >
      <svg
        class="h-10 w-10"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M12 4v16m8-8H4"
        />
      </svg>
      <span class="text-sm font-medium">Legg til kategori</span>
    </button>
  );
};

export default AddCategoryButton;
