import { Year } from "./types";

/**
 * The four periods of Act 2, defined in ONE place.
 *
 * The old game asked the same question four times: "here are all the
 * remaining fields, sorted the same way — pick some." Nothing about round 4
 * differed from round 1 except smaller numbers, so the four rounds felt
 * like one round repeated.
 *
 * Each period now has its own decision problem. Three things change:
 *
 *   - `capacity` — how many fields can actually be closed in the period.
 *     Real decommissioning is limited by rig availability for plugging
 *     wells, by the supplier industry and by the Storting's calendar. In
 *     the game it is the constraint that forces a priority.
 *   - `lens` — what the field selector puts in front of you. Period 1 is
 *     about emissions per barrel, period 2 about kroner, period 3 about
 *     whether a closure changes anything at all, period 4 about what you
 *     leave behind.
 *   - `measure` — what the period report scores you on afterwards, which
 *     is a different question every time.
 *
 * The result: four periods that teach four different things about the same
 * shelf.
 */

/** What the field selector emphasises this period. */
export type PeriodLens =
  /** Emissions per barrel — the fields differ by a factor of several hundred */
  | "intensity"
  /** Kroner — what each field carries of Norway's petroleum revenue */
  | "economy"
  /** Whether closing changes anything, or the field was stopping anyway */
  | "additionality"
  /** What is still running in 2040, and for how long after */
  | "legacy";

export type Period = {
  /** Round number, 1–4 */
  round: number;
  /** First and last year of the period */
  fromYear: Year;
  toYear: Year;
  /** "2025–2028" */
  label: string;
  /** Chapter name */
  name: string;
  /** One line above the name — the period's situation */
  kicker: string;
  /** The situation, in two or three plain sentences */
  brief: string[];
  /** Maximum number of fields that can be closed this period */
  capacity: number;
  /** Why the capacity is what it is, in the game's own terms */
  capacityReason: string;
  /** What the field selector emphasises */
  lens: PeriodLens;
  /** Heading for the lens column in the selector */
  lensLabel: string;
  /** One sentence explaining what the lens shows and why it matters now */
  lensExplainer: string;
  /** What the period report scores */
  measure: {
    /** Short name of the measure, e.g. "Kutt per tapt fat" */
    name: string;
    /** What a good result means, in one sentence */
    explainer: string;
  };
  /** What happens in the world during the period */
  events: { emoji: string; text: string }[];
  /**
   * The period's accent colour, as a CSS colour. Each period looks
   * different from the moment it opens — the header, the timeline segment
   * and the brief all take this colour.
   */
  accent: string;
  /** A single character that stands for the period in the timeline */
  glyph: string;
};

export const periods: Period[] = [
  {
    round: 1,
    fromYear: "2025",
    toYear: "2028",
    label: "2025–2028",
    name: "Kartleggingen",
    kicker: "Første stortingsperiode",
    brief: [
      "Du har nettopp fått nøklene til departementet. Sokkelen går for fullt, og ingenting er bestemt.",
      "Det første du får på bordet er utslippstallene per felt. De er ikke like – noen felt slipper ut hundrevis av ganger mer per fat enn andre.",
      "Kapasiteten til å avvikle er minst nå. Velg få felt, og velg dem godt.",
    ],
    capacity: 5,
    capacityReason:
      "Riggene som må plugge brønnene er booket år i forveien, og ingen utredninger er gjort ennå.",
    lens: "intensity",
    lensLabel: "Utslipp per fat",
    lensExplainer:
      "Samme fat olje kan koste alt fra nesten ingenting til 60 kg CO₂ å produsere. Her ser du hvilke felt som er hvilke.",
    measure: {
      name: "Kutt per tapt fat",
      explainer:
        "Hvor mye CO₂ du kuttet for hvert fat produksjon du ga fra deg. Høyt tall betyr at du traff de ineffektive feltene.",
    },
    events: [
      {
        emoji: "🛢️",
        text: "33 felt er i drift. Til sammen produserer de energi tilsvarende 2 464 TWh i året.",
      },
      {
        emoji: "📊",
        text: "Utslippsregnskapet per felt legges fram. Forskjellene er større enn noen hadde ventet.",
      },
      {
        emoji: "🗳️",
        text: "Stortinget gir deg fullmakt til å sette sluttdato på felt – men ikke på mange om gangen.",
      },
    ],
    accent: "#3d8bd6",
    glyph: "I",
  },
  {
    round: 2,
    fromYear: "2029",
    toYear: "2032",
    label: "2029–2032",
    name: "Etterspørselen snur",
    kicker: "Andre stortingsperiode",
    brief: [
      "Europa kutter utslipp raskere enn ventet. Gassen selges fortsatt godt, oljen møter et tregere marked.",
      "Nå handler spørsmålet om penger: hvert felt bærer sin del av de 664 milliardene staten henter fra sokkelen i året.",
      "Avviklingskapasiteten er større. Det gjør valget vanskeligere, ikke enklere.",
    ],
    capacity: 10,
    capacityReason:
      "Leverandørindustrien har bygget opp riggkapasitet for plugging, og de første utredningene er ferdige.",
    lens: "economy",
    lensLabel: "Statsinntekt",
    lensExplainer:
      "Hvor mange milliarder i året feltet bærer av statens petroleumsinntekter. De store pengene og de store utslippene ligger sjelden på samme felt.",
    measure: {
      name: "Kutt per tapt krone",
      explainer:
        "Hvor mye CO₂ du kuttet per milliard kroner staten ga fra seg. Høyt tall betyr at du kuttet billig.",
    },
    events: [
      {
        emoji: "🇪🇺",
        text: "EUs karbontoll gjør varer laget med fossil energi dyrere å selge inn i Europa.",
      },
      {
        emoji: "🌬️",
        text: "Den første store norske havvindparken leverer strøm inn på nettet.",
      },
      {
        emoji: "💶",
        text: "Gassprisen holder seg. Oljeprisen svinger mer enn den har gjort på et tiår.",
      },
    ],
    accent: "#c77400",
    glyph: "II",
  },
  {
    round: 3,
    fromYear: "2033",
    toYear: "2036",
    label: "2033–2036",
    name: "Halefeltene",
    kicker: "Tredje stortingsperiode",
    brief: [
      "Mange felt er nå på hell av seg selv. Reservoarene tømmes, og produksjonen faller uansett hva du bestemmer.",
      "Det gjør at en avvikling kan bety alt – eller nesten ingenting. Et felt som stanser i 2037 uansett, gir deg lite ved å stenges i 2033.",
      "Denne perioden måles du på hvor mye av kuttet ditt som faktisk ikke ville skjedd av seg selv.",
    ],
    capacity: 12,
    capacityReason:
      "Avviklingsprosjektene går nå på rutine, og flere felt er allerede nær slutten.",
    lens: "additionality",
    lensLabel: "Stanser uansett",
    lensExplainer:
      "Året feltet tømmer seg selv. Jo lenger det er til da, jo mer betyr det å sette en sluttdato nå.",
    measure: {
      name: "Reelt kutt",
      explainer:
        "Hvor stor del av kuttet ditt som ikke ville kommet av seg selv. Høy andel betyr at vedtakene dine gjorde en forskjell.",
    },
    events: [
      {
        emoji: "📉",
        text: "Verdens oljeetterspørsel har passert toppen. Prisen legger seg lavere enn på 2020-tallet.",
      },
      {
        emoji: "🛢️",
        text: "Sokkelen produserer nå under halvparten av det den gjorde i 2025 – uten at noe er vedtatt.",
      },
      {
        emoji: "🇳🇴",
        text: "Norges klimamål for 2035 nærmer seg forfall. Sokkelen teller med i regnskapet.",
      },
    ],
    accent: "#7b4bc4",
    glyph: "III",
  },
  {
    round: 4,
    fromYear: "2037",
    toYear: "2040",
    label: "2037–2040",
    name: "Arven",
    kicker: "Fjerde stortingsperiode",
    brief: [
      "Dette er siste periode du styrer. Det som fortsatt går i 2040, går videre inn i tiåret etter – uten at du har bestemt når det skal ta slutt.",
      "Ingen kapasitetsgrense nå. Spørsmålet er hva du vil overlate til den neste.",
      "Feltene som er igjen, er stort sett de største og de reneste. Det gjør valget til et ekte dilemma.",
    ],
    capacity: 34,
    capacityReason:
      "Ingen grense i denne perioden – hele apparatet er innrettet på avvikling.",
    lens: "legacy",
    lensLabel: "Igjen i 2040",
    lensExplainer:
      "Hvor mye feltet fortsatt produserer i 2040, og hva det betyr å la det gå videre uten sluttdato.",
    measure: {
      name: "Sokkelen med sluttdato",
      explainer:
        "Hvor stor del av produksjonen som har fått en vedtatt sluttdato når du går av. Resten er overlatt til den neste.",
    },
    events: [
      {
        emoji: "⚡",
        text: "Havvind, vannkraft og nett er bygget ut. Kraften står klar til å ta over.",
      },
      {
        emoji: "🔥",
        text: "Feltene som fortsatt går på gassturbiner slipper ut mer per fat for hvert år som går.",
      },
      {
        emoji: "🏁",
        text: "I 2040 gjøres regnskapet opp – for klimaet, for kronene og for det du etterlater.",
      },
    ],
    accent: "#2e9e6b",
    glyph: "IV",
  },
];

/** The period for a given round (1–4), clamped to the range that exists. */
export function periodForRound(round: number): Period {
  return periods[Math.min(Math.max(round, 1), periods.length) - 1];
}

/** "2029–2032" for round 2. One source of truth for period labels. */
export function periodLabelForRound(round: number): string {
  return periodForRound(round).label;
}

/** How many fields may be closed in the given round. */
export function capacityForRound(round: number): number {
  return periodForRound(round).capacity;
}
