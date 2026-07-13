/**
 * Real-world context for each parliamentary term the player is about to
 * steer through. Shown in the period report so the four rounds feel like
 * different times, not four copies of the same menu.
 *
 * Everything here is anchored in real, checkable policy and analysis;
 * future-tense items are framed as adopted targets or published estimates,
 * not predictions of our own:
 * - EU's carbon border tariff (CBAM) entered its definitive regime in 2026.
 * - EU's Fit for 55 package targets −55 % net emissions by 2030.
 * - REPowerEU aims to phase out Russian gas and cut gas demand overall.
 * - Sørlige Nordsjø II (~1.5 GW) and Utsira Nord are Norway's first
 *   large offshore wind areas, awarded in 2023–2025.
 * - The IEA's Net Zero roadmap has no new oil and gas field developments
 *   beyond those already committed.
 * - Norway's climate target for 2035 is a 70–75 % cut (announced 2025),
 *   and the EU aims to be climate neutral by 2050.
 * - Aging fields emit more per barrel: the same platforms run while
 *   production falls, so intensity rises toward end of life.
 */

export type PeriodEvent = {
  emoji: string;
  text: string;
};

export type PeriodStory = {
  /** Round number this story is the OUTLOOK for (2–4) */
  round: number;
  period: string;
  headline: string;
  events: PeriodEvent[];
};

export const periodStories: PeriodStory[] = [
  {
    round: 2,
    period: "2029–2032",
    headline: "Verden strammer til rundt fossil energi",
    events: [
      {
        emoji: "🇪🇺",
        text: "EUs karbontoll (CBAM) er i full drift – varer laget med fossil energi blir dyrere å selge til Europa.",
      },
      {
        emoji: "⏳",
        text: "EU skal kutte utslippene 55 % innen 2030. Kundene til norsk gass har vedtatt å trenge mindre av den.",
      },
      {
        emoji: "🌬️",
        text: "Sørlige Nordsjø II, Norges første store havvindpark, skal etter planen levere strøm i denne perioden.",
      },
    ],
  },
  {
    round: 3,
    period: "2033–2036",
    headline: "Etterspørselen etter olje og gass faller",
    events: [
      {
        emoji: "📉",
        text: "IEAs netto null-scenario har ikke plass til nye olje- og gassfelt utover de som allerede er besluttet.",
      },
      {
        emoji: "🇳🇴",
        text: "Norges klimamål for 2035 er 70–75 % kutt. Sokkelens utslipp teller på det norske regnskapet.",
      },
      {
        emoji: "🛢️",
        text: "Produksjonen på sokkelen faller bratt av seg selv nå – feltene tømmes uansett hva du velger.",
      },
    ],
  },
  {
    round: 4,
    period: "2037–2040",
    headline: "Siste etappe mot 2040",
    events: [
      {
        emoji: "🔥",
        text: "Feltene som er igjen er gamle: plattformene bruker like mye energi mens produksjonen synker, så utslipp per fat øker.",
      },
      {
        emoji: "🇪🇺",
        text: "EU skal være klimanøytralt i 2050 – markedet for fossil energi i Europa krymper år for år.",
      },
      {
        emoji: "⚡",
        text: "Vannkraft, vind og nett står klare til å ta over: Norge har allerede nesten 100 % fornybar strøm.",
      },
    ],
  },
];

/** The outlook story for the round the player is about to start. */
export function storyForRound(round: number): PeriodStory | undefined {
  return periodStories.find((s) => s.round === round);
}
