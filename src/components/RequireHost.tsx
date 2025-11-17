import { useParams } from "@solidjs/router";
import { ParentComponent } from "solid-js";
import { rooms } from "../store/roomsStore";
import ProtectedRoute from "./ProtectedRoute";

const RequireHost: ParentComponent = (props) => {
  const params = useParams<{ id: string }>();
  const room = () => rooms.find((r) => r.id === params.id);

  return (
    <ProtectedRoute requireHost={true} roomHostId={room()?.hostId}>
      {props.children}
    </ProtectedRoute>
  );
};

export default RequireHost;
