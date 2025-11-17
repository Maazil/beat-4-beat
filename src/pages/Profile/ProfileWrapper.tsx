import RequireFullUser from "../../components/RequireFullUser";
import Profile from "./Profile";

export default function ProfileWrapper() {
  return (
    <RequireFullUser>
      <Profile />
    </RequireFullUser>
  );
}
