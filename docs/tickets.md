# Tickets: Training Buddy — PWA do prowadzenia treningu

**Review ID:** req-2026-11-06-training-buddy
**Requirements:** `dev_plans/req-2026-11-06-training-buddy/requirements.md` (status at split: Ready for tickets)
**Created:** 2026-11-07
**Jira:** not created — projekt prywatny, tickety tylko w tym pliku

## Overview
| # | Jira | Title | Type | Repos | Wave | Blocked by | Set | Size |
|---|---|---|---|---|---|---|---|---|
| T1 | — | Przejście FBW A/B w trybie klasycznym | Story | training-buddy | 1 | — | MVP | L |
| T2 | — | Ćwiczenia na czas z przygotowaniem | Story | training-buddy | 2 | T1 | MVP | S |
| T3 | — | Tryb obwodu i przerwy zapisane w treningu | Story | training-buddy | 2 | T1 | MVP | M |
| T4 | — | Sterowanie sesją: wstecz, lista kroków, pominięcie, zakończenie | Story | training-buddy | 3 | T2, T3 | MVP | M |
| T5 | — | Własne treningi i edycja FBW A/B | Story | training-buddy | 3 | T3 | MVP | M |
| T6 | — | Własne ćwiczenia | Story | training-buddy | 4 | T5 | MVP | M |
| T7 | — | Ustawienia: język i dźwięk | Story | training-buddy | 3 | T3 | MVP | S |
| T8 | — | Instalacja i offline | Story | training-buddy | 3 | T3 | MVP | M |
| T9 | — | Wygoda sesji: pauza, 3-2-1, wibracja, wznowienie | Story | training-buddy | 4 | T4, T7 | Follow-up | M |
| T10 | — | Kopia danych: eksport i import | Story | training-buddy | 5 | T6, T7 | Follow-up | S |
| T11 | — | Przypomnienia na Androidzie | Story | training-buddy | 6 | T5, T8, T10 | Follow-up | M |

Dependency graph: `T1 → {T2 ∥ T3} → {T4 ∥ T5 ∥ T7 ∥ T8} → {T6 ∥ T9} → T10 → T11`
(dokładnie: T4 ← T2, T3; T5, T7, T8 ← T3; T6 ← T5; T9 ← T4, T7; T10 ← T6, T7; T11 ← T5, T8, T10)

Execution (jedno repo, więc „gotowe” = zmergowane i wdrożone na hosting):
- Wave 1: T1
- Wave 2 (parallel): T2, T3
- Wave 3 (parallel): T4, T5, T7, T8
- Wave 4 (parallel): T6, T9
- Wave 5: T10
- Wave 6: T11

Launch: MVP = T1–T8. Po T8 aplikacja jest instalowalna, działa offline i pokrywa wszystkie wymagania M. Flaga nie jest potrzebna: jedynym użytkownikiem jest właściciel, który zaczyna z niej korzystać, kiedy uzna. T9–T11 to dodatki (S/C). Drobne pozycje S w ticketach MVP (FR5, FR9, FR17, FR24, FR27, FR38, część FR29, fallback w FR40) są oznaczone „(S)” i można je wyciąć bez zmiany reszty ticketu.

Overlap: T2 i T4 zmieniają ten sam ekran ćwiczenia, więc T4 czeka na T2. T9 zmienia stan sesji z T4, więc czeka na T4. W fali 3 T5 i T7 dodają po jednym wejściu na ekranie startowym (konfigurator, ustawienia); konflikt jest trywialny, a w razie pracy równoległej merge idzie po kolei.

## Coverage
| Item | Ticket(s) |
|---|---|
| FR1 | T1 |
| FR2 | T1 |
| FR3 | T1, T5, T6 |
| FR4 | T9 |
| FR5 | T3 |
| FR6 | T11 |
| FR7 | T1 |
| FR8 | T1, T3 |
| FR9 | T3 |
| FR10 | T1, T3 |
| FR11 | T1 |
| FR12 | T1 |
| FR13 | T2 |
| FR14 | T4 |
| FR15 | T4 |
| FR16 | T4 |
| FR17 | T2, T4 |
| FR18 | T1, T3 |
| FR19 | T1, T9 |
| FR20 | T1, T4, T11 |
| FR21 | T4, T11 |
| FR22 | T6 |
| FR23 | T6 |
| FR24 | T6 |
| FR25 | T5, T6 |
| FR26 | T5 |
| FR27 | T5 |
| FR28 | T7 |
| FR29 | T7, T9 |
| FR30 | T10 |
| FR31 | T9 |
| FR32 | T1, T9 |
| FR33 | T8 |
| FR34 | T8 |
| FR35 | T8 |
| FR36 | T8 |
| FR37 | T8 |
| FR38 | T8 |
| FR39 | T1, T7 |
| FR40 | T3 |
| FR41 | T11 |
| FR42 | T11 |
| BR1 | T1 |
| BR2 | T3 |
| BR3 | T1 |
| BR4 | T1, T4 |
| BR5 | T4 |
| BR6 | T1, T2 |
| BR7 | T1 |
| BR8 | T1 |
| BR9 | T11 |
| BR10 | T5, T6 |
| BR11 | T3, T5 |
| BR12 | T10, T11 |
| EC1 | T4 |
| EC2 | T4 |
| EC3 | T4 |
| EC4 | T4 |
| EC5 | T4 |
| EC6 | T1, T2 |
| EC7 | T1, T8 |
| EC8 | T1 |
| EC9 | T1 |
| EC10 | T6 |
| EC11 | T9 |
| EC12 | T6 |
| EC13 | T9 |
| EC14 | T9 |
| EC15 | T11 |
| EC16 | T11 |
| EC17 | T11 |
| EC18 | T10 |
| EC19 | T8 |
| EC20 | T8 |
| EC21 | T5, T6 |
| EC22 | T3 |
| AC1 | T8 |
| AC2 | T1 |
| AC3 | T1, T3 |
| AC4 | T3 |
| AC5 | T1 |
| AC6 | T2 |
| AC7 | T1, T4 |
| AC8 | T4 |
| AC9 | T4 |
| AC10 | T1, T4 |
| AC11 | T4 |
| AC12 | T6 |
| AC13 | T5 |
| AC14 | T3, T5, T6, T7 |
| AC15 | T7 |
| AC16 | T1 |
| AC17 | T6 |
| AC18 | T6 |
| AC19 | T9 |
| AC20 | T8 |
| AC21 | T10, T11 |
| AC22 | T11 |
| AC23 | T8 |
| Impact: training-buddy / ekrany | T1, T3, T4, T5, T6, T7, T8, T9, T11 |
| Impact: training-buddy / logika sesji | T1, T2, T3, T4, T9 |
| Impact: training-buddy / PWA | T8 |
| Impact: training-buddy / dane (IndexedDB, eksport/import) | T3, T10 |
| Impact: training-buddy / przypomnienia w SW | T11 |
| Impact: hosting statyczny (HTTPS) | T1 |

## Notes to Raise
- **Wake Lock (FR32) przeniesiony z S do MVP (T1)**, decyzja użytkownika przy podziale (D50). Bez niego ekran iPhone'a gaśnie przed końcem przerwy i sygnał nie gra. Przełącznik w ustawieniach zostaje w T9.
- Licznik czasu ponad przerwę („+0:12”, część FR19, S) jest w T1, bo wymagają go BR6 i EC6 (powrót z tła po końcu przerwy). To umiejscowienie, nie zmiana zakresu.
- Spec `wymagania-pwa-trening.md` (v0.3) jest nieaktualny wobec D21–D50; źródłem prawdy jest `requirements.md`.

---

## T1 — Przejście FBW A/B w trybie klasycznym

**Jira:** —
**Type:** Story
**Set:** MVP · **Size:** L
**Blocked by:** none
**Wave:** 1

### Value
Jako ćwiczący mogę na telefonie przejść FBW A albo FBW B od pierwszej serii do konfetti, a aplikacja sama odmierza przerwy i sygnalizuje ich koniec dźwiękiem i pulsującym ekranem, więc nie muszę patrzeć na zegarek.

**Demo:** na iPhonie i Androidzie otwórz wdrożony adres, wybierz FBW A, „Start”, przeklikaj serie z przerwami (włączona muzyka gra dalej, sygnał na końcu przerwy, ekran nie gaśnie), dojdź do konfetti i podsumowania.

### Background
Training Buddy to prywatna PWA (tylko frontend, dane na urządzeniu) prowadząca trening siłowy FBW krok po kroku: pokazuje ćwiczenie i serię, odmierza przerwy, sygnalizuje ich koniec i pokazuje postęp. Ten ticket stawia projekt i najkrótszą pełną ścieżkę: wbudowany trening w trybie klasycznym z domyślnymi przerwami. Źródło: `requirements.md` (req-2026-11-06-training-buddy).

### Scope
- In:
  - projekt: Vite + React + TypeScript, Zustand, fonty systemowe, żadnych zewnętrznych zasobów; wdrożenie na hosting statyczny z HTTPS;
  - i18n od początku: każdy tekst UI przez słownik PL i EN, język z `navigator.language` (`pl*` → PL, inaczej EN), odmiana liczebników przez `Intl.PluralRules`, atrybut `lang` (FR39 bez przełącznika);
  - pięć kategorii z kolorem i ikoną (FR1); FBW A i FBW B w kodzie ze stałymi id (FR2, tabela niżej);
  - ekran startowy: karty FBW A/B (nazwa, liczba ćwiczeń, tryb, badge kategorii) → podgląd (FR3);
  - podgląd: rozpiska („4 × 5–7 powt.”, „3 × 45 s”, „3 × 6–8 powt. na nogę”, zakres czasu jako podpowiedź) i „Start”; przerwy domyślne 90 s / 120 s bez edycji (FR7, FR8 częściowo);
  - generator kroków w trybie klasycznym (BR1), sesja jako snapshot (BR3);
  - ekran ćwiczenia: pasek postępu (zrobione kroki ćwiczeń / wszystkie), „Ćwiczenie 2/5 · Seria 3/4”, badge, duża nazwa, cel; ćwiczenia jednostronne jako osobne kroki „Lewa noga (1/2)” / „Prawa noga (2/2)” („noga” dla Nogi i Tył uda i pośladki, „strona” dla reszty); „Zrobione” (FR10, FR11, FR12; postęp bez statusów pominięcia: BR4 częściowo);
  - ekran przerwy: start automatyczny, timer mm:ss z pierścieniem liczony od `endsAt`, typ przerwy, zapowiedź następnego kroku, „Pomiń przerwę”; na koniec sygnał, „Przerwa zakończona”, pulsowanie całego ekranu (przy `prefers-reduced-motion` stała zmiana koloru), licznik ponad przerwę „+0:12” (FR19, część) i „Dalej”; przeliczenie po powrocie do aplikacji (FR18, BR6);
  - dźwięk: Web Audio, działa offline, odblokowany przy „Start”, gra na muzyce i jej nie zatrzymuje (BR7);
  - Screen Wake Lock w trakcie sesji, odnawiany po powrocie do aplikacji; bez wsparcia aplikacja działa normalnie (FR32, D50);
  - zakończenie: konfetti (ograniczone przy `prefers-reduced-motion`), gratulacje, podsumowanie (nazwa, czas od startu do końca z pauzami, liczba ćwiczeń i serii), „Wróć do startu” (FR20, BR8);
  - UI mobile-first: pion 360–430 px, elementy ≥ 48 px, czytelność z 1–2 m, brak zoomu przy podwójnym dotknięciu.
- Out:
  - ćwiczenia na czas: do T2 plank pokazuje cel „45 s” i „Zrobione” jak ćwiczenie na powtórzenia (→ T2);
  - tryb obwodu, edycja przerw, zapis danych w IndexedDB (→ T3);
  - „Wstecz”, lista kroków, „Pomiń serię”, „Zakończ trening” i potwierdzenie systemowego „wstecz” (→ T4); do tego czasu wyjście z sesji to zwykła nawigacja;
  - przełącznik języka i ekran ustawień (→ T7);
  - instalacja, Service Worker, offline (→ T8);
  - pauza, ±15 s, 3-2-1 przed końcem przerwy, wibracja, wznowienie sesji, przełącznik Wake Lock (→ T9);
  - data ostatniego treningu (→ T11).

Dane wbudowane (FR2):

| Trening | # | Kategoria | Ćwiczenie (PL / EN) | Serie | Cel | Jednostronne |
|---|---|---|---|---|---|---|
| FBW A | 1 | Pull | Podciąganie nachwytem / Pull-ups (overhand grip) | 4 | 5–7 powt. | nie |
| FBW A | 2 | Push | Dipy (pompki na poręczach) / Dips | 4 | 5–7 powt. | nie |
| FBW A | 3 | Nogi | Bułgarski przysiad wykroczny / Bulgarian split squat | 3 | 6–8 powt. na nogę | tak |
| FBW A | 4 | Tył uda i pośladki | Nordic curl / Nordic hamstring curl | 3 | 5–7 powt. | nie |
| FBW A | 5 | Core | Plank (deska) / Plank | 3 | 45 s (zakres 45–60 s) | nie |
| FBW B | 1 | Pull | Podciąganie szerokim chwytem / Wide-grip pull-ups | 3 | 8–12 powt. | nie |
| FBW B | 2 | Push | Pompki z deficytem / Deficit push-ups | 3 | 10–15 powt. | nie |
| FBW B | 3 | Nogi | Skater squat / Skater squat | 3 | 6–10 powt. na nogę | tak |
| FBW B | 4 | Tył uda i pośladki | Hip thrust / Hip thrust | 3 | 10–15 powt. | nie |
| FBW B | 5 | Core | Unoszenie nóg w zwisie / Hanging leg raises | 3 | 10–15 powt. | nie |

Generator klasyczny (BR1): dla każdego ćwiczenia, dla serii 1..N, dla strony (lewa, prawa albo brak) krok ćwiczenia; po nim, jeśli to nie ostatni krok: przerwa między seriami (po ostatniej stronie serii, gdy to nie ostatnia seria) albo między ćwiczeniami (po ostatniej serii). Przerwa 0 s jest pomijana, po ostatnim kroku nie ma przerwy. FBW A: 20 kroków ćwiczeń, 12 przerw między seriami, 4 między ćwiczeniami.

### Changes by Repo
| Repo | Change | Notes |
|---|---|---|
| training-buddy (nowe) | szkielet aplikacji, i18n, dane wbudowane, ekrany start / podgląd / ćwiczenie / przerwa / zakończenie, generator klasyczny, timer, dźwięk, Wake Lock | wdrożenie na hosting HTTPS w tym tickecie |

### Acceptance Criteria
- [ ] AC2: Given pierwsze uruchomienie, when otworzę ekran startowy, then widzę FBW A i FBW B z danymi z tabeli, w trybie klasycznym.
- [ ] AC3 (tryb klasyczny): Given FBW A, when go przejdę, then jest 20 kroków ćwiczeń, a bułgarski przysiad w każdej serii pokazuje osobno lewą i prawą nogę.
- [ ] AC5: Given trwający trening, when dotknę „Zrobione”, then startuje przerwa właściwego typu (90 s między seriami, 120 s między ćwiczeniami); po jej końcu gra sygnał, ekran pulsuje i czeka na „Dalej”.
- [ ] AC7 (część): Given przerwa, when dotknę „Pomiń przerwę”, then od razu widzę następny krok.
- [ ] AC10: Given ostatni krok, when dotknę „Zrobione”, then widzę konfetti, gratulacje i podsumowanie z czasem i liczbą serii.
- [ ] AC16: Given trwająca przerwa, when zablokuję ekran na 30 s i wrócę, then timer pokazuje poprawny czas.
- [ ] Given muzyka gra w innej aplikacji, when kończy się przerwa, then sygnał gra, a muzyka się nie zatrzymuje.
- [ ] Given iPhone z iOS 18.4+ i auto-blokadą 30 s, when trwa przerwa 90 s, then ekran nie gaśnie.
- [ ] Given `prefers-reduced-motion`, when kończy się przerwa, then ekran zmienia kolor bez migania, a konfetti jest ograniczone.
- [ ] Given telefon z językiem systemu angielskim, when otworzę aplikację, then UI i nazwy ćwiczeń są po angielsku z poprawną odmianą liczebników.
- [ ] Aplikacja jest dostępna pod adresem HTTPS.

### Edge Cases
- EC6: przerwa skończyła się, gdy aplikacja była w tle → po powrocie „Przerwa zakończona”, licznik ponad przerwę i pulsowanie; sygnał gra, jeśli nie zagrał.
- EC7: telefon zablokowany w trakcie przerwy → sygnał może nie zagrać (ryzyko przyjęte, D22); wskazówka dla użytkownika w T8.
- EC8: iPhone z włączonym przełącznikiem wyciszenia → sygnału może nie być słychać, zostaje pulsowanie; muzyka gra dalej.
- EC9: iOS starszy niż 18.4 albo brak Wake Lock → aplikacja działa, ekran może zgasnąć.

### Decisions
- D4: po końcu przerwy sygnał, potem ekran czeka na „Dalej”.
- D8: podciąganie nachwytem; kategoria „Tył uda i pośladki” / „Posterior chain”.
- D10: React + Vite + TypeScript.
- D12: przerwy domyślne w trybie klasycznym 90 s / 120 s.
- D14: plank w FBW A ma domyślny cel 45 s.
- D16: po końcu przerwy licznik czasu ponad przerwę.
- D22: ryzyko zablokowanego telefonu przyjęte; Wake Lock domyślnie włączony.
- D23: minimalna wersja iOS 18.4.
- D24: sygnał gra na muzyce i jej nie zatrzymuje, nawet jeśli przełącznik wyciszenia go wycisza.
- D29: pulsowanie ekranu na koniec przerwy; przy ograniczonym ruchu stała zmiana koloru.
- D48: czas w podsumowaniu od startu do końca, razem z pauzami.
- D50: Wake Lock w MVP, w tym tickecie (decyzja przy podziale).

### Implementation Notes
- Hosting (GitHub Pages / Netlify / Cloudflare Pages) i ścieżka bazowa: przy podkatalogu `base` w Vite oraz zgodne `scope` i `start_url` (T8).
- Id wbudowanych ćwiczeń i treningów są stałe na zawsze (np. `builtin:pullup-overhand`, `builtin:fbw-a`); dane użytkownika będą się do nich odwoływać.
- Sygnały zaplanowane z wyprzedzeniem na osi czasu `AudioContext`, żeby nie zależeć od throttlingu timerów; sprawdzić na zablokowanym ekranie Android i iOS.
- Odporność timera na zmianę zegara systemowego (DST, ręczna zmiana czasu).
- Routing (React Router czy stan) i biblioteka i18n (`react-i18next` czy własny słownik): decyzja w mission-grill.
- `navigator.audioSession.type` w Safari: wybrać tryb, który miksuje dźwięk z muzyką (D24); sprawdzić na urządzeniu.
- Model sesji: tu wystarczy indeks kroku; statusy kroków dochodzą w T4, więc warto je przewidzieć.

### Rollout
- Wdrożenie na hosting statyczny z HTTPS; jedynym użytkownikiem jest właściciel, bez flag.
- Bez Service Workera aż do T8: aplikacja wymaga sieci przy otwarciu.

### Open Items
- Brak.

---

## T2 — Ćwiczenia na czas z przygotowaniem

**Jira:** —
**Type:** Story
**Set:** MVP · **Size:** S
**Blocked by:** T1 (merged)
**Wave:** 2

### Value
Jako ćwiczący mogę zrobić plank z odliczaniem: po „Start” mam 3 s na odłożenie telefonu, potem aplikacja odlicza cel i sygnalizuje koniec.

**Demo:** w FBW A dojdź do planku, dotknij „Start”: „Przygotuj się” 3-2-1, odliczanie 45 s, pauza i wznowienie, sygnał i pulsowanie na końcu, „Zrobione”.

### Background
Ćwiczenia na czas (np. plank) mają cel czasu, od którego timer odlicza do zera. Przy planku trzeba odłożyć telefon i przyjąć pozycję, stąd stałe 3 s przygotowania. W T1 plank działa tymczasowo jak ćwiczenie na powtórzenia. Źródło: `requirements.md`.

### Scope
- In:
  - odliczanie nie rusza samo po wejściu na ekran; „Start” → 3 s „Przygotuj się” z sygnałem na 3, 2 i 1 → odliczanie od celu do zera (FR13);
  - na koniec osobny sygnał końca odliczania, pulsowanie ekranu jak w T1 i czekanie na „Zrobione”; „Zrobione” działa też w trakcie odliczania;
  - pauza i wznowienie w przygotowaniu i w odliczaniu (D43);
  - odliczanie od znacznika końca, przeliczane po powrocie do aplikacji (BR6);
  - (S) sygnały 3-2-1 przed końcem odliczania (FR17).
- Out:
  - przełącznik sygnałów 3-2-1 w ustawieniach (→ T9);
  - ustawienie długości przygotowania (poza zakresem, D30).

### Changes by Repo
| Repo | Change | Notes |
|---|---|---|
| training-buddy | ekran ćwiczenia na czas, timer przygotowania i odliczania, sygnały | rozszerza timer i dźwięk z T1 |

### Acceptance Criteria
- [ ] AC6: Given plank, when wejdę na jego ekran, then odliczanie nie rusza; po „Start” widzę 3 s „Przygotuj się” z trzema sygnałami, potem odliczanie od 45 s do zera, sygnał i pulsowanie, a ekran czeka na „Zrobione”.
- [ ] Given trwające odliczanie, when dotknę „Zrobione”, then krok się kończy i startuje przerwa.
- [ ] Given przygotowanie albo odliczanie, when dotknę pauzy, then czas stoi; po wznowieniu liczy dalej od tego miejsca.
- [ ] Given trwające odliczanie, when zablokuję ekran na 30 s i wrócę, then pozostały czas jest poprawny.

### Edge Cases
- Odliczanie skończyło się w tle → po powrocie stan końca (sygnał, pulsowanie, „Zrobione”), jak EC6 dla przerwy.

### Decisions
- D2: cel czasu ustawiany w ćwiczeniu i w pozycji treningu; timer odlicza od celu do zera.
- D15: koniec odliczania: sygnał i czekanie na „Zrobione”.
- D29: pulsowanie także na końcu odliczania.
- D30: odliczanie po „Start”, stałe 3 s „Przygotuj się” z sygnałami 3-2-1.
- D43: pauza działa w przygotowaniu i odliczaniu.

### Implementation Notes
- Ten sam mechanizm `endsAt` / pauza co przerwa; stan pauzy będzie zapisywany w sesji w T9.

### Rollout
- Wdrożenie po merge; bez flag.

### Open Items
- Brak.

---

## T3 — Tryb obwodu i przerwy zapisane w treningu

**Jira:** —
**Type:** Story
**Set:** MVP · **Size:** M
**Blocked by:** T1 (merged)
**Wave:** 2

### Value
Jako ćwiczący mogę w podglądzie wybrać tryb klasyczny albo obwód i ustawić długości przerw, a aplikacja zapamiętuje je w treningu po zamknięciu.

**Demo:** w podglądzie FBW A przełącz na obwód, zmień przerwę między rundami, przeładuj aplikację (ustawienia zostały), przejdź trening: 4 rundy, w rundzie 4 tylko podciąganie i dipy.

### Background
Trening można wykonywać po kolei (wszystkie serie ćwiczenia, potem następne) albo w obwodzie (runda = jedna seria każdego ćwiczenia). Każdy tryb ma własne przerwy. Ten ticket wprowadza też zapis danych na urządzeniu, na którym opierają się kolejne tickety. Źródło: `requirements.md`.

### Scope
- In:
  - warstwa danych (FR40): IndexedDB przez `idb-keyval`, baza `training-buddy` wspólna dla aplikacji i (później) Service Workera, Zustand `persist`; ekran powitalny do czasu wczytania danych; walidacja przy odczycie z powrotem do wartości domyślnych; wersja schematu i migracje per klucz; (S) gdy IndexedDB niedostępne: praca w pamięci i baner, że dane nie zostaną zapisane;
  - przełącznik trybu w podglądzie i ustawienia przerw dla wybranego trybu: stepper ±15 s (w obwodzie ±5 s), zakres 0–10 min; każdy tryb pamięta własne wartości; zapis w treningu, także wbudowanym (FR8, D17);
  - zapisana wersja FBW A/B (to samo id) ma pierwszeństwo przed wersją z kodu (BR11, część);
  - generator obwodu (BR2) i położenie „Runda 2/4 · Ćwiczenie 3/5” na ekranie ćwiczenia (FR10); typy przerw „między ćwiczeniami w rundzie” i „między rundami” na ekranie przerwy (FR18);
  - (S) przerwa na zmianę strony, domyślnie 0 s = bez timera; ekran przerwy „Zmiana nogi” / „Zmiana strony” (FR9);
  - (S) szacowany czas treningu na karcie i w podglądzie (na żywo): kroki ćwiczeń × 40 s dla powtórzeń lub cel dla czasu, plus suma przerw (FR5).
- Out:
  - edycja ćwiczeń w FBW A/B i „Przywróć domyślne” (→ T5);
  - ustawienia aplikacji (→ T7).

Generator obwodu (BR2): dla rundy r = 1..max(liczba serii), dla każdego ćwiczenia z co najmniej r seriami, dla strony: krok ćwiczenia; przerwy: zmiana strony, między ćwiczeniami w rundzie, między rundami po ostatnim ćwiczeniu rundy. FBW A: 20 kroków ćwiczeń, 4 rundy, runda 4 to podciąganie i dipy; 13 przerw w rundach, 3 między rundami.

Przerwy domyślne:

| Tryb | Przerwa | Domyślnie |
|---|---|---|
| Klasyczny | między seriami | 90 s |
| Klasyczny | między ćwiczeniami | 120 s |
| Obwód | między ćwiczeniami w rundzie | 30 s |
| Obwód | między rundami | 120 s |
| Oba | zmiana strony | 0 s (bez timera) |

### Changes by Repo
| Repo | Change | Notes |
|---|---|---|
| training-buddy | warstwa danych IndexedDB, podgląd z trybem i przerwami, generator obwodu, szacowany czas | warstwa danych używana przez T5–T11 |

### Acceptance Criteria
- [ ] AC3 (obwód): Given FBW A w trybie obwodu, when go przejdę, then jest 20 kroków ćwiczeń, a bułgarski przysiad pokazuje w każdej rundzie lewą i prawą nogę.
- [ ] AC4: Given FBW A w trybie obwodu, when dojdę do rundy 4, then są w niej tylko podciąganie i dipy.
- [ ] AC14 (część): Given zmieniony tryb i przerwy treningu, when przeładuję aplikację, then zostają.
- [ ] Given zmiana trybu na obwód i z powrotem, then przerwy trybu klasycznego są takie jak przed zmianą.
- [ ] Given przerwa ustawiona na 0 s, when skończę krok, then od razu widzę następny krok.

### Edge Cases
- EC22: uszkodzone dane w IndexedDB → wartości domyślne, aplikacja się nie wywraca; IndexedDB niedostępne → praca w pamięci z banerem (S).

### Decisions
- D1: oba tryby w MVP, wybierane per trening.
- D3: zmiana strony bez timera; opcjonalna przerwa (S).
- D12: przerwy domyślne (tabela wyżej).
- D13: dane w IndexedDB (`idb-keyval`), wspólne dla aplikacji i Service Workera.
- D17: każdy tryb pamięta własne przerwy.

### Implementation Notes
- Walidacja przy odczycie (np. `zod`), ta sama później przy imporcie (T10).
- Format `persist` (`{ state, version }`) będzie czytany przez Service Worker w T11.
- Ćwiczenia i treningi pod jednym kluczem `library`, żeby operacje na obu zapisywały się w jednym kroku (T6).
- Dwie otwarte karty: wygrywa ostatni zapis.

### Rollout
- Pierwsza wersja schematu danych (`version: 1`); kolejne tickety dodają migracje.

### Open Items
- Brak.

---

## T4 — Sterowanie sesją: wstecz, lista kroków, pominięcie, zakończenie

**Jira:** —
**Type:** Story
**Set:** MVP · **Size:** M
**Blocked by:** T2 (merged; ten sam ekran ćwiczenia), T3 (merged; generator obwodu)
**Wave:** 3

### Value
Jako ćwiczący mogę cofnąć pomyłkowe „Zrobione”, przeskoczyć do dowolnego kroku (np. gdy sprzęt jest zajęty), pominąć serię i zakończyć trening wcześniej, a postęp i podsumowanie to uwzględniają.

**Demo:** w FBW A cofnij serię „Wstecz”; z listy przeskocz z podciągania seria 1 do dipów seria 1 (podciąganie oznaczone jako pominięte); zrób dipy, wróć z listy do podciągania seria 2, zrób je i zobacz powrót do dipów seria 2; zakończ trening wcześniej i zobacz podsumowanie bez konfetti.

### Background
Wymagania pozwalają poprawiać przebieg treningu w trakcie: cofnąć się o serię, skoczyć do dowolnego kroku z listy, pominąć serię albo przerwać trening. Reguły nawigacji ustalono tak, żeby aplikacja nie zmuszała do przeklikiwania serii już zrobionych. Źródło: `requirements.md`.

### Scope
- In:
  - status każdego kroku ćwiczenia: do zrobienia, zrobiony, pominięty; postęp = (zrobione + pominięte) / wszystkie kroki ćwiczeń (BR4);
  - nawigacja (BR5): po zakończeniu kroku następny jest pierwszy w kolejności krok do zrobienia; przerwa przed nim to przerwa stojąca w wygenerowanej liście bezpośrednio przed tym krokiem (brak albo 0 s → bez przerwy); brak kroków do zrobienia → ukończenie;
  - „Wstecz” cofa o jeden krok ćwiczenia (seria albo strona; z pierwszej serii do ostatniego kroku poprzedniego ćwiczenia); w przerwie wraca do kroku właśnie zakończonego (FR14);
  - lista kroków jako panel z ekranu sesji, ze statusami; dotknięcie przenosi bez potwierdzenia; przy skoku do przodu bieżący krok i kroki do zrobienia przed wybranym stają się pominięte; skok w trakcie przerwy anuluje przerwę (FR15);
  - „Zakończ trening” w menu z potwierdzeniem; systemowe „wstecz” w sesji też pyta (FR16); po potwierdzeniu podsumowanie bez konfetti i „Wróć do startu” (FR21);
  - podsumowanie pokazuje serie zrobione i pominięte (FR20);
  - (S) „Pomiń serię” oznacza bieżący krok jako pominięty i przechodzi dalej jak po „Zrobione”; łączny czas treningu widoczny w sesji (FR17).
- Out:
  - zapis i wznowienie sesji po zamknięciu (→ T9);
  - data ostatniego treningu przy zakończeniu (→ T11).

### Changes by Repo
| Repo | Change | Notes |
|---|---|---|
| training-buddy | model sesji ze statusami kroków, nawigacja, „Wstecz”, panel listy kroków, menu „Zakończ trening”, podsumowanie wcześniejszego zakończenia | działa w obu trybach |

### Acceptance Criteria
- [ ] AC7 (część): Given seria 2, when dotknę „Wstecz”, then wracam do serii 1 tego ćwiczenia.
- [ ] AC8: Given FBW A, podciąganie seria 1, when z listy kroków wybiorę dipy seria 1, then podciąganie serie 1–4 są oznaczone jako pominięte, a pasek postępu je wlicza.
- [ ] AC9: Given sytuacja z AC8 po zrobieniu dipów seria 1, when wybiorę z listy podciąganie seria 2 i dotknę „Zrobione”, then po przerwie aplikacja pokazuje dipy seria 2, a podciąganie seria 2 jest zrobione.
- [ ] AC10 (pominięte): Given trening z pominiętymi seriami, when dojdę do końca, then podsumowanie pokazuje liczbę zrobionych i pominiętych serii.
- [ ] AC11: Given trwający trening, when wybiorę „Zakończ trening” i potwierdzę, then widzę podsumowanie bez konfetti i „Wróć do startu”.
- [ ] Given sesja, when użyję systemowego „wstecz”, then aplikacja pyta o potwierdzenie zamiast wyjść.
- [ ] Nawigacja działa tak samo w trybie klasycznym i w obwodzie.

### Edge Cases
- EC1: skok listą do przodu → bieżący krok i kroki do zrobienia pomiędzy stają się pominięte i liczą się w postępie; aplikacja nie wraca do nich sama.
- EC2: skok wstecz do pominiętego kroku i jego wykonanie → aplikacja przechodzi do pierwszego kroku do zrobienia, z przerwą według BR5.
- EC3: „Wstecz” i ponowne „Zrobione” → aplikacja przechodzi do pierwszego kroku do zrobienia, bez przechodzenia przez zrobione.
- EC4: po zakończeniu kroku zostały tylko kroki zrobione lub pominięte → ukończenie z konfetti; podsumowanie pokazuje pominięte.
- EC5: skok listą w trakcie przerwy → przerwa anulowana, od razu wybrany krok.

### Decisions
- D25: „Wstecz” cofa o jedną serię lub stronę.
- D26: lista kroków ze skokiem do dowolnego kroku w MVP.
- D27: kroki ominięte skokiem do przodu są pominięte; liczą się w postępie; aplikacja do nich nie wraca sama.
- D28: po kroku wybranym z listy lub cofniętym aplikacja idzie do pierwszego niewykonanego kroku.
- D32: wcześniejsze zakończenie: podsumowanie bez konfetti, potem „Wróć do startu”.
- D46: lista kroków jako panel, dotknięcie bez potwierdzenia.
- D47: skok w trakcie przerwy anuluje przerwę.

### Implementation Notes
- Statusy kroków w stanie sesji zamiast samego `skipped[]` ze szkicu spec; przerwa przed następnym krokiem brana z wygenerowanej listy.
- Testy jednostkowe nawigacji (BR4, BR5) dla obu trybów.

### Rollout
- Wdrożenie po merge; bez flag.

### Open Items
- Brak.

---

## T5 — Własne treningi i edycja FBW A/B

**Jira:** —
**Type:** Story
**Set:** MVP · **Size:** M
**Blocked by:** T3 (merged; warstwa danych)
**Wave:** 3

### Value
Jako ćwiczący mogę ułożyć własny trening z wbudowanych ćwiczeń, zmienić FBW A pod siebie i w każdej chwili przywrócić jego domyślną wersję.

**Demo:** utwórz trening „Góra” z podciągania, dipów i pompek z własnymi seriami i celami; uruchom go; w FBW A zmień serie planku, przeładuj (zmiana została), „Przywróć domyślne”.

### Background
Poza wbudowanymi FBW A i FBW B użytkownik ma tworzyć własne treningi. Serie i cel są domyślne w ćwiczeniu i zmieniane w pozycji treningu. FBW A/B są edytowalne, ale nieusuwalne. Ten ticket używa tylko wbudowanych ćwiczeń; własne dochodzą w T6. Źródło: `requirements.md`.

### Scope
- In:
  - konfigurator treningów, wejście z ekranu startowego; własne treningi na liście startowej (FR3);
  - tworzenie i edycja (FR25): nazwa wymagana, 1–40 znaków, unikalna wśród własnych treningów bez rozróżniania wielkich liter; tryb (domyślnie klasyczny); ćwiczenia z biblioteki (na razie wbudowane) z filtrem kategorii; pozycja ma serie 1–10 i pełny cel (zakres powtórzeń 1–100 albo zakres czasu 5–600 s z celem w zakresie), startowo z ćwiczenia (D41); kolejność ↑/↓; usuwanie pozycji; zapis wymaga co najmniej 1 ćwiczenia; usuwanie treningu z potwierdzeniem;
  - FBW A/B edytowalne jak własne, nieusuwalne; „Przywróć domyślne” z potwierdzeniem wraca do wersji z aplikacji (ćwiczenia, serie, cele, tryb, przerwy) i usuwa zapisaną wersję; nazwa tłumaczona, dopóki użytkownik jej nie zmieni (FR26, BR11);
  - (S) „Duplikuj” trening: nazwa z dopiskiem „(kopia)”, kolejne „(kopia 2)” itd. (BR10); drag & drop; to samo ćwiczenie może wystąpić w treningu więcej niż raz (FR27).
- Out:
  - własne ćwiczenia, usuwanie ćwiczeń i trening „Brak ćwiczeń” (→ T6).

### Changes by Repo
| Repo | Change | Notes |
|---|---|---|
| training-buddy | konfigurator treningów (lista, edytor, walidacja), FBW A/B edycja i przywracanie, duplikowanie | dane pod kluczem `library`; migracja schematu, jeśli potrzebna |

### Acceptance Criteria
- [ ] AC13: Given zmieniony FBW A, when przeładuję aplikację, then zmiany zostają; when dotknę „Przywróć domyślne” i potwierdzę, then FBW A wraca do wersji domyślnej.
- [ ] AC14 (część): Given własne treningi, when przeładuję aplikację, then zostają.
- [ ] Given własny trening z wbudowanych ćwiczeń, when go uruchomię, then mogę go przejść z ustawionymi seriami i celami.
- [ ] Given trening „Góra”, when utworzę drugi o nazwie „góra”, then formularz pokazuje błąd unikalności.
- [ ] Given próba zapisu treningu bez ćwiczeń, then zapis jest zablokowany z komunikatem.
- [ ] Given zmieniona nazwa FBW A, when przełączę język, then nazwa zostaje taka, jak wpisana.

### Edge Cases
- EC21: drugi duplikat tego samego treningu → nazwa z dopiskiem „(kopia 2)”.

### Decisions
- D5: serie i cel domyślne w ćwiczeniu, zmieniane w pozycji treningu.
- D6: FBW A/B edytowalne, z „Przywróć domyślne”, nieusuwalne.
- D41: pozycja ma pełny cel z regułami formularza ćwiczenia.
- D42: duplikat z dopiskiem „(kopia)”, „(kopia 2)”…; nazwa nietłumaczona.
- D45: nazwy własnych treningów unikalne bez rozróżniania wielkich liter.

### Implementation Notes
- Zapisana wersja FBW A/B ma to samo id co wbudowana i flagę `builtIn: true`.

### Rollout
- Wdrożenie po merge; migracja schematu danych, jeśli model `library` się zmienia.

### Open Items
- Brak.

---

## T6 — Własne ćwiczenia

**Jira:** —
**Type:** Story
**Set:** MVP · **Size:** M
**Blocked by:** T5 (merged; reguły działają na treningach)
**Wave:** 4

### Value
Jako ćwiczący mogę dodać własne ćwiczenie (kategoria, nazwa, serie, powtórzenia albo czas z celem, jednostronne), użyć go w treningu i bezpiecznie je zmieniać lub usuwać.

**Demo:** dodaj „Wiosłowanie australijskie”, wstaw do treningu „Góra” i przejdź go; zmień typ ćwiczenia na czas (potwierdzenie, cel w treningu zmienia się na domyślny); usuń ćwiczenie, które jest jedynym w treningu (trening oznaczony „Brak ćwiczeń”).

### Background
Biblioteka ćwiczeń ma wbudowane ćwiczenia (tylko do odczytu) i własne. Zmiany własnych ćwiczeń wpływają na treningi, które ich używają; reguły ustalono tak, żeby nie gubić konfiguracji i nie zostawiać bezsensownych celów. Źródło: `requirements.md`.

### Scope
- In:
  - biblioteka: lista pogrupowana według kategorii, wbudowane oznaczone i tylko do odczytu (FR22);
  - formularz:

    | Pole | Reguły |
    |---|---|
    | Nazwa | Wymagana, 1–50 znaków, unikalna wśród własnych ćwiczeń bez rozróżniania wielkich liter. |
    | Kategoria | Wymagana: Pull / Push / Nogi / Tył uda i pośladki / Core. |
    | Typ | Powtórzenia albo Czas. |
    | Liczba serii | 1–10. |
    | Zakres powtórzeń | min 1–100, max ≥ min; gdy min = max, jedna liczba („10 powt.”). |
    | Zakres czasu | 5–600 s, max ≥ min; podpowiedź przy ćwiczeniu. |
    | Cel czasu | Wymagany dla typu Czas, w zakresie, domyślnie minimum; od niego odlicza timer. |
    | Jednostronne | Przełącznik „na nogę / na stronę”. |

  - edycja (FR23): zmiana nazwy, kategorii lub flagi „jednostronne” obejmuje wszystkie treningi; zmiana domyślnych serii i celu nie zmienia istniejących pozycji; zmiana typu ćwiczenia użytego w treningach wymaga potwierdzenia („Użyte w N treningach — cel zostanie zastąpiony domyślnym”), cel pozycji zmienia się na nowy domyślny, serie zostają;
  - usuwanie (FR23): lista treningów z tym ćwiczeniem i potwierdzenie; ćwiczenie znika z biblioteki i z treningów; trening bez ćwiczeń zostaje z oznaczeniem „Brak ćwiczeń” i nieaktywnym „Start” (FR3); w edytorze trzeba dodać ćwiczenie przed zapisem;
  - własne ćwiczenia dostępne w edytorze treningu z T5 (FR25);
  - (S) „Duplikuj” wbudowane ćwiczenie jako własne, nazwa w bieżącym języku z „(kopia)”, kolejne „(kopia 2)” (FR24, BR10).
- Out:
  - edycja wbudowanych ćwiczeń (tylko do odczytu, D18).

### Changes by Repo
| Repo | Change | Notes |
|---|---|---|
| training-buddy | biblioteka ćwiczeń, formularz z walidacją, propagacja zmian do treningów, usuwanie, duplikowanie | usunięcie ćwiczenia i jego pozycji jednym zapisem `library` |

### Acceptance Criteria
- [ ] AC12: Given biblioteka ćwiczeń, when dodam własne ćwiczenie, zbuduję z niego trening i go uruchomię, then mogę ten trening przejść.
- [ ] AC14 (część): Given własne ćwiczenia, when przeładuję aplikację, then zostają.
- [ ] AC17: Given trening złożony tylko z własnego ćwiczenia X, when usunę X i potwierdzę, then trening ma oznaczenie „Brak ćwiczeń” i nieaktywny „Start”.
- [ ] AC18: Given własne ćwiczenie na powtórzenia użyte w treningu, when zmienię typ na czas i potwierdzę, then pozycja ma nowy domyślny cel czasu i tę samą liczbę serii.
- [ ] Given zmiana nazwy ćwiczenia, then nowa nazwa jest widoczna we wszystkich treningach z tym ćwiczeniem.

### Edge Cases
- EC10: usunięcie ćwiczenia, które było jedynym w treningu → trening „Brak ćwiczeń”, „Start” nieaktywny; do zapisu w edytorze trzeba dodać ćwiczenie.
- EC12: zmiana typu ćwiczenia użytego w treningach → potwierdzenie; cel zastąpiony nowym domyślnym, serie bez zmian.
- EC21: drugi duplikat tego samego ćwiczenia → „(kopia 2)”.

### Decisions
- D2: cel czasu w ćwiczeniu i w pozycji treningu.
- D5: zmiana domyślnych serii i celu nie zmienia istniejących pozycji.
- D18: wbudowane ćwiczenia tylko do odczytu, z „Duplikuj”.
- D33: usunięcie ćwiczenia usuwa je z treningów; pusty trening zostaje jako „Brak ćwiczeń”.
- D34: zmiana typu z potwierdzeniem; cel pozycji → nowy domyślny, serie zostają.
- D42: nazwa duplikatu.

### Implementation Notes
- Ćwiczenia i treningi pod jednym kluczem `library`, więc usunięcie ćwiczenia razem z pozycjami to jeden zapis.

### Rollout
- Wdrożenie po merge; migracja schematu, jeśli model się zmienia.

### Open Items
- Brak.

---

## T7 — Ustawienia: język i dźwięk

**Jira:** —
**Type:** Story
**Set:** MVP · **Size:** S
**Blocked by:** T3 (merged; zapis ustawień)
**Wave:** 3

### Value
Jako ćwiczący mogę przełączyć język aplikacji między polskim i angielskim (wybór zostaje zapamiętany) i wyłączyć dźwięk.

**Demo:** w ustawieniach przełącz na EN (UI i nazwy wbudowanych ćwiczeń zmieniają się bez przeładowania), zamknij i otwórz aplikację (nadal EN); wyłącz dźwięk i dojdź do końca przerwy (brak sygnału, ekran pulsuje).

### Background
Aplikacja jest dwujęzyczna; w T1 język wynika z ustawień telefonu. Ten ticket dodaje ekran ustawień z przełącznikiem języka i dźwięku. Źródło: `requirements.md`.

### Scope
- In:
  - ekran ustawień, wejście z ekranu startowego;
  - język PL / EN zapisany w `settings`, przełączanie bez przeładowania (FR39, FR28);
  - dźwięk wł. / wył. (FR28);
  - (S) test dźwięku, reset danych z potwierdzeniem, wersja aplikacji (FR29, część).
- Out:
  - przełączniki sygnałów 3-2-1, wibracji i „Nie wygaszaj ekranu” (→ T9);
  - eksport i import (→ T10);
  - przypomnienia (→ T11).

### Changes by Repo
| Repo | Change | Notes |
|---|---|---|
| training-buddy | ekran ustawień, zapis języka i dźwięku, reset danych | klucz `settings` |

### Acceptance Criteria
- [ ] AC15: Given język PL, when przełączę na EN, then zmieniają się wszystkie teksty UI i nazwy wbudowanych ćwiczeń, bez przeładowania; po ponownym uruchomieniu nadal jest EN.
- [ ] AC14 (część): Given wybrany język, when przeładuję aplikację, then zostaje.
- [ ] Given dźwięk wyłączony, when kończy się przerwa, then sygnału nie ma, a ekran pulsuje.
- [ ] Given reset danych potwierdzony, then aplikacja wraca do stanu pierwszego uruchomienia.

### Edge Cases
- Brak.

### Decisions
- D13: dane w IndexedDB.

### Implementation Notes
- Język zapisany w `settings` będzie czytany przez Service Worker przy tekście powiadomień (T11).

### Rollout
- Wdrożenie po merge.

### Open Items
- Brak.

---

## T8 — Instalacja i offline

**Jira:** —
**Type:** Story
**Set:** MVP · **Size:** M
**Blocked by:** T3 (merged; zapis flag pierwszego uruchomienia)
**Wave:** 3

### Value
Jako ćwiczący mogę zainstalować aplikację na ekranie głównym i używać jej na siłowni bez internetu; na iPhonie aplikacja prowadzi mnie przez instalację, zanim zdążę skonfigurować treningi w Safari.

**Demo:** na Androidzie zainstaluj aplikację, włącz tryb samolotowy i przejdź FBW A. Na iPhonie otwórz adres w Safari (ekran „Zainstaluj aplikację”), dodaj do ekranu głównego, uruchom (ekranu instalacji brak), w trybie samolotowym przejdź trening. Wdróż nową wersję w trakcie sesji (komunikat, bez przeładowania).

### Background
Aplikacja ma działać w pełni offline po pierwszym uruchomieniu i być instalowalna. Na iOS Safari i aplikacja z ekranu głównego mają osobne dane *(inferred)*, więc kto skonfiguruje treningi w Safari, po instalacji zobaczy pustą aplikację. Zablokowany telefon może wstrzymać sygnał końca przerwy, stąd jednorazowa wskazówka. Źródło: `requirements.md`.

### Scope
- In:
  - manifest: `name` „Training Buddy”, `short_name` „TrainBuddy”, `display: standalone`, `orientation: portrait`, `start_url`, `scope`, `theme_color`, `background_color`; tymczasowe ikony „TB” na jednolitym kolorze motywu w rozmiarach 192, 512 i maskable; na iOS `apple-touch-icon`, meta `apple-mobile-web-app-*`, safe area (FR33);
  - Service Worker (`vite-plugin-pwa`, strategia `injectManifest` pod przypomnienia w T11) z precache całej aplikacji: HTML, JS, CSS, ikony, dźwięki, tłumaczenia; działa offline także przy uruchomieniu bez sieci (FR34);
  - aktualizacje: komunikat „Dostępna nowa wersja, odśwież”; nigdy samo przeładowanie w trakcie sesji; zignorowany komunikat → nowa wersja przy następnym uruchomieniu od zera (FR35);
  - pierwsze uruchomienie w Safari na iOS (nie z ekranu głównego): ekran „Zainstaluj aplikację” z instrukcją (Udostępnij → Do ekranu początkowego), ostrzeżeniem, że dane z przeglądarki nie przejdą do aplikacji, wskazówką z FR37 i opcją „Kontynuuj w przeglądarce”; w zainstalowanej aplikacji ekranu nie ma (FR36);
  - jednorazowa wskazówka przed pierwszym treningiem „Nie blokuj telefonu w trakcie treningu, inaczej sygnał może nie zagrać”; nie wraca, jeśli była na ekranie z FR36 (FR37);
  - (S) zachęta do instalacji na Androidzie (`beforeinstallprompt`), prośba `navigator.storage.persist()` (FR38).
- Out:
  - docelowa ikona (poza zakresem MVP, D38);
  - powiadomienia i `periodicsync` (→ T11).

### Changes by Repo
| Repo | Change | Notes |
|---|---|---|
| training-buddy | manifest, ikony, Service Worker z precache, komunikat aktualizacji, ekran instalacji na iOS, wskazówka przed pierwszym treningiem | flagi „widziano” w IndexedDB |

### Acceptance Criteria
- [ ] AC1: Given aplikacja zainstalowana na Androidzie i na iPhonie (iOS 18.4+), when włączę tryb samolotowy i ją uruchomię, then mogę przejść cały trening FBW A.
- [ ] AC20: Given iPhone, Safari, pierwsze uruchomienie, when otworzę aplikację, then widzę ekran „Zainstaluj aplikację” z ostrzeżeniem o danych i opcją „Kontynuuj w przeglądarce”; w aplikacji zainstalowanej ten ekran się nie pojawia.
- [ ] AC23: Given wdrożona aplikacja, when sprawdzę instalowalność, then manifest ma `short_name` „TrainBuddy” i ikony „TB” (192, 512, maskable), a Lighthouse potwierdza kryteria instalowalności.
- [ ] Given trwająca sesja i nowa wersja na serwerze, then pojawia się komunikat, a aplikacja się nie przeładowuje.
- [ ] Given pierwszy trening, when dotknę „Start”, then raz widzę wskazówkę „Nie blokuj telefonu…”; przy kolejnych treningach już nie.
- [ ] Lighthouse (Performance, Accessibility, Best Practices) ≥ 90; JS poniżej ok. 150 kB gzip; start z pamięci podręcznej poniżej 1 s.

### Edge Cases
- EC7 (część): ryzyko zablokowanego telefonu komunikowane wskazówką (FR37).
- EC19: nowa wersja w trakcie sesji → komunikat bez przeładowania; zignorowany → nowa wersja przy następnym uruchomieniu od zera.
- EC20: „Kontynuuj w przeglądarce” → dane zostają tylko w Safari i nie przejdą do aplikacji zainstalowanej później.

### Decisions
- D22: jednorazowa wskazówka przed pierwszym treningiem.
- D23: minimalna wersja iOS 18.4.
- D31: ekran „Zainstaluj aplikację” przy pierwszym uruchomieniu w Safari na iOS (zachęta do instalacji na iOS: M).
- D37: `short_name` „TrainBuddy”, `name` „Training Buddy”.
- D38: tymczasowa ikona „TB”.
- D44: zignorowana aktualizacja wchodzi przy następnym uruchomieniu od zera.

### Implementation Notes
- Kolor motywu i ikona „TB” do ustalenia przy implementacji.
- Przy hostingu w podkatalogu: zgodne `base`, `scope` i `start_url`.
- Sprawdzić na urządzeniu, że Safari i aplikacja z ekranu głównego mają osobne dane (także iOS 26+); wykrywanie trybu standalone (`navigator.standalone`, `display-mode`).

### Rollout
- Pierwsze wdrożenie Service Workera: od tej wersji aplikacja działa offline, a aktualizacje idą przez komunikat.

### Open Items
- Brak.

---

## T9 — Wygoda sesji: pauza, 3-2-1, wibracja, wznowienie

**Jira:** —
**Type:** Story
**Set:** Follow-up · **Size:** M
**Blocked by:** T4 (merged; model sesji ze statusami), T7 (merged; ekran ustawień)
**Wave:** 4

### Value
Jako ćwiczący mogę zatrzymać i wydłużyć przerwę, dostać ostrzeżenie 3-2-1 i wibrację przed jej końcem, a po zamknięciu aplikacji w trakcie treningu wrócić do niego tam, gdzie został przerwany.

**Demo:** w przerwie pauza, +15 s, sygnały 3-2-1, wibracja na Androidzie; zamknij aplikację w trakcie treningu, otwórz („Kontynuuj trening”), kontynuuj; spróbuj zacząć inny trening (pytanie o porzucenie).

### Background
Dodatki o priorytecie S, które poprawiają wygodę prowadzenia sesji: sterowanie przerwą, sygnały ostrzegawcze i trwałość sesji po zamknięciu aplikacji. Źródło: `requirements.md`.

### Scope
- In:
  - przerwa: sygnały 3-2-1 przed końcem, pauza i wznowienie, +15 s / −15 s, wibracja na koniec (tylko Android) (FR19);
  - przełączniki w ustawieniach: sygnały 3-2-1, wibracja (Android), „Nie wygaszaj ekranu podczas treningu” (domyślnie wł.) (FR29, FR32);
  - zapis sesji w IndexedDB przy każdej zmianie: snapshot treningu i ćwiczeń, statusy kroków, bieżący krok, `endsAt`, pauza, czas startu (FR31);
  - ekran startowy: baner „Kontynuuj trening” z opcją porzucenia; sesja starsza niż 12 h → propozycja porzucenia; start innego treningu (lub tego samego od nowa) → pytanie „Masz niedokończony trening X. Porzucić go i zacząć nowy?” z „Porzuć i zacznij” / „Anuluj” (FR4).
- Out:
  - data ostatniego treningu (→ T11).

### Changes by Repo
| Repo | Change | Notes |
|---|---|---|
| training-buddy | sterowanie przerwą, wibracja, przełączniki w ustawieniach, zapis i wznowienie sesji, baner i pytanie o porzucenie | klucz `session` |

### Acceptance Criteria
- [ ] AC19: Given zapisana niedokończona sesja, when uruchomię inny trening, then aplikacja pyta, czy porzucić poprzedni; „Anuluj” zostawia sesję.
- [ ] Given trening w trakcie przerwy, when zamknę aplikację i otworzę ją ponownie, then widzę „Kontynuuj trening”, a po wybraniu przerwa ma poprawny pozostały czas albo jest zakończona.
- [ ] Given pauza w przerwie, when zamknę i otworzę aplikację, then przerwa nadal jest zatrzymana z tym samym pozostałym czasem.
- [ ] Given przerwa, when dotknę +15 s, then pozostały czas rośnie o 15 s.
- [ ] Given sygnały 3-2-1 włączone, when do końca przerwy zostają 3 s, then słychać trzy krótkie sygnały; po wyłączeniu w ustawieniach ich nie ma.
- [ ] Given „Nie wygaszaj ekranu” wyłączone, when trwa sesja, then aplikacja nie trzyma blokady ekranu.

### Edge Cases
- EC11: usunięcie lub edycja ćwiczenia albo treningu przy zapisanej sesji → sesja bez zmian (snapshot).
- EC13: start treningu przy zapisanej sesji → pytanie; porzucona sesja nie ustawia daty ostatniego treningu.
- EC14: zapisana sesja starsza niż 12 h → propozycja porzucenia.

### Decisions
- D16: licznik czasu ponad przerwę (już w T1).
- D22: Wake Lock domyślnie włączony.
- D39: pytanie przed porzuceniem niedokończonej sesji.
- D43: pauza także w ćwiczeniu na czas (stan pauzy zapisywany w sesji).

### Implementation Notes
- Dwie otwarte karty zapisujące sesję: wygrywa ostatni zapis.
- Vibration API nie działa na iOS; przełącznik wibracji widoczny tylko tam, gdzie API istnieje.

### Rollout
- Migracja schematu: nowy klucz `session`.

### Open Items
- Brak.

---

## T10 — Kopia danych: eksport i import

**Jira:** —
**Type:** Story
**Set:** Follow-up · **Size:** S
**Blocked by:** T6 (merged; pełny model ćwiczeń i treningów), T7 (merged; ekran ustawień)
**Wave:** 5

### Value
Jako ćwiczący mogę zapisać kopię swoich ćwiczeń, treningów i ustawień do pliku i odtworzyć ją, np. po zmianie telefonu albo wyczyszczeniu danych przeglądarki.

**Demo:** eksport do pliku JSON, reset danych, import pliku: wszystko wraca 1:1; import pliku z nowszej wersji: komunikat i brak zmian.

### Background
Dane są tylko na urządzeniu i mogą zostać wyczyszczone (czyszczenie danych witryny, odinstalowanie aplikacji). Kopia do pliku to jedyna ochrona. Ustalono, że import zastępuje dane, a nie scala. Źródło: `requirements.md`.

### Scope
- In:
  - eksport do pliku JSON: ćwiczenia, treningi (ze zmienionymi FBW A/B), ustawienia; bez trwającej sesji i bez daty ostatniego treningu (BR12, FR30);
  - import: walidacja pliku, potwierdzenie, zastąpienie wszystkich danych; plik z nowszej wersji schematu odrzucany z komunikatem; niepoprawny plik odrzucany bez zmian w danych.
- Out:
  - przypomnienia w kopii: dochodzą razem z przypomnieniami w T11.

### Changes by Repo
| Repo | Change | Notes |
|---|---|---|
| training-buddy | eksport i import w ustawieniach, walidacja pliku, wersja schematu w pliku | ta sama walidacja co przy odczycie (T3) |

### Acceptance Criteria
- [ ] AC21 (bez przypomnień): Given dane i plik eksportu, when zresetuję dane i zaimportuję plik, then ćwiczenia, treningi i ustawienia wracają 1:1; plik z nowszej wersji jest odrzucony z komunikatem.
- [ ] Given niepoprawny plik, when go zaimportuję, then widzę komunikat, a dane się nie zmieniają.

### Edge Cases
- EC18: import pliku z nowszej wersji aplikacji albo uszkodzonego → odrzucony z komunikatem, dane bez zmian.

### Decisions
- D21: import zastępuje wszystkie dane po potwierdzeniu; zakres eksportu; plik z nowszej wersji odrzucany.
- D49: data ostatniego treningu nie trafia do eksportu.

### Implementation Notes
- Walidacja przez ten sam schemat co odczyt z IndexedDB (np. `zod`).
- Udostępnianie pliku na iOS: pobranie albo Web Share API; do sprawdzenia w zainstalowanej PWA.

### Rollout
- Wdrożenie po merge.

### Open Items
- Brak.

---

## T11 — Przypomnienia na Androidzie

**Jira:** —
**Type:** Story
**Set:** Follow-up (priorytet C) · **Size:** M
**Blocked by:** T5 (merged; treningi do przypisania), T8 (deployed; Service Worker), T10 (merged; kopia danych do rozszerzenia)
**Wave:** 6

### Value
Jako ćwiczący na Androidzie mogę ustawić dni i godziny treningów i dostać powiadomienie „Czas na trening”, chyba że tego dnia trening już się odbył.

**Demo:** na Androidzie (aplikacja zainstalowana) ustaw przypomnienie na dziś na godzinę, która minęła, z FBW A; po synchronizacji w tle przychodzi „Czas na trening: FBW A”; po ukończeniu treningu kolejnego dnia przypomnienie nie przychodzi. Na iPhonie przełączniki są nieaktywne z komunikatem.

### Background
Bez serwera nie da się wysłać powiadomienia o dokładnej godzinie. Ustalono wersję best effort tylko na Androidzie: przeglądarka sama decyduje, kiedy obudzić aplikację w tle (co ok. 12 h lub rzadziej, *inferred*), więc powiadomienie przychodzi po ustawionej godzinie, do północy. Źródło: `requirements.md`.

### Scope
- In:
  - ekran przypomnień w ustawieniach: dla każdego dnia tygodnia przełącznik, godzina i opcjonalny trening; zgoda na powiadomienia przy włączeniu pierwszego przypomnienia; wykrywanie wsparcia (Periodic Background Sync, aplikacja zainstalowana, zgoda) i nieaktywne przełączniki z wyjaśnieniem, gdy go brak; stały komunikat: „Przypomnienia działają tylko na Androidzie (Chrome, aplikacja zainstalowana na ekranie głównym). Na iPhonie nie zadziałają. Nie gwarantujemy dokładnej godziny: system może pokazać powiadomienie później.” (FR41);
  - Service Worker (`periodicsync`): powiadomienie tylko gdy dziś jest dzień z harmonogramu, minęła ustawiona godzina, a nie minęła północ (czas urządzenia), dziś nie było jeszcze powiadomienia i dziś nie było treningu; tekst „Czas na trening: FBW A” albo „Czas na trening”, gdy brak przypisania; tekst w języku z `settings`; dotknięcie otwiera aplikację (FR42);
  - usunięcie treningu czyści przypisanie w przypomnieniach (D40);
  - data ostatniego treningu zapisywana przy ukończeniu i przy zakończeniu przed czasem, nie przy porzuceniu (BR9, FR20, FR21);
  - przypomnienia w eksporcie i imporcie z T10 (BR12);
  - (C) wyróżnienie treningu zaplanowanego na dziś na ekranie startowym (FR6).
- Out:
  - Web Push, eksport do kalendarza, przypomnienia na iOS (poza zakresem, D7).

### Changes by Repo
| Repo | Change | Notes |
|---|---|---|
| training-buddy | ekran przypomnień, rejestracja `periodicSync`, logika w Service Workerze, data ostatniego treningu, przypomnienia w kopii | klucze `reminders`, `reminderState`; SW czyta format `persist` |

### Acceptance Criteria
- [ ] AC22: Given Android, aplikacja zainstalowana, zgoda na powiadomienia i przypomnienie na dziś na godzinę, która minęła, when system uruchomi synchronizację przed północą, then przychodzi „Czas na trening: <nazwa>”; jeśli trening ukończono dziś, powiadomienia nie ma; na iPhonie przełączniki są nieaktywne z komunikatem.
- [ ] AC21 (przypomnienia): Given przypomnienia i plik eksportu, when zresetuję dane i zaimportuję plik, then przypomnienia wracają.
- [ ] Given dwie synchronizacje tego samego dnia po godzinie przypomnienia, then powiadomienie przychodzi raz.

### Edge Cases
- EC15: synchronizacja po północy dnia przypomnienia → brak powiadomienia.
- EC16: trening ukończony albo zakończony przed czasem dziś przed godziną przypomnienia → brak powiadomienia tego dnia.
- EC17: przypomnienie przypisane do usuniętego treningu → zostaje, z tekstem „Czas na trening”.

### Decisions
- D7: przypomnienia tylko best effort na Androidzie, z informacją o iOS i braku gwarancji godziny.
- D35: okno do północy tego samego dnia (zastępuje D19).
- D36: brak przypomnienia, jeśli dziś był trening; zapisywana tylko data ostatniego treningu.
- D39: porzucona sesja nie ustawia daty ostatniego treningu.
- D40: przypomnienie dla usuniętego treningu zostaje z ogólnym tekstem.
- D49: data ostatniego treningu poza eksportem.

### Implementation Notes
- Data ostatniego treningu i ostatniego powiadomienia w `reminderState`; „dzień” w strefie czasowej urządzenia.
- `periodicSync.register('training-reminder', { minInterval: 1 h })`; częstotliwość ustala przeglądarka; sprawdzić na urządzeniu.
- Service Worker czyta `reminders`, `settings` i `library` z IndexedDB w formacie `persist` (`{ state, version }`).

### Rollout
- Migracja schematu: klucze `reminders` i `reminderState`; wersja pliku eksportu rośnie (stare pliki bez przypomnień nadal się importują).

### Open Items
- Brak.
