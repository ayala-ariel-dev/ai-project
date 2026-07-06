import { useLanguage } from "../i18n/LanguageContext";

export function Header() {
  const { t } = useLanguage();

  return <header className="header">{t.app.smartTitle}</header>;
}
