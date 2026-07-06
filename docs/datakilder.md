# Datakilder for ekte energitall

Kartlegging av åpne norske (og europeiske) datakilder som kan gi spillet **ekte tall**
for strømforbruk, vindkraftproduksjon, import/eksport av kraft og verdien av den.

> **Verifiseringsstatus:** Kildene er katalogisert fra kjennskap til norsk
> energidata (per januar 2026). Utviklingsmiljøet dette ble skrevet i hadde ikke
> nettilgang utenfor GitHub/npm, så endepunktene bør røyk-testes med `curl` før
> de tas i bruk. Integrasjonsmønsteret nederst gjør det trivielt.

## 1. Strømforbruk og -produksjon i Norge

| Kilde | Hva | API/format | Lisens |
|---|---|---|---|
| **SSB Statistikkbanken** | Elektrisitetsbalansen: produksjon, forbruk, import, eksport per måned tilbake til 1979 | `https://data.ssb.no/api/v0/no/table/<tabellnr>` (JSON-stat2, POST med spørring). Relevante tabeller: «Elektrisitetsbalanse» (mnd.) og «Elektrisitet» (årlig) | NLOD (fri bruk med kildehenvisning) |
| **Elhub** | Faktisk strømforbruk og -produksjon på timesnivå, aggregert per prisområde, kommune og forbruksgruppe (husholdning/industri/…) | Åpent data-API hos `api.elhub.no` (JSON), oppdateres daglig | NLOD |
| **Statnett driftsdata** | Sanntid: produksjon, forbruk, **fysisk kraftflyt mot utlandet per forbindelse** (Danmark, Tyskland, England, Nederland, Sverige, Finland) | REST uten nøkkel: `https://driftsdata.statnett.no/restapi/...` | Åpen, uten registrering |

**Gir oss:** ekte «Norge bruker X TWh» (i dag hardkodet ~140 TWh på
omstillingssiden), og ekte import/eksport-volumer time for time.

## 2. Strømpriser og verdien av krafteksport

| Kilde | Hva | API/format | Lisens |
|---|---|---|---|
| **hvakosterstrommen.no** | Day-ahead spotpris per prisområde NO1–NO5, per time | Gratis JSON: `/api/v1/prices/<år>/<mnd-dag>_<sone>.json`, CORS åpent (laget for frontend-bruk) | Gratis med synlig attribusjon |
| **ENTSO-E Transparency Platform** | Priser, last, produksjon per type og **fysisk flyt over alle landegrenser** for hele Europa, inkl. alle norske soner | REST/XML med gratis API-nøkkel | Fri bruk |
| **SSB utenrikshandel med varer** | **Fasiten i kroner**: månedlig eksport- og importverdi av elektrisk strøm (varenummer for elektrisk energi) | Samme StatBank-API som over | NLOD |
| **Nord Pool** | Kilden bak prisene; offisielt API er kommersielt | (bruk heller de tre over; `nordpool`-pakken på npm finnes for uoffisiell tilgang) | – |

**Gir oss:** «Hva tjener Norge på krafteksport?» – enten presist fra SSB
(kroner per måned), eller beregnet i sanntid som Statnett-flyt (MWh) ×
spotpris (kr/MWh). Det siste er en kul, levende visualisering.

## 3. Vindkraft – energi per turbin, ekte kapasitetsfaktorer

| Kilde | Hva | API/format | Lisens |
|---|---|---|---|
| **NVE vindkraftdata** | Alle norske vindkraftverk: installert effekt, antall turbiner, idriftsettelsesår, **faktisk årsproduksjon (GWh)** og brukstimer | Datasett + kart-API hos NVE (`api.nve.no` / GeoJSON-nedlasting) | NLOD |
| **NVE magasinstatistikk** | Fyllingsgrad i vannmagasinene, ukentlig per område – energisikkerhets-indikatoren i Norge | `https://biapi.nve.no/magasinstatistikk/api/...` (JSON, uten nøkkel) | NLOD |
| **Regjeringen/Energidepartementet (havvind)** | Offisielle tall for Sørlige Nordsjø II (1 500 MW, ~7 TWh/år) og Utsira Nord | Pressemeldinger/rapporter (tall til hardkoding) | Offentlig |
| **Produsentspesifikasjoner** | Vestas V236-15.0 MW: ~80 GWh/år offshore iflg. produsent; norske onshore-parker ligger på ~3 000–3 500 brukstimer (≈30–40 % kapasitetsfaktor) | Datablad | – |

**Gir oss:** erstatte dagens antagelse «60 GWh per havvindturbin» med ekte
norske kapasitetsfaktorer, og vise faktisk produksjon fra eksisterende
vindparker ved siden av det utfasingen krever.

## 4. Fremtidig kraftbehov og energisikkerhet

| Kilde | Hva |
|---|---|
| **NVE langsiktig kraftmarkedsanalyse** | Forventet norsk forbruksvekst mot 2040 (elektrifisering, industri, hydrogen) og kraftbalanse per scenario |
| **Statnett langsiktig markedsanalyse (LMA)** | Tilsvarende prognoser fra systemoperatøren, inkl. effektbalanse |
| **Energifakta Norge** (energifaktanorge.no) | Kuraterte nøkkeltall fra Energidepartementet – god kilde for formidlingstekster |
| **Miljødirektoratet – utslippsregnskapet** | Norske utslipp per sektor, riktige tall for «tilsvarer»-sammenligninger |
| **IEA World Energy Outlook** | Globale scenarioer for oljeetterspørsel – underbygger «stranded assets»-poenget |

## 5. Petroleumsøkonomi (README nevner inntektsgrafer som uimplementert)

| Kilde | Hva |
|---|---|
| **Norsk Petroleum / Sokkeldirektoratet** | Statens netto kontantstrøm fra petroleum (skatter, SDØE, utbytte), nedlastbare datasett – samme kilde spillet alt bruker for produksjon |
| **NBIM (Oljefondet)** | Fondsverdi og tilførsel, nedlastbar historikk |
| **SSB** | Petroleumssektorens andel av BNP, eksportverdi olje/gass per måned |

**Gir oss:** den manglende inntektsdimensjonen i spillet – hva utfasing betyr
for statens inntekter, ærlig fremstilt side om side med klimagevinsten.

## Anbefalt integrasjonsmønster

Repoet har allerede et byggetids-mønster for data (`npm run data:*` laster ned
fra Google Sheets og genererer `src/generated/*.ts`). Nye kilder bør inn samme
vei:

```
npm run data:energy  →  build/fetchEnergyData.ts
                        (SSB + NVE + Elhub → src/generated/energyData.ts)
```

Fordeler: ingen CORS-problemer, ingen API-nøkler i frontend, deterministiske
deploys, og GitHub Actions-runnerne (som har åpent nett) kan verifisere
kildene i CI. Unntaket er sanntidsvisninger (dagens spotpris, flyt akkurat nå)
– der er hvakosterstrommen.no og Statnett driftsdata laget for direkte bruk
fra nettleser.

## Nye features dette muliggjør

1. **«Krafteksport-telleren»** – sanntidsverdi av norsk kraftutveksling
   (Statnett-flyt × spotpris), med SSB-fasit per måned
2. **Ekte forbrukstall** på omstillingssiden (Elhub/SSB i stedet for ~140 TWh)
3. **Ekte turbinekvivalenter** – NVE-kapasitetsfaktorer i stedet for antatt
   60 GWh/år
4. **Energisikkerhetspanel** – magasinfylling + kraftbalanse + forbruksprognose
   2040, koblet mot fornybarbehovet fra spillerens utfasingsplan
5. **Inntektsdimensjonen** – statens petroleumsinntekter vs. klimagevinst,
   grafen README har lovet hele tiden
