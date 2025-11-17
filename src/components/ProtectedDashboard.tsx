import { ParentComponent } from "solid-js";
import PageWrapper from "../pages/dashboard/PageWrapper";
import ProtectedRoute from "./ProtectedRoute";

const ProtectedDashboard: ParentComponent = (props) => {
  return (
    <ProtectedRoute>
      <PageWrapper {...props} />
    </ProtectedRoute>
  );
};

export default ProtectedDashboard;
