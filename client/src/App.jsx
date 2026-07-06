import { BrowserRouter, Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import QuizPage from "./pages/QuizPage";
import TrueFalseQuizPage from "./pages/TrueFalseQuizPage"; 
import ResultPage from "./pages/ResultPage";
import RolePlayPage from "./pages/RolePlayPage"; 
import ProtectedRoute from "./components/ProtectedRoute";
import AuthPage from "./pages/AuthPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/auth" element={<AuthPage />} />
        <Route
          path="/"
          element={(
            <ProtectedRoute>
              <HomePage />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/quiz"
          element={(
            <ProtectedRoute>
              <QuizPage />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/quiz-true-false"
          element={(
            <ProtectedRoute>
              <TrueFalseQuizPage />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/role-play"
          element={(
            <ProtectedRoute>
              <RolePlayPage />
            </ProtectedRoute>
          )}
        /> 
        <Route
          path="/result"
          element={(
            <ProtectedRoute>
              <ResultPage />
            </ProtectedRoute>
          )}
        />
        <Route path="*" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  );
}