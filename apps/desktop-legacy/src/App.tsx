import { I18nProvider } from "@/components/i18n/I18nProvider";
import { VaultGate } from "@/components/vault/VaultGate";

export default function App() {
  return (
    <I18nProvider>
      <VaultGate />
    </I18nProvider>
  );
}
