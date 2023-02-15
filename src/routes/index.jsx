import { createBrowserRouter } from "react-router-dom";
import Home from "@/pages/Home";
import Blog from "@/pages/Blog";
import ReadPage from "@/pages/ReadPage";

const routes = createBrowserRouter([
  {
    path: "/",
    element: <Home />,
  },
  {
    path: "/blog",
    element: <Blog />,
  },
  {
    path: "/blog/:slug",
    element: <ReadPage />,
  },
]);

export default routes;
