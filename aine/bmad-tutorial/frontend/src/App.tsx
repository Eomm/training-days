import { createBrowserRouter, RouterProvider, Outlet } from "react-router";
import { HomePage } from "./pages/HomePage.js";
import { useGuestIdentity } from "./hooks/useGuestIdentity.ts";

function RootLayout() {
  const { isLoading } = useGuestIdentity();

  return (
    <main
      className={`min-h-screen bg-white${isLoading ? " flex items-center justify-center" : ""}`}
    >
      <a
        href="#task-input"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:bg-white focus:px-4 focus:py-2"
      >
        Skip to task input
      </a>
      {isLoading ? <p className="text-gray-500">Loading…</p> : <Outlet />}
    </main>
  );
}

const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    children: [{ index: true, element: <HomePage /> }],
  },
]);

export function App() {
  return <RouterProvider router={router} />;
}
