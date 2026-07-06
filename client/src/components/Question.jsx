export default function Question({ question, selectedAnswer, onSelect }) {
  if (!question) return null;

  return (
    <div className="question-card">
      <h3>{question.question}</h3>

      {question.options.map((option, idx) => (
        <label key={idx} style={{ display: "block", marginBottom: "8px" }}>
          <input
            type="radio"
            name={`question-${question.id}`}
            value={option}
            checked={selectedAnswer === option}
            onChange={() => onSelect(option)}
          />
          {" "}
          {option}
        </label>
      ))}
    </div>
  );
}
