import { useId, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { noAutocapitalize } from "@/lib/noAutocapitalize";

type Props = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  autoComplete?: string;
  /** Kasada kayıtlı sır var; alan boşken rozet gösterilir. */
  storedInVault?: boolean;
  multiline?: boolean;
  rows?: number;
};

export function SecretInput({
  label,
  value,
  onChange,
  placeholder,
  required,
  disabled,
  autoComplete,
  storedInVault = false,
  multiline = false,
  rows = 5,
}: Props) {
  const [visible, setVisible] = useState(false);
  const inputId = useId();
  const showStoredBadge = storedInVault && !value.trim();

  return (
    <label className="vault-field secret-input" htmlFor={inputId}>
      <span className="secret-input__label-row">
        <span>{label}</span>
        {showStoredBadge && (
          <span className="secret-input__badge" title="Parola şifreli kasada saklanıyor">
            Kasada kayıtlı
          </span>
        )}
      </span>

      <div className={`secret-input__wrap ${multiline ? "secret-input__wrap--area" : ""}`}>
        {multiline ? (
          <textarea
            id={inputId}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            required={required}
            disabled={disabled}
            rows={rows}
            placeholder={placeholder}
            className={visible ? "secret-input__revealed" : undefined}
            {...noAutocapitalize}
          />
        ) : (
          <input
            id={inputId}
            type={visible ? "text" : "password"}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            required={required}
            disabled={disabled}
            autoComplete={autoComplete}
            placeholder={placeholder}
            {...noAutocapitalize}
          />
        )}
        <button
          type="button"
          className="secret-input__toggle"
          onClick={() => setVisible((v) => !v)}
          disabled={disabled}
          aria-label={visible ? "Gizle" : "Göster"}
          aria-pressed={visible}
          tabIndex={-1}
        >
          <Icon name={visible ? "visibility_off" : "visibility"} size={18} />
        </button>
      </div>

      {showStoredBadge && (
        <p className="secret-input__hint">
          Güvenlik için kayıtlı parola burada gösterilmez. Değiştirmek için yeni parolayı yazın; boş
          bırakırsanız kasadaki parola kullanılmaya devam eder.
        </p>
      )}
    </label>
  );
}
