# Requirements Review: Training Buddy — PWA do prowadzenia treningu

**Review ID:** req-2026-11-06-training-buddy
**Status:** Split into tickets
**Created:** 2026-11-06
**Last updated:** 2026-11-07
**Source synced:** spec `wymagania-pwa-trening.md` (draft v0.3, 2026-11-06)
**Product questions:** 0 draft, 0 for product, 0 answered (18 settled by user in rounds 1–5) — not posted

## Summary

### Sources
- Jira: N/A
- Linked: N/A
- Docs: `wymagania-pwa-trening.md` (draft v0.3; decyzje spec D1–D13 i 7 zaakceptowanych założeń przeniesione niżej jako D1–D20)
- Designs: N/A
- Tickets: `tickets.md` (obok tego pliku) — 11 ticketów, MVP T1–T8

### Goal
Osoba trenująca FBW z masą ciała ma na telefonie prowadzenie treningu: aplikacja pokazuje ćwiczenie i serię, odmierza przerwy z sygnałem końca i pokazuje postęp, także offline. Miara sukcesu: brak, z założenia (aplikacja prywatna, bez analityki, spec §1). Praktyczny test: FBW A i FBW B da się przejść na telefonie w trybie samolotowym bez patrzenia na zegarek.

### Actors
- Ćwiczący — jedyny użytkownik; konfiguruje ćwiczenia i treningi, prowadzi sesję. Brak kont i ról.
- Service Worker — działa w tle: offline, aktualizacje, przypomnienia (Android).

### Stated Requirements
- R1: PWA tylko frontend, mobile-first, instalowalna, w pełni offline po pierwszym uruchomieniu — spec §1, §7
- R2: Wbudowane treningi FBW A i FBW B z ćwiczeniami, seriami i celami z tabel — spec §4
- R3: Kategorie: Pull, Push, Nogi, Tył uda i pośladki, Core — spec §3, D8
- R4: Własne ćwiczenia: nazwa, kategoria, typ (powtórzenia / czas z zakresem i celem), liczba serii, jednostronne — spec §5.6
- R5: Własne treningi z biblioteki ćwiczeń: kolejność, serie i cel per pozycja, tryb — spec §5.7, D5
- R6: FBW A/B edytowalne, z „Przywróć domyślne”, nieusuwalne — spec §5.7, D6
- R7: Ekran startowy z listą treningów; podgląd (rozpiska) z ustawieniami przerw przed startem — spec §5.1, §5.2
- R8: Dwa tryby: klasyczny i obwód, każdy z własnymi przerwami — spec §5.2, §6.1, D1, D12
- R9: Ekran ćwiczenia: nazwa, cel, seria/runda; ćwiczenia jednostronne jako osobne kroki na każdą stronę — spec §5.3
- R10: Przerwa startuje sama po „Zrobione”, kończy się sygnałem, ekran czeka na „Dalej”; można ją pominąć — spec §5.4, D4
- R11: Ćwiczenie na czas odlicza od celu do zera, kończy się sygnałem i czeka na „Zrobione” — spec §5.3, D2
- R12: „Wstecz” do poprzedniego kroku ćwiczenia — spec §5.3 (oryginalne życzenie: „przejść w treningu do poprzedniego ćwiczenia”)
- R13: Postęp treningu widoczny w trakcie — spec §5.3
- R14: Po ukończeniu konfetti i gratulacje — spec §5.5
- R15: PL i EN, przełączane, wybór zapamiętany — spec §9
- R16: Dane tylko na urządzeniu, w IndexedDB — spec §10, D13
- R17: Przypomnienia: best effort, tylko Android, z informacją o iOS i braku gwarancji godziny — spec §8, D7
- R18: (S) Wznowienie sesji po zamknięciu aplikacji — spec §6.5
- R19: (S) Eksport i import danych do pliku JSON — spec §5.8
- R20: (S) Ekran nie gaśnie w trakcie treningu (Wake Lock) — spec §6.4

### Scope (as stated)
- In: R1–R20, priorytety M/S/C jak w spec.
- Out: konta i backend, historia treningów, Web Push, eksport do kalendarza, przypomnienia na iOS, filmy instruktażowe, integracje zdrowotne (spec §16).

## Current State

### Workspace
| Repo | Checked | Why relevant |
|---|---|---|
| `training-buddy` (nowe) | n/a — greenfield, jeszcze nie istnieje | cała aplikacja |
| repozytoria SpotMe | nie — nie dotyczy | projekt prywatny, poza platformą SpotMe |

### What Exists Today
Kodu nie ma. „Obecny stan” to zachowanie przeglądarek, na którym opierają się findings. Wszystkie punkty poniżej są do sprawdzenia na urządzeniach:
- **iOS** — zablokowana lub schowana PWA jest wstrzymana, timery i dźwięk nie działają *(inferred: znane zachowanie WebKit)*.
- **iOS** — Wake Lock w zainstalowanej PWA działa od ok. iOS 18.4 *(inferred: notatki wydania WebKit)*.
- **iOS** — Safari i aplikacja dodana do ekranu głównego mają osobne dane *(inferred: znane zachowanie WebKit, niesprawdzone na iOS 26+)*.
- **iOS** — dźwięk z Web Audio: zależnie od trybu sesji audio albo miesza się z muzyką i jest wyciszany przełącznikiem, albo przerywa muzykę *(inferred: Audio Session API w Safari)*.
- **Android/Chrome** — Periodic Background Sync uruchamia przeglądarka, rzadko (minimum ok. 12 h, zależnie od zaangażowania) *(inferred: dokumentacja web.dev)*.

### Impact Map
| Repo | Area | Change | Evidence |
|---|---|---|---|
| training-buddy | ekrany: start, podgląd, sesja, zakończenie, konfigurator, ustawienia | new | spec §5 |
| training-buddy | logika sesji: generator kroków, timer, dźwięk, wake lock | new | spec §6 |
| training-buddy | PWA: manifest, Service Worker, offline, aktualizacje | new | spec §7 |
| training-buddy | dane: IndexedDB, migracje, eksport/import | new | spec §10 |
| training-buddy | przypomnienia w Service Workerze | new | spec §8 |
| hosting statyczny (HTTPS) | wdrożenie | new | spec §7 |

## Findings
| ID | Type | Finding | Evidence | Value | Status |
|---|---|---|---|---|---|
| F1 | ambiguity | „Wstecz” cofa o jeden krok (serię lub stronę), a życzenie brzmiało „do poprzedniego ćwiczenia”. Przy cofaniu po serii powrót do poprzedniego ćwiczenia z serii 3 to 3+ dotknięcia; przy cofaniu po ćwiczeniu nie da się poprawić jednej pomyłkowej serii. | R12; spec §5.3 | middle | resolved by D25, D26 |
| F2 | risk | Sygnał końca przerwy wymaga aplikacji na wierzchu z włączonym ekranem. Zablokowana PWA na iOS jest wstrzymana *(inferred)*, więc sygnał nie zagra, a przy D4 („czekaj na Dalej”) użytkownik nie wie, że przerwa minęła. Spec nie mówi, czy to akceptujemy ani jak to komunikujemy. | R10, R20; spec §6.2–6.4 | high | accepted risk (D22) |
| F3 | conflict | Spec §12 obiecuje iOS 16.4+, a Wake Lock w zainstalowanej PWA działa od ok. 18.4 *(inferred)*. Na starszych iOS ekran gaśnie po czasie auto-blokady (często 30 s), krócej niż przerwa 90 s, i wpada w F2. | spec §6.4, §12 | middle | resolved by D23 |
| F4 | gap | Brak reguły, co ważniejsze: sygnał grający mimo przełącznika wyciszenia (może przy tym zatrzymać muzykę użytkownika) czy sygnał grający na muzyce (wyciszany przełącznikiem) *(inferred)*. Spec §6.3 zostawia „do sprawdzenia”. | R10; spec §6.3 | middle | resolved by D24 |
| F5 | gap | Koniec przerwy sygnalizuje tylko dźwięk i tekst. Przy wyłączonym dźwięku, wyciszonym iPhonie (F4) lub hałasie na siłowni nic nie przyciąga wzroku. | R10; spec §5.4 | middle | resolved by D29 |
| F6 | gap | Ćwiczenie na czas odlicza od razu po „Start”. Przy planku trzeba odłożyć telefon i przyjąć pozycję, więc pierwsze sekundy przepadają. | R11; spec §5.3 | middle | resolved by D30 |
| F7 | ambiguity | „Zakończ trening” przed końcem: nie wiadomo, czy pokazać podsumowanie z konfetti, podsumowanie bez konfetti, czy od razu ekran startowy. | R14; spec §5.3, §5.5 | middle | resolved by D32 |
| F8 | gap | Import kopii: nie wiadomo, czy zastępuje dane, czy je scala (kolizje id, duplikaty nazw), co obejmuje eksport (ustawienia, przypomnienia, trwająca sesja) i co z plikiem z nowszej wersji aplikacji. Zła odpowiedź oznacza utratę danych. | R19; spec §5.8, §10 | high | resolved by D21 |
| F9 | risk | Na iOS Safari i aplikacja z ekranu głównego mają osobne dane *(inferred)*. Kto skonfiguruje treningi w Safari, a potem zainstaluje aplikację, zobaczy ją pustą. Spec ma tylko „S: krótka instrukcja instalacji”. | R1, R16; spec §7 | middle | resolved by D31 |
| F10 | edge case | Usunięcie ćwiczenia może zostawić trening pusty. §5.6 przewiduje „ostrzeżenie”, §5.7 wymaga min. 1 ćwiczenia; brak decyzji, co z pustym treningiem po potwierdzeniu. | R4, R5; spec §5.6, §5.7 | middle | resolved by D33 |
| F11 | edge case | Zmiana typu własnego ćwiczenia (powtórzenia ↔ czas) użytego w treningach: pozycje zachowują stary cel (D5), więc ćwiczenie na czas miałoby w treningu cel „5–7 powt.”. | R4, R5; spec §5.6 | middle | resolved by D34 |
| F12 | conflict | Okno 6 h na przypomnienie (D19) a synchronizacja w tle uruchamiana przez Chrome co ≥ ok. 12 h *(inferred)*. Okno złapie synchronizację tylko w części dni, więc przypomnienia będą wyglądać na zepsute. | R17; spec §8; D19 | middle | resolved by D35 |
| F13 | gap | Przypomnienie przyjdzie także wtedy, gdy dzisiejszy trening jest już zrobiony: aplikacja nie zapisuje daty ukończenia (historia poza MVP, D9). | R17; spec §8; D9 | middle | resolved by D36 |
| F14 | gap | `short_name` i ikona są nieustalone (D20), a manifest z ikonami jest M i warunkiem instalowalności. | R1; spec §7; D20 | middle | resolved by D37, D38 |
| F15 | edge case | Start innego treningu, gdy jest zapisana niedokończona sesja: nie wiadomo, czy stara sesja znika po cichu. | R18; spec §6.5 | middle | resolved by D39 |
| F16 | ambiguity | Cel czasu w pozycji treningu: §5.6 wymaga celu w zakresie ćwiczenia, §5.7 dopuszcza dowolne 5–600 s. | R5; spec §5.6, §5.7 | low | resolved by D41 |
| F17 | edge case | „Duplikuj” wbudowane ćwiczenie: nazwa zostaje w bieżącym języku na stałe, a drugi duplikat łamie unikalność nazw. | spec §5.6, §9 | low | resolved by D42 |
| F18 | gap | Pauza jest tylko na ekranie przerwy; nie wiadomo, czy można zatrzymać odliczanie ćwiczenia na czas. | R11; spec §5.3, §5.4 | low | resolved by D43 |
| F19 | gap | Postęp liczy „wykonane kroki”; nie wiadomo, czy pominięte serie się wliczają. | R13; spec §5.3 | low | resolved by D27 |
| F20 | gap | Zignorowany komunikat o aktualizacji: nie wiadomo, kiedy nowa wersja wchodzi w życie. | spec §7 | low | resolved by D44 |
| F21 | gap | Przypomnienie z przypisanym treningiem, który został usunięty. | R17; spec §8 | middle | resolved by D40 |
| F22 | gap | Nazwy ćwiczeń mają regułę unikalności, nazwy treningów nie. | R5; spec §5.6, §5.7 | low | resolved by D45 |
| F23 | edge case | Skok listą do przodu omija kroki. Nie wiadomo, czy ominięte kroki liczą się jako pominięte (podsumowanie, postęp) i czy aplikacja później do nich wraca. | D26; spec §5.5 | middle | resolved by D27 |
| F24 | edge case | Skok listą wstecz (np. do zapomnianej serii 3, gdy jesteś przy serii 10): po wykonaniu tego kroku nie wiadomo, czy aplikacja idzie dalej po kolei (przez zrobione już serie), czy wraca do pierwszego niewykonanego kroku. To samo po „Wstecz” (D25). | D25, D26 | middle | resolved by D28 |

## Decisions
| # | Decision | Rationale | Source |
|---|---|---|---|
| D1 | Oba tryby w MVP: klasyczny i obwód, wybierane per trening. | — | spec v0.3 (user, 2026-11-06) |
| D2 | Cel czasu ustawiany przy dodawaniu ćwiczenia i w konfiguracji treningu; timer odlicza od celu do zera. | — | spec v0.3 (user, 2026-11-06) |
| D3 | Zmiana strony bez timera; opcjonalnie ustawiana przerwa (S). | — | spec v0.3 (user, 2026-11-06) |
| D4 | Po końcu przerwy sygnał, potem ekran czeka na „Dalej”. | — | spec v0.3 (user, 2026-11-06) |
| D5 | Serie i cel domyślne w ćwiczeniu, zmieniane w pozycji treningu. | wynika z D2 | spec v0.3 (user, 2026-11-06) |
| D6 | FBW A/B edytowalne, z „Przywróć domyślne”, nieusuwalne. | — | spec v0.3 (user, 2026-11-06) |
| D7 | Przypomnienia tylko best effort na Androidzie (Periodic Background Sync), z informacją o iOS i braku gwarancji godziny. | brak backendu | spec v0.3 (user, 2026-11-06) |
| D8 | Podciąganie nachwytem; kategoria „Tył uda i pośladki” (EN: Posterior chain). | — | spec v0.3 (user, 2026-11-06) |
| D9 | Historia treningów poza MVP. | — | spec v0.3 (user, 2026-11-06) |
| D10 | Stack: React + Vite + TypeScript. | — | spec v0.3 (user, 2026-11-06) |
| D11 | Nazwa robocza: Training Buddy. | — | spec v0.3 (user, 2026-11-06) |
| D12 | Przerwy domyślne: klasyczny 90 s / 120 s, obwód 30 s w rundzie / 120 s między rundami. | — | spec v0.3 (user, 2026-11-06) |
| D13 | Dane w IndexedDB (`idb-keyval`), wspólne dla aplikacji i Service Workera. | dostęp z SW, zapis asynchroniczny | spec v0.3 (user, 2026-11-06) |
| D14 | Plank w FBW A: cel domyślny 45 s. | dół zakresu 45–60 s | spec v0.3 założenie 1 (zaakceptowane) |
| D15 | Koniec odliczania ćwiczenia na czas: sygnał i czekanie na „Zrobione”. | spójne z D4 | spec v0.3 założenie 2 (zaakceptowane) |
| D16 | Po końcu przerwy licznik czasu ponad przerwę („+0:12”). | — | spec v0.3 założenie 3 (zaakceptowane) |
| D17 | Każdy tryb pamięta własne przerwy. | przełączenie nie gubi ustawień | spec v0.3 założenie 4 (zaakceptowane) |
| D18 | Wbudowane ćwiczenia tylko do odczytu, z „Duplikuj”. | — | spec v0.3 założenie 5 (zaakceptowane) |
| D19 | ~~Brak powiadomienia, jeśli synchronizacja przyszła > 6 h po ustawionej godzinie.~~ Zastąpione przez D35. | — | spec v0.3 założenie 6 (zaakceptowane; zastąpione w round 3) |
| D20 | `short_name` do wybrania razem z ikoną. Rozstrzygnięte przez D37, D38. | — | spec v0.3 założenie 7 (zaakceptowane) |
| D21 | Import kopii zastępuje wszystkie dane po potwierdzeniu. Eksport obejmuje ćwiczenia, treningi (ze zmienionymi FBW A/B), ustawienia i przypomnienia, bez trwającej sesji. Plik z nowszej wersji aplikacji jest odrzucany z komunikatem. | kopia przywraca stan 1:1; scalanie dublowałoby treningi | user (round 1) |
| D22 | Akceptujemy, że przy zablokowanym telefonie sygnał może nie zagrać. Wake Lock domyślnie włączony; przed pierwszym treningiem jednorazowa wskazówka „Nie blokuj telefonu w trakcie treningu, inaczej sygnał może nie zagrać”. | obejścia są zawodne i zużywają baterię | user (round 1) |
| D23 | Minimalna wersja iOS: 18.4 (zamiast 16.4). Na starszych brak gwarancji, że ekran nie zgaśnie. | Wake Lock w zainstalowanej PWA | user (round 1) |
| D24 | Sygnał gra na muzyce użytkownika i jej nie zatrzymuje, nawet jeśli przełącznik wyciszenia na iPhonie go wtedy wycisza. | trening z muzyką to typowy scenariusz | user (round 1) |
| D25 | „Wstecz” cofa o jedną serię (lub stronę w ćwiczeniu jednostronnym). | poprawa pomyłkowego „Zrobione” | user (round 1) |
| D26 | Lista kroków ze skokiem do dowolnego kroku przechodzi z C do M. | prośba użytkownika przy Q5 | user (round 1) |
| D27 | Kroki ominięte skokiem listą do przodu są oznaczane jako pominięte: widać je na liście i w podsumowaniu, w postępie liczą się jako przejdzione. Aplikacja sama do nich nie wraca; można je wybrać z listy. | przewidywalne; zajęty sprzęt → powrót z listy | user (round 2) |
| D28 | Po wykonaniu kroku wybranego z listy lub cofniętego „Wstecz” aplikacja przechodzi do pierwszego niewykonanego kroku. Typ przerwy przed nim zależy od tego kroku (między seriami / ćwiczeniami / rundami). | bez przeklikiwania zrobionych serii | user (round 2) |
| D29 | Koniec przerwy i koniec odliczania ćwiczenia na czas: cały ekran pulsuje kolorem do dotknięcia „Dalej” / „Zrobione”. Przy `prefers-reduced-motion` stała zmiana koloru bez migania. | widoczne z kilku metrów, działa bez dźwięku (uzupełnia D24) | user (round 2) |
| D30 | Ćwiczenie na czas: odliczanie nie startuje samo po wejściu na ekran, tylko po „Start”. Po „Start” stałe 3 s „Przygotuj się” z sygnałami 3-2-1, potem odliczanie celu. Bez ustawienia długości. | czas na odłożenie telefonu | user (round 2, zmiana rekomendacji 5 s → 3 s) |
| D31 | Pierwsze uruchomienie w Safari na iOS (nie z ekranu głównego): ekran „Zainstaluj aplikację” z instrukcją, ostrzeżeniem, że dane z przeglądarki nie przejdą do aplikacji *(inferred)*, i opcją „Kontynuuj w przeglądarce”. Na tym ekranie wskazówka z D22. Zachęta do instalacji na iOS: S → M. | ochrona przed „pustą aplikacją” po instalacji | user (round 2) |
| D32 | „Zakończ trening” przed końcem (po potwierdzeniu): podsumowanie bez konfetti (zrobione i pominięte serie, czas), potem „Wróć do startu”. | konfetti tylko za cały trening | user (round 3) |
| D33 | Usunięcie ćwiczenia (po potwierdzeniu z listą treningów, w których jest) usuwa je z tych treningów. Trening bez ćwiczeń zostaje na liście z oznaczeniem „Brak ćwiczeń” i nieaktywnym „Start”. Zapisana niedokończona sesja ma własną kopię treningu i ćwiczeń, więc się nie zmienia. | nazwa i przerwy zostają | user (round 3) |
| D34 | Zmiana typu ćwiczenia (powtórzenia ↔ czas) użytego w treningach wymaga potwierdzenia („Użyte w N treningach — cel zostanie zastąpiony domyślnym”). W tych treningach cel pozycji zmienia się na nowy domyślny cel ćwiczenia; liczba serii zostaje. | cel starego typu nie ma sensu | user (round 3) |
| D35 | Przypomnienie pokazywane, gdy synchronizacja w tle przyjdzie po ustawionej godzinie, do północy tego samego dnia (czas urządzenia). Zastępuje D19. | Chrome budzi aplikację co ≥ ok. 12 h *(inferred)*; okno 6 h gubiłoby część dni | user (round 3) |
| D36 | Aplikacja zapamiętuje tylko datę ostatniego treningu (ukończonego lub zakończonego wcześniej) i tego dnia nie wysyła przypomnienia. To nie jest historia treningów (D9 bez zmian). | zbędne przypomnienia uczą je ignorować | user (round 3) |
| D37 | `short_name`: „TrainBuddy”; `name`: „Training Buddy”. | 14 znaków może zostać uciętych na iPhonie *(inferred)* | user (round 4) |
| D38 | Ikona tymczasowa: litery „TB” na jednolitym kolorze motywu, rozmiary 192, 512 i maskable. Docelową można podmienić samymi plikami. | ikona warunkiem instalacji; nie blokuje MVP | user (round 4) |
| D39 | Start innego treningu (lub tego samego od nowa), gdy jest zapisana niedokończona sesja: pytanie „Masz niedokończony trening X. Porzucić go i zacząć nowy?” z „Porzuć i zacznij” / „Anuluj”. Porzucona sesja nie ustawia daty ostatniego treningu (D36). | chroni postęp | user (round 4) |
| D40 | Przypomnienie przypisane do usuniętego treningu zostaje, z ogólnym tekstem „Czas na trening”; przypisanie jest czyszczone przy usuwaniu treningu. | dzień i godzina zwykle zostają aktualne | user (round 5) |
| D41 | Pozycja treningu ma pełny cel (zakres i cel), z tymi samymi regułami co formularz ćwiczenia (powtórzenia 1–100, czas 5–600 s, cel czasu w zakresie), niezależnie od zakresu w ćwiczeniu. | wynika z D5 | default (assumed) |
| D42 | Duplikat dostaje nazwę źródła (wbudowane: w bieżącym języku) z dopiskiem „(kopia)”, kolejne „(kopia 2)” itd.; nazwa jest stała (nietłumaczona). | własne nazwy są jedne; unikalność | default (assumed) |
| D43 | Pauza działa też w 3 s przygotowania i w odliczaniu ćwiczenia na czas. | spójne z przerwą | default (assumed) |
| D44 | Zignorowana aktualizacja wchodzi przy następnym uruchomieniu aplikacji od zera, nigdy w trakcie sesji. | standardowe zachowanie Service Workera | default (assumed) |
| D45 | Nazwy własnych treningów unikalne bez rozróżniania wielkich liter. | jak nazwy ćwiczeń | default (assumed) |
| D46 | Lista kroków to panel otwierany z ekranu sesji; dotknięcie kroku przenosi do niego bez potwierdzenia. | szybkie poprawki w trakcie treningu | default (assumed) |
| D47 | Skok listą w trakcie przerwy anuluje przerwę i od razu pokazuje wybrany krok. | użytkownik świadomie wybrał krok | default (assumed) |
| D48 | Czas w podsumowaniu: od startu sesji do końca, razem z pauzami. | najprostsza zrozumiała miara | default (assumed) |
| D49 | Data ostatniego treningu (D36) nie trafia do eksportu. | dotyczy tylko przypomnień na tym urządzeniu | default (assumed) |
| D50 | Wake Lock w sesji (FR32) przechodzi z S do M, do pierwszego ticketu; przełącznik w ustawieniach zostaje S. | bez niego ekran iPhone'a gaśnie przed końcem przerwy i sygnał nie gra (D22, D23) | user (podział na tickety, 2026-11-07) |

## Questions for Product

> Dla właściciela produktu: odpowiedz pod pytaniem (zamień _pending_). Każde pytanie ma naszą propozycję; „OK” ją akceptuje.

### QP1 — Co robi import kopii zapasowej
**State:** settled by user (round 1, D21)
**Blocks:** eksport/import w ustawieniach

Aplikacja pozwala zapisać kopię danych do pliku i wczytać ją z powrotem (np. po zmianie telefonu). Nie ustalono, czy wczytanie kopii zastępuje to, co jest w aplikacji, czy dokłada do tego.

Options:
- **A** — Zastępuje wszystko po potwierdzeniu; kopia obejmuje ćwiczenia, treningi, ustawienia i przypomnienia, bez trwającego treningu. Plik z nowszej wersji aplikacji jest odrzucany z komunikatem.
- **B** — Dokłada do obecnych danych; przy powtórzonych nazwach dodaje „(2)”.

**Our proposal:** A — kopia ma przywrócić stan 1:1; scalanie dubluje treningi przy każdym ponownym imporcie.

**Answer:** A (round 1, D21)

### QP2 — Zablokowany telefon w trakcie przerwy
**State:** settled by user (round 1, D22)
**Blocks:** ekran podglądu i sesji, komunikaty

Gdy telefon jest zablokowany, aplikacja webowa na iPhonie jest wstrzymana, więc sygnał końca przerwy nie zagra. Na Androidzie zależy to od systemu. Aplikacja domyślnie nie pozwala ekranowi zgasnąć, ale użytkownik może go zablokować sam.

Options:
- **A** — Akceptujemy; przed pierwszym treningiem jednorazowa wskazówka „Nie blokuj telefonu w trakcie treningu, inaczej sygnał może nie zagrać”.
- **B** — Szukamy obejścia (np. ciche odtwarzanie dźwięku w tle) — zawodne i zużywa baterię.

**Our proposal:** A — obejścia nie są niezawodne, a wskazówka kosztuje jeden ekran.

**Answer:** A (round 1, D22)

### QP3 — Sygnał a muzyka i wyciszenie iPhone'a
**State:** settled by user (round 1, D24)
**Blocks:** dźwięki w sesji

Na iPhonie trzeba wybrać jedno: sygnał gra mimo przełącznika wyciszenia, ale może zatrzymać muzykę (np. Spotify), albo gra na muzyce, ale przełącznik wyciszenia go wycisza.

Options:
- **A** — Sygnał gra na muzyce i jej nie zatrzymuje; przy wyciszonym iPhonie zostaje sygnał wizualny.
- **B** — Sygnał zawsze słychać, nawet przy wyciszeniu; muzyka może się zatrzymać.

**Our proposal:** A — trening z muzyką to typowy scenariusz, a zatrzymywanie muzyki przy każdej przerwie jest gorsze niż wyciszony sygnał.

**Answer:** A (round 1, D24)

### QP4 — Co robi „Wstecz”
**State:** settled by user (round 1, D25)
**Blocks:** ekran ćwiczenia

Options:
- **A** — Cofa o jedną serię (albo stronę przy ćwiczeniach na jedną nogę).
- **B** — Cofa do początku poprzedniego ćwiczenia.

**Our proposal:** A — najczęściej poprawia się pomyłkowe „Zrobione”, a to dotyczy jednej serii.

**Answer:** A (round 1, D25)

### QP5 — Serie przeskoczone listą do przodu
**State:** settled by user (round 2, D27)
**Blocks:** lista kroków, podsumowanie

Z listy kroków można przeskoczyć np. z pierwszej serii podciągania od razu do planku. Nie ustalono, co z seriami pomiędzy.

Options:
- **A** — Oznaczamy je jako pominięte: widać je na liście i w podsumowaniu, można do nich wrócić z listy, ale aplikacja sama do nich nie wraca.
- **B** — Zostają do zrobienia: aplikacja wróci do nich po skończeniu reszty.

**Our proposal:** A — przewidywalne; kto chce wrócić (np. zajęty sprzęt), wraca z listy.

**Answer:** A (round 2, D27)

### QP6 — Dokąd po serii wybranej z listy lub cofniętej
**State:** settled by user (round 2, D28)
**Blocks:** lista kroków, „Wstecz”

Ktoś przy serii 10 wraca do zapomnianej serii 3 i ją robi.

Options:
- **A** — Aplikacja przechodzi do pierwszej niewykonanej serii, czyli tam, gdzie był.
- **B** — Aplikacja idzie dalej po kolei, przez serie już zrobione.

**Our proposal:** A — po odrobieniu zapomnianej serii nie trzeba przeklikiwać zrobionych.

**Answer:** A (round 2, D28)

### QP7 — Sygnał wizualny końca przerwy
**State:** settled by user (round 2, D29)
**Blocks:** ekran przerwy i ćwiczenia na czas

Dziś koniec przerwy to dźwięk i napis. Przy wyłączonym dźwięku, wyciszonym iPhonie albo hałasie łatwo to przegapić.

Options:
- **A** — Cały ekran pulsuje kolorem do czasu dotknięcia „Dalej” (przy ograniczonym ruchu w systemie: stała zmiana koloru bez migania).
- **B** — Zostaje sam napis „Przerwa zakończona”.

**Our proposal:** A — widać z kilku metrów, działa bez dźwięku.

**Answer:** A (round 2, D29)

### QP8 — Czas na przygotowanie przed ćwiczeniem na czas
**State:** settled by user (round 2, D30)
**Blocks:** ekran ćwiczenia na czas

Po „Start” przy planku odliczanie rusza od razu, a trzeba jeszcze odłożyć telefon i przyjąć pozycję.

Options:
- **A** — Najpierw 5 s „Przygotuj się” z sygnałami 3-2-1, potem odliczanie celu.
- **B** — Bez przygotowania.
- **C** — Czas przygotowania ustawiany w ustawieniach.

**Our proposal:** A — stałe 5 s wystarcza; dodatkowe ustawienie to zbędna opcja w MVP.

**Answer:** inne — odliczanie po „Start”, 3 s „Przygotuj się” z 3-2-1 (round 2, D30)

### QP9 — Pierwsze uruchomienie na iPhonie w przeglądarce
**State:** settled by user (round 2, D31)
**Blocks:** onboarding, instalacja na iOS

Na iPhonie przeglądarka i aplikacja dodana do ekranu głównego mają osobne dane. Ktoś, kto skonfiguruje treningi w Safari i potem zainstaluje aplikację, zobaczy ją pustą.

Options:
- **A** — Przy pierwszym uruchomieniu w Safari ekran „Zainstaluj aplikację” z instrukcją i ostrzeżeniem, że dane z przeglądarki nie przejdą; opcja „Kontynuuj w przeglądarce”.
- **B** — Tylko dyskretny baner z instrukcją.

**Our proposal:** A — chroni przed utratą konfiguracji; na tym samym ekranie zmieści się wskazówka „nie blokuj telefonu” (D22).

**Answer:** A (round 2, D31)

### QP10 — Wcześniejsze zakończenie treningu
**State:** settled by user (round 3, D32)
**Blocks:** ekran sesji, ekran zakończenia

Można zakończyć trening przed ostatnią serią. Nie ustalono, co wtedy widać.

Options:
- **A** — Podsumowanie bez konfetti (zrobione i pominięte serie, czas), potem „Wróć do startu”.
- **B** — To samo podsumowanie co po całym treningu, z konfetti.
- **C** — Od razu ekran startowy.

**Our proposal:** A — widać, co zrobione; konfetti zostaje nagrodą za cały trening.

**Answer:** A (round 3, D32)

### QP11 — Trening, w którym nie zostało żadne ćwiczenie
**State:** settled by user (round 3, D33)
**Blocks:** biblioteka ćwiczeń, lista treningów

Usunięcie ćwiczenia usuwa je ze wszystkich treningów. Trening złożony tylko z tego ćwiczenia zostaje pusty.

Options:
- **A** — Pusty trening zostaje na liście z oznaczeniem „Brak ćwiczeń” i nieaktywnym „Start”.
- **B** — Pusty trening jest usuwany razem z ćwiczeniem (ostrzeżenie wymienia go przed potwierdzeniem).

**Our proposal:** A — nazwa i ustawienia przerw zostają, wystarczy dodać inne ćwiczenia.

**Answer:** A (round 3, D33)

### QP12 — Zmiana typu ćwiczenia (powtórzenia ↔ czas)
**State:** settled by user (round 3, D34)
**Blocks:** formularz ćwiczenia

Ćwiczenie użyte w treningach ma tam własny cel, np. „5–7 powtórzeń”. Po zmianie na ćwiczenie na czas taki cel nie ma sensu.

Options:
- **A** — Zmiana wymaga potwierdzenia („Użyte w N treningach — cel zostanie zastąpiony domyślnym”); w tych treningach cel zmienia się na nowy domyślny, liczba serii zostaje.
- **B** — Zmiana typu niemożliwa, gdy ćwiczenie jest w jakimś treningu.

**Our proposal:** A — jeden krok zamiast ręcznego usuwania i dodawania ćwiczenia w każdym treningu.

**Answer:** A (round 3, D34)

### QP13 — Spóźnione przypomnienie
**State:** settled by user (round 3, D35)
**Blocks:** przypomnienia (Android)

Telefon budzi aplikację w tle rzadko, mniej więcej co 12 godzin lub rzadziej, w momencie wybranym przez system. Dziś przypomnienie przepada, jeśli spóźni się ponad 6 godzin, czyli w części dni nie przyjdzie wcale.

Options:
- **A** — Przypomnienie przychodzi w dowolnym momencie po ustawionej godzinie, do końca tego samego dnia.
- **B** — Zostaje okno 6 godzin.

**Our proposal:** A — spóźnione przypomnienie tego samego dnia nadal pomaga; po północy już nie.

**Answer:** A (round 3, D35)

### QP14 — Przypomnienie po zrobionym treningu
**State:** settled by user (round 3, D36)
**Blocks:** przypomnienia (Android)

Aplikacja nie zapisuje historii, więc nie wie, że dziś był trening, i przypomni o nim mimo to.

Options:
- **A** — Aplikacja zapamiętuje tylko datę ostatniego treningu (także zakończonego wcześniej) i tego dnia nie przypomina.
- **B** — Przypomina zawsze.

**Our proposal:** A — jedna data to nie historia, a zbędne przypomnienia uczą je ignorować.

**Answer:** A (round 3, D36)

### QP15 — Nazwa pod ikoną na ekranie głównym
**State:** settled by user (round 4, D37)
**Blocks:** instalacja aplikacji (manifest)

Pod ikoną zainstalowanej aplikacji jest krótka nazwa. Pełna „Training Buddy” (14 znaków) może zostać ucięta na iPhonie.

Options:
- **A** — „TrainBuddy”.
- **B** — „Buddy”.
- **C** — „Training Buddy” z ryzykiem ucięcia.

**Our proposal:** A — mieści się i nadal kojarzy się z nazwą.

**Answer:** A (round 4, D37)

### QP16 — Ikona aplikacji
**State:** settled by user (round 4, D38)
**Blocks:** instalacja aplikacji (manifest)

Bez ikony aplikacji nie da się zainstalować. Docelowej ikony nie ma.

Options:
- **A** — Tymczasowa ikona: litery „TB” na jednolitym kolorze motywu, we wszystkich wymaganych rozmiarach. Docelową można podmienić później bez zmian w działaniu.
- **B** — Najpierw projekt docelowej ikony; instalacja czeka.

**Our proposal:** A — nie blokuje MVP; podmiana to wymiana plików.

**Answer:** A (round 4, D38)

### QP17 — Nowy trening, gdy poprzedni jest niedokończony
**State:** settled by user (round 4, D39)
**Blocks:** ekran startowy, wznowienie sesji

Aplikacja pamięta niedokończony trening, a na starcie pokazuje „Wznów”. Nie ustalono, co gdy ktoś zamiast tego zaczyna inny (lub ten sam od nowa).

Options:
- **A** — Pytanie „Masz niedokończony trening X. Porzucić go i zacząć nowy?” z „Porzuć i zacznij” oraz „Anuluj”.
- **B** — Stary trening znika bez pytania.

**Our proposal:** A — jedno dotknięcie więcej chroni przed utratą postępu.

**Answer:** A (round 4, D39)

### QP18 — Przypomnienie przypisane do usuniętego treningu
**State:** settled by user (round 5, D40)
**Blocks:** przypomnienia (Android), usuwanie treningu

Przypomnienie może wskazywać konkretny trening („Czas na FBW A”). Nie ustalono, co gdy ten trening zostanie usunięty.

Options:
- **A** — Przypomnienie zostaje, z ogólnym tekstem „Czas na trening”; przypisanie jest czyszczone.
- **B** — Przypomnienie jest usuwane razem z treningiem (ostrzeżenie przy usuwaniu).

**Our proposal:** A — dzień i godzina treningu zwykle zostają aktualne, nawet gdy zmienia się plan.

**Answer:** A (round 5, D40)

## Refined Requirements

Sfinalizowane 2026-11-07. Sekcja jest samodzielna: razem z Decisions i Deferred to Implementation wystarcza do budowy. Priorytety: **M** = MVP, **S** = should, **C** = could. Teksty w „…” to robocze brzmienie UI po polsku; wersja EN jest tłumaczeniem.

### Functional Requirements

**Kategorie i dane wbudowane**
- FR1 (M): Pięć kategorii ćwiczeń, każda ze stałym kolorem i ikoną (badge), spójnymi w całej aplikacji: `pull` Pull / Pull, `push` Push / Push, `legs` Nogi / Legs, `posterior` Tył uda i pośladki / Posterior chain, `core` Core / Core. (R3, D8)
- FR2 (M): Wbudowane treningi FBW A i FBW B są dostępne od pierwszego uruchomienia, w trybie klasycznym, z domyślnymi przerwami (BR2). Wbudowane ćwiczenia i treningi mają stałe id i tłumaczone nazwy. (R2, D8, D14)

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

**Ekran startowy**
- FR3 (M): Lista treningów, wbudowanych i własnych. Karta pokazuje nazwę, liczbę ćwiczeń, tryb i badge kategorii; dotknięcie otwiera podgląd. Trening bez ćwiczeń ma oznaczenie „Brak ćwiczeń” i nieaktywny „Start”. Z ekranu startowego wchodzi się do konfiguratora i ustawień. (R7, D33)
- FR4 (S): Gdy jest zapisana niedokończona sesja, u góry widać baner „Kontynuuj trening” z opcją porzucenia. Sesję starszą niż 12 h aplikacja proponuje porzucić. Start innego treningu (albo tego samego od nowa) pyta: „Masz niedokończony trening X. Porzucić go i zacząć nowy?”, z opcjami „Porzuć i zacznij” / „Anuluj”. (R18, D39)
- FR5 (S): Szacowany czas treningu na karcie i w podglądzie: liczba kroków ćwiczeń × przyjęty czas serii (40 s dla powtórzeń, cel dla ćwiczeń na czas) plus suma przerw. W podglądzie przeliczany na żywo.
- FR6 (C): Wyróżnienie treningu zaplanowanego na dziś według harmonogramu przypomnień.

**Podgląd treningu**
- FR7 (M): Rozpiska w kolejności z treningu: badge, nazwa, zapis serii („4 × 5–7 powt.”, „3 × 45 s”, „3 × 6–8 powt. na nogę”). Przy ćwiczeniu na czas zakres widnieje jako podpowiedź („zakres 45–60 s”). (R7)
- FR8 (M): Przełącznik trybu (klasyczny / obwód) i ustawienia przerw dla wybranego trybu: stepper ±15 s (w obwodzie ±5 s), zakres 0–10 min. Każdy tryb pamięta własne wartości. Tryb i przerwy zapisują się w treningu, także wbudowanym. Przycisk „Start”. (R8, D1, D12, D17)
- FR9 (S): Przerwa na zmianę strony w ćwiczeniach jednostronnych; domyślnie 0 s, czyli bez timera. (D3)

**Sesja: ekran ćwiczenia**
- FR10 (M): Pasek postępu (BR4) i położenie w treningu: w trybie klasycznym „Ćwiczenie 2/5 · Seria 3/4”, w obwodzie „Runda 2/4 · Ćwiczenie 3/5”. Badge kategorii, duża nazwa ćwiczenia, cel (powtórzenia albo czas). (R9, R13)
- FR11 (M): W ćwiczeniu jednostronnym każda strona to osobny krok ze wskaźnikiem „Lewa noga (1/2)” / „Prawa noga (2/2)”. Kategorie Nogi oraz Tył uda i pośladki mają etykietę „noga”, pozostałe „strona”. (R9)
- FR12 (M): Ćwiczenie na powtórzenia: duży przycisk „Zrobione” kończy krok; co dalej, mówi BR5.
- FR13 (M): Ćwiczenie na czas: odliczanie nie rusza samo. Po „Start” są 3 s „Przygotuj się” z sygnałem na 3, 2 i 1, potem odliczanie od celu do zera. Na koniec gra sygnał, ekran pulsuje (jak w FR18) i czeka na „Zrobione”. „Zrobione” działa też w trakcie odliczania. Pauza i wznowienie działają zarówno w przygotowaniu, jak i w odliczaniu. (R11, D2, D15, D29, D30, D43)
- FR14 (M): „Wstecz” cofa o jeden krok ćwiczenia, czyli o jedną serię albo stronę: z serii 2 do serii 1, z pierwszej serii do ostatniego kroku poprzedniego ćwiczenia. W czasie przerwy „Wstecz” wraca do kroku, który właśnie zakończono. (R12, D25)
- FR15 (M): Lista kroków to panel otwierany z ekranu sesji. Pokazuje każdy krok ćwiczenia ze statusem: zrobiony, pominięty, bieżący albo do zrobienia. Dotknięcie kroku przenosi do niego bez potwierdzenia. Przy skoku do przodu bieżący krok i kroki do zrobienia przed wybranym stają się pominięte. Skok w trakcie przerwy anuluje przerwę. (D26, D27, D46, D47)
- FR16 (M): „Zakończ trening” w menu sesji, z potwierdzeniem. Systemowy przycisk lub gest „wstecz” w sesji też pyta o potwierdzenie, zamiast cicho wychodzić. Po potwierdzeniu: FR21. (D32)
- FR17 (S): „Pomiń serię” oznacza bieżący krok jako pominięty i przechodzi dalej jak po „Zrobione”. Łączny czas treningu widoczny w sesji. Sygnały 3-2-1 przed końcem odliczania ćwiczenia na czas.

**Sesja: ekran przerwy**
- FR18 (M): Przerwa startuje sama po zakończeniu kroku ćwiczenia (długość i typ: BR5). Ekran pokazuje:
  - duży timer (mm:ss) z pierścieniem postępu;
  - typ przerwy: „Przerwa między seriami”, „Przerwa między ćwiczeniami”, „Przerwa między rundami” albo „Zmiana nogi” / „Zmiana strony”;
  - zapowiedź następnego kroku: nazwa, seria lub runda, cel, strona.

  „Pomiń przerwę” od razu pokazuje następny krok. Na koniec przerwy gra sygnał, pojawia się napis „Przerwa zakończona”, a cały ekran pulsuje kolorem; ekran czeka na „Dalej”. Przy `prefers-reduced-motion` ekran zamiast pulsować zmienia kolor na stałe. (R10, D4, D29)
- FR19 (S): Po końcu przerwy licznik czasu ponad przerwę („+0:12”). Sygnały 3-2-1 przed końcem przerwy (do wyłączenia w ustawieniach). Pauza i wznowienie, przyciski +15 s / −15 s. Wibracja na koniec przerwy (tylko Android). (D16)

**Zakończenie**
- FR20 (M): Gdy po zakończeniu kroku nie zostaje żaden krok do zrobienia (BR5): konfetti, gratulacje i podsumowanie z nazwą treningu, czasem (BR8) oraz liczbą ćwiczeń i serii zrobionych i pominiętych. Przycisk „Wróć do startu”. Sesja zostaje usunięta, a aplikacja zapisuje datę ostatniego treningu (BR9). (R14, D27, D36)
- FR21 (M): Zakończenie przed czasem (FR16) pokazuje to samo podsumowanie, ale bez konfetti, i przycisk „Wróć do startu”. Sesja zostaje usunięta, a data ostatniego treningu zapisana (BR9). (D32, D36)

**Konfigurator: biblioteka ćwiczeń**
- FR22 (M): Lista ćwiczeń pogrupowana według kategorii; wbudowane są oznaczone i tylko do odczytu. Formularz dodawania i edycji:

| Pole | Reguły |
|---|---|
| Nazwa | Wymagana, 1–50 znaków, unikalna wśród własnych ćwiczeń bez rozróżniania wielkich liter. |
| Kategoria | Wymagana, jedna z FR1. |
| Typ | Powtórzenia albo Czas. |
| Liczba serii | 1–10. |
| Zakres powtórzeń | min 1–100, max ≥ min. Gdy min = max, aplikacja pokazuje jedną liczbę („10 powt.”). |
| Zakres czasu | 5–600 s, max ≥ min; wyświetlany jako podpowiedź. |
| Cel czasu | Wymagany dla typu Czas, w obrębie zakresu, domyślnie minimum zakresu; od niego odlicza timer. |
| Jednostronne | Przełącznik „na nogę / na stronę”. |

  (R4, D2, D5)
- FR23 (M): Edycja i usuwanie własnych ćwiczeń:
  - Zmiana nazwy, kategorii lub flagi „jednostronne” obejmuje wszystkie treningi z tym ćwiczeniem.
  - Zmiana domyślnych serii i celu nie zmienia pozycji w istniejących treningach.
  - Zmiana typu (powtórzenia ↔ czas) ćwiczenia użytego w treningach wymaga potwierdzenia („Użyte w N treningach — cel zostanie zastąpiony domyślnym”). W tych treningach cel pozycji zmienia się na nowy domyślny cel ćwiczenia, a liczba serii zostaje.
  - Usunięcie ćwiczenia użytego w treningach pokazuje listę tych treningów. Po potwierdzeniu ćwiczenie znika z biblioteki i z tych treningów; trening, który został bez ćwiczeń, zostaje (FR3).

  (R4, D5, D33, D34)
- FR24 (S): „Duplikuj” wbudowane ćwiczenie jako własne; nazwa według BR10. (D18, D42)

**Konfigurator: treningi**
- FR25 (M): Tworzenie i edycja treningu:
  - nazwa: wymagana, 1–40 znaków, unikalna wśród własnych treningów bez rozróżniania wielkich liter;
  - tryb: domyślnie klasyczny;
  - ćwiczenia wybierane z biblioteki, z filtrem kategorii;
  - każda pozycja ma liczbę serii (1–10) i pełny cel według reguł formularza ćwiczenia; wartości startowe pochodzą z ćwiczenia;
  - kolejność zmieniana przyciskami ↑/↓, pozycje można usuwać;
  - zapis wymaga co najmniej 1 ćwiczenia;
  - usuwanie własnego treningu z potwierdzeniem.

  (R5, D5, D41, D45)
- FR26 (M): FBW A i FBW B edytuje się jak własne treningi, ale nie można ich usunąć. „Przywróć domyślne” (z potwierdzeniem) wraca do wersji z FR2: ćwiczenia, serie, cele, tryb i przerwy. (R6, D6, BR11)
- FR27 (S): „Duplikuj” dowolny trening (nazwa według BR10). Zmiana kolejności przez drag & drop. To samo ćwiczenie może wystąpić w treningu więcej niż raz.

**Ustawienia**
- FR28 (M): Język PL / EN; dźwięk wł. / wył. (R15)
- FR29 (S): Test dźwięku; sygnały 3-2-1 wł. / wył.; wibracja wł. / wył. (Android); „Nie wygaszaj ekranu podczas treningu”, domyślnie wł.; reset danych z potwierdzeniem; wersja aplikacji. (D22)
- FR30 (S): Eksport danych do pliku JSON i import z pliku (BR12). (R19, D21)

**Sesja: trwałość i ekran**
- FR31 (S): Stan sesji zapisuje się w IndexedDB przy każdej zmianie: snapshot treningu i ćwiczeń, statusy kroków, bieżący krok, znacznik końca timera, pauza, czas startu. Po zamknięciu lub przeładowaniu aplikacja proponuje kontynuację (FR4). (R18)
- FR32 (M): W trakcie sesji aplikacja trzyma ekran włączony (Screen Wake Lock) i odnawia blokadę po powrocie do aplikacji. Bez wsparcia API działa normalnie, tylko ekran może zgasnąć. (R20, D22, D23, D50)

**PWA i instalacja**
- FR33 (M): Manifest zawiera:
  - `name`: „Training Buddy”, `short_name`: „TrainBuddy”;
  - `display: standalone`, `orientation: portrait`, `start_url`, `scope`, `theme_color`, `background_color`;
  - ikony 192 px, 512 px i wariant maskable: tymczasowe litery „TB” na jednolitym kolorze motywu.

  Na iOS: `apple-touch-icon`, meta `apple-mobile-web-app-*` i obsługa safe area. (R1, D37, D38)
- FR34 (M): Service Worker zapisuje w pamięci podręcznej całą aplikację (HTML, JS, CSS, ikony, dźwięki, tłumaczenia). Po pierwszym wejściu aplikacja działa w pełni offline, także uruchamiana bez sieci. (R1)
- FR35 (M): Gdy jest nowa wersja, aplikacja pokazuje komunikat „Dostępna nowa wersja, odśwież”. Nigdy nie przeładowuje się sama w trakcie sesji. Gdy komunikat zostanie zignorowany, nowa wersja wchodzi przy następnym uruchomieniu od zera. (D44)
- FR36 (M): Przy pierwszym uruchomieniu w Safari na iOS (nie z ekranu głównego) aplikacja pokazuje ekran „Zainstaluj aplikację” z:
  - instrukcją: Udostępnij → Do ekranu początkowego;
  - ostrzeżeniem, że dane z przeglądarki nie przejdą do zainstalowanej aplikacji;
  - wskazówką z FR37;
  - opcją „Kontynuuj w przeglądarce”.

  W zainstalowanej aplikacji ten ekran się nie pojawia. (D31)
- FR37 (M): Przed pierwszym treningiem aplikacja jednorazowo pokazuje wskazówkę „Nie blokuj telefonu w trakcie treningu, inaczej sygnał może nie zagrać”. Jeśli użytkownik widział ją już na ekranie z FR36, nie wraca. (D22)
- FR38 (S): Zachęta do instalacji na Androidzie (`beforeinstallprompt`). Prośba o trwałe przechowywanie danych (`navigator.storage.persist()`).

**Język**
- FR39 (M): PL i EN. Domyślny język wynika z `navigator.language` (`pl*` → PL, inaczej EN), a wybór jest zapamiętany. Przełączanie działa bez przeładowania.
  - Tłumaczone są: cały UI, kategorie, nazwy wbudowanych ćwiczeń i treningów, komunikaty, powiadomienia i atrybut `lang` dokumentu.
  - Nazwy własnych ćwiczeń i treningów oraz zmienione nazwy FBW A/B zostają w formie wpisanej przez użytkownika.
  - Liczebniki odmieniają się przez `Intl.PluralRules`: 1 seria / 2 serie / 5 serii, 1 powtórzenie / 3 powtórzenia / 5 powtórzeń, 1 runda / 2 rundy / 5 rund.

  (R15)

**Dane**
- FR40 (M): Dane są tylko na urządzeniu, w IndexedDB, w jednej bazie wspólnej dla aplikacji i Service Workera. Klucze: `library` (ćwiczenia i treningi, w tym zmienione FBW A/B), `settings`, `session`, `reminders`, `reminderState` (data ostatniego powiadomienia i ostatniego treningu).
  - Przy starcie aplikacja pokazuje ekran powitalny, dopóki dane się nie wczytają.
  - Dane są walidowane przy odczycie; przy błędzie aplikacja przyjmuje wartości domyślne i się nie wywraca.
  - Każdy klucz ma wersję schematu i migracje.
  - (S) Gdy IndexedDB jest niedostępne, aplikacja działa w pamięci i pokazuje baner, że dane nie zostaną zapisane.

  (R16, D13)

**Przypomnienia (C, tylko Android, best effort)**
- FR41 (C): Harmonogram: dla każdego dnia tygodnia przełącznik, godzina i opcjonalny trening. O zgodę na powiadomienia aplikacja pyta przy włączeniu pierwszego przypomnienia.
  - Wsparcie: Periodic Background Sync, zainstalowana aplikacja i zgoda na powiadomienia. Bez wsparcia (iOS, inne przeglądarki, aplikacja niezainstalowana) przełączniki są nieaktywne, a ekran mówi dlaczego.
  - Zawsze widoczny komunikat: „Przypomnienia działają tylko na Androidzie (Chrome, aplikacja zainstalowana na ekranie głównym). Na iPhonie nie zadziałają. Nie gwarantujemy dokładnej godziny: system może pokazać powiadomienie później.”

  (R17, D7)
- FR42 (C): Synchronizacja w tle pokazuje powiadomienie tylko wtedy, gdy jednocześnie:
  - dziś jest dzień z harmonogramu;
  - minęła ustawiona godzina, a nie minęła jeszcze północ (czas urządzenia);
  - dziś nie było jeszcze powiadomienia;
  - dziś nie było treningu (BR9).

  Tekst: „Czas na trening: FBW A”, a bez przypisanego treningu albo gdy trening usunięto: „Czas na trening”. Usunięcie treningu czyści przypisanie w przypomnieniach. Dotknięcie powiadomienia otwiera aplikację. (R17, D35, D36, D40)

### Business Rules
- BR1 — Generator kroków, tryb klasyczny: dla każdego ćwiczenia, dla serii 1..N, dla każdej strony (lewa, prawa albo brak) dodawany jest krok ćwiczenia. Po nim, jeśli to nie ostatni krok treningu, przerwa:
  - zmiana strony: po lewej stronie, tylko gdy ustawiona na więcej niż 0 s;
  - między seriami: po ostatniej stronie serii, gdy to nie ostatnia seria;
  - między ćwiczeniami: po ostatniej serii ćwiczenia.

  Przykład: FBW A ma 20 kroków ćwiczeń (4 + 4 + 3×2 + 3 + 3), 12 przerw między seriami i 4 między ćwiczeniami.
- BR2 — Tryb obwodu: dla rundy r = 1..max(liczba serii), dla każdego ćwiczenia, które ma co najmniej r serii, dla każdej strony dodawany jest krok ćwiczenia. Przerwy: zmiana strony; między ćwiczeniami w rundzie; między rundami po ostatnim ćwiczeniu rundy. Przykład: FBW A ma 20 kroków ćwiczeń w 4 rundach, runda 4 to tylko podciąganie i dipy; 13 przerw w rundach i 3 między rundami.

  Domyślne przerwy:

  | Tryb | Przerwa | Domyślnie |
  |---|---|---|
  | Klasyczny | między seriami | 90 s |
  | Klasyczny | między ćwiczeniami | 120 s |
  | Obwód | między ćwiczeniami w rundzie | 30 s |
  | Obwód | między rundami | 120 s |
  | Oba | zmiana strony | 0 s (bez timera) |

  Przerwa 0 s jest pomijana; po ostatnim kroku nie ma przerwy. (D1, D3, D12)
- BR3 — Sesja to snapshot treningu i ćwiczeń z chwili startu. Późniejsza edycja lub usunięcie ćwiczenia czy treningu nie zmienia trwającej ani zapisanej sesji.
- BR4 — Każdy krok ćwiczenia ma status: do zrobienia, zrobiony albo pominięty. Krok pominięty można wybrać z listy (FR15) i wykonać; wtedy staje się zrobiony. Postęp = (zrobione + pominięte kroki ćwiczeń) / wszystkie kroki ćwiczeń. (D27)
- BR5 — Po zakończeniu kroku ćwiczenia („Zrobione” albo „Pomiń serię”) następnym krokiem jest pierwszy w kolejności krok do zrobienia, a nie po prostu następny na liście. Przerwa przed nim to przerwa, która w wygenerowanej liście stoi bezpośrednio przed tym krokiem (typ i długość); jeśli takiej nie ma albo ma 0 s, przerwy nie ma. Gdy nie zostaje żaden krok do zrobienia, trening jest ukończony (FR20), bez przerwy. (D28)
- BR6 — Timer liczy od znacznika końca (`endsAt`), nie przez sumowanie ticków. Po powrocie do aplikacji stan jest przeliczany. Jeśli przerwa skończyła się w tle, ekran pokazuje „Przerwa zakończona” z licznikiem czasu ponad przerwę, a sygnał gra, jeśli nie zdążył wcześniej. Pauza zapamiętuje pozostały czas, a wznowienie ustawia nowy znacznik końca. To samo dotyczy przygotowania i odliczania ćwiczenia na czas.
- BR7 — Dźwięk:
  - działa offline (generowany albo z pamięci podręcznej) i odblokowuje się przy dotknięciu „Start”;
  - gra na muzyce użytkownika i nigdy jej nie zatrzymuje, nawet jeśli przełącznik wyciszenia na iPhonie go wtedy wycisza;
  - rodzaje sygnałów: krótkie 3-2-1, dłuższy na koniec przerwy, osobny na koniec odliczania ćwiczenia na czas.

  (D24)
- BR8 — Czas w podsumowaniu liczy się od startu sesji do jej końca, razem z pauzami. (D48)
- BR9 — Data ostatniego treningu (dzień w strefie czasowej urządzenia) zapisuje się przy ukończeniu treningu i przy zakończeniu przed czasem, ale nie przy porzuceniu sesji. Służy tylko przypomnieniom i nie trafia do eksportu. (D36, D39, D49)
- BR10 — Nazwy:
  - nazwy własnych ćwiczeń i własnych treningów są unikalne bez rozróżniania wielkich liter;
  - duplikat dostaje nazwę źródła (dla wbudowanych w bieżącym języku) z dopiskiem „(kopia)”, a kolejne „(kopia 2)”, „(kopia 3)” itd.;
  - nazwy własne nie są tłumaczone.

  (D42, D45)
- BR11 — Zapisana wersja FBW A/B (to samo id) ma pierwszeństwo przed wersją z aplikacji. „Przywróć domyślne” usuwa zapisaną wersję. Nazwa FBW A/B jest tłumaczona, dopóki użytkownik jej nie zmieni. (D6)
- BR12 — Kopia danych:
  - eksport obejmuje ćwiczenia, treningi (ze zmienionymi FBW A/B), ustawienia i przypomnienia, bez trwającej sesji i daty ostatniego treningu;
  - import waliduje plik i po potwierdzeniu zastępuje wszystkie dane;
  - plik z nowszej wersji schematu jest odrzucany z komunikatem, a niepoprawny plik odrzucany bez zmian w danych.

  (D21, D49)

### Edge Cases
- EC1: Skok listą do przodu, np. z podciągania seria 1 do planku seria 1 → bieżący krok i kroki do zrobienia pomiędzy stają się pominięte i liczą się w postępie. Aplikacja nie wraca do nich sama. (D27)
- EC2: Skok listą wstecz do pominiętego kroku i jego wykonanie → aplikacja przechodzi do pierwszego kroku do zrobienia (tam, gdzie użytkownik był), z przerwą według BR5. (D28)
- EC3: „Wstecz” i ponowne „Zrobione” → aplikacja przechodzi do pierwszego kroku do zrobienia, bez przechodzenia przez kroki już zrobione. (D25, D28)
- EC4: Po zakończeniu kroku zostały tylko kroki zrobione lub pominięte → trening ukończony, z konfetti; podsumowanie pokazuje pominięte. (D27)
- EC5: Skok listą w trakcie przerwy → przerwa zostaje anulowana i od razu widać wybrany krok. (D47)
- EC6: Przerwa skończyła się, gdy aplikacja była w tle → po powrocie „Przerwa zakończona”, licznik czasu ponad przerwę i pulsowanie; sygnał gra, jeśli nie zagrał. (BR6)
- EC7: Telefon zablokowany w trakcie przerwy → sygnał może nie zagrać, bo iOS wstrzymuje aplikację. Ryzyko przyjęte; użytkownik dostaje wskazówkę z FR37. (D22)
- EC8: iPhone z włączonym przełącznikiem wyciszenia → sygnału może nie być słychać; zostaje pulsowanie ekranu. Muzyka gra dalej. (D24, D29)
- EC9: iOS starszy niż 18.4 albo brak Wake Lock → aplikacja działa, ale ekran może zgasnąć. (D23)
- EC10: Usunięcie ćwiczenia, które było jedynym w treningu → trening zostaje z oznaczeniem „Brak ćwiczeń” i nieaktywnym „Start”; do zapisu w edytorze trzeba dodać ćwiczenie. (D33)
- EC11: Usunięcie lub edycja ćwiczenia lub treningu, gdy jest zapisana niedokończona sesja → sesja bez zmian (snapshot). (BR3)
- EC12: Zmiana typu ćwiczenia (powtórzenia ↔ czas) użytego w treningach → potwierdzenie; cel pozycji zostaje zastąpiony nowym domyślnym, serie bez zmian. (D34)
- EC13: Start treningu, gdy jest zapisana niedokończona sesja → pytanie z FR4; „Anuluj” zostawia sesję. Porzucona sesja nie ustawia daty ostatniego treningu. (D39)
- EC14: Zapisana sesja starsza niż 12 h → aplikacja proponuje ją porzucić.
- EC15: Synchronizacja w tle przyszła po północy dnia przypomnienia → brak powiadomienia. (D35)
- EC16: Trening ukończony albo zakończony przed czasem dziś przed godziną przypomnienia → brak powiadomienia tego dnia. (D36)
- EC17: Przypomnienie przypisane do usuniętego treningu → przypomnienie zostaje, z tekstem „Czas na trening”. (D40)
- EC18: Import pliku z nowszej wersji aplikacji albo uszkodzonego → plik odrzucony z komunikatem, dane bez zmian. (D21)
- EC19: Nowa wersja aplikacji dostępna w trakcie sesji → komunikat, bez przeładowania. Zignorowany komunikat → nowa wersja przy następnym uruchomieniu od zera. (D44)
- EC20: Pierwsze uruchomienie w Safari na iOS → ekran „Zainstaluj aplikację”. Po wyborze „Kontynuuj w przeglądarce” dane zostają tylko w Safari i nie przejdą do aplikacji zainstalowanej później. (D31)
- EC21: Drugi duplikat tego samego ćwiczenia lub treningu → nazwa z dopiskiem „(kopia 2)”. (D42)
- EC22: Uszkodzone dane w IndexedDB → wartości domyślne, aplikacja się nie wywraca. IndexedDB niedostępne → praca w pamięci z banerem (S).

### Non-functional
- **Platformy:** iOS 18.4+ (Safari i aplikacja na ekranie głównym) oraz Chrome na Androidzie (2 ostatnie wersje). Na desktopie aplikacja działa w wycentrowanej kolumnie, ale nie jest celem. (D23)
- **Offline i prywatność:** w trakcie działania żadnych zapytań sieciowych poza pobraniem aplikacji i aktualizacji. Bez analityki, zewnętrznych fontów i CDN; fonty systemowe.
- **Wydajność:** JS poniżej ok. 150 kB (gzip), start z pamięci podręcznej poniżej 1 s na średnim telefonie, Lighthouse (Performance, Accessibility, Best Practices) ≥ 90, spełnione kryteria instalowalności.
- **UI:**
  - mobile-first, pion, 360–430 px; główne akcje w zasięgu kciuka; elementy dotykowe ≥ 48 px;
  - ekran sesji czytelny z 1–2 m: bardzo duże cyfry i nazwa, wysoki kontrast;
  - brak zoomu przy podwójnym dotknięciu przycisków.
- **Wygląd (S):**
  - tryb ciemny według systemu;
  - `prefers-reduced-motion` ogranicza konfetti i animacje, a pulsowanie zamienia na stałą zmianę koloru;
  - etykiety ARIA, kontrast WCAG AA, informacja przekazywana nie tylko kolorem.
- **Testy:**
  - jednostkowe: generator kroków (oba tryby, jednostronne), nawigacja po krokach (BR4, BR5), timer, walidacja formularzy, odmiana liczebników, logika przypomnień (BR9, FR42);
  - E2E (Playwright, viewport mobilny): cały trening w obu trybach, wstecz, pominięcie, skoki listą, tryb offline, dane po przeładowaniu, edycja i przywrócenie FBW A, zmiana języka.
- **Stack:** React + Vite + TypeScript, `vite-plugin-pwa` (`injectManifest`), Zustand `persist` z `idb-keyval`, `canvas-confetti`. Hosting statyczny z HTTPS. (D10, D13)

### Acceptance Criteria
- AC1: Given aplikacja zainstalowana na Androidzie i na iPhonie (iOS 18.4+), when włączę tryb samolotowy i ją uruchomię, then mogę przejść cały trening FBW A. (FR33, FR34)
- AC2: Given pierwsze uruchomienie, when otworzę ekran startowy, then widzę FBW A i FBW B z danymi z FR2, w trybie klasycznym. (FR2, FR3)
- AC3: Given FBW A, when przejdę go w trybie klasycznym i w obwodzie, then w obu trybach jest 20 kroków ćwiczeń, a bułgarski przysiad w każdej serii pokazuje osobno lewą i prawą nogę. (BR1, BR2, FR11)
- AC4: Given FBW A w trybie obwodu, when dojdę do rundy 4, then są w niej tylko podciąganie i dipy. (BR2)
- AC5: Given trwający trening, when dotknę „Zrobione”, then startuje przerwa właściwego typu, o długości z podglądu. Po jej końcu gra sygnał, ekran pulsuje i czeka na „Dalej”. (FR18, BR5)
- AC6: Given plank, when wejdę na jego ekran, then odliczanie nie rusza. Po „Start” widzę 3 s „Przygotuj się” z trzema sygnałami, potem odliczanie od 45 s do zera, sygnał i pulsowanie, a ekran czeka na „Zrobione”. (FR13)
- AC7: Given przerwa, when dotknę „Pomiń przerwę”, then od razu widzę następny krok. Given seria 2, when dotknę „Wstecz”, then wracam do serii 1 tego ćwiczenia. (FR14, FR18)
- AC8: Given FBW A, podciąganie seria 1, when z listy kroków wybiorę dipy seria 1, then podciąganie serie 1–4 są oznaczone jako pominięte, a pasek postępu je wlicza. (FR15, BR4)
- AC9: Given sytuacja z AC8 po zrobieniu dipów seria 1, when wybiorę z listy podciąganie seria 2 i dotknę „Zrobione”, then po przerwie aplikacja pokazuje dipy seria 2, a podciąganie seria 2 jest zrobione. (BR5)
- AC10: Given ostatni krok do zrobienia, when dotknę „Zrobione”, then widzę konfetti, gratulacje i podsumowanie z czasem oraz liczbą zrobionych i pominiętych serii. (FR20)
- AC11: Given trwający trening, when wybiorę „Zakończ trening” i potwierdzę, then widzę podsumowanie bez konfetti i „Wróć do startu”. (FR21)
- AC12: Given biblioteka ćwiczeń, when dodam własne ćwiczenie (kategoria, nazwa, serie, powtórzenia albo czas z celem, jednostronne), zbuduję z niego trening i go uruchomię, then mogę ten trening przejść. (FR22, FR25)
- AC13: Given zmieniony FBW A, when przeładuję aplikację, then zmiany zostają; when dotknę „Przywróć domyślne” i potwierdzę, then FBW A wraca do wersji z FR2. (FR26)
- AC14: Given własne ćwiczenia, treningi, zmienione tryby i przerwy oraz wybrany język, when przeładuję aplikację, then wszystko zostaje. (FR40)
- AC15: Given język PL, when przełączę na EN, then zmieniają się wszystkie teksty UI i nazwy wbudowanych ćwiczeń, bez przeładowania; po ponownym uruchomieniu nadal jest EN. (FR39)
- AC16: Given trwająca przerwa, when zablokuję ekran na 30 s i wrócę, then timer pokazuje poprawny czas. (BR6)
- AC17: Given trening złożony tylko z własnego ćwiczenia X, when usunę X i potwierdzę, then trening ma oznaczenie „Brak ćwiczeń” i nieaktywny „Start”. (FR23, FR3)
- AC18: Given własne ćwiczenie na powtórzenia użyte w treningu, when zmienię jego typ na czas i potwierdzę, then pozycja w treningu ma nowy domyślny cel czasu i tę samą liczbę serii. (FR23)
- AC19: Given zapisana niedokończona sesja, when uruchomię inny trening, then aplikacja pyta, czy porzucić poprzedni; „Anuluj” zostawia sesję. (FR4)
- AC20: Given iPhone, Safari, pierwsze uruchomienie, when otworzę aplikację, then widzę ekran „Zainstaluj aplikację” z ostrzeżeniem o danych i opcją „Kontynuuj w przeglądarce”; w aplikacji zainstalowanej ten ekran się nie pojawia. (FR36)
- AC21: Given dane i plik eksportu, when zresetuję dane i zaimportuję plik, then ćwiczenia, treningi, ustawienia i przypomnienia wracają 1:1. Plik z nowszej wersji jest odrzucony z komunikatem. (FR30, BR12)
- AC22: Given Android, aplikacja zainstalowana, zgoda na powiadomienia i przypomnienie na dziś na godzinę, która już minęła, when system uruchomi synchronizację przed północą, then przychodzi „Czas na trening: <nazwa>”. Jeśli trening ukończono dziś, powiadomienia nie ma. Na iPhonie przełączniki są nieaktywne z komunikatem. (FR41, FR42)
- AC23: Given wdrożona aplikacja, when sprawdzę instalowalność, then manifest ma `short_name` „TrainBuddy” i ikony „TB” (192, 512, maskable), a Lighthouse potwierdza kryteria instalowalności. (FR33)

### Out of Scope
- Konta, backend, synchronizacja między urządzeniami.
- Historia treningów, zapis powtórzeń i ciężarów, progresja, wykresy. (D9) Data ostatniego treningu (BR9) nie jest historią.
- Web Push, eksport przypomnień do kalendarza, przypomnienia na iOS. (D7)
- Filmy i animacje instruktażowe, integracje (Apple Health, Google Fit, smartwatch).
- Ustawienie długości przygotowania przed ćwiczeniem na czas (stałe 3 s). (D30)
- Docelowa ikona (MVP ma tymczasową). (D38)

## Open Questions
- Brak.

## Deferred to Implementation
- [training-buddy] Hosting (GitHub Pages / Netlify / Cloudflare Pages) i ścieżka bazowa; GitHub Pages w podkatalogu wymaga `base` w Vite oraz zgodnych `scope` i `start_url`.
- [training-buddy] Id wbudowanych ćwiczeń i treningów stałe na zawsze — dane użytkownika się do nich odwołują.
- [training-buddy] Sygnały planowane z wyprzedzeniem na osi czasu `AudioContext` (start przerwy → zaplanowany sygnał końca), żeby nie zależeć od throttlingu timerów; sprawdzić na zablokowanym ekranie Android i iOS.
- [training-buddy] Odporność timera na zmianę zegara systemowego (DST, ręczna zmiana czasu).
- [training-buddy] Dwie otwarte karty zapisujące sesję: wygrywa ostatni zapis.
- [training-buddy] Routing (React Router czy stan) i biblioteka i18n (`react-i18next` czy własny słownik) — spec §13.
- [training-buddy] Walidacja danych przy odczycie i imporcie (np. `zod`) — spec §10.
- [training-buddy] Data ostatniego treningu (D36) w `reminderState` w IndexedDB, czytana przez Service Worker; „dzień” w strefie czasowej urządzenia.
- [training-buddy] Model sesji pod BR4/BR5: statusy kroków (zrobiony / pominięty) zamiast samego `skipped[]` w szkicu spec; przerwa przed następnym krokiem brana z wygenerowanej listy.
- [training-buddy] Kolor motywu (`theme_color`) i tymczasowa ikona „TB” (D38).
- [training-buddy] Sprawdzić na urządzeniach założenia oznaczone *(inferred)*: wstrzymanie zablokowanej PWA na iOS, Wake Lock od iOS 18.4, osobne dane Safari i aplikacji (także iOS 26+), miksowanie dźwięku z muzyką, częstotliwość Periodic Background Sync.

## History
- 2026-11-06 — analysis: 22 findings (11 gap, 4 edge case, 3 ambiguity, 2 conflict, 2 risk), repos: training-buddy (nowe)
- 2026-11-06 — round 1: 5 asked — 5 decided (D21–D25), +1 decyzja użytkownika (D26: lista kroków → M), 0 → product
- 2026-11-06 — skutki D26: 2 nowe findings (F23, F24)
- 2026-11-06 — round 2: 5 asked — 5 decided (D27–D31; Q4 zmienione: 3 s zamiast 5 s), F19 rozstrzygnięte przy okazji (D27), 0 → product
- 2026-11-06 — round 3 posted: 5 questions (F7, F10, F11, F12, F13), QP10–QP14 drafts
- 2026-11-07 — round 3: 5 asked — 5 decided (D32–D36; D35 zastępuje D19), 0 → product
- 2026-11-07 — round 4 posted: 3 questions (F14 ×2, F15), QP15–QP17 drafts
- 2026-11-07 — round 4: 3 asked — 3 decided (D37–D39), 0 → product
- 2026-11-07 — F21 podniesione z low do middle (treść powiadomienia nie jest low) → round 5; podsumowanie i lista założeń przedstawione
- 2026-11-07 — round 5: 1 asked — 1 decided (D40); 9 założeń domyślnych zaakceptowanych (D41–D49)
- 2026-11-07 — finalised: 42 FR, 12 BR, 22 EC, 23 AC
- 2026-11-07 — split: 11 ticketów w `tickets.md` (MVP T1–T8, Follow-up T9–T11), 6 fal; D50 (Wake Lock → M); Jira nie dotyczy
