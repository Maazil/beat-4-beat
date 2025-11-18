import { ParentComponent } from "solid-js";

const RoomsWrapper: ParentComponent = (props) => {
  return (
    <div class="min-h-screen bg-[#f4f6f8] text-neutral-900">
      {props.children}
    </div>
  );
};
export default RoomsWrapper;
