import { useLanguage } from "../i18n/LanguageContext";

export default function QuizProgress({ current, total }) {
  const { t } = useLanguage();

  return (
    <p className="progress">
      {t.quiz.progress(current, total)}
    </p>
  );
}
