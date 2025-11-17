import RequireFullUser from "../../../components/RequireFullUser";
import CreateRoom from "./createRoom";

export default function CreateRoomWrapper() {
  return (
    <RequireFullUser>
      <CreateRoom />
    </RequireFullUser>
  );
}
