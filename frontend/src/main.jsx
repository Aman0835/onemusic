import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { PersistGate } from "redux-persist/integration/react";
import "./index.css";
import App from "./App.jsx";
import appStore from "./components/utils/appStore";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Provider store={appStore}>
      <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
        <App />
      </GoogleOAuthProvider>
    </Provider>
  </StrictMode>,
);
