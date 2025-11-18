import RequireFullUser from "../../components/RequireFullUser";
import Profile from "./profile";

export default function ProfileWrapper() {
  return (
    <RequireFullUser>
      <Profile />
    </RequireFullUser>
  );
}
