import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import HomePage from "../pages/HomePage";
import * as api from "../services/studyApi";
import * as pdfjsLib from "pdfjs-dist";

// --- Mock navigate ---
const mockedNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockedNavigate,
}));

// --- Mock child components ---
jest.mock("../components/Card", () => ({ children }) => <div>{children}</div>);
jest.mock("../components/Textarea", () => ({ value, onChange }) => (
  <textarea value={value} onChange={(e) => onChange(e.target.value)} />
));
jest.mock("../components/Button", () => ({ children, onClick }) => (
  <button onClick={onClick}>{children}</button>
));
jest.mock("../components/Loader", () => () => <div>טוען...</div>);

// --- Mock the API module completely ---
jest.mock("../services/studyApi", () => ({
  analyzeQuiz: jest.fn(),
  startRolePlay: jest.fn(),
}));

jest.mock("../services/authApi", () => ({
  logout: jest.fn(),
}));

jest.mock("pdfjs-dist", () => ({
  GlobalWorkerOptions: {},
  getDocument: jest.fn(),
}));

jest.mock("pdfjs-dist/build/pdf.worker.mjs?url", () => "pdf-worker.js", { virtual: true });

describe("HomePage Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  test("renders title, subtitle, and textarea when no saved text", () => {
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    expect(screen.getByText(/עוזר הלמידה/i)).toBeInTheDocument();
    expect(screen.getByText(/לומדים חכם יותר/i)).toBeInTheDocument();
    expect(screen.getByRole("textbox")).toBeInTheDocument();
  });

  test("displays saved text from localStorage", () => {
    localStorage.setItem("studyText", "Saved Text");
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    expect(screen.getByText("Saved Text")).toBeInTheDocument();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  });

  test("handleClearText clears text and localStorage", () => {
    localStorage.setItem("studyText", "Saved Text");
    localStorage.setItem("studyFileName", "notes.txt");
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText("❌"));
    expect(localStorage.getItem("studyText")).toBeNull();
    expect(localStorage.getItem("studyFileName")).toBeNull();
    expect(screen.getByRole("textbox")).toBeInTheDocument();
  });

  test("loads text from an uploaded file", async () => {
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    const file = new File(["Uploaded notes"], "notes.txt", { type: "text/plain" });
    Object.defineProperty(file, "text", {
      value: jest.fn().mockResolvedValue("Uploaded notes"),
    });

    fireEvent.change(screen.getByLabelText("העלאת קובץ"), {
      target: { files: [file] },
    });

    expect(await screen.findByText("Uploaded notes")).toBeInTheDocument();
    expect(screen.getByText("notes.txt")).toBeInTheDocument();
    expect(localStorage.getItem("studyText")).toBe("Uploaded notes");
    expect(localStorage.getItem("studyFileName")).toBe("notes.txt");
  });

  test("loads text from a dropped file", async () => {
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    const file = new File(["Dropped notes"], "dropped.txt", { type: "text/plain" });
    Object.defineProperty(file, "text", {
      value: jest.fn().mockResolvedValue("Dropped notes"),
    });

    fireEvent.drop(screen.getByText("גררו לכאן קובץ").closest(".file-upload-box"), {
      dataTransfer: { files: [file] },
    });

    expect(await screen.findByText("Dropped notes")).toBeInTheDocument();
    expect(screen.getByText("dropped.txt")).toBeInTheDocument();
    expect(localStorage.getItem("studyText")).toBe("Dropped notes");
  });

  test("loads text from an uploaded PDF", async () => {
    pdfjsLib.getDocument.mockReturnValue({
      promise: Promise.resolve({
        numPages: 2,
        getPage: jest
          .fn()
          .mockResolvedValueOnce({
            getTextContent: jest.fn().mockResolvedValue({
              items: [{ str: "First" }, { str: "page" }],
            }),
          })
          .mockResolvedValueOnce({
            getTextContent: jest.fn().mockResolvedValue({
              items: [{ str: "Second" }, { str: "page" }],
            }),
          }),
      }),
    });

    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    const file = new File(["pdf data"], "lesson.pdf", { type: "application/pdf" });
    Object.defineProperty(file, "arrayBuffer", {
      value: jest.fn().mockResolvedValue(new ArrayBuffer(8)),
    });

    fireEvent.change(screen.getByLabelText("העלאת קובץ"), {
      target: { files: [file] },
    });

    expect(await screen.findByText(/First page/)).toBeInTheDocument();
    expect(screen.getByText(/Second page/)).toBeInTheDocument();
    expect(screen.getByText("lesson.pdf")).toBeInTheDocument();
    expect(localStorage.getItem("studyText")).toBe("First page\n\nSecond page");
  });

  test("shows error when uploaded file is empty", async () => {
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    const file = new File([""], "empty.txt", { type: "text/plain" });
    Object.defineProperty(file, "text", {
      value: jest.fn().mockResolvedValue("   "),
    });

    fireEvent.change(screen.getByLabelText("העלאת קובץ"), {
      target: { files: [file] },
    });

    expect(await screen.findByText("הקובץ שנבחר ריק")).toBeInTheDocument();
    expect(localStorage.getItem("studyText")).toBeNull();
  });

  test("shows error if quiz button clicked with empty text", async () => {
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText("שאלון אמריקאי"));
    expect(await screen.findByText("צריך להזין טקסט קודם")).toBeInTheDocument();
  });

  test("calls analyzeQuiz and navigates on Multiple Choice", async () => {
    api.analyzeQuiz.mockResolvedValue({ questions: [] });

    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByRole("textbox"), { target: { value: "Test" } });
    fireEvent.click(screen.getByText("שאלון אמריקאי"));

    expect(screen.getByText(/טוען/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(api.analyzeQuiz).toHaveBeenCalledWith("Test", "multiple-choice", "he");
      expect(mockedNavigate).toHaveBeenCalledWith("/quiz", { state: { quizData: { questions: [] } } });
    });
  });

  test("shows error on failed API call", async () => {
    api.analyzeQuiz.mockRejectedValue(new Error("API Error"));

    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByRole("textbox"), { target: { value: "Test" } });
    fireEvent.click(screen.getByText("שאלון אמריקאי"));

    expect(screen.getByText(/טוען/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("לא הצלחנו ליצור שאלון. נסו שוב.")).toBeInTheDocument();
    });
  });

  test("calls startRolePlay and navigates", async () => {
    api.startRolePlay.mockResolvedValue({ sessionId: 123 });

    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByRole("textbox"), { target: { value: "Roleplay text" } });
    fireEvent.click(screen.getByText("משחק תפקידים"));

    await waitFor(() => {
      expect(api.startRolePlay).toHaveBeenCalledWith("Roleplay text", "he");
      expect(mockedNavigate).toHaveBeenCalledWith("/role-play", { state: { session: { sessionId: 123 } } });
    });
  });
});
