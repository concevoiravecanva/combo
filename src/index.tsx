import { AppUiProvider } from "@canva/app-ui-kit";
import { createRoot } from "react-dom/client";
import App from "./app"; // ✅ import corrigé
import "@canva/app-ui-kit/styles.css";
import { AppI18nProvider } from "@canva/app-i18n-kit";

const root = createRoot(document.getElementById("root") as Element);

// Note: Si vous avez besoin de gérer l'action 'edit_design:render',
// vous devrez installer et configurer le module approprié de Canva SDK

function render() {
  root.render(
    <AppI18nProvider>
      <AppUiProvider>
        <App />
      </AppUiProvider>
    </AppI18nProvider>
  );
}

render();

if (module.hot) {
  module.hot.accept("./app", render);
}
