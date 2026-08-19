import { energyData } from "../generated/energyData";
import { RESERVOIR_CAPACITY_TWH } from "./norwayFacts";
import { TWH_PER_TURBINE_YEAR } from "./energyTransition";

/**
 * What could take over — and, just as importantly, what each option cannot
 * do.
 *
 * Act 3 has to answer "so what replaces it?" without turning into a
 * brochure. Every entry therefore carries a `limit`: the real constraint on
 * that option. A reader who works in energy knows these constraints exist,
 * and a page that lists only upsides tells them the rest of the page is
 * marketing too.
 *
 * Figures are annual, in TWh where the option produces energy, and in
 * billions of kroner where the point is export value.
 */

export type Alternative = {
  emoji: string;
  name: string;
  /** The headline figure */
  value: string;
  unit: string;
  /** What it is and why it is relevant here */
  text: string;
  /** The honest constraint */
  limit: string;
};

/**
 * Norway's stated ambition is to allocate areas for 30 GW of offshore wind
 * by 2040 (regjeringen.no). At a ~45 % capacity factor that is roughly
 * 120 TWh a year — the single biggest new energy source available.
 */
export const OFFSHORE_WIND_GW_TARGET = 30;
export const OFFSHORE_WIND_TWH =
  Math.round(OFFSHORE_WIND_GW_TARGET * 1000 * 8.76 * 0.45) / 1000;

export function alternatives(): Alternative[] {
  return [
    {
      emoji: "🌬️",
      name: "Havvind",
      value: Math.round(OFFSHORE_WIND_TWH).toLocaleString("nb-NO"),
      unit: "TWh i året",
      text: `Norge har som mål å tildele areal for ${OFFSHORE_WIND_GW_TARGET} GW havvind innen 2040. Det tilsvarer rundt ${(Math.round(OFFSHORE_WIND_TWH / TWH_PER_TURBINE_YEAR / 100) * 100).toLocaleString("nb-NO")} store turbiner, og bruker de samme verftene, fartøyene og fagfolkene som sokkelen.`,
      limit:
        "Ingenting av dette er bygget ennå, og flytende havvind er i dag dyrere per kWh enn både vannkraft og bunnfast vind. Uten nett og uten kunder blir det ikke bygget.",
    },
    {
      emoji: "💧",
      name: "Vannkraften vi har",
      value: RESERVOIR_CAPACITY_TWH.toLocaleString("nb-NO"),
      unit: "TWh lagring",
      text: `Magasinene kan lagre ${RESERVOIR_CAPACITY_TWH} TWh – omtrent halvparten av all magasinkapasitet i Europa. Det gjør norsk vannkraft til et batteri: kjøpe billig kraft når det blåser i Nordsjøen, selge dyrt når det er vindstille.`,
      limit:
        "Lagring er ikke ny produksjon. Batteriet gjør europeisk vindkraft mer verdt, men det lager ikke én ekstra TWh selv.",
    },
    {
      emoji: "🔌",
      name: "Strømmen plattformene bruker",
      value:
        energyData.electricity.oilGasConsumptionTwh.toLocaleString("nb-NO"),
      unit: "TWh i året",
      text: `Oljeutvinningen bruker selv ${energyData.electricity.oilGasConsumptionTwh} TWh strøm i året – nesten like mye som all norsk vindkraft produserer (${energyData.electricity.windProductionTwh} TWh). Den kraften blir ledig etter hvert som feltene stenger, uten at én ny turbine må reises.`,
      limit:
        "Kraften frigjøres der feltene ligger, og en del av den kommer fra kabler bygget for nettopp den bruken. Nytten avhenger av at nettet på land tåler å ta den imot.",
    },
    {
      emoji: "🏭",
      name: "Industri og eksport av kraft",
      value: energyData.trade.exportValueBnNok.toLocaleString("nb-NO"),
      unit: "mrd kr i året",
      text: `Norge eksporterte strøm for ${energyData.trade.exportValueBnNok.toLocaleString("nb-NO")} milliarder kroner i ${energyData.trade.year}, og produserer ${energyData.electricity.productionTwh} TWh mot et forbruk på ${energyData.electricity.consumptionTwh}. Å fase ut olje betyr ikke å slutte å selge energi til Europa – det betyr å bytte produkt.`,
      limit:
        "Kraft er langt mindre verdt per enhet energi enn olje og gass. Krafteksport alene erstatter ikke petroleumsinntektene, uansett hvor mye vi bygger.",
    },
    {
      emoji: "🐟",
      name: "Det fastlandet allerede selger",
      value: "766",
      unit: "mrd kr i året",
      text: "Fastlandseksporten av varer – sjømat, industri, kjemi, teknologi – var 766 milliarder kroner i 2025, uten tjenestene. Omstillingen bygger videre på noe som allerede finnes og vokser.",
      limit:
        "Ingen av disse næringene er i nærheten av å vokse raskt nok til å erstatte 664 milliarder i statsinntekt i løpet av femten år.",
    },
  ];
}

/**
 * Why the order matters — the argument Act 3 closes on.
 *
 * These are not claims about whether to phase out. They are claims about
 * the difference between a decline that is scheduled and one that is not,
 * and they hold whichever end date a reader prefers.
 */
export const plannedVsUnplanned = [
  {
    emoji: "🧭",
    title: "Rekkefølgen er gratis å velge",
    planned:
      "Med en plan kan de mest utslippsintensive feltene stenges først. Kuttet per tapt fat blir da mange ganger større.",
    unplanned:
      "Uten plan bestemmer oljeprisen rekkefølgen, og prisen bryr seg ikke om utslipp per fat.",
  },
  {
    emoji: "🔧",
    title: "Leverandørindustrien trenger varsel",
    planned:
      "Verft, rederier og kommuner kan planlegge når de vet hvilke felt som stenger når. Kompetansen kan flyttes over i havvind, karbonlagring og industri.",
    unplanned:
      "En brå nedgang treffer som en permittering. Kompetansen forsvinner ut av landet i stedet for over i noe nytt.",
  },
  {
    emoji: "💰",
    title: "Staten kan spare i forkant",
    planned:
      "Et kjent inntektsfall kan møtes med sparing og omstilling i forkant. Det er nettopp det Oljefondet er bygget for.",
    unplanned:
      "Et uventet inntektsfall må håndteres i budsjettet det året det skjer.",
  },
  {
    emoji: "🏗️",
    title: "Opprydding koster uansett",
    planned:
      "Plugging av brønner og fjerning av installasjoner tar år og krever rigger. Med en plan kan arbeidet fordeles jevnt.",
    unplanned:
      "Stenger mange felt samtidig, konkurrerer de om de samme riggene – og regningen blir dyrere.",
  },
];
