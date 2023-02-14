import React from "react";
import ReactDOM from "react-dom/client";
import "primereact/resources/themes/bootstrap4-dark-blue/theme.css"; //theme

import "primereact/resources/primereact.css"; //core css
import "primeicons/primeicons.css";
import '/node_modules/primeflex/primeflex.css'
import App from "./App";
import "./index.css";
import PrimeReact from "primereact/api";

PrimeReact.ripple = true;
PrimeReact.inputStyle = 'filled';
ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
