# CSS-en, forklart på fem minutter

Alt av styling følger én flyt, og den får plass i hodet:

```
src/application.css          ← temaet, basiselementene, app-skallet,
                               delte komponenter (les toppkommentaren)
src/components/<side>/*.css  ← stiler som bare én side bruker
```

## Flyten

1. **Tema.** Fem farger definert én gang på `:root` — ingen komponent
   finner opp egne grønnfarger:

   | Token    | Verdi     | Rolle                             |
   | -------- | --------- | --------------------------------- |
   | `--skog` | `#133600` | tekst i lyst tema, flater i mørkt |
   | `--lime` | `#e0ffb2` | flater i lyst tema, tekst i mørkt |
   | `--gran` | `#347103` | aksenter og mørk bakgrunn         |
   | `--eple` | `#a5e34d` | primærknapper og fremdrift        |
   | `--rav`  | `#c77400` | advarsler og verstinger           |

   Lyst/mørkt tema bytter roller via én `prefers-color-scheme`-blokk.
   Animasjoner respekterer `prefers-reduced-motion`.

2. **Basiselementer.** `button`, `dialog`, `ul`, `a`, `td` stylet som nakne
   elementer. Merk én global overraskelse: `ul` er flex-kolonne i hele
   appen — komponenter som vil ha chips eller rutenett overstyrer selv.

3. **App-skallet.** `#app` er et tre-raders grid (header / main / footer).
   Header-raden er `.header-bar` (merkevare + `.header-nav`), footeren er
   `.footer-row`. Alt av chrome-layout ligger i CSS-klasser — JSX-en
   inneholder ingen layout-styling.

4. **Delte komponenter.** `.main-button` er den viktigste: ikon + tekst +
   valgfri tallbadge. All responsivitet (størrelser, kort/lang tekst,
   stabling på mobil) er rene media queries, og fargene er `.primary`- og
   `.active`-modifikatorer — komponenten har ingen resize-lyttere, ingen
   styling-props og ikke én inline style.

5. **Side-spesifikt.** Hver side eier sin egen CSS-fil ved siden av
   komponenten (`costPage.css`, `map.css`, `emissions.css`,
   `dataView.css`, …). Ingen side styler en annen sides klasser, og
   `application.css` inneholder bare det som faktisk er globalt.

## Breakpoints

De samme tre grensene overalt — ingen side finner opp sine egne:

| Område  | Bredde     | Hva skjer                                                 |
| ------- | ---------- | --------------------------------------------------------- |
| mobil   | ≤ 600 px   | korte knappetekster, stablet ikon+tekst, alt i én kolonne |
| tablet  | 601–960 px | kompakte knapper, logoen viker for hjemlenken             |
| desktop | > 960 px   | full størrelse                                            |

600-grensen er med vilje den samme som `useIsSmallScreen`-hooken, så CSS og
JS aldri er uenige om hva «mobil» betyr.

## Kjøreregler

- **Ingen `!important`** — med ett dokumentert unntak: Chart.js setter
  inline størrelse på `canvas` i runtime, og `.emission-chart canvas` må
  vinne over den.
- **Inline styles i JSX bare for data**: en målers bredde i prosent, en
  søyles fyllgrad. Aldri for layout — layout hører hjemme i CSS-fila.
- **Mørkt tema testes alltid** sammen med lyst. Alle flater med egen
  bakgrunnsfarge trenger en `prefers-color-scheme: dark`-override (det var
  akkurat dette som gjorde årstall-kolonnen i datatabellene usynlig i mørkt
  tema før).

## Kjent arv

Én ting fra før forken er bevisst latt i fred, og er grei å vite om:

- **`ul` er global flex-kolonne.** Endres den, må hver liste i appen
  sjekkes — derfor står den, med kommentar, og komponenter overstyrer
  lokalt.

Inline styles i JSX finnes fortsatt, men bare der verdien er data: en
målers bredde i prosent, en søylefarge som kommer som prop. Alt av layout
ligger i CSS-filene.

## Hvordan verifisere at en endring ikke brakk noe

Kjør appen og sjekk sidene ved 390, 650 og 1280 px i begge fargeskjemaer —
overflow-sjekken er `document.documentElement.scrollWidth >
clientWidth`. Det er slik feilene i denne opprydningen ble funnet, og det
tar under et minutt med nettleserens devtools.
