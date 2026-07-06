import "../styles/homePage.css";
import { useLanguage } from "../i18n/LanguageContext";

export default function Loader() {
  const { t } = useLanguage();

  return <p className="loader">{t.app.loading}</p>;
}
