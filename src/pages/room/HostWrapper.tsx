import RequireHost from "../../components/RequireHost";
import Host from "./Host";

export default function HostWrapper() {
  return (
    <RequireHost>
      <Host />
    </RequireHost>
  );
}
