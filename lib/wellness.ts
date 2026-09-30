// Shared by the Wellness Library page, the waitlist form, and admin.
export const WELLNESS_INTERESTS: [string, string][] = [
  ["audio", "Guided audio and meditations"],
  ["journaling", "Journaling prompts"],
  ["coping", "Coping tools for hard moments"],
  ["readings", "Short readings"],
  ["rest", "Rest and boundaries"],
  ["team-checkins", "Team check-ins and meeting tools"],
  ["live", "Live group sessions"],
];

export const TEAM_SIZES = ["2 to 10", "11 to 25", "26 to 50", "51 or more"];

export const interestLabel = (id: string) => WELLNESS_INTERESTS.find(([k]) => k === id)?.[1] ?? id;
