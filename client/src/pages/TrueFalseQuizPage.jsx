// TrueFalseQuizPage.jsx
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Card from "../components/Card";
import Button from "../components/Button";
import { useLanguage } from "../i18n/LanguageContext";
import "../styles/trueFalseQuizPage.css";

export default function TrueFalseQuizPage() {
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

  const handleSelect = (questionId, value) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleSubmit = () => {
    let calculatedScore = 0;
    quizData.quiz.questions.forEach((q) => {
      if (answers[q.id] === q.correct_answer) calculatedScore++;
    });

    setScore(calculatedScore);
    setSubmitted(true);

    const history = JSON.parse(localStorage.getItem("studyHistory") || "[]");
    history.unshift({
      type: "true-false",
      score: calculatedScore,
      total: quizData.quiz.questions.length,
      createdAt: new Date().toISOString(),
    });
    localStorage.setItem("studyHistory", JSON.stringify(history.slice(0, 20)));
  };

  const handleSubmitClick = () => {
    if (Object.keys(answers).length !== quizData.quiz.questions.length) {
      setWarning(t.quiz.answerAll);
      return;
    }
    setWarning("");
    handleSubmit();
  };

  return (
    <Card>
      <h1 className="quiz-title">{t.quiz.trueFalseTitle}</h1>
      <h3 className="quiz-subtitle">{t.quiz.trueFalseSubtitle}</h3>

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
            <h3 className="question-text">{q.statement}</h3>

            <div className="answer-buttons">
              {[
                { label: "✔️", value: true },
                { label: "❌", value: false },
              ].map((btn) => {
                const isSelected = answers[q.id] === btn.value;

                return (
                  <button
                    key={btn.label}
                    onClick={() => handleSelect(q.id, btn.value)}
                    disabled={submitted}
                    className={`answer-btn ${isSelected ? "selected" : ""}`}
                  >
                    {btn.label}
                  </button>
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
