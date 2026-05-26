import ProtectedRoute from "../../../components/ProtectedRoute";
import CreateRoom from "./createRoom";

export default function CreateRoomWrapper() {
  return (
    <ProtectedRoute>
      <CreateRoom />
    </ProtectedRoute>
  );
}
