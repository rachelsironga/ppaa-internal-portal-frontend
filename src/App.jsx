import { useLocation } from "react-router-dom";
import Layout from "./layouts/Layout";
import AppRoutes from "./router/AppRoutes";
import { Blank } from "./layouts/Blank";
import ProtectedRoute from "./components/wrapper/ProtectedRoute";
import { Provider } from "react-redux";
import store, { persistor } from "./redux/store";
import { PersistGate } from "redux-persist/integration/react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { InternalPortalI18nProvider } from "./contexts/InternalPortalI18nContext.jsx";


function App() {
  const location = useLocation();
  const isAuthPath =
    location.pathname.includes("auth") ||
    location.pathname.includes("error") ||
    location.pathname.includes("under-maintenance") ||
    location.pathname.includes("blank") ||
    location.pathname === "/"; // Root (PortalPage) is public/auth-like

  const isService = location.pathname === "/services";

  return (
    <>
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />

      <Provider store={store}>
        <PersistGate loading={null} persistor={persistor}>
          <InternalPortalI18nProvider>
            {isAuthPath ? (
              <AppRoutes>
                <Blank />
              </AppRoutes>
            ) : (
              <ProtectedRoute>
                <Layout isService={isService}>
                  <AppRoutes />
                </Layout>
              </ProtectedRoute>
            )}
          </InternalPortalI18nProvider>
        </PersistGate>
      </Provider>
    </>
  );
}

export default App;
