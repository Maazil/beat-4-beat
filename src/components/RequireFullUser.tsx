import { ParentComponent } from "solid-js";
import ProtectedRoute from "./ProtectedRoute";

const RequireFullUser: ParentComponent = (props) => {
  return (
    <ProtectedRoute requireFullUser={true}>{props.children}</ProtectedRoute>
  );
};

export default RequireFullUser;
