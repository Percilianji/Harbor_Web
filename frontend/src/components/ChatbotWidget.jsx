import React, { useState } from "react";
import { apiRequest } from "../utils/api.js";

const ageOptions = ["General", "Children 6-9", "Preteens 10-12", "Teens 13-17", "Young adults 18+", "Parents & guardians", "Educators"];
const topicOptions = ["Awareness", "Consent", "Personal safety", "Digital safety", "Healthy relationships", "Getting help", "Community safety"];

export default function ChatbotWidget() {
  const [chatInput, setChatInput] = useState("");
  const [chatAge, setChatAge] = useState("General");
  const [chatTopic, setChatTopic] = useState("Awareness");
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Hi, I am Ask Harbor. Ask me about consent, boundaries, online safety, or getting help." },
  ]);
  const [chatOpen, setChatOpen] = useState(false);
  const [sending, setSending] = useState(false);

  const sendMessage = (event) => {
    event.preventDefault();
    const text = chatInput.trim();
    if (!text || sending) return;

    const nextMessages = [...messages, { role: "user", content: text }];
    setMessages(nextMessages);
    setChatInput("");
    setSending(true);

    apiRequest("/api/chatbot", {
      method: "POST",
      body: JSON.stringify({
        message: text,
        ageGroup: chatAge,
        topic: chatTopic,
        history: nextMessages,
      }),
    })
      .then((data) => {
        const suffix = data.mode === "fallback" && data.reason ? ` (${data.reason.replaceAll("_", " ")})` : "";
        const prefix = data.mode === "fallback" ? `Local guidance${suffix}: ` : "";
        const debug = data.mode === "fallback" && data.error ? `\n\nDebug: ${data.error}` : "";
        setMessages((current) => [...current, { role: "assistant", content: `${prefix}${data.reply}${debug}` }]);
      })
      .catch(() => {
        setMessages((current) => [...current, {
          role: "assistant",
          content: "I could not reach Ask Harbor right now. If this is urgent or unsafe, contact a trusted adult, local emergency service, or support hotline.",
        }]);
      })
      .finally(() => setSending(false));
  };

  return (
    <>
      <button
        className={`chatbot-launcher ${chatOpen ? "active" : ""}`}
        type="button"
        aria-label={chatOpen ? "Close Ask Harbor chatbot" : "Open Ask Harbor chatbot"}
        aria-expanded={chatOpen}
        aria-controls="ask-harbor-chat"
        onClick={() => setChatOpen((value) => !value)}
      >
        <span className="chat-icon" aria-hidden="true">
          <span />
          <span />
          <span />
        </span>
        <span className="sr-only">Ask Harbor</span>
      </button>

      {chatOpen && (
        <section id="ask-harbor-chat" className="chatbot-panel" aria-labelledby="ask-harbor-title">
          <div className="chatbot-panel-head">
            <div>
              <p className="eyebrow">Ask Harbor</p>
              <h2 id="ask-harbor-title">Awareness chat</h2>
            </div>
            <button className="chatbot-close" type="button" aria-label="Close Ask Harbor chatbot" onClick={() => setChatOpen(false)}>x</button>
          </div>
          <p className="chatbot-intro">Ask general questions about safety, consent, boundaries, online pressure, or how to seek support.</p>
          <div className="chatbot-shell">
            <div className="chatbot-controls">
              <label>
                Age context
                <select value={chatAge} onChange={(event) => setChatAge(event.target.value)}>
                  {ageOptions.map((item) => <option key={item}>{item}</option>)}
                </select>
              </label>
              <label>
                Topic context
                <select value={chatTopic} onChange={(event) => setChatTopic(event.target.value)}>
                  {topicOptions.map((item) => <option key={item}>{item}</option>)}
                </select>
              </label>
            </div>
            <div className="chatbot-messages" aria-live="polite">
              {messages.map((message, index) => (
                <div className={`chat-message ${message.role}`} key={`${message.role}-${index}`}>
                  {message.content}
                </div>
              ))}
            </div>
            <form className="chatbot-form" onSubmit={sendMessage}>
              <label className="sr-only" htmlFor="ask-harbor-message">Message Ask Harbor</label>
              <input
                id="ask-harbor-message"
                value={chatInput}
                onChange={(event) => setChatInput(event.target.value)}
                placeholder="Ask a question about boundaries, consent, or safety"
              />
              <button className="button primary" type="submit" disabled={sending}>{sending ? "Sending" : "Send"}</button>
            </form>
          </div>
        </section>
      )}
    </>
  );
}
