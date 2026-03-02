import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import "./index.css";
import App from "./App.jsx";
import appStore from "./components/utils/appStore";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Provider store={appStore}>
      
        <App />
     
    </Provider>
  </StrictMode>,
);
