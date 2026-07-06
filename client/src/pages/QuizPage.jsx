import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Card from "../components/Card";
import Button from "../components/Button";
import { useLanguage } from "../i18n/LanguageContext";
import "../styles/quizPage.css";

export default function QuizPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const quizData = location.state?.quizData;
  const { t } = useLanguage();

  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [warning, setWarning] = useState("");

  if (!quizData) {
    return (
      <Card>
        <h2 className="quiz-title">{t.quiz.noData}</h2>
        <Button onClick={() => navigate("/")}>{t.quiz.back}</Button>
      </Card>
    );
  }

  const handleSubmitQuiz = () => {
    let calculatedScore = 0;

    quizData.quiz.questions.forEach((q) => {
      if (answers[q.id] === q.correct_answer) {
        calculatedScore++;
      }
    });

    setScore(calculatedScore);
    setSubmitted(true);

    const history = JSON.parse(localStorage.getItem("studyHistory") || "[]");
    history.unshift({
      type: "multiple-choice",
      score: calculatedScore,
      total: quizData.quiz.questions.length,
      createdAt: new Date().toISOString(),
    });
    localStorage.setItem("studyHistory", JSON.stringify(history.slice(0, 20)));
  };

  const handleSubmitClick = () => {
    const allAnswered = quizData.quiz.questions.every(
      (q) => answers[q.id] !== undefined
    );

    if (!allAnswered) {
      setWarning(t.quiz.answerAll);
      return;
    }

    setWarning("");
    handleSubmitQuiz();
  };

  return (
    <Card>
      <h1 className="quiz-title">{t.quiz.multipleChoiceTitle}</h1>
      <h3 className="quiz-subtitle">{t.quiz.multipleChoiceSubtitle}</h3>

      {quizData.quiz.questions.map((q) => {
        let questionClass = "question-card";
        if (submitted) {
          questionClass +=
            answers[q.id] === q.correct_answer
              ? " correct"
              : " incorrect";
        }

        return (
          <div key={q.id} className={questionClass}>
            <h3 className="question-text">{q.question}</h3>

            <div className="options-list">
              {q.options.map((option, idx) => {
                let optionClass = "option-label";

                if (submitted) {
                  if (option === q.correct_answer) optionClass += " correct-option";
                  else if (answers[q.id] === option) optionClass += " wrong-option";
                }

                return (
                  <label key={idx} className={optionClass}>
                    <input
                      type="radio"
                      name={`question-${q.id}`}
                      value={option}
                      checked={answers[q.id] === option}
                      onChange={() =>
                        setAnswers((prev) => ({ ...prev, [q.id]: option }))
                      }
                      disabled={submitted}
                    />
                    <span>{option}</span>
                  </label>
                );
              })}
            </div>
          </div>
        );
      })}

      {warning && <div className="warning-text">{warning}</div>}

      {!submitted ? (
        <Button onClick={handleSubmitClick}>{t.quiz.submit}</Button>
      ) : (
        <div className="score-box">
          <h2>
            🏅 {t.quiz.score}: {score} / {quizData.quiz.questions.length}
          </h2>
          <Button onClick={() => navigate("/")}>{t.quiz.backHome}</Button>
        </div>
      )}
    </Card>
  );
}
