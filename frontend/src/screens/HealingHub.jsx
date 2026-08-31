import React, { useEffect, useState } from "react";
import SectionHeading from "../components/SectionHeading.jsx";
import { apiRequest } from "../utils/api.js";
import { useLanguage } from "../utils/language.jsx";

const phases = ["Inhale", "Hold", "Exhale", "Rest"];
const defaultExercises = [
  {
    title: "Inhale and exhale",
    type: "breathing",
    body: "Use this when your body feels tense, shaky, panicked, numb, or too full. Breathe with the circle for a few rounds, then stop whenever you want.",
    steps: ["Sit or stand in a position that feels steady.", "Click Start and follow the words in the circle.", "Let your shoulders drop a little when you exhale.", "Stop if the rhythm does not feel helpful."],
  },
  {
    title: "5-4-3-2-1 grounding",
    type: "checklist",
    body: "Use this when memories, worry, or fear pull you away from the present moment. It gently brings attention back to the room you are in.",
    steps: ["Name five things you can see.", "Name four things you can feel.", "Name three things you can hear.", "Name two things you can smell.", "Name one kind thing about yourself."],
  },
  {
    title: "Release body tension",
    type: "checklist",
    body: "Use this when your jaw, hands, shoulders, or stomach feel tight. The aim is not to force calm, but to tell your body it can soften a little.",
    steps: ["Press your feet into the floor for three seconds, then release.", "Squeeze your hands gently, then open them.", "Lift your shoulders toward your ears, then let them drop.", "Unclench your jaw and rest your tongue.", "Take one slow breath before moving on."],
  },
  {
    title: "Safe-place visualization",
    type: "reflection",
    body: "Use this when you need a mental place to pause. Choose a real or imagined place that feels calm, private, and safe enough for this moment.",
    steps: ["Picture the place in your mind.", "Notice the colors, sounds, temperature, and textures.", "Imagine one thing there that helps you feel protected.", "Write a short sentence you can repeat when you need to return to it."],
  },
  {
    title: "Before disclosure",
    type: "reflection",
    body: "Use this before telling someone something hard. It helps you decide what support you want before the conversation starts.",
    steps: ["Choose who feels safest to talk to.", "Decide what you want: listening, help, privacy, company, or practical action.", "Write one sentence you can start with.", "Plan what you will do afterward to feel steady."],
  },
];

export default function HealingHub() {
  const { isFrench } = useLanguage();
  const [running, setRunning] = useState(false);
  const [phase, setPhase] = useState(0);
  const [exercises, setExercises] = useState(defaultExercises);
  const [activeIndex, setActiveIndex] = useState(0);
  const activeExercise = exercises[activeIndex] || defaultExercises[0];
  const label = running ? phases[phase % phases.length] : "Inhale";

  useEffect(() => {
    apiRequest("/api/healing/tools")
      .then((data) => {
        if (Array.isArray(data.tools) && data.tools.length) {
          setExercises(data.tools);
        }
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    setRunning(false);
    setPhase(0);
  }, [activeIndex]);

  useEffect(() => {
    if (!running) return undefined;
    const timer = window.setInterval(() => setPhase((value) => value + 1), 4000);
    return () => window.clearInterval(timer);
  }, [running]);

  useEffect(() => {
    if (!running || !("speechSynthesis" in window)) return undefined;
    window.speechSynthesis.cancel();
    const message = new SpeechSynthesisUtterance(label);
    message.rate = 0.82;
    message.pitch = 0.92;
    message.volume = 0.72;
    window.speechSynthesis.speak(message);
    return () => window.speechSynthesis.cancel();
  }, [label, running]);

  return (
    <section id="healing" className="app-section" aria-labelledby="healing-title">
      <SectionHeading eyebrow={isFrench ? "Soutien" : "Healing hub"} title={isFrench ? "Petits outils pour se calmer." : "Small tools for a steady moment."}>
        {isFrench ? "Choisissez un exercice simple. Vous pouvez arreter ou changer quand vous voulez." : "Choose a practical exercise. The selected exercise opens on the left, and you can stop or switch whenever you want."}
      </SectionHeading>
      <div className="healing-layout">
        <article className="breathing-tool active-exercise" aria-labelledby="active-exercise-title">
          <p className="eyebrow">{isFrench ? "Exercice choisi" : "Selected exercise"}</p>
          <h3 id="active-exercise-title">{activeExercise.title}</h3>
          <p className="exercise-description">{activeExercise.body}</p>

          {activeExercise.type === "breathing" ? (
            <>
              <div className={`breath-circle ${label === "Inhale" || label === "Hold" ? "expand" : ""}`}>{label}</div>
              <div className="tool-row breath-actions">
                <button className="button primary" type="button" onClick={() => setRunning((value) => !value)}>{running ? (isFrench ? "Arreter" : "Stop") : (isFrench ? "Commencer" : "Start")}</button>
                <button className="button secondary" type="button" onClick={() => { setRunning(false); setPhase(0); }}>{isFrench ? "Reprendre" : "Reset"}</button>
              </div>
            </>
          ) : (
            <div className="active-steps">
              {activeExercise.steps.map((step) => (
                <label key={step}>
                  <input type="checkbox" />
                  <span>{step}</span>
                </label>
              ))}
              {activeExercise.type === "reflection" && (
                <textarea placeholder={isFrench ? "Ecrivez une note privee. Ce n'est pas sauvegarde." : "Write a private note for this exercise. This is not saved."} />
              )}
            </div>
          )}
        </article>
        <div className="resource-cards exercise-list" aria-label="Healing exercises">
          {exercises.map((exercise, index) => (
            <button
              className={`exercise-card ${activeIndex === index ? "active" : ""}`}
              key={exercise.title}
              type="button"
              onClick={() => setActiveIndex(index)}
            >
              <span>{exercise.type === "breathing" ? "Breathing" : exercise.type === "reflection" ? "Reflection" : "Grounding"}</span>
              <strong>{exercise.title}</strong>
              <small>{exercise.body}</small>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
