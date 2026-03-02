import { createBrowserRouter, RouterProvider, Outlet } from "react-router";
import { HomePage } from "./pages/HomePage.js";

function RootLayout() {
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
