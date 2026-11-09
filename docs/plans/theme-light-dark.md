# Plan: jasny i ciemny motyw (light / dark)

Status: zrealizowane 2026-11-08 (szybki przełącznik: tak) · 2026-11-08 · szacunek: M (ok. 1 dzień pracy)

## Cel

- Domyślnie motyw zgodny z ustawieniem systemu (`prefers-color-scheme`) i zmieniany na żywo, gdy system przełączy się między jasnym a ciemnym.
- W ustawieniach wybór **Systemowy / Jasny / Ciemny**, zapamiętany na urządzeniu. Wybór „Jasny” albo „Ciemny” ma pierwszeństwo przed systemem.
- Zmiana działa od razu, bez przeładowania.
- Start aplikacji nie mignie złym motywem.
- Kontrast WCAG AA w obu motywach.

Zmienia decyzję „tylko ciemny motyw” z `DECISIONS.md` (Fundament). Wymagania przewidywały tryb ciemny według systemu jako S.

## Stan obecny (z kodu)

- Wszystkie kolory UI idą przez zmienne w `src/styles/tokens.css`, ale `:root` jest na sztywno ciemne (`color-scheme: dark`).
- Kolory na stałe poza tokenami są w ok. 25 miejscach CSS:
  - `session.css` — 10: półprzezroczyste białe nakładki, ciemne tła kart przerwy i celu;
  - `pwa.css` — 7: bursztynowa ramka ostrzeżenia, niebieski iOS;
  - `home.css` — 6: wartości zapasowe w `var(..., #hex)`;
  - `animations.css` — 4: puls „sukces”, połysk;
  - `global.css`, `components.css` i `config.css` — po 1.
- Warianty kolorów do drobnego tekstu (`--c-work-text`, `--c-rest-text`, `--c-danger-text`, `CATEGORIES[...].work.text`) są dobrane pod ciemne tło. Na jasnym tle limonka, żółty i bursztyn nie spełnią AA.
- Przyciski wypełnione akcentem mają ciemny tekst (`--c-on-accent`), co działa w obu motywach.
- `theme-color` w `index.html` i `theme_color` / `background_color` w manifeście są ciemne (#0B0F17).
- Ustawienia (`Settings`) są w IndexedDB i wczytują się asynchronicznie, a do tego czasu widać ekran powitalny.

## Projekt

### 1. Model i zapis
- `Settings.theme: 'system' | 'light' | 'dark'`, domyślnie `'system'`. Walidacja w `sanitizeSettings` z powrotem do `'system'`. Przy włączonym T10 (eksport) motyw trafi do kopii razem z ustawieniami.
- **Lustro w `localStorage`** (`tb-theme`): sama wartość wyboru, zapisywana razem z IndexedDB. Tylko ją da się odczytać synchronicznie przed pierwszym malowaniem. Źródłem prawdy zostaje IndexedDB, lustro służy wyłącznie do startu bez mignięcia.

### 2. Stosowanie motywu
- Na `<html>` zawsze ustawiony jest `data-theme="light"` albo `"dark"`, czyli motyw już rozstrzygnięty. CSS zna tylko te dwie wartości.
- **Skrypt w `index.html`** (kilka linii, przed CSS):
  - czyta `tb-theme`;
  - przy `system` albo braku wartości bierze `matchMedia('(prefers-color-scheme: light)')`;
  - ustawia `data-theme` i `<meta name="theme-color">`.
- **Hook `useThemeEffect()` w `App`**:
  - reaguje na zmianę `settings.theme` i nasłuchuje `matchMedia` (`change`) w trybie systemowym;
  - aktualizuje `data-theme`, `theme-color` i lustro w `localStorage`.
- **Logika w `src/app/theme.ts`**: czysta funkcja `resolveTheme(choice, systemPrefersLight)` plus efekt uboczny `applyTheme(resolved)`, z testami jednostkowymi.
- **Przejście**: krótkie przejście kolorów tła i tekstu przy zmianie motywu (ok. 200 ms, bez przejść przy ograniczonym ruchu). W trakcie sesji treningu zmiana systemowa też działa, a przejście się nie gryzie z kolorami kategorii, bo dotyczy tylko tokenów neutralnych.

### 3. Tokeny (`tokens.css`)
- `:root` / `[data-theme='dark']`: obecne wartości bez zmian, plus `color-scheme: dark`.
- **`[data-theme='light']` nadpisuje:**
  - neutralne: bg #F5F7FB, surface #FFFFFF, elevated #EEF2F7, elevated-2 #E2E8F0;
  - obramowania: `rgb(15 23 42 / 0.10)` i `/ 0.18`;
  - tekst: #0F172A, tekst-2 #334155, muted #64748B;
  - scrim: `rgb(15 23 42 / 0.45)`;
  - cienie: łagodniejsze, chłodny odcień;
  - `color-scheme: light`.
- **Nowe tokeny w miejsce kolorów wpisanych na stałe:**
  - `--c-overlay` (białe nakładki 6–8% w ciemnym, czarne 4–6% w jasnym);
  - `--c-card-tint` (tło kart celu i przerwy);
  - `--c-warn`, `--c-warn-soft`, `--c-warn-text` (bursztyn w PWA);
  - `--c-ios-blue`;
  - `--c-success-text`;
  - `--glow-*`, przeliczane z tokenów.
- **Tekst w kolorze akcentu w jasnym motywie** dostaje ciemniejsze odcienie, każdy sprawdzony na AA dla #FFFFFF i #F5F7FB:
  - praca: #C2410C;
  - przerwa: #3B6A99;
  - danger: #BE123C;
  - sukces: #4D7C0F.
- **Wypełnienia akcentem** (przyciski, gradienty) w obu motywach zostają te same, z ciemnym tekstem.

### 4. Kategorie
- `CATEGORIES[...]` dostaje drugi wariant tekstu dla jasnego tła: `work.textLight` i `--c-cat-<id>-text`, np. limonka → #4D7C0F, żółty → #A16207, bursztyn → #B45309, róż → #BE185D, niebieski → #1D4ED8.
- **Odznaki kategorii**: tło 16% koloru zostaje, a tekst i ikona w jasnym motywie biorą `-text`.
- **Ekran ćwiczenia**:
  - `SessionScreen` ustawia `--c-work-text` z wariantu zależnego od rozstrzygniętego motywu;
  - gradient i poświata zostają;
  - w jasnym motywie poświata tła jest słabsza: alfa ok. 0,18 zamiast 0,3, żeby nie brudzić bieli.

### 5. Ekrany do przejrzenia
- **Sesja**:
  - karty celu i przerwy mają dziś ciemne gradienty na stałe, trzeba je zamienić na `--c-card-tint`;
  - pulsowanie: w jasnym motywie mocniejsza alfa, żeby było widać z kilku metrów;
  - poświata, pierścień i lista kroków.
- **Start i plany**:
  - kula w tle „hero”;
  - talia pod kartą planu, kolory kartek z tokenów;
  - podświetlenie „Następny”.
- **Konfigurator**: kropki, cień, ramki grup.
- **PWA**:
  - ekran instalacji z ikonami i bursztynową ramką;
  - wskazówka o blokadzie z gradientem SVG;
  - toast aktualizacji.
- **Ekran końca**: poświata sukcesu, konfetti (kolory kategorii są widoczne na jasnym tle).
- **Ekran powitalny** przy wczytywaniu danych: od razu w dobrym motywie dzięki skryptowi z pkt 2.

### 6. UI wyboru
- **Ustawienia**: nowa sekcja „Wygląd” z segmentem **Systemowy · Jasny · Ciemny**, każda opcja z ikoną: monitor/telefon, słońce, księżyc. Pod spodem podpowiedź „Systemowy: teraz jasny/ciemny”.
- **Opcjonalny szybki przełącznik** w nagłówku ekranu startowego (ikona słońce/księżyc). Dotknięcie przełącza jawnie na przeciwny motyw, a powrót do „Systemowy” odbywa się w ustawieniach. Domyślnie go nie dodajemy (patrz decyzje).
- **Teksty** PL i EN w `settings.ts`.

### 7. PWA i metadane
- **`theme-color`**:
  - dwa tagi z `media="(prefers-color-scheme: light|dark)"` dla instalacji i Safari;
  - skrypt z pkt 2 dopisuje tag bez `media` z kolorem aktualnego motywu, gdy wybór jest jawny;
  - kolor paska stanu iOS (`black-translucent`) działa w obu motywach.
- **Manifest** (`theme_color` / `background_color`) zostaje ciemny, bo manifest nie ma wariantów motywu, a ekran startowy instalacji to ułamek sekundy.
- **Ikona** bez zmian: pomarańczowe „TB” jest czytelne na obu tłach.

### 8. Testy
- **Jednostkowe:**
  - `resolveTheme` (3 wybory × 2 ustawienia systemu);
  - walidacja `theme` i zapis wyboru;
  - lustro `localStorage` zgodne z IndexedDB;
  - hook reaguje na `matchMedia` `change`.
- **E2E (Playwright):**
  - `emulateMedia({ colorScheme: 'light' })` → `data-theme="light"`, a `theme-color` jasny;
  - wybór „Ciemny” w ustawieniach, przeładowanie, systemowy jasny → nadal ciemny i bez mignięcia (sprawdzenie `data-theme` przed hydratacją);
  - powrót do „Systemowy” znów słucha systemu.
- **Kontrast**: `@axe-core/playwright` (nowa zależność dev) uruchamiany na każdym ekranie w obu motywach, reguła `color-contrast`.
- **Przegląd wizualny**: zrzuty ekranów wszystkich ekranów w obu motywach (390 px), jak przy wcześniejszych zmianach.

### 9. Kolejność prac
1. Lustro `localStorage` i skrypt w `index.html`, tokeny jasne, `data-theme`, hook. Aplikacja działa w obu motywach, z błędami kontrastu.
2. Wymiana kolorów wpisanych na stałe na tokeny (lista z „Stan obecny”).
3. Warianty tekstu dla kategorii i akcentów, poświaty i pulsowanie w jasnym motywie.
4. UI w ustawieniach i ewentualny szybki przełącznik.
5. Testy jednostkowe i E2E, axe, poprawki kontrastu, zrzuty do przeglądu.
6. `DECISIONS.md`: nowa sekcja; decyzję „tylko ciemny” oznaczyć jako zastąpioną.

## Decyzje do potwierdzenia (domyślne w nawiasach)

1. **Szybki przełącznik** na ekranie startowym: (nie; tylko w ustawieniach).
2. **Lustro wyboru w `localStorage`**, żeby start nie mrugał: (tak; jedyny wyjątek od „dane tylko w IndexedDB”, przechowuje wyłącznie `system/light/dark`).
3. **Ekran treningu** w jasnym motywie: (jasny jak reszta, kolory kategorii jako akcent). Alternatywa: ekran sesji zawsze ciemny, dla czytelności z daleka i spokoju oczu na siłowni.
4. **Manifest i ekran startowy instalacji**: (zostają ciemne).
