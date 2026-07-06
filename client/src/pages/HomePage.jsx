import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Card from "../components/Card";
import Textarea from "../components/Textarea";
import Button from "../components/Button";
import Loader from "../components/Loader";
import LanguageSwitcher from "../components/LanguageSwitcher";
import { useLanguage } from "../i18n/LanguageContext";
import { analyzeQuiz, startRolePlay } from "../services/studyApi";
import { logout } from "../services/authApi";
import { getCurrentUser } from "../services/authStorage";
import "../styles/homePage.css";

let pdfJsLoadPromise;
const MAX_ESTIMATED_INPUT_TOKENS = 30000;

const estimateInputTokens = (value) => {
  const normalizedText = value.trim();
  if (!normalizedText) return 0;

  return Math.ceil(normalizedText.length / 4);
};

const loadPdfJs = async () => {
  if (!pdfJsLoadPromise) {
    pdfJsLoadPromise = Promise.all([
      import("pdfjs-dist"),
      import("pdfjs-dist/build/pdf.worker.mjs?url"),
    ]).then(([pdfjsLib, pdfjsWorker]) => {
      pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker.default;
      return pdfjsLib;
    });
  }

  return pdfJsLoadPromise;
};

export default function HomePage() {
  const { language, t } = useLanguage();

  const [text, setText] = useState(() => localStorage.getItem("studyText") || "");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [loadingMessage, setLoadingMessage] = useState("");
  const [selectedFileName, setSelectedFileName] = useState(() => localStorage.getItem("studyFileName") || "");
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const currentUser = getCurrentUser();
  const displayName = currentUser?.name || currentUser?.email?.split("@")[0] || "";
  const estimatedTokens = estimateInputTokens(text);
  const tokenUsagePercent = Math.min(100, Math.round((estimatedTokens / MAX_ESTIMATED_INPUT_TOKENS) * 100));
  const tokenUsageLevel = tokenUsagePercent >= 85 ? "high" : tokenUsagePercent >= 60 ? "medium" : "low";
  const numberLocale = language === "he" ? "he-IL" : "en-US";
  const tokenUsageText = t.home.tokenUsageCount(
    estimatedTokens.toLocaleString(numberLocale),
    MAX_ESTIMATED_INPUT_TOKENS.toLocaleString(numberLocale)
  );

  const history = JSON.parse(localStorage.getItem("studyHistory") || "[]");
  const quizEntries = history.filter((item) => item.type === "multiple-choice" || item.type === "true-false");
  const avgScore = quizEntries.length
    ? Math.round((quizEntries.reduce((acc, item) => acc + (item.score / item.total), 0) / quizEntries.length) * 100)
    : 0;


  const handleChange = (newText) => {
    setText(newText);
    localStorage.setItem("studyText", newText);
    setError(""); 
  };

  const extractPdfText = async (file) => {
    const pdfjsLib = await loadPdfJs();
    const pdfData = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: pdfData }).promise;
    const pageTexts = [];

    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      const page = await pdf.getPage(pageNumber);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item) => item.str || "").join(" ");
      pageTexts.push(pageText);
    }

    return pageTexts.join("\n\n");
  };

  const handleSelectedFile = async (file) => {
    if (!file) return;

    try {
      const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
      const fileText = isPdf ? await extractPdfText(file) : await file.text();
      if (!fileText.trim()) {
        setError(isPdf ? t.home.pdfEmpty : t.home.fileEmpty);
        return;
      }

      setText(fileText);
      setSelectedFileName(file.name);
      localStorage.setItem("studyText", fileText);
      localStorage.setItem("studyFileName", file.name);
      setError("");
    } catch (err) {
      console.error("Failed to read file:", err);
      setError(t.home.readFileFailed);
    }
  };

  const handleFileUpload = async (event) => {
    await handleSelectedFile(event.target.files?.[0]);
    event.target.value = "";
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    setIsDraggingFile(true);
  };

  const handleDragLeave = (event) => {
    event.preventDefault();
    if (event.relatedTarget instanceof Node && event.currentTarget.contains(event.relatedTarget)) return;
    setIsDraggingFile(false);
  };

  const handleDrop = async (event) => {
    event.preventDefault();
    setIsDraggingFile(false);
    await handleSelectedFile(event.dataTransfer.files?.[0]);
  };

  const handleQuizClick = async (quizType) => {
    if (!text.trim()) {
      setError(t.home.textRequired);
      return;
    }

    setLoading(true);
    setLoadingMessage(quizType === "multiple-choice" ? t.home.generatingMc : t.home.generatingTf);
    setError("");
    try {
      const data = await analyzeQuiz(text, quizType, language);

      if (quizType === "multiple-choice") {
        navigate("/quiz", { state: { quizData: data } });
      } else if (quizType === "true-false") {
        navigate("/quiz-true-false", { state: { quizData: data } });
      }
    } catch (err) {
      console.error("Error calling analyzeQuiz:", err);
      const backendError = err?.response?.data?.error;
      setError(backendError || t.home.generateQuizFailed);
    } finally {
      setLoading(false);
      setLoadingMessage("");
    }
  };

  const handlePlayClick = async () => {
    if (!text.trim()) {
      setError(t.home.textRequired);
      return;
    }

    setLoading(true);
    setLoadingMessage(t.home.buildingRolePlay);
    setError("");
    try {
      const session = await startRolePlay(text, language);
      navigate("/role-play", { state: { session } });
    } catch (err) {
      console.error("Failed to start role play:", err);
      const backendError = err?.response?.data?.error;
      setError(backendError || t.home.rolePlayFailed);
    } finally {
      setLoading(false);
      setLoadingMessage("");
    }
  };


  const handleClearText = () => {
    setText("");
    setSelectedFileName("");
    localStorage.removeItem("studyText");
    localStorage.removeItem("studyFileName");
  };

  const handleLogout = () => {
    logout();
    navigate("/auth", { replace: true });
  };

  const handleUseSample = () => {
    setText(t.home.sampleText);
    setSelectedFileName("");
    localStorage.setItem("studyText", t.home.sampleText);
    localStorage.removeItem("studyFileName");
    setError("");
  };

  return (
    <Card>
      <LanguageSwitcher />

      <div className={`token-usage-meter token-usage-meter-${tokenUsageLevel}`} aria-label={t.home.tokenUsageLabel}>
        <div className="token-usage-row">
          <span>{t.home.tokenUsageLabel}</span>
          <strong>{tokenUsagePercent}%</strong>
        </div>
        <div className="token-usage-track" aria-hidden="true">
          <span style={{ width: `${tokenUsagePercent}%` }} />
        </div>
        <small>{tokenUsageText}</small>
      </div>

      <h1 className="home-title">{t.app.title}</h1>
      <h3 className="home-subtitle">{t.home.subtitle}</h3>
      <div className="home-user-actions">
        <button className="logout-btn" onClick={handleLogout}>{t.home.signOut}</button>
        {displayName ? <span className="home-greeting">{t.home.greeting(displayName)}</span> : null}
      </div>

      <div className="onboarding-box">
        <h4>{t.home.bestResultsTitle}</h4>
        <p>{t.home.bestResultsText}</p>
        <button className="sample-btn" onClick={handleUseSample}>{t.home.sampleButton}</button>
      </div>

      <div className="progress-box">
        <h4>{t.home.snapshotTitle}</h4>
        <p>{t.home.completedQuizzes}: {quizEntries.length}</p>
        <p>{t.home.averageAccuracy}: {avgScore}%</p>
      </div>

      <div
        className={`file-upload-box ${isDraggingFile ? "dragging" : ""}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <label className="file-upload-btn" htmlFor="study-file-upload">
          {t.home.uploadFile}
        </label>
        <input
          id="study-file-upload"
          className="file-upload-input"
          type="file"
          accept=".txt,.md,.markdown,.csv,.json,.rtf,.pdf,text/*,application/pdf"
          onChange={handleFileUpload}
        />
        <div className="file-upload-copy">
          <strong>{selectedFileName || t.home.dropTitle}</strong>
          <span>{selectedFileName ? t.home.uploadHint : t.home.dropHint}</span>
        </div>
      </div>

      {text ? (
        <div className="saved-text-box">
          <p>{text}</p>
          <button className="clear-text-btn" onClick={handleClearText}>
            ❌
          </button>
        </div>
      ) : (
        <Textarea value={text} onChange={handleChange} placeholder={t.home.textPlaceholder} />
      )}

      <div className="home-actions">
        <Button onClick={() => handleQuizClick("multiple-choice")}>
          {t.home.multipleChoice}
        </Button>
        <Button onClick={() => handleQuizClick("true-false")}>
          {t.home.trueFalse}
        </Button>
        <Button onClick={handlePlayClick}>
          {t.home.rolePlay}
        </Button>
      </div>

      {loading ? (
        <>
          <Loader />
          <p className="loader-message">{loadingMessage}</p>
        </>
      ) : error ? (
        <p className="error-message">{error}</p>
      ) : null}

    </Card>
  );
}
