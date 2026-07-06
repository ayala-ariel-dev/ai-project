import { useLocation } from "react-router-dom";
import { useLanguage } from "../i18n/LanguageContext";

export default function ResultPage() {
  const { state } = useLocation();
  const { t } = useLanguage();

  return (
    <div>
      <h2>{t.result.title}</h2>
      <pre>{JSON.stringify(state, null, 2)}</pre>
    </div>
  );
}
