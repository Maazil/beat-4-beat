import { ParentComponent } from "solid-js";
import ProtectedRoute from "../../components/ProtectedRoute";

const MarketWrapper: ParentComponent = (props) => {
  return (
    <ProtectedRoute>
      <div class="bg-stage min-h-screen text-ink">{props.children}</div>
    </ProtectedRoute>
  );
};
export default MarketWrapper;
