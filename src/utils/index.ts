import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import type { Sport, BetResult, EventStatus, BetStatus } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPoints(points: number): string {
  return new Intl.NumberFormat("es-ES").format(Math.floor(points));
}

export function formatOdds(odds: number): string {
  return odds.toFixed(2);
}

export function formatDate(dateStr: string): string {
  return format(parseISO(dateStr), "dd MMM yyyy - HH:mm", { locale: es });
}

export function formatDateShort(dateStr: string): string {
  return format(parseISO(dateStr), "dd/MM HH:mm");
}

export function formatRelative(dateStr: string): string {
  return formatDistanceToNow(parseISO(dateStr), { addSuffix: true, locale: es });
}

export function calculatePotentialWin(amount: number, odds: number): number {
  return Math.floor(amount * odds);
}

export function getSportIcon(sport: Sport): string {
  const icons: Record<Sport, string> = {
    football: "⚽",
    tennis: "🎾",
    basketball: "🏀",
    baseball: "⚾",
    volleyball: "🏐",
    other: "🏆",
  };
  return icons[sport] || "🏆";
}

export function getSportLabel(sport: Sport): string {
  const labels: Record<Sport, string> = {
    football: "Fútbol",
    tennis: "Tenis",
    basketball: "Baloncesto",
    baseball: "Béisbol",
    volleyball: "Voleibol",
    other: "Otro",
  };
  return labels[sport] || sport;
}

export function getPredictionLabel(prediction: BetResult): string {
  const labels: Record<BetResult, string> = {
    home: "Local",
    draw: "Empate",
    away: "Visitante",
  };
  return labels[prediction];
}

export function getEventStatusLabel(status: EventStatus): string {
  const labels: Record<EventStatus, string> = {
    pending: "Pendiente",
    live: "En Directo",
    finished: "Finalizado",
    cancelled: "Cancelado",
  };
  return labels[status];
}

export function getBetStatusLabel(status: BetStatus): string {
  const labels: Record<BetStatus, string> = {
    pending: "Pendiente",
    won: "Ganada",
    lost: "Perdida",
    cancelled: "Cancelada",
  };
  return labels[status];
}

export function getWinRateColor(rate: number): string {
  if (rate >= 60) return "text-win";
  if (rate >= 40) return "text-pending";
  return "text-loss";
}
