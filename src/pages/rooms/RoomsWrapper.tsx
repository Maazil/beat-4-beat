import { ParentComponent } from "solid-js";

const RoomsWrapper: ParentComponent = (props) => {
  return <div class="bg-stage min-h-screen text-ink">{props.children}</div>;
};
export default RoomsWrapper;
