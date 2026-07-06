import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import TrueFalseQuizPage from "../pages/TrueFalseQuizPage";

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

describe("TrueFalseQuizPage Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const sampleQuizData = {
    quiz: {
      questions: [
        { id: 1, statement: "The sky is blue", correct_answer: true },
        { id: 2, statement: "2 + 2 = 5", correct_answer: false },
      ],
    },
  };

  test("renders fallback when no quiz data", () => {
    render(
      <MemoryRouter>
        <TrueFalseQuizPage />
      </MemoryRouter>
    );

    expect(screen.getByText(/לא נמצאו נתוני שאלון/i)).toBeInTheDocument();
    fireEvent.click(screen.getByText(/חזרה/i));
    expect(mockNavigate).toHaveBeenCalledWith("/");
  });

  test("renders questions and answer buttons", () => {
    render(
      <MemoryRouter initialEntries={[{ state: { quizData: sampleQuizData } }]}>
        <TrueFalseQuizPage />
      </MemoryRouter>
    );

    expect(screen.getByText("שאלון נכון / לא נכון")).toBeInTheDocument();
    expect(screen.getByText("The sky is blue")).toBeInTheDocument();
    expect(screen.getByText("2 + 2 = 5")).toBeInTheDocument();

    // Check answer buttons
    expect(screen.getAllByText("✔️").length).toBe(2);
    expect(screen.getAllByText("❌").length).toBe(2);
  });

  test("shows warning if submit clicked without answering all questions", () => {
    render(
      <MemoryRouter initialEntries={[{ state: { quizData: sampleQuizData } }]}>
        <TrueFalseQuizPage />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText("שליחת שאלון"));
    expect(screen.getByText("צריך לענות על כל השאלות קודם")).toBeInTheDocument();
  });

  test("calculates score correctly after answering all questions", () => {
    render(
      <MemoryRouter initialEntries={[{ state: { quizData: sampleQuizData } }]}>
        <TrueFalseQuizPage />
      </MemoryRouter>
    );

    fireEvent.click(screen.getAllByText("✔️")[0]); // first question true
    fireEvent.click(screen.getAllByText("❌")[1]); // second question false

    fireEvent.click(screen.getByText("שליחת שאלון"));

    expect(screen.getByText("🏅 הציון שלך: 2 / 2")).toBeInTheDocument();
  });

  test("marks correct and wrong answers", () => {
    render(
      <MemoryRouter initialEntries={[{ state: { quizData: sampleQuizData } }]}>
        <TrueFalseQuizPage />
      </MemoryRouter>
    );

    fireEvent.click(screen.getAllByText("✔️")[0]); // correct
    fireEvent.click(screen.getAllByText("✔️")[1]); // wrong

    fireEvent.click(screen.getByText("שליחת שאלון"));

    expect(screen.getByText("🏅 הציון שלך: 1 / 2")).toBeInTheDocument();
  });

  test("back button navigates to home after submission", () => {
    render(
      <MemoryRouter initialEntries={[{ state: { quizData: sampleQuizData } }]}>
        <TrueFalseQuizPage />
      </MemoryRouter>
    );

    fireEvent.click(screen.getAllByText("✔️")[0]);
    fireEvent.click(screen.getAllByText("❌")[1]);
    fireEvent.click(screen.getByText("שליחת שאלון"));

    fireEvent.click(screen.getByText("חזרה לדף הבית"));
    expect(mockNavigate).toHaveBeenCalledWith("/");
  });
});
