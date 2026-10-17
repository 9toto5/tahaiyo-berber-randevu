import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  Check,
  LockKeyhole,
  Mail,
  Scissors,
  UserRound,
  X,
} from "lucide-react";
import { useSalon } from "../store";

export default function LoginModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: (role: "staff" | "customer") => void;
}) {
  const { state, login } = useSalon();
  const [role, setRole] = useState<"customer" | "staff">("customer");
  const [email, setEmail] = useState("deniz@boss.demo");
  const [password, setPassword] = useState("boss123");
  const [error, setError] = useState("");
  const dialog = useRef<HTMLDivElement>(null);
  const accounts = state.users.filter((account) => account.role === role);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialog.current?.focus();
    const keyHandler = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "Tab") {
        const focusable = dialog.current?.querySelectorAll<HTMLElement>(
          'button, input, [tabindex="0"]',
        );
        if (!focusable?.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (
          event.shiftKey &&
          (document.activeElement === first ||
            document.activeElement === dialog.current)
        ) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", keyHandler);
    return () => {
      document.body.style.overflow = originalOverflow;
      document.removeEventListener("keydown", keyHandler);
      previous?.focus();
    };
  }, [onClose]);
  function changeRole(next: "staff" | "customer") {
    setRole(next);
    setError("");
    setEmail(next === "staff" ? "emre@boss.demo" : "deniz@boss.demo");
    setPassword("boss123");
  }
  return (
    <div
      className="modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        className="login-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="login-title"
        tabIndex={-1}
        ref={dialog}
      >
        <button
          className="icon-button modal-close"
          onClick={onClose}
          aria-label="Giriş penceresini kapat"
        >
          <X size={21} />
        </button>
        <div className="login-emblem">
          <Scissors size={27} />
        </div>
        <p className="eyebrow">BOSS'A HOŞ GELDİN</p>
        <h2 id="login-title">Kendine bir zaman ayır.</h2>
        <p className="muted">Randevuların ve sana özel alanın burada.</p>
        <div className="login-tabs" aria-label="Hesap türü">
          <button
            className={role === "customer" ? "active" : ""}
            onClick={() => changeRole("customer")}
          >
            <UserRound size={16} /> Müşteri girişi
          </button>
          <button
            className={role === "staff" ? "active" : ""}
            onClick={() => changeRole("staff")}
          >
            <Scissors size={16} /> Personel girişi
          </button>
        </div>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (login(email.trim(), password)) {
              onSuccess(
                state.users.find(
                  (account) =>
                    account.email.toLowerCase() === email.trim().toLowerCase(),
                )!.role,
              );
            } else
              setError(
                "E-posta veya parola hatalı. Test hesaplarından birini seçebilirsin.",
              );
          }}
        >
          <label className="form-field">
            E-posta adresi
            <div className="input-with-icon">
              <Mail size={17} />
              <input
                type="email"
                autoComplete="username"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>
          </label>
          <label className="form-field">
            Parola
            <div className="input-with-icon">
              <LockKeyhole size={17} />
              <input
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </div>
          </label>
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <button className="button button-dark login-submit" type="submit">
            Giriş yap <ArrowRight size={18} />
          </button>
        </form>
        <div className="demo-accounts">
          <div className="demo-accounts-title">
            <span>Bir test hesabı seç</span>
            <span>
              Parola: <strong>boss123</strong>
            </span>
          </div>
          <div className="demo-account-list">
            {accounts.map((account) => (
              <button
                key={account.id}
                className={email === account.email ? "selected" : ""}
                onClick={() => {
                  setEmail(account.email);
                  setPassword("boss123");
                  setError("");
                }}
              >
                <span className="small-avatar">
                  {account.name
                    .split(" ")
                    .map((word) => word[0])
                    .slice(0, 2)
                    .join("")}
                </span>
                <span>
                  <strong>{account.name}</strong>
                  <small>{account.email}</small>
                </span>
                {email === account.email && <Check size={16} />}
              </button>
            ))}
          </div>
          <p className="demo-explanation">
            Bu bir demo ortamıdır. Hesaplar örnektir; değişiklikler yalnızca bu
            tarayıcıda saklanır.
          </p>
        </div>
      </div>
    </div>
  );
}
