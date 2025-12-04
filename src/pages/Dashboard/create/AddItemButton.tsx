import { Component } from "solid-js";
import type { CategoryColorScheme } from "./categoryColors";

interface AddItemButtonProps {
  colorScheme: CategoryColorScheme;
  onClick: () => void;
}

const AddItemButton: Component<AddItemButtonProps> = (props) => {
  return (
    <button
      type="button"
      onClick={() => props.onClick()}
      class="flex h-16 w-full items-center justify-center rounded-lg border-2 border-dashed transition sm:h-20"
      style={{
        "border-color": props.colorScheme.border,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = props.colorScheme.itemBgHover;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = "transparent";
      }}
    >
      <svg
        class="h-8 w-8 opacity-50"
        style={{ color: props.colorScheme.textDark }}
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
    </button>
  );
};

export default AddItemButton;
