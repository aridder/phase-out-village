/**
 * The game's story, told in ONE place.
 *
 * One mission, four named chapters, one clear ending. Every text-bearing
 * surface — the front page, the status bar, the chapter report between
 * rounds and the finale — reads from here, so the player meets a single
 * consistent narrative instead of competing framings scattered across
 * components.
 *
 * The tone is deliberately light and plain: short sentences, no policy
 * acronyms, no units the player hasn't been introduced to. Everything is
 * still anchored in real, checkable facts (EU climate targets, offshore
 * wind buildout, IEA demand outlooks, aging-field emission intensity) —
 * they are just retold in everyday language.
 */

export type ChapterEvent = { emoji: string; text: string };

export type Chapter = {
  /** Round number (1–4) this chapter covers */
  round: number;
  /** The years the chapter spans, e.g. "2025–2028" */
  period: string;
  /** Short chapter name shown in the status bar and chapter report */
  name: string;
  /** What happens in the world during this chapter, in plain language */
  events: ChapterEvent[];
};

/** The mission brief — the whole setup in three short beats. */
export const storyIntro = {
  heading: "Du er Norges nye energiminister",
  /** Scene-setting paragraphs, kept to one short sentence each */
  scene: [
    "Året er 2025. Olje og gass står for en fjerdedel av Norges utslipp – og feltene tømmes uansett.",
    "Stortinget har gitt deg ett oppdrag: Lag planen som avvikler oljefeltene, felt for felt.",
  ],
};

export const chapters: Chapter[] = [
  {
    round: 1,
    period: "2025–2028",
    name: "Oppdraget",
    events: [
      {
        emoji: "🛢️",
        text: "Norge har 34 felt i drift. Noen er store og moderne – andre er gamle og slipper ut mye.",
      },
      {
        emoji: "🎯",
        text: "Jobben din: gi feltene en sluttdato. De mest forurensende først.",
      },
    ],
  },
  {
    round: 2,
    period: "2029–2032",
    name: "Europa kjøper mindre",
    events: [
      {
        emoji: "🇪🇺",
        text: "EU kutter utslipp og trenger mindre gass. Norges største kunde handler mindre.",
      },
      {
        emoji: "💸",
        text: "Varer laget med fossil energi blir dyrere å selge til Europa.",
      },
      {
        emoji: "🌬️",
        text: "Norges første store havvindpark begynner å levere strøm.",
      },
    ],
  },
  {
    round: 3,
    period: "2033–2036",
    name: "Nedturen",
    events: [
      {
        emoji: "📉",
        text: "Verden vil ha mindre olje. Etterspørselen faller år for år.",
      },
      {
        emoji: "🛢️",
        text: "Feltene tømmes uansett – produksjonen faller av seg selv nå.",
      },
      {
        emoji: "🇳🇴",
        text: "Norge har lovet å kutte 70–75 % innen 2035. Sokkelen teller med.",
      },
    ],
  },
  {
    round: 4,
    period: "2037–2040",
    name: "Sluttspurten",
    events: [
      {
        emoji: "🔥",
        text: "Feltene som er igjen er gamle. De slipper ut mer for hvert fat.",
      },
      {
        emoji: "⚡",
        text: "Ren strøm fra vann og vind står klar til å ta over.",
      },
      {
        emoji: "🏁",
        text: "I 2040 gjør vi opp regnskapet. Klarte du oppdraget?",
      },
    ],
  },
];

/** The chapter the player is about to steer through. */
export function chapterForRound(round: number): Chapter | undefined {
  return chapters.find((c) => c.round === round);
}

/**
 * The ending headline: one clear verdict the moment the finale opens.
 * The numbers and comparisons come after — the player should never have
 * to read a chart to learn whether they made it.
 */
export function endingHeadline(reachedGoal: boolean, fieldsClosed: number) {
  if (fieldsClosed === 0) return "🏁 2040 – du lot feltene være";
  return reachedGoal
    ? "🏆 2040 – du klarte oppdraget!"
    : "🏁 2040 – nesten i mål";
}
