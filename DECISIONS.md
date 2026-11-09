# Decyzje podjęte podczas budowy MVP

Data: 2026-11-07. Zakres: tickety T1–T8 z `docs/tickets.md` (T9–T11 poza MVP). Dokument łączy pliki z `docs/decisions/*.md` (zostają na miejscu jako źródło). Zawiera tylko decyzje podjęte w trakcie budowy; decyzje produktowe D1–D50 są w `docs/requirements.md`. Duplikaty połączono, a wpisy zastąpione późniejszymi poprawkami opisano w ich aktualnej wersji.

Stan na koniec budowy: `npm run typecheck` bez błędów, `npm test` 141/141 (16 plików), `npm run build` OK, `npm run e2e` 11/11. JS: ok. 110,9 kB gzip w głównym chunku, ok. 117,9 kB gzip łącznie z chunkami ładowanymi dynamicznie (rejestracja SW, workbox-window, konfetti); budżet ~150 kB. Service Worker osobno: 5,5 kB gzip.

## Fundament

- **Wersje stacku** — React 19.3, Vite 8, TypeScript 7 (natywny kompilator, `tsc -b` działa), Zustand 5, Vitest 5, vite-plugin-pwa 2. Powód: aktualne stabilne wersje na dzień budowy.
- **Ostrzeżenia `npm audit`** — zostawione (dotyczą tylko zależności deweloperskich vite-plugin-pwa/workbox-build: glob, minimatch). Powód: `audit fix --force` cofnąłby vite-plugin-pwa do 1.x; nie trafiają do bundla.
- **Motyw** — ~~tylko ciemny (`color-scheme: dark`), bez wariantu jasnego.~~ Zastąpione 2026-11-08: jasny i ciemny motyw (sekcja na końcu). Powód: spójny, „sportowy” wygląd, pulsy kolorów sesji projektowane pod ciemne tło; jasny motyw podwoiłby testy kontrastu.
- **Paleta finalna** — bg #0B0F17, surface #141A24, elevated #1D2532 / #263042, tekst #F3F5F9 / #C5CCD8, muted #8B95A7; praca #FF5A1F→#FF8A3D (tekst #FF8A5C); przerwa #14D3C5→#38BDF8 (tekst #3EE0D4); sukces #A3E635; błąd #F43F5E (tekst #FB7185); kategorie: pull #4F8CFF, push #FF6B4A, legs #A06BFF, posterior #F5B83D, core #2DD4BF. Powód: kierunek projektu + jaśniejsze odcienie „-text” dla AA na małym tekście.
- **Tekst na wypełnionych akcentach** — ciemny (#0B0F17) na wszystkich przyciskach z gradientem. Powód: biały na #FF5A1F ma ok. 3,1:1 (poniżej AA), ciemny daje > 6:1.
- **Badge kategorii** — kolor + ikona SVG + etykieta, tło 16% koloru (`color-mix`). Powód: informacja nie tylko kolorem (WCAG), czytelność na ciemnym tle.
- **Ikony kategorii** — proste glify liniowe 24×24 w `CATEGORIES[...].iconPath` (dane w domenie, render w komponencie). Powód: bez emoji i zewnętrznych zasobów, domena bez Reacta.
- **Nawigacja** — własny store Zustand ze stosem ekranów (`{screen, key}`) i kierunkiem animacji, bez routera i URL-i ekranów. Powód: brak potrzeby deep linków, mniejszy bundle.
- **Systemowe „wstecz”** — model „pułapki”: wpis bazowy + jeden wpis-pułapka, gdy jest dokąd wrócić; popstate → `nav.back()`, w sesji pytanie o zakończenie, na ekranie końca → start. Powód: działa niezależnie od głębokości stosu. Koszt: po powrocie do startu przyciskiem w UI pierwsze systemowe „wstecz” nic nie robi.
- **startSession zastępuje podgląd** — `nav.startSession` robi `replace` podglądu (stos `[start, session]`), sesja powstaje przed wskazówką o blokadzie. Powód: wyjście z sesji/końca nigdy nie wraca do nieaktualnego podglądu.
- **Animacje ekranów** — tylko animacja wejścia (slide+fade, kierunek wg nawigacji), bez animacji wyjścia i bez View Transitions API. Powód: prostota i brak podwójnego renderu ekranów.
- **Fokus po zmianie ekranu** — `<main tabIndex=-1>` dostaje fokus (bez przewijania) przy każdej zmianie ekranu poza pierwszym renderem; przewinięcie na górę. Powód: czytniki ekranu ogłaszają nowy ekran.
- **i18n** — własny słownik: `core.ts` (bez Reacta) + `index.ts` (hooki); klucze `<namespace>.<klucz>`; liczba mnoga przez sufiksy `_one/_few/_many/_other` z `Intl.PluralRules`; brak klucza → PL → sam klucz. Powód: zero zależności, brak konfliktów między agentami.
- **Typowanie kluczy i18n** — brak (klucz to `string`); test pilnuje, że każdy klucz istnieje w PL i EN. Powód: szybkość; pliki namespace'ów edytowali różni agenci.
- **Formatowanie celu** — PL „powt.” bez odmiany (skrót), EN „rep/reps” z odmianą; dopisek „na nogę/na stronę” zależy od kategorii (`sideUnit`). Powód: przykłady z FR7.
- **Walidacja** — ręczne `sanitize*` / `validateTarget` zamiast zod; te same limity (`LIMITS`) w formularzach. Powód: budżet JS, prosty model.
- **Walidacja przy odczycie** — w `merge` persist złe wpisy odrzucane pojedynczo, ustawienia z fallbackiem per pole, własne ćwiczenia z id `builtin:*` odrzucane. Powód: EC22 — brak wywrotki, minimalna utrata danych.
- **Przechowywanie w IndexedDB** — obiekty (structured clone, po przejściu przez JSON), jeden magazyn `kv` w bazie `training-buddy`, klucze `library`, `settings`, `ui`. Powód: czytelne dla SW, brak podwójnego parsowania.
- **Klucz `ui`** — flagi `lockHintSeen` i `installScreenSeen` osobno od ustawień. Powód: to nie ustawienia użytkownika i nie trafią do eksportu (T10).
- **Brak IndexedDB** — adapter nigdy nie rzuca: przy błędzie lub braku odpowiedzi w 2,5 s przechodzi na pamięć i pokazuje baner. Powód: FR40 i ochrona przed zawieszeniem ekranu powitalnego.
- **Ekran powitalny** — czeka na hydratację wszystkich persistowanych store'ów, awaryjnie maks. 4 s. Powód: FR40, brak „wiecznego” splasha.
- **Model biblioteki** — w store tylko własne ćwiczenia, własne treningi i nadpisania FBW A/B (to samo id, `builtIn: true`, `nameKey`); wbudowane dane z kodu przez memoizowane selektory. Powód: BR11 („Przywróć domyślne” = usunięcie nadpisania).
- **Zmiana typu ćwiczenia** — `saveExercise` sam podmienia cele pozycji w treningach przy zmianie typu (powtórzenia ↔ czas); zmiana samego domyślnego celu nie rusza pozycji. Powód: D34/FR23 zawsze spójne.
- **Usuwanie ćwiczenia** — usuwa pozycje także z nadpisanych FBW A/B, w jednym `set()`. Powód: D33.
- **Unikalność nazw** — porównanie po `trim().toLocaleLowerCase()`, tylko wśród własnych (FBW A/B nie blokują nazw). Powód: FR22, D45.
- **Nazwa duplikatu** — „X (kopia)”, „X (kopia 2)”…, przyrostek z i18n (EN „copy”), potem stały; przy przekroczeniu limitu 40/50 znaków skracana jest nazwa źródła (`duplicateNameWithin`). Powód: BR10 i możliwość zapisu kopii bez ręcznej zmiany nazwy.
- **Szacowany czas** — `estimateWorkoutSec` liczy na wygenerowanych krokach (40 s na serię powtórzeń, cel dla czasu, plus przerwy), format „~N min”. Powód: FR5, ta sama logika co sesja.
- **Model kroków** — `WorkStep` ma gotowe pola etykiet (ćwiczenie N/M, seria, runda, strona, `workIndex`); w obwodzie numer ćwiczenia liczony w obrębie rundy; pozycje z nieznanym ćwiczeniem pomijane. Powód: FR10 bez liczenia w UI.
- **Model sesji (kontrakt)** — `ActiveSession.statuses` równoległa do `steps`, plus `phase` (`work|prepare|countdown|countdownDone|rest|restDone`), `endsAt`, `finishedAt`, `endedEarly`. Powód: BR4/BR5 i proste indeksowanie.
- **Toasty** — store `useToast` + `showToast()` i `<ToastHost/>` (maks. 3 naraz, 2,6 s). Powód: wspólny mechanizm potwierdzeń.
- **Modale** — własny `role="alertdialog"`/`dialog` w portalu (fokus na „Anuluj”, pułapka Tab, Esc, blokada przewijania, animacja wyjścia) zamiast `<dialog>`. Powód: przewidywalne zachowanie w jsdom i spójna animacja.
- **Testy komponentów** — `IS_REACT_ACT_ENVIRONMENT` i shimy `scrollTo`/`matchMedia` w `src/test/setup.ts`; aktualizacje store'ów w `await act(async …)`. Powód: synchroniczne `act` nie opróżnia kolejki w React 19.3.

## Sesja

- **Model sesji w silniku** — `EngineSession` rozszerza `ActiveSession` o `completedIndex` i `begun`; w przerwie `index` wskazuje krok przerwy, a następny krok to zawsze `index + 1`. Powód: przerwa z BR5 to krok stojący przed następnym na liście.
- **Silnik jako czyste funkcje** — `session/engine.ts` bez Reacta, `now` jako argument; store przed każdą akcją przelicza fazy z `endsAt`. Powód: pełne testy BR4/BR5/BR6 bez fałszywych timerów.
- **Fazy** — `work` (dla ćwiczenia na czas = czeka na Start), `prepare`, `countdown`, `countdownDone`, `rest`, `restDone`; pauza = `pausedRemainingMs` bez `endsAt`; koniec = `finishedAt` (+ `endedEarly`). Powód: zgodność z kontraktem fundamentu.
- **„Wstecz” poza przerwą** — przechodzi do poprzedniego kroku i nie zmienia statusów (chip „Zrobione wcześniej”). Powód: przypadkowe „Wstecz” nie kasuje wykonanej serii.
- **„Wstecz” w przerwie** — wraca do właśnie zakończonego kroku i przywraca jego status sprzed „Zrobione” (`completedPrevStatus`), także po zakończonej przerwie (`restDone`). Powód: BR4 i FR14 — wcześniejsza seria nie staje się pominięta.
- **Skok listą do przodu** — pomijane tylko kroki „do zrobienia” z zakresu [bieżący, wybrany); w przerwie „bieżący” = krok po przerwie; skok do następnego kroku tylko kończy przerwę. Powód: D27 bez utraty danych.
- **„Pomiń serię”** — na kroku już zrobionym status zostaje „zrobiony”; w przerwie pozycja menu nieaktywna. Powód: brak utraty danych; w przerwie jest „Pomiń przerwę”.
- **Przyciski w trakcie odliczania** — w przygotowaniu i odliczaniu miejsce „Wstecz” zajmuje „Pauza/Wznów”; przed „Start” i po odliczaniu „Wstecz” wraca. Powód: na małym ekranie trzy duże przyciski się nie mieszczą.
- **Ćwiczenie na czas przed „Start”** — główny „Start”, nad nim mniejsze „Wstecz” i „Zrobione” (odhaczenie bez timera). Powód: FR13 — odliczanie nie rusza samo, ale timer nie jest obowiązkowy.
- **Czas treningu** — liczony od pierwszego pokazania ekranu sesji, nie od „Start” w podglądzie. Powód: wskazówka o blokadzie (FR37) nie wlicza się do czasu.
- **Liczenie serii w podsumowaniu** — seria = (pozycja, numer serii); jednostronna zrobiona, gdy obie strony zrobione; „niewykonane” tylko po wcześniejszym zakończeniu i gdy > 0; „Ćwiczenia” = X z Y z co najmniej jednym zrobionym krokiem. Powód: FBW A ma 17 serii (20 kroków), jak w podglądzie.
- **Czas w podsumowaniu** — mm:ss (h:mm:ss ≥ 1 h) od `startedAt` do `finishedAt`. Powód: BR8/D48.
- **Data ostatniego treningu (BR9)** — nie jest zapisywana. Powód: dotyczy tylko przypomnień (T11).
- **Trwałość sesji** — sesja tylko w pamięci. Powód: zapis i wznowienie to T9.
- **Dźwięk generowany** — Web Audio (oscylatory z obwiednią), bez plików: beep 880 Hz (3-2-1), koniec przerwy = rosnący akord (~1,1 s), koniec odliczania = podwójny „ding” + niski „punch”. Powód: offline bez zasobów, trzy różne sygnały (BR7).
- **Odblokowanie audio** — `createSession()` (synchronicznie z „Start” w podglądzie) tworzy/wznawia AudioContext i gra cichy bufor; zapasowy nasłuch `pointerdown`/`keydown` w sesji. Powód: iOS wymaga gestu.
- **Tryb audio iOS** — `navigator.audioSession.type = 'ambient'` przed utworzeniem kontekstu, gdy API istnieje. Powód: D24 — miksowanie z muzyką.
- **Planowanie sygnałów** — sygnały bieżącego timera planowane z góry na zegarze AudioContext; plan z kluczem (faza, krok, `endsAt`) jest anulowany/przeplanowany przy każdej zmianie i po powrocie z tła. Powód: niezależność od throttlingu timerów JS.
- **Fallback po powrocie z tła** — jeśli koniec minął przy ukrytej stronie, a AudioContext nie grał, sygnał końca gra od razu po powrocie. Powód: EC6 bez podwójnego sygnału na Androidzie.
- **3-2-1 przed końcem przerwy** — niezaimplementowane. Powód: FR19 to S w T9.
- **Odświeżanie UI** — 200 ms przy działającym timerze (pierścień z przejściem 220 ms), 1 s w pozostałych stanach. Powód: płynny pierścień bez rAF i bez obciążania baterii.
- **Wake Lock** — hook `useWakeLock` na ekranie sesji, gdy `keepScreenOn` i sesja trwa; ponowne pobranie po `visibilitychange`; cicho pomijany bez API lub przy odmowie. Powód: FR32/D50, EC9.
- **Światy kolorów** — praca = żarowy pomarańcz, przerwa = turkus/błękit, crossfade dwóch warstw (700 ms); koniec timera pulsuje pod treścią (przyciski i tekst ostre). Powód: faza widoczna z daleka, czytelność przycisków.
- **Animacje prowadzenia** — krok wjeżdża z prawej (cofnięcie z lewej), kaskada nagłówka, karta „Następnie” z opóźnieniem, pop 3-2-1, puls cyfry w ostatnich 3 s, limonkowy wybuch z ptaszkiem po „Zrobione”; przy reduced motion bez ruchu, puls jako stały kolor. Powód: poczucie prowadzenia przez trening.
- **Pasek „Potem” na ekranie ćwiczenia** — zapowiedź kroku po „Zrobione” (BR5) lub „Ostatni krok — dasz radę!”. Powód: prowadzenie także poza przerwą.
- **Menu sesji** — w nagłówku „Lista kroków” i „⋯” (arkusz: Pomiń serię, Lista kroków, Zakończ trening). Powód: lista kroków używana często (D26).
- **Lista kroków** — grupowana po ćwiczeniach (klasyczny) lub rundach (obwód); status ikoną + tekstem; bieżący krok podświetlony i przewinięty na środek. Powód: informacja nie tylko kolorem.
- **Potwierdzenie zakończenia** — „Zakończyć trening?” z „Ćwiczę dalej” / „Zakończ”, ten sam dialog dla menu i systemowego „wstecz”. Powód: FR16, jeden wzorzec.
- **Konfetti** — dynamiczny import `canvas-confetti`, wybuch + 1,2 s „armatek” w kolorach motywu; przy reduced motion jeden mały wybuch; raz na sesję. Powód: budżet JS i FR20.
- **Sprzątanie sesji** — „Wróć do startu” czyści sesję; po systemowym „wstecz” z ekranu końca sesja zostaje w pamięci do następnego startu. Powód: brak efektów czyszczących przy odmontowaniu (StrictMode).

## Ekran startowy, podgląd i ustawienia

- **Nagłówek startu** — własny pasek z logo (błyskawica na pomarańczowym gradiencie), nazwą i ikoną ustawień zamiast `ScreenHeader`. Powód: start to „wizytówka”, bez „wstecz”.
- **Sekcja powitalna** — pozdrowienie zależne od pory dnia, tytuł „Gotowy na trening?” ze słowem w gradiencie i dwie rozmyte, dryfujące kule światła (stoją przy reduced motion). Powód: energia bez rozpraszania.
- **Karta treningu** — nazwa, chip trybu (klasyczny pomarańczowy, obwód turkusowy), chip „Wbudowane”, statystyki „5 ćwiczeń · 17 serii · ~42 min”, kropki kategorii, okrągły „play”, pasek akcentu w kolorze pierwszej kategorii. Powód: FR3 + FR5 jednym spojrzeniem.
- **Liczba serii na karcie** — suma serii pozycji, bez rozbijania na strony. Powód: tak użytkownik myśli o planie.
- **Pusty trening na starcie** — karta z przerywaną ramką i chipem „Brak ćwiczeń”; dotknięcie otwiera edytor treningu, nie podgląd. Powód: najkrótsza droga do naprawy.
- **Wejście do konfiguratora** — osobny wiersz „Ćwiczenia i treningi” pod listą treningów. Powód: widoczne, ale podrzędne wobec kart.
- **Dostępne nazwy kart** — karty bez `aria-label`; nazwą dostępną jest cała treść karty. Powód: WCAG 2.5.3 „label in name”.
- **Podgląd: statystyki** — trzy kafle (ćwiczenia, serie, czas wyróżniony pomarańczowo), wartość „wskakuje” przy zmianie; kolumny `1.15fr 1fr 1.3fr`. Powód: FR5 „na żywo”, etykiety bez ucinania.
- **Przełącznik trybu** — własny `Segmented` (radiogroup, strzałki) z kciukiem na sprężynie, pomarańczowy/turkusowy, pod spodem zdanie o trybie. Powód: kolor podpowiada charakter trybu.
- **Zapis trybu i przerw** — każda zmiana od razu przez `library.updateWorkout` (dla FBW tworzy nadpisanie), bez „Zapisz”, z dopiskiem o natychmiastowym zapisie. Powód: FR8/D17.
- **Format przerw** — `m:ss`; 0 s jako „Brak”, dla zmiany strony „Bez timera”. Powód: czytelność, FR9.
- **Krok steppera przerw** — ±15 s w klasycznym, ±5 s w obwodzie (także zmiana strony wg aktywnego trybu); zakres 0–600 s. Powód: FR8.
- **Stepper zmiany strony** — tylko gdy trening ma ćwiczenie jednostronne. Powód: inaczej nic nie zmienia.
- **Kolejność sekcji podglądu** — statystyki → tryb → przerwy → plan → „Edytuj trening” → przyklejony „Start”. Powód: decyzje w zasięgu kciuka, „Start” zawsze widoczny.
- **Plan jako oś czasu** — numerowane kółka w kolorze kategorii połączone linią, badge, zapis serii; w obwodzie liczba rund przy nagłówku. Powód: poczucie „ścieżki”, FR7.
- **Przycisk „Start”** — 60 px, gradient pracy, „oddychająca” poświata; nieaktywny przy pustym treningu (wtedy komunikat i „Edytuj trening”). Powód: zaproszenie do akcji, FR3/FR8.
- **Edycja z podglądu** — ołówek w nagłówku i przycisk „Edytuj trening” pod planem. Powód: szybki dostęp z obu miejsc.
- **Brakujący trening w podglądzie** — „Nie znaleziono treningu.” z „wstecz”. Powód: brak wywrotki po usunięciu.
- **Ustawienia: zakres** — język PL/EN (natychmiast), dźwięk, „Test dźwięku”, informacja o przełączniku wyciszenia (D24), „Nie wygaszaj ekranu” (domyślnie wł.), reset danych, wersja; bez 3-2-1 i wibracji (T9). Powód: zakres T7.
- **Przełącznik (switch)** — cały wiersz jest celem dotyku (`role="switch"`), włączony = limonkowy tor. Powód: cel ≥ 48 px, odróżnienie od akcentów pracy/przerwy.
- **Test dźwięku** — `home/beep.ts` deleguje do `playTest('restEnd')` z `session/audio.ts`, gra także przy wyłączonym dźwięku; bez Web Audio toast z błędem. Powód: wspólny AudioContext odblokowuje też audio sesji na iOS, a test gra ten sam sygnał co w treningu.
- **Reset danych** — dialog „danger”, reset store'ów, `clear()` całego `kv` (limit 2,5 s) i `location.reload()`. Powód: obejmuje przyszłe klucze, gwarantuje stan pierwszego uruchomienia.
- **Wersja aplikacji** — import `version` z `package.json`. Powód: bez zmian w `vite.config.ts`; Vite wycina tylko użyte pole.
- **Style obszaru** — jeden `screens/home/home.css`, keyframes z prefiksem `home-`, animacje wyłączone przy reduced motion. Powód: brak konfliktów z innymi obszarami.

## Konfigurator

- **Logika formularzy poza komponentami** — parsowanie, walidacja i budowanie obiektów w `src/screens/config/forms.ts` (czyste funkcje z testami); bez nowych akcji w `stores/library.ts` poza `duplicateNameWithin`. Powód: łatwe testy, mało zmian w fundamencie.
- **Pola liczbowe jako tekst** — `type="text"` z `inputMode="numeric"` i `pattern="[0-9]*"`, surowy tekst (cyfry, maks. 4). Powód: klawiatura numeryczna i brak „skakania” liczby przy czyszczeniu pola.
- **Cel czasu podąża za minimum** — dopóki cel = minimum zakresu, zmiana minimum zmienia cel; po ręcznej zmianie już nie. Powód: FR22 „domyślnie minimum zakresu”.
- **Domyślne wartości** — nowe ćwiczenie: Pull, 3 serie, 8–12 powt.; Czas: 30–60 s, cel 30 s; formularz pamięta wartości obu typów. Powód: rozsądny start, przełączanie nie gubi liczb.
- **Typ celu pozycji = typ ćwiczenia** — w edytorze treningu typu pozycji nie da się zmienić. Powód: typ wynika z ćwiczenia (D34).
- **Kiedy pokazywać błędy** — zakresy na żywo, nazwa po pierwszej edycji, „Podaj nazwę”/„Dodaj co najmniej jedno ćwiczenie” po próbie zapisu; nieudany zapis = shake, przewinięcie do błędu, komunikat. Powód: nie krzyczeć na pustym formularzu.
- **Nazwa FBW A/B w edytorze** — pole wstępnie wypełnione tłumaczeniem; zapis bez zmiany lub pusty zostawia nazwę tłumaczoną (bez sprawdzania unikalności), inna wartość staje się nazwą własną i musi być unikalna. Powód: BR11, D45, AC13.
- **Zapis bez zmian nie tworzy nadpisania** — „Zapisz” w niezmienionym formularzu tylko wraca do listy. Powód: FBW nie dostaje fałszywego „Zmieniony”.
- **„Przywróć domyślne”** — tylko dla FBW z zapisanym nadpisaniem („Zmieniony”). Powód: przywracanie niezmienionego nic nie robi.
- **Odrzucanie zmian** — „wstecz” w nagłówku i systemowy „wstecz” przy niezapisanych zmianach pytają „Odrzucić zmiany?” (systemowy przez strażnika z obszaru Integracja). Powód: formularz nie ginie po cichu.
- **Przerwy w edytorze treningu** — edytor nie pokazuje przerw (są w podglądzie); nowy trening dostaje domyślne. Powód: jedno miejsce edycji przerw (FR8).
- **Picker ćwiczeń** — po wyborze dodaje na końcu z domyślnymi seriami, zamyka arkusz, podświetla i przewija nową pozycję, toast „Dodano …”. Powód: prosty, przewidywalny przepływ.
- **Bez drag & drop** — kolejność tylko ↑/↓ z animacją FLIP (wyłączona przy reduced motion); FR27 pominięty. Powód: czas MVP i niezawodność na dotyku.
- **Usuwanie ćwiczeń tylko w edytorze** — z potwierdzeniem i listą treningów (FR23); trening można usunąć z listy i z edytora. Powód: usunięcie ćwiczenia ma skutki kaskadowe.
- **Duplikowanie także własnych ćwiczeń** — „Duplikuj” przy każdym ćwiczeniu; duplikat wbudowanego otwiera edytor kopii. Powód: spójnie z treningami.
- **Wbudowane ćwiczenie tylko do odczytu** — ten sam formularz z zablokowanymi polami, notką i „Duplikuj”. Powód: widać szczegóły, D18 zachowane.
- **Zakładka konfiguratora zapamiętana** — zakładka i podświetlenie ostatnio zapisanego wiersza w nietrwałym store `configUi`. Powód: powrót z edytora na tę samą zakładkę.
- **Licznik „w N treningach”** — przy własnym ćwiczeniu. Powód: kontekst przed zmianą typu lub usunięciem.
- **Akcent wiersza treningu** — pasek w kolorze kategorii pierwszego ćwiczenia, kropki kategorii pozycji. Powód: spójność z badge'ami (FR1).
- **Szerokość arkusza pickera** — arkusz `width: 100vw` (z `max-width`), pasek filtrów `contain: inline-size`. Powód: szeroki rząd chipów rozpychał arkusz poza ekran.

## PWA

- **Ścieżka bazowa** — `base: './'`, `start_url`/`scope`/`id` = `./`, SW `./sw.js` ze scope `./`. Powód: działa pod dowolną ścieżką hostingu statycznego.
- **Brak tras URL** — fallback nawigacji serwuje `index.html`, ale głębokie ścieżki offline nie załadują assetów. Powód: nawigacja stanowa, jedynym adresem jest `./`.
- **Service Worker** — `injectManifest` + `precacheAndRoute`, `cleanupOutdatedCaches`, `NavigationRoute` na `index.html`, `SKIP_WAITING`, `clientsClaim()`. Powód: offline od pierwszej instalacji, aktualizacje czekają na zgodę.
- **Zakres precache** — js, css, html, svg, png, ico, woff2, mp3, wav, ogg, json; `includeManifestIcons: false`. Powód: komplet offline bez podwójnych wpisów.
- **Przeładowanie po „Odśwież”** — własne przeładowanie na `controllerchange` (awaryjnie po 3 s), `onNeedReload` pusty. Powód: plugin nie przeładowywał przy aktualizacjach wykrytych później.
- **Sprawdzanie aktualizacji** — przy starcie i po powrocie na pierwszy plan, nie częściej niż co 30 min, tylko online. Powód: bez interwału w tle (bateria).
- **Komunikat o aktualizacji** — baner u góry z „Odśwież” i „Później”; „Później” chowa go do następnego uruchomienia; zachowanie w sesji opisane w „Poprawki po review”. Powód: FR35/D44 — nigdy przeładowania w trakcie sesji.
- **SW w dev i testach** — rejestracja pomijana w `DEV` i `test`, `virtual:pwa-register` ładowany dynamicznie. Powód: brak cache przy developmencie.
- **Wykrywanie iOS** — iPhone/iPad/iPod w UA albo `MacIntel` z `maxTouchPoints > 1`; standalone = `navigator.standalone` lub `display-mode`. Powód: iPadOS podaje UA desktopowy.
- **Ekran instalacji we wszystkich przeglądarkach iOS** — poza trybem standalone. Powód: od iOS 16.4 Chrome/Edge też instalują przez „Udostępnij”, problem osobnych danych ten sam.
- **Instrukcja „Udostępnij”** — wspomina, że w nowym Safari trzeba najpierw dotknąć „⋯”. Powód: w kompaktowym Safari (iOS 26) przycisk jest w menu.
- **Routing do ekranu instalacji** — App po hydratacji woła `shouldShowInstallScreen()` (`!installScreenSeen && isIosBrowser()`). Powód: jeden mechanizm, bez podwójnej nawigacji.
- **„Kontynuuj w przeglądarce”** — ustawia `installScreenSeen` i `lockHintSeen`, potem `nav.reset()`. Powód: FR37 — wskazówka już była na ekranie instalacji.
- **Kolejność na ekranie instalacji** — ostrzeżenie o danych zaraz pod wstępem, wskazówka FR37 na końcu. Powód: D31 widoczne bez przewijania.
- **Ekran wskazówki (lockHint)** — ma „wstecz” (wskazówka nie oznaczona jako widziana), animowana ilustracja telefonu i 3 krótkie porady. Powód: przyjazne prowadzenie z możliwością wycofania.
- **Zachęta do instalacji na Androidzie** — `beforeinstallprompt` przechwycony, własny chip „Zainstaluj aplikację” renderowany inline na starcie. Powód: subtelna zachęta, nie zasłania przycisków na dole.
- **Odrzucenie chipu** — w `localStorage` (`tb.installChipDismissed`). Powód: kosmetyczna flaga, Chrome i tak ogranicza prompt.
- **`navigator.storage.persist()`** — raz na uruchomienie przy pierwszym wejściu w lockHint/sesję, pomijane gdy już przyznane. Powód: moment zaangażowania.
- **Ikony** — monogram „TB” ze ścieżek, ciemne litery na gradiencie ember; warianty any, maskable (78%), apple-touch-icon 180 px; generator `scripts/gen-icons.mjs` z `@resvg/resvg-js`. Powód: D38 — tymczasowe ikony w kolorze marki.
- **Nowe devDependencies** — `@resvg/resvg-js`, jawnie `workbox-routing` i `workbox-core`. Powód: bezpośrednie importy w `src/sw.ts`.
- **index.html** — `color-scheme: dark`, inline tło `#0B0F17`, meta `apple-mobile-web-app-*`, favicony, `<noscript>`. Powód: brak białego błysku przy starcie.

## Integracja

- **Strażnicy systemowego „wstecz”** — `app/backGuard.ts` (stos LIFO), `history.ts` pyta ich przed nawigacją: otwarty arkusz/dialog się zamyka, edytor z niezapisanymi zmianami pyta o odrzucenie. Powód: Android „wstecz” nie gubi formularza.
- **Pułapka historii przy modalu na starcie** — przy aktywnym strażniku wpis „trap” także na ekranie startowym. Powód: „wstecz” zamyka dialog zamiast wychodzić z aplikacji.
- **Siatka modali** — `.modal-root` ma `grid-template-columns: minmax(0, 100%)`. Powód: szeroka zawartość nie rozpycha arkusza; poprawka w fundamencie zamiast obejść.
- **Parzystość tłumaczeń** — test sprawdza, że każdy klucz (bez form mnogich) istnieje w PL i EN. Powód: wcześniej tylko `common` i `session`.
- **Pasek akcji sesji** — przyciski bez zawijania, mniejszy padding, na ≤ 380 px mniejsza czcionka. Powód: „Pomiń przerwę” łamało się przy 390 px.
- **E2E: Playwright** — `@playwright/test` 1.65, `e2e/playwright.config.ts`, `npm run e2e` (build + `vite preview` na 4173); viewport iPhone 13 w Chromium, UA Androida, `pl-PL`, `reducedMotion: 'reduce'`. Powód: UA iOS kierowałby na ekran instalacji, który ma osobny test.
- **E2E: zegar** — pełny trening używa `page.clock`. Powód: prawdziwy timer bez czekania minut.
- **E2E: dodatkowe scenariusze** — systemowy „wstecz” (arkusz → dialog odrzucenia, koniec sesji), jednorazowy ekran instalacji na iOS, układ na niskim telefonie. Powód: ścieżki zmienione w integracji i po review.
- **tsconfig dla e2e** — `e2e/tsconfig.json` w referencjach głównego `tsconfig.json`. Powód: `typecheck` sprawdza też specy.
- **E2E a strażnik podwójnego dotknięcia** — specy odczekują `REPEAT_COMPLETE_GUARD_MS + 100` ms między akcjami. Powód: Playwright klika szybciej niż człowiek; błędny był test, nie aplikacja.
- **E2E: czekanie na zapis przed przeładowaniem** — helper `waitForStored` czyta bazę `training-buddy`/`kv` przed `reload()`. Powód: przeładowanie kilka ms po dotknięciu przerywało zapis (flaky).
- **E2E: stary serwer podglądu** — przed uruchomieniem zatrzymany stary `vite preview` na 4173; `reuseExistingServer` poza CI zostaje. Powód: stary serwer mógł serwować nieaktualny build.

## Poprawki po review

- **Komunikat o nowej wersji w sesji** — na `session` i `lockHint` baner informacyjny („Trening trwa dalej — odświeżysz po jego zakończeniu.”) tylko z „Później”, znika po 8 s; po sesji wraca wersja z „Odśwież”. Powód: FR35/D44 zabraniają przeładowania, nie komunikatu (EC19); zastępuje wpis „ukryty w sesji” z `docs/decisions/pwa.md`.
- **Sygnały końca przerwy/czasu** — wspólny klucz planu dla rest→restDone i prepare→countdown→countdownDone; anulowanie nie ucina grającego sygnału; minione sygnały nie grają ponownie po pauzie ani powrocie z tła. Powód: ucięty dzwonek i powtórki po pauzie.
- **Odblokowanie audio po przerwaniu** — `AudioContext.onstatechange`: wyjście z `running` instaluje nasłuch dotknięcia, powrót przelicza plan sygnałów; to samo w `schedule()` i po powrocie z tła. Powód: BR7 — po telefonie/Siri reszta sesji mogła być cicha.
- **Ochrona przed podwójnym dotknięciem** — jedno okno 400 ms dla wszystkich akcji sesji zmieniających stan, liczone od ostatniej skutecznej akcji; ptaszek tylko, gdy „Zrobione” zadziałało. Powód: przyciski różnych pasków leżą w tych samych miejscach (zastępuje wcześniejszą ochronę tylko dla „Zrobione”/„Pomiń serię”).
- **Odmiana „rep/reps” i postępu** — EN `target.reps` z `_one/_other` wg maksimum zakresu; `session.progressValue` odmieniane po łącznej liczbie kroków („1 z 1 kroku”, „0 z 20 kroków”). Powód: poprawna odmiana liczebników.
- **Układ sesji na niskich telefonach** — pierścień `min(248px, 34dvh)` (≤ 740 px: 30dvh), mniejsze odstępy, bez podpowiedzi „Dotknij Start”, nieprzezroczysty pasek akcji; test e2e (j). Powód: „Potem” nachodziło na przyciski przy 375×667.
- **Kontrast podczas pulsu** — przy `.sx--alert` drobne teksty przechodzą na `--c-text`; intensywność pulsu bez zmian. Powód: WCAG AA na pomarańczowym/turkusowym tle.
- **„Potem” przy ćwiczeniach jednostronnych** — pokazuje stronę następnego kroku (chip). Powód: FR11 — bez strony wyglądało jak powtórka.
- **Cele dotyku ≥ 48 px** — przełącznik w edytorze ćwiczenia ma obszar 68×48 px, „Usuń z treningu” i zamknięcie toastu `--tap-min`. Powód: dostępność bez zmiany wyglądu.

## Znane ograniczenia / do sprawdzenia na urządzeniu

Fakty platformowe przyjęte jako wnioski (*inferred*), do weryfikacji na prawdziwym iPhonie i Androidzie:

- **Blokada ekranu na iOS** — zablokowana lub schowana PWA jest wstrzymywana (timery i dźwięk stoją), więc sygnał końca przerwy może nie zagrać (EC7, ryzyko przyjęte w D22; użytkownik dostaje wskazówkę FR37).
- **Wake Lock na iOS** — w zainstalowanej PWA ma działać od ok. iOS 18.4 (D23); sprawdzić, czy ekran nie gaśnie w trakcie przerwy 90 s i czy blokada wraca po powrocie do aplikacji.
- **Osobne dane Safari i aplikacji z ekranu głównego** — założone (D31), niesprawdzone na iOS 26+; potwierdzić, że ostrzeżenie na ekranie instalacji jest nadal prawdziwe.
- **Miksowanie dźwięku z muzyką** — `navigator.audioSession.type = 'ambient'` ma grać na muzyce bez jej zatrzymywania (D24) i jest wyciszany przełącznikiem; sprawdzić na iOS z muzyką w tle i na Androidzie.
- **Ostrzeżenie builda** — „inlineDynamicImports option is deprecated” pojawia się, bo vite-plugin-pwa 2 działa na Vite 8; nieszkodliwe.
- **Niesprawdzone na prawdziwym urządzeniu** — dźwięk i jego odblokowanie na iOS, Wake Lock, pełnoekranowy puls, instalacja na ekranie głównym. EC7 (brak sygnału przy zablokowanym iPhonie) to przyjęte ryzyko.
- **Asynchroniczny zapis ustawień** — zapis do IndexedDB jest asynchroniczny, więc zmiana kilka ms przed zabiciem aplikacji może przepaść; realnie mało prawdopodobne, obsłużone w testach e2e, nie w aplikacji.
- **Poza zakresem MVP (niezbudowane)** — wznowienie sesji, pauza, ±15 s, wibracje, 3-2-1 przed końcem przerwy (T9), eksport/import (T10), przypomnienia (T11), drag & drop kolejności (FR27, zamiast tego strzałki ↑/↓).
- **Pozostałości poprzednich przebiegów** — w katalogu głównym są `.review/`, `.review-pwa-check.tmp.mjs` i `test-results/`; nie były ruszane.
- **Nieaktualny wpis w `docs/decisions/pwa.md`** — nadal mówi, że baner aktualizacji jest ukryty w sesji; nieedytowany (plik innego obszaru), zastąpienie zapisane w `docs/decisions/fixes.md` i w sekcji „Poprawki po review” powyżej.
- **Odzyskiwanie audio po przerwaniu** — pokryte tylko testem jednostkowym z fałszywym AudioContext; na iOS wznowienie poza dotknięciem zależy od wersji systemu. Koniec przerwy/czasu, który w całości wypada w trakcie przerwania na pierwszym planie (telefon, Siri), nie jest odtwarzany później — przyjęte w ramach EC7.
- **Strażnik podwójnego dotknięcia (400 ms)** — obejmuje wszystkie akcje sesji, więc dwie różne zamierzone akcje w odstępie < 400 ms też są gubione (np. „Pomiń przerwę”, zaraz potem „Zrobione”); specy e2e czekają między akcjami jak człowiek.
- **Układ ekranu kroku na czas** — zweryfikowany tylko 375×667 (zrzut i test e2e); 50-znakowa nazwa zawijana do 3 linii przy 360×780 nie była mierzona ponownie. Jeśli nadal się nie mieści, nieprzezroczysty pasek akcji zasłania nadmiar (bez nachodzenia tekstu), ale kartę trzeba przewinąć.
- **Kontrast pulsu** — drobne teksty przechodzą na kolor główny w trakcie pulsu, alfa pulsu bez zmian; kontrast liczony ręcznie, nie mierzony narzędziem.

## Rozszerzenie: plany z obciążeniem (2026-11-08)

Decyzje użytkownika: treningi z grupami (superserie / obwody) i przerwami per ćwiczenie; nowe kategorie Barki, Biceps, Triceps; „3–4 serie” → 3; stare FBW A/B z masą ciała zostają obok.

- **Wbudowane treningi** — 6: „FBW A”, „FBW B” (z obciążeniem), „FBW A · ekspres”, „FBW B · ekspres”, „FBW A · masa ciała”, „FBW B · masa ciała”. Stare id (`builtin:fbw-a/-b`) bez zmian, więc zapisane zmiany użytkownika w nich zostają; zmieniły się tylko ich tłumaczone nazwy. Nowe id: `builtin:fbw-{a,b}-weights`, `builtin:fbw-{a,b}-express`.
- **Model grup** — bez nowej struktury bloków: pozycja treningu dostała opcjonalne `linkNext` (wykonywana zaraz po niej następna pozycja) i `restSec` (własna przerwa). Kolejne połączone pozycje tworzą grupę: 2 = superseria, 3+ = obwód. Powód: zgodność wstecz bez migracji danych, mało zmian w sesji i walidacji.
- **Przebieg grupy** — rundy po jednej serii każdego ćwiczenia, bez przerwy w rundzie (poza zmianą strony), po rundzie przerwa = `restSec` ostatniej pozycji grupy; liczba rund = największa liczba serii w grupie. Ta sama przerwa także przed następnym ćwiczeniem.
- **Przerwa pojedynczego ćwiczenia** — `restSec` działa między seriami i przed następnym ćwiczeniem. Pozycje bez `restSec` zachowują się jak dotąd (przerwy z panelu treningu).
- **Tryb obwodu dla całego treningu** — ignoruje połączenia i przerwy per ćwiczenie (jak dotąd: jeden obwód z przerwami z panelu).
- **Przerwy z rozpiski** — „2,5–3 min” → 3:00, „3,5 min” → 3:30, „2 min” → 2:00, „2,5 min po obwodzie” → 2:30. Powód: górna granica zakresu przy ciężkich seriach 5×5; łatwo zmienić w podglądzie.
- **Zakres „5 × 5 (4–6)”** — cel zapisany jako zakres 4–6 powt. (aplikacja nie ma osobnej wartości docelowej dla powtórzeń).
- **Ćwiczenia jednostronne** — uginanie z hantlami z supinacją („na każdą rękę”) i podpór bokiem („45 s na stronę”) jako jednostronne; nowa jednostka strony „ręka” dla Barków, Bicepsa i Tricepsa („Lewa ręka”, „na rękę”, „Zmiana ręki”).
- **Warianty w nazwie** — „Martwy ciąg (klasyczny / sumo / trap bar)”, „Pompki / pompki na poręczach”, „Martwy ciąg rumuński (5 s opuszczania)” jako pojedyncze ćwiczenia. Uwagi z rozpiski (rozgrzewka, obciążenie przy podciąganiu, drążek lub poręcze, powolne opuszczanie) pokazywane w podglądzie i na ekranie ćwiczenia jako notatki (`noteKey`, tylko wbudowane).
- **Kategorie** — Facepull i wznosy w opadzie → Barki; wyciskanie stojąc → Barki; martwy ciąg (oba) → Tył uda i pośladki; podciąganie kolan → Core. Kolory: Barki #F472B6, Biceps #84CC16, Triceps #FACC15 (do tego ikona i nazwa, więc nie tylko kolor).
- **Podgląd** — grupy jako ramka „Superseria / Obwód · N rund”, przy każdym bloku z własną przerwą stepper „Przerwa po serii / po rundzie”. Gdy wszystkie bloki mają własne przerwy, panel przerw treningu w trybie klasycznym pokazuje tylko informację.
- **Edytor treningu** — przy pozycji przełącznik „Połącz z następnym ćwiczeniem” i stepper przerwy (na końcu bloku). Usunięcie ostatniego ćwiczenia grupy przenosi jej przerwę na poprzednie. Strzałki ↑/↓ przenoszą pozycję razem z jej połączeniem.
- **Ekran sesji** — etykieta „Superseria · Runda 1/3 · Ćwiczenie 4/8” / „Obwód · …”; dłuższe nazwy ćwiczeń mniejszą czcionką; lista kroków grupuje blok („Superseria · Uginanie + Wyciskanie francuskie”).

## Kolory ekranu ćwiczenia według kategorii (2026-11-08)

- **Ekran ćwiczenia** — tło (poświata), przycisk „Zrobione”, cel, pierścień odliczania, pasek postępu i pulsowanie na końcu odliczania biorą kolor kategorii bieżącego ćwiczenia (`CATEGORIES[...].work`: gradient + jaśniejszy wariant tekstu, AA na ciemnym tle). Pull niebieski, Push ember (dawny kolor pracy), Nogi fiolet, Tył uda i pośladki bursztyn, Core morski, Barki róż, Biceps limonka, Triceps żółty.
- **Płynne przejścia** — kolory pracy zarejestrowane przez `@property`, więc przy zmianie kategorii (np. superseria biceps → triceps) cały ekran przechodzi kolorem w ok. 0,65 s; przy ograniczeniu ruchu bez przejścia. Podczas przerwy przygotowany jest kolor następnego ćwiczenia, żeby po przerwie ekran od razu był w dobrym kolorze.
- **Przerwa** — zawsze spokojny, przygaszony błękit (mgła #7FA3C9 → #A6C1DE). Dotychczasowy turkus przerwy kolidował z kolorem Core (#2DD4BF), więc został zastąpiony błękitem o niskim nasyceniu, odróżnialnym od wszystkich (nasyconych) kolorów kategorii. Ten sam kolor w trybie obwodu w podglądzie, ramkach „Obwód” i na ekranie wskazówki o blokadzie.
- **Konfetti** — w kolorach kategorii zamiast ember/turkus.
- **Znana zbieżność** — kolor „zrobione” (limonka #A3E635) jest bliski kolorowi Bicepsa; status ma też ikonę ✓, więc informacja nie zależy tylko od koloru.

## Plany — grupy treningów (2026-11-08)

Decyzje użytkownika: nazwa „Plan”; wersje ekspresowe jako osobny plan; ekran startowy pokazuje plany i treningi spoza planów; plan podpowiada następny trening.

- **Model** — `Plan { id, builtIn, nameKey?, name?, workoutIds[] }`: plan tylko wskazuje treningi (trening może należeć do kilku planów; usunięcie planu nie usuwa treningów). Plany zapisane pod tym samym kluczem `library` co treningi; brak migracji (nowe pola są opcjonalne w walidacji).
- **Wbudowane plany** — „FBW · z obciążeniem” (FBW A, FBW B), „FBW · ekspres” (A, B), „FBW · masa ciała” (A, B). Edytowalne (nazwa, lista, kolejność), z „Przywróć domyślne”, nieusuwalne — jak wbudowane treningi.
- **Podpowiedź „Następny”** — zapamiętywany jest tylko ostatnio ukończony trening każdego planu i czas (`planLast`), bez historii. Następny = kolejny po nim w kolejności planu (po ostatnim znów pierwszy); treningi bez ćwiczeń są pomijane. Liczy się trening ukończony albo zakończony wcześniej z co najmniej jedną zrobioną serią; porzucenie bez serii nic nie zmienia. Ukończony trening jest zapisywany w każdym planie, który go zawiera.
- **Ekran startowy** — sekcja „Plany” (karta: nazwa, treningi w planie, „Następny: …”), pod nią „Pojedyncze treningi” — tylko treningi, które nie są w żadnym planie; sekcja ukryta, gdy jest pusta (a plany istnieją).
- **Ekran planu** — lista treningów planu jako karty; „Następny” wyróżniony, „Ostatnio zrobiony” oznaczony; ikona edycji planu.
- **Konfigurator** — trzy zakładki: Plany (domyślna), Treningi, Ćwiczenia (zakładki bez ikon, żeby zmieściły się na 360–390 px). Edytor planu: nazwa (1–40, unikalna wśród własnych planów bez rozróżniania wielkich liter), treningi z ↑/↓ i usuwaniem, „Dodaj trening” z listy wszystkich treningów (każdy raz na plan), zapis wymaga ≥ 1 treningu; duplikowanie planu „(kopia)”.
- **Usunięcie treningu** — znika też ze wszystkich planów; potwierdzenie wymienia te plany.
- **Poza zakresem teraz** — tworzenie nowego treningu bezpośrednio z edytora planu (najpierw tworzy się trening w zakładce Treningi); przypomnienia (T11) mogłyby kiedyś wskazywać plan zamiast treningu.

## Plan „Split góra/dół” (2026-11-08)

- **Plan** — wbudowany „Split góra/dół” (`builtin:plan-split-upper-lower`) z treningami „Split A · przyciąganie + nogi” i „Split B · wyciskanie + nogi”; rotacja A → B → A… jak w pozostałych planach. Na liście planów po planach FBW z obciążeniem i ekspres, przed planem z masą ciała.
- **Grafik tygodnia** — jako notatka planu na ekranie planu (nowe opcjonalne `noteKey` w planie, tylko wbudowane). Aplikacja nie pilnuje dni tygodnia; podpowiada tylko kolejny trening (A/B). Przypomnienia per dzień to T11.
- **Liczby z rozpiski** — jak w FBW z obciążeniem: „3–4 serie” → 3, „2,5–3 min” → 3:00, „5 × 5 (4–6)” → 5 serii po 4–6 powt.; „3 × 20” mountain climber i „4 × 20 (10 na stronę)” spięcia → cel 20 powt. (spięcia z notatką „Naprzemiennie: 10 na każdą stronę”, bez dzielenia na strony).
- **Ćwiczenia** — nowe: ściąganie drążka wyciągu górnego (Pull), martwy ciąg rumuński (Tył uda i pośladki; osobno od wariantu z 5 s opuszczania), wykroki (Nogi, na każdą nogę), uginanie na modlitewniku (Biceps), mountain climber (Core), wyciskanie hantli leżąc i rozpiętki (Push), wyciskanie hantli w siadzie (Barki), spięcia z naprzemiennym wznosem nóg (Core). Wykorzystane istniejące: podciąganie, wiosłowanie w opadzie, uginanie ze sztangą, wyciskanie stojąc, przysiad, dipy (w splicie 5 × 4–6 z notatką o obciążeniu / maszynie asystującej), wyciskanie francuskie sztangi, wznosy w opadzie.
- **Bez superserii** — rozpiska nie łączy ćwiczeń, więc każde ćwiczenie to osobny blok z własną przerwą.

## Plan „Push / Pull / Legs” (2026-11-08)

- **Plan** — wbudowany „Push / Pull / Legs” (`builtin:plan-ppl`) z treningami „PPL A · push”, „PPL B · pull”, „PPL C · nogi + brzuch”; rotacja A → B → C → A. Na liście planów po splicie góra/dół. Grafik (bloki 3 dni z rzędu, dzień przerwy, przykład dla 2 tygodni) jako notatka planu.
- **Liczby** — jak w pozostałych planach: „3–4 serie” → 3, „2,5–3 min” → 3:00, „5 × 5 (4–6)” → 5 × 4–6 powt.; ćwiczenia, które zwykle mają 3 × 8–12 (wyciskanie hantli w siadzie, wyciskanie francuskie sztangi, uginanie z hantlami z supinacją, martwy ciąg rumuński), w PPL mają 5 × 4–6 i 3:00 tylko w tych treningach (cel pozycji, nie zmiana ćwiczenia).
- **Obwód brzucha w PPL C** — podciąganie kolan (3 × 10) → scyzoryki (3 × 10) → podpór bokiem (3 × 30 s na stronę, lewa i prawa jako osobne kroki) bez przerw, 2:30 po każdej rundzie; po ostatniej rundzie koniec treningu.
- **Ćwiczenia** — nowe: chest press na maszynie (Push), wyprosty z linką wyciągu górnego (Triceps), poziome przyciąganie / wiosłowanie australijskie (Pull), wykroki z hantlami (Nogi, na każdą nogę; osobno od „Wykroków” ze splitu), uginanie podudzi (Tył uda i pośladki), scyzoryki (Core). „Wyciskanie francuskie sztangi w leżeniu na ławce” i „martwy ciąg rumuński (powolna faza negatywna)” to istniejące ćwiczenia z notatkami „W leżeniu na ławce.” i „Powolna faza negatywna.”.

## Jasny i ciemny motyw (2026-11-08)

Plan: `docs/plans/theme-light-dark.md`. Decyzje użytkownika: szybki przełącznik na ekranie startowym; kopia wyboru w `localStorage`; ekran treningu jasny jak reszta; manifest i ekran startowy instalacji zostają ciemne.

- **Wybór** — `Settings.theme`: `system` (domyślnie) / `light` / `dark`, w IndexedDB jak reszta ustawień. W ustawieniach sekcja „Wygląd” z „Systemowy · Jasny · Ciemny” i podpowiedzią „Jak w telefonie — teraz jasny/ciemny”. W trybie systemowym motyw zmienia się na żywo razem z telefonem.
- **Szybki przełącznik** — ikona słońce/księżyc w nagłówku ekranu startowego; przełącza na przeciwny do widocznego motyw jako wybór stały (powrót do „Systemowy” w ustawieniach).
- **Start bez mignięcia** — wybór jest kopiowany do `localStorage` (`tb-theme`, tylko `system/light/dark`; jedyny wyjątek od „dane tylko w IndexedDB”, IndexedDB zostaje źródłem prawdy). Skrypt w `index.html` ustawia `data-theme` i `theme-color` przed pierwszym malowaniem; `app/theme.ts` (`useThemeEffect`) utrzymuje je potem w zgodzie z ustawieniem i systemem.
- **Mechanizm** — CSS zna tylko rozstrzygnięty motyw: `<html data-theme="light|dark">`; ciemny to `:root`, jasny to `[data-theme='light']` nadpisujący wyłącznie kolory w `tokens.css`. Zmiana z UI płynnie przenika całą stronę (View Transitions API, 260 ms; bez animacji przy ograniczeniu ruchu).
- **Paleta jasna** — tło #F5F7FB, powierzchnie #FFFFFF / #EEF2F7 / #E2E8F0, tekst #0F172A / #334155 / #5B6B82, cienie chłodne i lżejsze.
- **Kontrast** — w jasnym motywie ciemniejsze odcienie dla tekstu w kolorach akcentów (praca #C2410C, przerwa #3B6A99, sukces #4D7C0F, błąd #BE123C, ostrzeżenie #B45309) i dla kategorii (np. Biceps #4D7C0F, Triceps #A16207, Core #0F766E); tekst odznak kategorii miesza kolor z czernią zamiast z bielą. Wypełnienia przycisków zostają jasne z ciemnym tekstem w obu motywach.
- **Ekran ćwiczenia** — gradient przycisku i pierścienia z koloru kategorii jak dotąd; tekst kategorii i duże cyfry celu biorą ciemniejszy wariant (`CATEGORIES[...].work.textLight`, `--grad-work-text`); pierścień w jasnym motywie zaczyna się od ciemniejszego odcienia; poświaty tła słabsze (`--glow-alpha` 0,6).
- **Kolory na stałe** — wszystkie kolory w CSS komponentów przeszły na tokeny (nowe: `--c-overlay`, `--c-dot-ring`, `--c-badge-tint`, `--c-warn`, `--c-warn-text`, `--c-ios-blue`, `--c-success-text`, `--c-success-deep`, `--grad-work-text`, `--glow-alpha`). Zasada w nagłówku `tokens.css`: nowy kolor = token z wartością dla obu motywów.
- **PWA** — `theme-color` w dwóch wariantach `media` (system) plus nadpisanie przy wyborze stałym; manifest (`theme_color` / `background_color`) zostaje ciemny.
- **Testy** — jednostkowe dla rozstrzygania motywu, zapisu i przełącznika; E2E: motyw systemowy i zmiana na żywo, wybór stały po przeładowaniu bez mignięcia, przełącznik na starcie, oraz automatyczny test kontrastu (`@axe-core/playwright`, reguła `color-contrast`) na ekranach: start, plan, podgląd, ćwiczenie, przerwa, koniec, ustawienia, konfigurator (plany, ćwiczenia, edytory) — w obu motywach. Stany pulsowania (koniec przerwy / odliczania) nie są objęte testem axe.
