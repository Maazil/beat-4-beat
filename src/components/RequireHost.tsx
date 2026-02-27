import { useParams } from "@solidjs/router";
import { ParentComponent } from "solid-js";
import { useRoom } from "../hooks/useRoom";
import ProtectedRoute from "./ProtectedRoute";

const RequireHost: ParentComponent = (props) => {
  const params = useParams<{ id: string }>();
  const { room } = useRoom(() => params.id);

  return (
    <ProtectedRoute requireHost={true} roomHostId={room()?.hostId}>
      {props.children}
    </ProtectedRoute>
  );
};

export default RequireHost;
