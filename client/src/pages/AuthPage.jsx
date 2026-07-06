import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Card from "../components/Card";
import LanguageSwitcher from "../components/LanguageSwitcher";
import { useLanguage } from "../i18n/LanguageContext";
import { fetchCurrentUser, loginWithGoogleIdToken } from "../services/authApi";
import { getAccessToken } from "../services/authStorage";
import "../styles/authPage.css";

export default function AuthPage() {
  const [mode, setMode] = useState("login");
  const [error, setError] = useState("");
  const googleButtonRef = useRef(null);
  const navigate = useNavigate();
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const { language, t } = useLanguage();

  useEffect(() => {
    const token = getAccessToken();
    if (!token) return;

    fetchCurrentUser()
      .then(() => navigate("/", { replace: true }))
      .catch(() => {
        // If token is stale the auth page will keep showing sign-in.
      });
  }, [navigate]);

  useEffect(() => {
    if (!googleClientId) return;
    if (!window.google?.accounts?.id) return;
    if (!googleButtonRef.current) return;

    window.google.accounts.id.initialize({
      client_id: googleClientId,
      callback: async (response) => {
        try {
          await loginWithGoogleIdToken(response.credential);
          setError("");
          navigate("/", { replace: true });
        } catch (err) {
          console.error("Google auth failed:", err);
          setError(t.auth.failed);
        }
      },
    });

    googleButtonRef.current.innerHTML = "";
    window.google.accounts.id.renderButton(googleButtonRef.current, {
      theme: "outline",
      size: "large",
      shape: "pill",
      text: mode === "register" ? "signup_with" : "signin_with",
      locale: language,
      width: 280,
    });
  }, [googleClientId, language, mode, navigate, t.auth.failed]);

  return (
    <Card>
      <LanguageSwitcher />

      <h1 className="auth-title">{t.auth.title}</h1>
      <p className="auth-subtitle">{t.auth.subtitle}</p>

      <div className="auth-tabs">
        <button
          className={`auth-tab ${mode === "login" ? "active" : ""}`}
          onClick={() => setMode("login")}
        >
          {t.auth.login}
        </button>
        <button
          className={`auth-tab ${mode === "register" ? "active" : ""}`}
          onClick={() => setMode("register")}
        >
          {t.auth.register}
        </button>
      </div>

      <p className="auth-hint">
        {mode === "register"
          ? t.auth.registerHint
          : t.auth.loginHint}
      </p>

      {googleClientId ? (
        <div ref={googleButtonRef} className="google-auth-button" />
      ) : (
        <p className="auth-error">{t.auth.missingClientId}</p>
      )}

      {error ? <p className="auth-error">{error}</p> : null}
    </Card>
  );
}
