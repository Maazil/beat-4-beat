import { ParentComponent } from "solid-js";
import RequireFullUser from "../../components/RequireFullUser";
import PageWrapper from "../dashboard/PageWrapper";

const ProfileWrapper: ParentComponent = (props) => {
  return (
    <RequireFullUser>
      <PageWrapper>{props.children}</PageWrapper>
    </RequireFullUser>
  );
};

export default ProfileWrapper;
