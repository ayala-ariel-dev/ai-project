
import { useNavigate, useLocation } from "react-router-dom";
import Card from "../components/Card";
import Button from "../components/Button";
import { useState, useEffect, useRef } from "react";
import { sendRolePlayMessage, getRolePlayFeedback } from "../services/studyApi";
import { useLanguage } from "../i18n/LanguageContext";
import "../styles/rolePlayPage.css";
import dingSound from "../assets/ding.mp3";
// import ReactMarkdown from "react-markdown";

export default function RolePlayPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const { session } = location.state || {};
    const { t } = useLanguage();

    const storageKey = `rolePlay_${session?.id}`; 

    const [messages, setMessages] = useState(() => {
        const saved = localStorage.getItem(storageKey);
        return saved ? JSON.parse(saved) : (session?.messages || [{ role: "A", text: t.rolePlay.initialMessage }]);
    });

    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [typing, setTyping] = useState(false);
    const [feedback, setFeedback] = useState(null);
    const [feedbackLoading, setFeedbackLoading] = useState(false);

    const messagesEndRef = useRef(null);

    // שמירת ההודעות בכל שינוי
    useEffect(() => {
        localStorage.setItem(storageKey, JSON.stringify(messages));
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim()) return;
        setLoading(true);
        setTyping(true);

        try {
            const userMessage = { role: "B", text: input };
            setMessages((prev) => [...prev, userMessage]);
            setInput("");

            const reply = await sendRolePlayMessage(session.id, userMessage.text);

            if (reply.role === "A") {
                const audio = new Audio(dingSound);
                audio.play();
            }

            setMessages((prev) => [...prev, reply]);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
            setTyping(false);
        }
    };

    const handleBackHome = () => {
        localStorage.removeItem(storageKey);
        navigate("/");
    };

    const handleGetFeedback = async () => {
        if (!session?.id) return;
        setFeedbackLoading(true);
        try {
            const data = await getRolePlayFeedback(session.id);
            setFeedback(data);

            const history = JSON.parse(localStorage.getItem("studyHistory") || "[]");
            history.unshift({
                type: "role-play",
                understanding: data?.understanding || t.rolePlay.unknown,
                createdAt: new Date().toISOString(),
            });
            localStorage.setItem("studyHistory", JSON.stringify(history.slice(0, 20)));
        } catch (err) {
            console.error("Error fetching feedback:", err);
            setFeedback({ error: t.rolePlay.feedbackFailed });
        } finally {
            setFeedbackLoading(false);
        }
    };

    const handleClearConversation = () => {
        setMessages([]);
        setFeedbackLoading(false);
        localStorage.removeItem(storageKey);
    };

    const getRoleName = (role) => {
        if (!session?.roles) return role;
        return role === "A" ? session.roles.A : session.roles.B;
    };

    return (
        <Card>
            <h1 className="quiz-title">{t.rolePlay.title}</h1>
            <h3 className="quiz-subtitle">{t.rolePlay.subtitle}</h3>

            <div className="chat-box">
                {messages.map((m, idx) => (
                    <div
                        key={idx}
                        className={`chat-message ${m.role === "A" ? "role-a" : "role-b"}`}
                    >
                        <strong className="chat-role">{getRoleName(m.role)}:</strong>{" "}
                        <div className="chat-text">
                            {/* <ReactMarkdown>{m.text}</ReactMarkdown> */}
                            <p>{m.text}</p>
                        </div>
                    </div>
                ))}
                {typing && (
                    <div className="chat-message role-a typing">
                        <strong className="chat-role">{getRoleName("A")}:</strong>{" "}
                        <span className="chat-text">{t.rolePlay.typing}</span>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            <div className="chat-user-label">
                <strong>{session?.roles?.B || t.rolePlay.userFallback}:</strong>
            </div>

            <div className="chat-input-row">
                <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleSend();
                        }
                    }}
                    disabled={loading}
                    placeholder={t.rolePlay.inputPlaceholder}
                    className="chat-input"
                />
                <Button onClick={handleSend} disabled={loading || !input.trim()}>
                    {t.rolePlay.send}
                </Button>
            </div>

            <div className="chat-footer">
                <button onClick={handleBackHome} className="back-btn">➡️</button>
                <Button onClick={handleGetFeedback} disabled={feedbackLoading}>
                    {feedbackLoading ? t.rolePlay.loadingFeedback : t.rolePlay.getFeedback}
                </Button>
                <Button onClick={handleClearConversation}>{t.rolePlay.clearConversation}</Button>
            </div>

            {feedback && (
                <div className="feedback-box">
                    <h3>{t.rolePlay.feedbackTitle}</h3>
                    {feedback.error ? (
                        <p>{feedback.error}</p>
                    ) : (
                        <>
                            <p><strong>{t.rolePlay.understanding}:</strong> {feedback.understanding}</p>
                            <p><strong>{t.rolePlay.comments}:</strong> {feedback.comments}</p>
                        </>
                    )}
                </div>
            )}
        </Card>
    );
}
