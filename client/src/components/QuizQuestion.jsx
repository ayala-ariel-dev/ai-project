export default function QuizQuestion({ question, onAnswer }) {
  return (
    <div className="question">
      <p className="question-title">{question.question}</p>

      {question.options.map((opt) => (
        <label key={opt} className="option">
          <input
            type="radio"
            name={`q-${question.id}`}
            onChange={() => onAnswer(question.id, opt)}
          />
          {opt}
        </label>
      ))}
    </div>
  );
}
