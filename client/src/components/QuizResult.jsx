import { useLanguage } from "../i18n/LanguageContext";
import Card from "./Card";

export default function QuizResult({ result }) {
  const { t } = useLanguage();

  return (
    <Card>
      <h2>{t.quiz.score}: {result.score}%</h2>

      {result.details.map((d) => (
        <p key={d.id} className={d.correct ? "correct" : "wrong"}>
          {d.correct ? "✅" : "❌"} {d.question}
        </p>
      ))}
    </Card>
  );
}
