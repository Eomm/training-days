import { createBrowserRouter, RouterProvider, Outlet } from "react-router";
import { HomePage } from "./pages/HomePage.js";
import { useGuestIdentity } from "./hooks/useGuestIdentity.ts";

function RootLayout() {
  const { isLoading } = useGuestIdentity();

  if (isLoading) {
    return (
      <main className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-gray-500">Loading…</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white">
      <Outlet />
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
