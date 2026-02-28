import { ParentComponent } from "solid-js";
import ProtectedRoute from "../../components/ProtectedRoute";
import PageWrapper from "../dashboard/PageWrapper";

const ProfileWrapper: ParentComponent = (props) => {
  return (
    <ProtectedRoute requireFullUser={false}>
      <PageWrapper>{props.children}</PageWrapper>
    </ProtectedRoute>
  );
};

export default ProfileWrapper;
