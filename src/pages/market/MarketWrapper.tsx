import { ParentComponent } from "solid-js";
import ProtectedRoute from "../../components/ProtectedRoute";

const MarketWrapper: ParentComponent = (props) => {
  return (
    <ProtectedRoute>
      <div class="bg-ambient min-h-screen text-neutral-100">{props.children}</div>
    </ProtectedRoute>
  );
};
export default MarketWrapper;
