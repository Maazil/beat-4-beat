import { ParentComponent } from "solid-js";
import PageWrapper from "../dashboard/PageWrapper";

const ProfileWrapper: ParentComponent = (props) => {
  return <PageWrapper>{props.children}</PageWrapper>;
};

export default ProfileWrapper;
