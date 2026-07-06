import QuizQuestion from "./QuizQuestion";

export default function QuizList({ questions, onAnswer }) {
  return questions.map((q) => (
    <QuizQuestion key={q.id} question={q} onAnswer={onAnswer} />
  ));
}
