import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { initI18n } from "@/i18n";
import { resolveInitialLocale } from "@/i18n/locale";
import { DEFAULT_THEME_ID } from "@/lib/themes";

document.documentElement.dataset.theme = DEFAULT_THEME_ID;
document.documentElement.classList.add("termsh-native-glass");

initI18n(resolveInitialLocale());

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
