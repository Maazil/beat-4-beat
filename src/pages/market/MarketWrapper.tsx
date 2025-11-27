import { ParentComponent } from "solid-js";

const MarketWrapper: ParentComponent = (props) => {
  return (
    <div class="bg-ambient min-h-screen text-neutral-100">{props.children}</div>
  );
};
export default MarketWrapper;
