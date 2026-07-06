import { useLanguage } from "../i18n/LanguageContext";
import "../styles/languageSwitcher.css";

export default function LanguageSwitcher() {
  const { language, languages, setLanguage, t } = useLanguage();
  const languageOrder = ["en", "he"];

  return (
    <div className="language-switcher" aria-label={t.language.label}>
      <div className="language-switcher-options">
        {languageOrder.map((code) => {
          const option = languages[code];
          return (
          <button
            key={option.code}
            type="button"
            className={`language-switcher-btn ${language === option.code ? "active" : ""}`}
            onClick={() => setLanguage(option.code)}
          >
            {option.label}
          </button>
          );
        })}
      </div>
    </div>
  );
}
