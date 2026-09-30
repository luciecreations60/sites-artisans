import { Outlet } from "react-router";
import { AuthProvider } from "~/lib/auth";

export default function EspaceClientLayout() {
  return (
    <AuthProvider>
      <Outlet />
    </AuthProvider>
  );
}
