"use client";

import { useState, useEffect } from "react";
import { X, ChevronRight, ChevronLeft, Zap, Gift, Trophy, TrendingUp } from "lucide-react";

const STORAGE_KEY = "sharpbet_onboarding_done";

const steps = [
  {
    icon: "🎉",
    title: "Bienvenido a SharpBet",
    description: "Predice resultados deportivos, compite con otros usuarios y gana premios reales. Todo con puntos virtuales.",
    highlight: "Tienes 1.000 puntos para empezar",
    highlightColor: "text-accent",
    detail: "Usa tus puntos para predecir resultados deportivos y compite con otros usuarios en la clasificación.",
    visual: (
      <div className="flex items-center justify-center gap-4 py-2">
        {["⚽", "🏀", "🎾", "⚾"].map((icon, i) => (
          <span key={i} className="text-3xl opacity-80">{icon}</span>
        ))}
      </div>
    ),
  },
  {
    icon: "🎯",
    title: "Haz tus predicciones",
    description: "Elige un evento deportivo, selecciona quién gana y apuesta los puntos que quieras.",
    highlight: "Si aciertas, multiplicas tus puntos",
    highlightColor: "text-win",
    detail: "Las cuotas reflejan la probabilidad de cada resultado. Mayor cuota = mayor ganancia, pero más difícil de acertar.",
    visual: (
      <div className="flex items-center justify-center gap-3 py-2">
        <div className="flex flex-col items-center bg-surface-2 rounded-xl px-4 py-3 border border-border">
          <span className="text-[10px] text-text-muted">1</span>
          <span className="text-accent font-bold text-lg">2.45</span>
          <span className="text-[10px] text-text-muted">Local</span>
        </div>
        <div className="flex flex-col items-center bg-surface-2 rounded-xl px-4 py-3 border border-border">
          <span className="text-[10px] text-text-muted">X</span>
          <span className="text-text-primary font-bold text-lg">3.10</span>
          <span className="text-[10px] text-text-muted">Empate</span>
        </div>
        <div className="flex flex-col items-center bg-surface-2 rounded-xl px-4 py-3 border border-border">
          <span className="text-[10px] text-text-muted">2</span>
          <span className="text-accent font-bold text-lg">2.80</span>
          <span className="text-[10px] text-text-muted">Visitante</span>
        </div>
      </div>
    ),
  },
  {
    icon: "⚡",
    title: "Gana más puntos",
    description: "¿Te quedas sin puntos? Hay varias formas de conseguir más sin gastar dinero.",
    highlight: null,
    highlightColor: "",
    detail: null,
    visual: (
      <div className="space-y-2.5 py-1">
        {[
          { icon: <Zap size={16} className="text-accent" />, label: "Encuestas y ofertas", pts: "+100–500 pts" },
          { icon: <Gift size={16} className="text-win" />, label: "Invita amigos", pts: "+500 pts" },
          { icon: <Trophy size={16} className="text-gold" />, label: "Acumula en el ranking", pts: "Top posiciones" },
        ].map((item, i) => (
          <div key={i} className="flex items-center gap-3 bg-surface-2 rounded-xl px-4 py-3">
            <div className="w-7 h-7 rounded-lg bg-surface-3 flex items-center justify-center flex-shrink-0">
              {item.icon}
            </div>
            <span className="text-text-secondary text-sm flex-1">{item.label}</span>
            <span className="text-accent text-xs font-bold">{item.pts}</span>
          </div>
        ))}
      </div>
    ),
  },
  {
    icon: "🎁",
    title: "Canjea tus puntos",
    description: "Acumula puntos y canjéalos por premios reales en la tienda de SharpBet.",
    highlight: "Tarjetas regalo, productos y más",
    highlightColor: "text-gold",
    detail: "Cuantas más predicciones aciertes, más puntos acumulas y mejores premios puedes conseguir.",
    visual: (
      <div className="flex items-center justify-center gap-3 py-2">
        {[
          { emoji: "🎮", label: "Digital" },
          { emoji: "📦", label: "Físico" },
          { emoji: "💳", label: "Gift card" },
        ].map((item, i) => (
          <div key={i} className="flex flex-col items-center gap-1.5 bg-surface-2 rounded-xl px-4 py-3 border border-border">
            <span className="text-2xl">{item.emoji}</span>
            <span className="text-text-muted text-[10px]">{item.label}</span>
          </div>
        ))}
      </div>
    ),
  },
];

export function OnboardingModal({ username }: { username?: string }) {
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) {
      setVisible(true);
    }
  }, []);

  const close = () => {
    localStorage.setItem(STORAGE_KEY, "1");
    setExiting(true);
    setTimeout(() => setVisible(false), 300);
  };

  const next = () => {
    if (step < steps.length - 1) setStep((s) => s + 1);
    else close();
  };

  const prev = () => {
    if (step > 0) setStep((s) => s - 1);
  };

  if (!visible) return null;

  const current = steps[step];
  const isLast = step === steps.length - 1;

  return (
    <div className={`fixed inset-0 z-[100] flex items-end sm:items-center justify-center transition-opacity duration-300 ${exiting ? "opacity-0" : "opacity-100"}`}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={close} />

      {/* Modal */}
      <div className={`relative w-full sm:max-w-md bg-surface border border-border rounded-t-3xl sm:rounded-2xl shadow-2xl transition-transform duration-300 ${exiting ? "translate-y-8" : "translate-y-0"}`}>
        {/* Close */}
        <button
          onClick={close}
          className="absolute top-4 right-4 p-1.5 text-text-muted hover:text-text-primary transition rounded-lg hover:bg-surface-2"
        >
          <X size={18} />
        </button>

        <div className="p-6 pb-8">
          {/* Step icon */}
          <div className="text-5xl mb-4 text-center">{current.icon}</div>

          {/* Title */}
          <h2 className="font-display font-black text-2xl text-text-primary text-center mb-2">
            {step === 0 && username ? `Hola, ${username} 👋` : current.title}
          </h2>

          {/* Description */}
          <p className="text-text-secondary text-sm text-center mb-4 leading-relaxed">
            {current.description}
          </p>

          {/* Visual */}
          <div className="mb-4">
            {current.visual}
          </div>

          {/* Highlight */}
          {current.highlight && (
            <div className="bg-surface-2 border border-border rounded-xl px-4 py-3 text-center mb-2">
              <p className={`font-bold text-sm ${current.highlightColor}`}>{current.highlight}</p>
              {current.detail && (
                <p className="text-text-muted text-xs mt-1">{current.detail}</p>
              )}
            </div>
          )}

          {/* Step dots */}
          <div className="flex items-center justify-center gap-1.5 my-5">
            {steps.map((_, i) => (
              <button
                key={i}
                onClick={() => setStep(i)}
                className={`rounded-full transition-all duration-200 ${
                  i === step ? "w-5 h-2 bg-accent" : "w-2 h-2 bg-surface-3 hover:bg-surface-3/80"
                }`}
              />
            ))}
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            {step > 0 && (
              <button
                onClick={prev}
                className="flex items-center gap-1 px-4 py-3 rounded-xl bg-surface-2 text-text-secondary hover:text-text-primary border border-border transition text-sm font-medium"
              >
                <ChevronLeft size={16} />
                Anterior
              </button>
            )}
            <button
              onClick={next}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-accent hover:bg-accent/80 text-background font-bold text-sm transition"
            >
              {isLast ? "¡Empezar a predecir!" : "Siguiente"}
              {!isLast && <ChevronRight size={16} />}
            </button>
          </div>

          {/* Skip */}
          {!isLast && (
            <button onClick={close} className="w-full text-center text-text-muted text-xs mt-3 hover:text-text-secondary transition">
              Saltar introducción
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
