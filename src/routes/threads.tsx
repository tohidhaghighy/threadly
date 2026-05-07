import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/threads")({
  component: ThreadsLayout,
});

function ThreadsLayout() {
  return <Outlet />;
}
