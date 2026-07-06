import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import QuizPage from "../pages/QuizPage";

// Mock child components
jest.mock("../components/Card", () => ({ children }) => <div>{children}</div>);
jest.mock("../components/Button", () => ({ children, onClick }) => (
  <button onClick={onClick}>{children}</button>
));

const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => {
  const originalModule = jest.requireActual("react-router-dom");
  return {
    ...originalModule,
    useNavigate: () => mockNavigate,
  };
});

describe("QuizPage Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const sampleQuizData = {
    quiz: {
      questions: [
        {
          id: 1,
          question: "What is 2+2?",
          options: ["3", "4", "5"],
          correct_answer: "4",
        },
        {
          id: 2,
          question: "Capital of France?",
          options: ["London", "Paris", "Rome"],
          correct_answer: "Paris",
        },
      ],
    },
  };

  test("renders fallback when no quiz data", () => {
    render(
      <MemoryRouter>
        <QuizPage />
      </MemoryRouter>
    );

    expect(screen.getByText(/לא נמצאו נתוני שאלון/i)).toBeInTheDocument();
    fireEvent.click(screen.getByText(/חזרה/i));
    expect(mockNavigate).toHaveBeenCalledWith("/");
  });

  test("renders quiz questions and options", () => {
    render(
      <MemoryRouter initialEntries={[{ state: { quizData: sampleQuizData } }]}>
        <QuizPage />
      </MemoryRouter>
    );

    expect(screen.getByText("שאלון אמריקאי")).toBeInTheDocument();
    expect(screen.getByText("What is 2+2?")).toBeInTheDocument();
    expect(screen.getByText("Capital of France?")).toBeInTheDocument();

    sampleQuizData.quiz.questions.forEach((q) => {
      q.options.forEach((option) => {
        expect(screen.getByLabelText(option)).toBeInTheDocument();
      });
    });
  });

  test("shows warning if submit clicked without answering all questions", () => {
    render(
      <MemoryRouter initialEntries={[{ state: { quizData: sampleQuizData } }]}>
        <QuizPage />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText("שליחת שאלון"));
    expect(screen.getByText("צריך לענות על כל השאלות קודם")).toBeInTheDocument();
  });

  test("calculates score correctly after answering all questions", () => {
    render(
      <MemoryRouter initialEntries={[{ state: { quizData: sampleQuizData } }]}>
        <QuizPage />
      </MemoryRouter>
    );

    // Select correct answers
    fireEvent.click(screen.getByLabelText("4"));
    fireEvent.click(screen.getByLabelText("Paris"));

    fireEvent.click(screen.getByText("שליחת שאלון"));

    expect(screen.getByText("🏅 הציון שלך: 2 / 2")).toBeInTheDocument();
  });

  test("marks correct and wrong answers after submission", () => {
    render(
      <MemoryRouter initialEntries={[{ state: { quizData: sampleQuizData } }]}>
        <QuizPage />
      </MemoryRouter>
    );

    // Select one correct, one wrong
    fireEvent.click(screen.getByLabelText("4"));
    fireEvent.click(screen.getByLabelText("London"));

    fireEvent.click(screen.getByText("שליחת שאלון"));

    // Check score
    expect(screen.getByText("🏅 הציון שלך: 1 / 2")).toBeInTheDocument();
  });

  test("back button navigates to home after submission", () => {
    render(
      <MemoryRouter initialEntries={[{ state: { quizData: sampleQuizData } }]}>
        <QuizPage />
      </MemoryRouter>
    );

    // Select answers
    fireEvent.click(screen.getByLabelText("4"));
    fireEvent.click(screen.getByLabelText("Paris"));
    fireEvent.click(screen.getByText("שליחת שאלון"));

    fireEvent.click(screen.getByText("חזרה לדף הבית"));
    expect(mockNavigate).toHaveBeenCalledWith("/");
  });
});
