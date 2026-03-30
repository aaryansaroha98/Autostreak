const MOTIVATIONAL_QUOTES = [
  "Tiny steps compound into extraordinary progress.",
  "Momentum loves consistency.",
  "Shipping daily beats perfect someday.",
  "Discipline is a product feature too.",
  "Quiet progress is still progress.",
  "Stay curious, keep committing.",
  "Every streak starts with one honest commit.",
  "Build in public, improve in private.",
  "A reliable cadence beats occasional sprints.",
  "The graph reflects your habit, not your luck.",
  "Great systems make good days repeatable.",
  "Keep your promise to future you.",
  "Small commits lower friction and raise quality.",
  "Consistency is confidence made visible.",
  "Daily effort is the quiet advantage.",
  "Progress compounds when defaults are smart.",
  "Code with intention, iterate with speed.",
  "Done today unlocks better tomorrow.",
  "Your streak is proof that systems work.",
  "Long-term wins are built one day at a time."
];

export function randomQuote() {
  const index = Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length);
  return MOTIVATIONAL_QUOTES[index] ?? "Keep building.";
}
