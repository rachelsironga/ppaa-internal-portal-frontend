import { useLocation } from "react-router-dom";
import Layout from "./layouts/Layout";
import AppRoutes from "./router/AppRoutes";
import { Blank } from "./layouts/Blank";
import ProtectedRoute from "./components/wrapper/ProtectedRoute";
import { Provider } from "react-redux";
import store from "./state-manager/store";

function App() {
  const location = useLocation();
  const isAuthPath =
    location.pathname.includes("auth") ||
    location.pathname.includes("error") ||
    location.pathname.includes("under-maintenance") |
    location.pathname.includes("blank");
  return (
    <>
      <Provider store={store}>
        {isAuthPath ? (
          <AppRoutes>
            <Blank />
          </AppRoutes>
        ) : (
          <ProtectedRoute>
            <Layout>
              <AppRoutes />
            </Layout>
          </ProtectedRoute>
        )}
      </Provider>

    </>
  );
}

export default App;
