# Training Buddy (PWA): wymagania, draft v0.3

Data: 2026-11-06 · Status: draft, decyzje D1–D13 i założenia przyjęte (sekcja 15) · Nazwa robocza: **Training Buddy**

## 1. Cel i założenia

Aplikacja webowa (PWA) prowadzi krok po kroku przez trening siłowy: pokazuje ćwiczenie i serię, odmierza przerwy, sygnalizuje dźwiękiem ich koniec i pokazuje postęp.

Założenia:

- **Tylko frontend.** Bez backendu, kont, logowania i API. Dane trzymamy w IndexedDB na urządzeniu (sekcja 10).
- **Mobile-first.** Projekt pod telefon w pionie (szerokość 360–430 px). Na desktopie wycentrowana kolumna.
- **PWA i offline.** Aplikację można zainstalować na ekranie głównym. Po pierwszym uruchomieniu działa w pełni bez sieci.
- **Dwa języki.** Polski i angielski, przełączane w aplikacji.
- **Prywatność.** Aplikacja niczego nie wysyła: bez analityki, zewnętrznych fontów i CDN.

Priorytety: **M** = must (MVP), **S** = should, **C** = could / nice to have.

## 2. Słownik

| Pojęcie | Znaczenie |
|---|---|
| Ćwiczenie | Definicja ruchu: nazwa, kategoria, typ (powtórzenia lub czas), domyślna liczba serii i cel. |
| Trening | Uporządkowana lista ćwiczeń z liczbą serii i celem, plus tryb (klasyczny lub obwód) i ustawienia przerw. |
| Seria | Jedno wykonanie ćwiczenia, np. 5–7 powtórzeń albo 45 s. |
| Tryb klasyczny | Wszystkie serie jednego ćwiczenia, potem następne ćwiczenie. |
| Tryb obwodu | Runda to jedna seria każdego ćwiczenia; rundy powtarzane do wyczerpania serii. |
| Ćwiczenie jednostronne | Wykonywane osobno na każdą nogę lub stronę (np. bulgarian split squat). Każda strona to osobny krok. |
| Sesja | Trwające wykonywanie treningu: bieżący krok, timer, postęp. |
| Krok | Element sesji: krok ćwiczenia (seria, ewentualnie strona) albo krok przerwy. |

## 3. Kategorie ćwiczeń

| Klucz | PL | EN |
|---|---|---|
| `pull` | Pull | Pull |
| `push` | Push | Push |
| `legs` | Nogi | Legs |
| `posterior` | Tył uda i pośladki | Posterior chain |
| `core` | Core | Core |

Każda kategoria ma stały kolor i ikonę (badge), spójne w całej aplikacji.

## 4. Dane wbudowane

Wbudowane ćwiczenia i treningi są zdefiniowane w kodzie i przetłumaczone. Treningi FBW A i FBW B można edytować i przywrócić do wersji domyślnej (D6). Wbudowane ćwiczenia są tylko do odczytu.

Oba treningi startują w trybie klasycznym.

### FBW A

| # | Kategoria | Ćwiczenie (PL) | EN | Serie | Cel | Jednostronne |
|---|---|---|---|---|---|---|
| 1 | Pull | Podciąganie nachwytem | Pull-ups (overhand grip) | 4 | 5–7 powt. | nie |
| 2 | Push | Dipy (pompki na poręczach) | Dips | 4 | 5–7 powt. | nie |
| 3 | Nogi | Bułgarski przysiad wykroczny | Bulgarian split squat | 3 | 6–8 powt. na nogę | **tak** |
| 4 | Tył uda i pośladki | Nordic curl | Nordic hamstring curl | 3 | 5–7 powt. | nie |
| 5 | Core | Plank (deska) | Plank | 3 | 45 s (zakres 45–60 s) | nie |

### FBW B

| # | Kategoria | Ćwiczenie (PL) | EN | Serie | Cel | Jednostronne |
|---|---|---|---|---|---|---|
| 1 | Pull | Podciąganie szerokim chwytem | Wide-grip pull-ups | 3 | 8–12 powt. | nie |
| 2 | Push | Pompki z deficytem | Deficit push-ups | 3 | 10–15 powt. | nie |
| 3 | Nogi | Skater squat | Skater squat | 3 | 6–10 powt. na nogę | **tak** |
| 4 | Tył uda i pośladki | Hip thrust | Hip thrust | 3 | 10–15 powt. | nie |
| 5 | Core | Unoszenie nóg w zwisie | Hanging leg raises | 3 | 10–15 powt. | nie |

## 5. Ekrany i przepływ

```
Start (lista treningów)
 ├─ Podgląd treningu (rozpiska, tryb, przerwy) ─► Sesja: Ćwiczenie ⇄ Przerwa ─► Koniec (konfetti)
 ├─ Konfigurator
 │   ├─ Ćwiczenia (biblioteka: dodaj / edytuj / usuń)
 │   └─ Treningi (dodaj / edytuj / duplikuj / usuń / przywróć domyślne)
 └─ Ustawienia (język, dźwięk, ekran, przypomnienia, kopia danych)
```

### 5.1 Ekran startowy

- **M** Lista treningów: wbudowane (FBW A, FBW B) i własne. Karta pokazuje nazwę, liczbę ćwiczeń, tryb i badge kategorii.
- **M** Dotknięcie karty otwiera podgląd treningu.
- **M** Wejście do konfiguratora i ustawień.
- **S** Baner „Kontynuuj trening”, gdy istnieje niezakończona sesja (z opcją porzucenia).
- **S** Szacowany czas treningu na karcie.
- **C** Wyróżnienie treningu zaplanowanego na dziś (z harmonogramu przypomnień).

### 5.2 Podgląd treningu (rozpiska)

- **M** Lista ćwiczeń w kolejności z definicji: badge kategorii, nazwa, zapis serii, np. „4 × 5–7 powt.”, „3 × 45 s”, „3 × 6–8 powt. na nogę”. Przy ćwiczeniu na czas zakres jako podpowiedź („zakres 45–60 s”).
- **M** Przełącznik trybu: klasyczny / obwód. Zmiana zapisuje się w treningu.
- **M** Ustawienia przerw (stepper ±15 s, zakres 0–10 min; w obwodzie krok 5 s). Etykiety i wartości zależą od trybu, a każdy tryb pamięta własne wartości:

| Tryb | Przerwa | Domyślnie |
|---|---|---|
| Klasyczny | między seriami | 90 s |
| Klasyczny | między ćwiczeniami | 120 s |
| Obwód | między ćwiczeniami w rundzie | 30 s |
| Obwód | między rundami | 120 s |
| Oba | zmiana strony (ćwiczenia jednostronne, **S**) | 0 s = bez timera |

- **M** Tryb i przerwy zapisywane w treningu, również wbudowanym.
- **M** Przycisk „Start”.
- **S** Szacowany czas treningu przeliczany na żywo: liczba kroków × przyjęty czas serii (np. 40 s dla powtórzeń, cel dla ćwiczeń na czas) + suma przerw.

### 5.3 Sesja: ekran ćwiczenia

- **M** Pasek postępu (wykonane kroki ćwiczeń / wszystkie) i tekst: w trybie klasycznym „Ćwiczenie 2/5 · Seria 3/4”, w obwodzie „Runda 2/4 · Ćwiczenie 3/5”.
- **M** Badge kategorii, nazwa ćwiczenia (duża), cel: liczba powtórzeń albo czas.
- **M** Ćwiczenia jednostronne: wyraźny wskaźnik strony, np. „Lewa noga (1/2)”, „Prawa noga (2/2)”. Każda strona to osobny krok przeklikiwany przyciskiem. Dla kategorii Nogi oraz Tył uda i pośladki etykieta „noga”, dla pozostałych „strona”.
- **M** Ćwiczenie na powtórzenia: duży przycisk „Zrobione” uruchamia przerwę (albo kończy trening po ostatnim kroku).
- **M** Ćwiczenie na czas: „Start” uruchamia odliczanie od celu (np. 45 s) do zera. Na koniec gra sygnał, a ekran czeka na „Zrobione”, tak jak po przerwie (D4). „Zrobione” działa też w trakcie odliczania.
- **M** „Wstecz” wraca do poprzedniego kroku ćwiczenia z listy kroków (np. z serii 2 do serii 1 albo do ostatniego kroku poprzedniego ćwiczenia).
- **M** Menu „Zakończ trening” z potwierdzeniem. Systemowy przycisk/gest „wstecz” też pyta o potwierdzenie, zamiast cicho wychodzić z sesji.
- **S** „Pomiń serię”: oznacza krok jako pominięty i przechodzi dalej jak po „Zrobione”.
- **S** Łączny czas trwania treningu.
- **S** Sygnały 3-2-1 przed końcem odliczania ćwiczenia na czas.
- **C** Lista wszystkich kroków ze skokiem do wybranego ćwiczenia.

### 5.4 Sesja: ekran przerwy

- **M** Duży timer odliczający (mm:ss) z pierścieniem postępu i typem przerwy: „Przerwa między seriami”, „Przerwa między ćwiczeniami”, „Przerwa między rundami”, „Zmiana nogi”.
- **M** Zapowiedź następnego kroku: nazwa, seria lub runda, cel, strona.
- **M** Timer startuje automatycznie po „Zrobione”.
- **M** „Pomiń przerwę” od razu pokazuje następny krok.
- **M** Koniec przerwy: sygnał dźwiękowy i komunikat „Przerwa zakończona”. Ekran czeka, aż użytkownik dotknie dużego przycisku „Dalej” (D4).
- **M** „Wstecz” w czasie przerwy wraca do kroku ćwiczenia, który właśnie zakończono.
- **M** Po ostatnim kroku treningu nie ma przerwy. Przerwa o długości 0 s jest pomijana.
- **S** Po końcu przerwy licznik czasu ponad przerwę („+0:12”).
- **S** Krótkie sygnały 3-2-1 przed końcem przerwy (do wyłączenia w ustawieniach).
- **S** Pauza i wznowienie; przyciski +15 s / −15 s.
- **S** Wibracja na koniec przerwy (tylko Android, iOS nie obsługuje Vibration API).

### 5.5 Ekran zakończenia

- **M** Animacja konfetti i gratulacje.
- **M** Powrót do ekranu startowego; sesja usunięta z pamięci.
- **S** Podsumowanie: nazwa treningu, czas trwania, liczba ćwiczeń i serii (wykonane i pominięte). Podsumowanie nie jest zapisywane (historia poza MVP, D9).

### 5.6 Konfigurator: biblioteka ćwiczeń

- **M** Lista ćwiczeń pogrupowana według kategorii. Wbudowane są oznaczone i tylko do odczytu.
- **M** Dodawanie ćwiczenia, formularz:

| Pole | Reguły |
|---|---|
| Nazwa | Wymagana, 1–50 znaków, unikalna wśród własnych ćwiczeń (bez rozróżniania wielkości liter). |
| Kategoria | Wymagana: Pull / Push / Nogi / Tył uda i pośladki / Core. |
| Typ | Powtórzenia albo Czas. |
| Liczba serii | 1–10. |
| Zakres powtórzeń | min 1–100, max ≥ min. Gdy min = max, wyświetlamy jedną liczbę („10 powt.”). |
| Zakres czasu | 5–600 s, max ≥ min. Podpowiedź wyświetlana przy ćwiczeniu. |
| Cel czasu | Wymagany dla typu Czas, w obrębie zakresu, domyślnie minimum. To od niego odlicza timer. |
| Jednostronne | Przełącznik „na nogę / na stronę”. |

- **M** Edycja i usuwanie własnych ćwiczeń. Usunięcie ćwiczenia użytego w treningach pokazuje listę tych treningów; po potwierdzeniu ćwiczenie znika także z nich. Jeśli trening zostałby pusty, użytkownik dostaje ostrzeżenie.
- **M** Zmiana nazwy, kategorii lub flagi „jednostronne” obejmuje wszystkie treningi z tym ćwiczeniem. Zmiana domyślnych serii i celu nie zmienia istniejących pozycji w treningach (D5).
- **S** „Duplikuj” wbudowane ćwiczenie jako własne.

### 5.7 Konfigurator: treningi

- **M** Tworzenie treningu: nazwa (wymagana, 1–40 znaków), tryb (domyślnie klasyczny) i ćwiczenia wybierane z biblioteki (z filtrem kategorii).
- **M** Każda pozycja ma liczbę serii i cel (zakres powtórzeń albo cel czasu, 5–600 s). Wartości startowe pochodzą z ćwiczenia i można je zmienić w treningu (D5).
- **M** Zmiana kolejności przyciskami ↑/↓ i usuwanie pozycji.
- **M** Walidacja: co najmniej 1 ćwiczenie.
- **M** Edycja i usuwanie własnych treningów (usuwanie z potwierdzeniem).
- **M** FBW A i FBW B edytuje się jak własne, ale nie można ich usunąć. „Przywróć domyślne” (z potwierdzeniem) wraca do wersji z aplikacji: ćwiczenia, serie, cele, tryb i przerwy. Nazwa jest tłumaczona, dopóki użytkownik jej nie zmieni (D6).
- **S** „Duplikuj” dowolny trening, np. „FBW A (kopia)”.
- **S** Zmiana kolejności przez drag & drop.
- **S** To samo ćwiczenie może wystąpić w treningu więcej niż raz.

### 5.8 Ustawienia

- **M** Język: PL / EN.
- **M** Dźwięk: wł. / wył.
- **S** Test dźwięku; sygnały 3-2-1 wł. / wył.
- **S** Wibracja wł. / wył. (Android).
- **S** „Nie wygaszaj ekranu podczas treningu” (Wake Lock), domyślnie wł.
- **S** Eksport i import danych do pliku JSON. To kopia zapasowa, bo dane przeglądarki mogą zostać wyczyszczone (np. przy czyszczeniu danych witryny albo odinstalowaniu aplikacji).
- **S** Reset danych (z potwierdzeniem).
- **S** Wersja aplikacji.
- **C** Przypomnienia (sekcja 8).

## 6. Logika sesji

### 6.1 Generowanie kroków

Na starcie sesji trening zamienia się w płaską listę kroków. To snapshot: późniejsza edycja treningu nie zmienia trwającej sesji. „Wstecz”, postęp i zapis sesji działają na tej liście tak samo w obu trybach.

Tryb klasyczny:

```
dla każdego ćwiczenia w treningu:
  dla serii 1..N:
    dla strony w (jednostronne ? [lewa, prawa] : [brak]):
      krok ćwiczenia
      jeśli to nie ostatni krok treningu, dodaj przerwę:
        - zmiana strony      (po lewej stronie, tylko gdy ustawiona > 0 s)
        - między seriami     (po ostatniej stronie serii, gdy to nie ostatnia seria)
        - między ćwiczeniami (po ostatniej serii ćwiczenia)
```

Tryb obwodu:

```
dla rundy r = 1..max(liczba serii):
  dla każdego ćwiczenia, które ma co najmniej r serii:
    dla strony w (jednostronne ? [lewa, prawa] : [brak]):
      krok ćwiczenia
      jeśli to nie ostatni krok treningu, dodaj przerwę:
        - zmiana strony                 (po lewej stronie, tylko gdy ustawiona > 0 s)
        - między ćwiczeniami w rundzie  (gdy to nie ostatnie ćwiczenie rundy)
        - między rundami                (po ostatnim ćwiczeniu rundy)
```

Przykład FBW A (zmiana nogi bez timera):

| Tryb | Kroki ćwiczeń | Przerwy |
|---|---|---|
| Klasyczny | 20 (4 + 4 + 3×2 + 3 + 3) | 12 między seriami, 4 między ćwiczeniami |
| Obwód | 20; rundy 1–3 mają 5 ćwiczeń, runda 4 tylko podciąganie i dipy | 13 między ćwiczeniami w rundzie, 3 między rundami |

### 6.2 Timer

- Czas liczony od znacznika końca (`endsAt = Date.now() + czas`), a nie przez sumowanie ticków `setInterval`. Przeglądarka spowalnia timery w tle i licznik by się rozjechał.
- UI odświeżany co ok. 250 ms lub przez `requestAnimationFrame`.
- Po powrocie do aplikacji (`visibilitychange`) stan jest przeliczany. Jeśli przerwa skończyła się w tle, ekran pokazuje „Przerwa zakończona” z licznikiem czasu ponad przerwę i czeka na „Dalej”. Sygnał gra, jeśli nie zdążył zagrać wcześniej.
- Pauza zapisuje pozostały czas, wznowienie ustawia nowe `endsAt`.
- Odliczanie ćwiczenia na czas działa tak samo (znacznik końca).

### 6.3 Dźwięk

- Web Audio API. Sygnały generowane oscylatorem albo krótkie pliki w precache, więc nie zależą od sieci.
- `AudioContext` odblokowywany przy dotknięciu „Start” (iOS i Android blokują dźwięk bez gestu użytkownika).
- iOS: przełącznik wyciszenia może wyciszać Web Audio. Do sprawdzenia `navigator.audioSession.type = 'playback'` (Safari); w ustawieniach krótka informacja dla użytkownika.
- Rodzaje sygnałów: krótkie piknięcia 3-2-1, dłuższy sygnał na koniec przerwy, osobny sygnał na koniec odliczania ćwiczenia na czas.

### 6.4 Ekran włączony

- Screen Wake Lock API w trakcie sesji; blokada pobierana ponownie po `visibilitychange`.
- Wsparcie: Chrome Android oraz Safari 16.4+. W PWA zainstalowanej na iOS działa poprawnie dopiero w nowszych wersjach (ok. 18.4+). Bez wsparcia aplikacja działa normalnie, tylko ekran może zgasnąć.

### 6.5 Trwałość sesji (S)

- Stan sesji (snapshot treningu, indeks kroku, `endsAt`, pauza, czas startu) zapisywany w IndexedDB przy każdej zmianie.
- Po zamknięciu lub przeładowaniu aplikacji ekran startowy proponuje kontynuację. Sesję starszą niż 12 h aplikacja proponuje porzucić.

## 7. PWA i offline

- **M** Web App Manifest: `name: "Training Buddy"`, `short_name` (do ustalenia, pod ikoną mieści się ok. 12 znaków), `start_url`, `scope`, `display: standalone`, `orientation: portrait`, `theme_color`, `background_color`, ikony 192 i 512 px oraz wariant `maskable`. Ikona do zaprojektowania.
- **M** iOS: `apple-touch-icon`, meta `apple-mobile-web-app-*`, obsługa safe area (`env(safe-area-inset-*)`).
- **M** Service Worker z precache całej aplikacji (HTML, JS, CSS, ikony, dźwięki, tłumaczenia). Po pierwszym wejściu aplikacja działa offline, także przy uruchomieniu bez sieci.
- **M** Aktualizacje: gdy jest nowa wersja, aplikacja pokazuje komunikat „Dostępna nowa wersja, odśwież”. Nigdy nie przeładowuje się sama w trakcie sesji.
- **S** Zachęta do instalacji: Android przez `beforeinstallprompt`, iOS przez krótką instrukcję („Udostępnij → Do ekranu początkowego”).
- **S** `navigator.storage.persist()`: prośba o trwały storage.
- Hosting statyczny z HTTPS (wymóg Service Workera), np. GitHub Pages, Netlify, Cloudflare Pages.

## 8. Przypomnienia (C, tylko Android, best effort)

Decyzja D7: przypomnienia robimy wyłącznie jako best effort na Androidzie. Bez Web Push, bez eksportu do kalendarza, bez wsparcia iOS.

- **Harmonogram.** Dla każdego dnia tygodnia przełącznik i godzina, opcjonalnie przypisany trening (np. wtorek: FBW A, czwartek: FBW B). Zapis w IndexedDB.
- **Mechanizm.** Periodic Background Sync (Chrome na Androidzie, tylko zainstalowana PWA). Aplikacja rejestruje synchronizację (`periodicSync.register('training-reminder', { minInterval: 1 h })`), ale o tym, kiedy ją uruchomić, decyduje przeglądarka (zależnie od tego, jak często użytkownik korzysta z aplikacji, odstępy rzędu wielu godzin). Powiadomienie przychodzi więc po ustawionej godzinie, nie punktualnie.
- **Logika w Service Workerze** (zdarzenie `periodicsync`): jeśli dziś jest dzień z harmonogramu, minęła ustawiona godzina i dziś nie było jeszcze powiadomienia, wywołaj `showNotification` („Czas na trening: FBW A”). Nie pokazuj powiadomienia, jeśli od ustawionej godziny minęło ponad 6 h. Kliknięcie w powiadomienie otwiera aplikację.
- **Storage.** Service Worker czyta harmonogram, język i nazwy treningów bezpośrednio z tej samej bazy IndexedDB co aplikacja. Tam też zapisuje znacznik „powiadomiono dziś” (`reminderState`).
- **Uprawnienia.** O zgodę na powiadomienia aplikacja pyta przy włączeniu pierwszego przypomnienia (gest użytkownika).
- **Wykrywanie wsparcia.** `'periodicSync' in registration`, aplikacja zainstalowana, zgoda na powiadomienia. Bez wsparcia (iOS, inne przeglądarki, PWA niezainstalowana) przełączniki są nieaktywne, a ekran mówi dlaczego.
- **Komunikat na ekranie przypomnień, zawsze widoczny:** „Przypomnienia działają tylko na Androidzie (Chrome, aplikacja zainstalowana na ekranie głównym). Na iPhonie nie zadziałają. Nie gwarantujemy dokładnej godziny: system może pokazać powiadomienie później.”

## 9. Lokalizacja (i18n)

- **M** PL i EN. Domyślny język według `navigator.language` (`pl*` → PL, inaczej EN). Wybór zapamiętany w IndexedDB. Przełączanie bez przeładowania.
- **M** Tłumaczone: cały UI, kategorie, nazwy wbudowanych ćwiczeń i treningów, komunikaty, powiadomienia, atrybut `lang` dokumentu.
- **M** Nazwy własnych ćwiczeń i treningów (oraz zmienione nazwy FBW A/B) zostają w takiej formie, w jakiej wpisał je użytkownik.
- **M** Poprawna odmiana liczebników przez `Intl.PluralRules`: „1 seria / 2 serie / 5 serii”, „1 powtórzenie / 3 powtórzenia / 5 powtórzeń”, „1 runda / 2 rundy / 5 rund”.
- Manifest ma jedną, angielską nazwę aplikacji: „Training Buddy”.

## 10. Dane i IndexedDB (D13)

Dane trzymamy w IndexedDB przez `idb-keyval`: baza `training-buddy` z jednym magazynem klucz-wartość. Każdy klucz to jeden store Zustand zapisywany przez middleware `persist`. Aplikacja i Service Worker korzystają z tej samej bazy.

| Klucz | Zawartość |
|---|---|
| `library` | własne ćwiczenia, własne treningi i zmienione wersje FBW A/B |
| `settings` | język, dźwięk, wibracja, wake lock |
| `session` | trwająca sesja |
| `reminders` | harmonogram przypomnień |
| `reminderState` | data ostatniego powiadomienia (zapisuje Service Worker) |

- Ćwiczenia i treningi leżą pod jednym kluczem, więc operacja na obu (np. usunięcie ćwiczenia razem z jego pozycjami w treningach) zapisuje się w jednym kroku.
- Wersja schematu i migracje: `version` i `migrate` w `persist`, osobno dla każdego klucza.
- Odczyt jest asynchroniczny. Przy starcie aplikacja pokazuje ekran powitalny, dopóki dane się nie wczytają (zwykle kilkadziesiąt ms), i dopiero wtedy renderuje UI w zapisanym języku.

Wczytywanie treningów: zapisana wersja FBW A/B (to samo `id`) wygrywa z wersją z kodu. „Przywróć domyślne” usuwa zapisaną wersję.

Szkic modelu:

```ts
type Category = 'pull' | 'push' | 'legs' | 'posterior' | 'core';

type Target =
  | { type: 'reps'; min: number; max: number }                         // np. 5–7 powtórzeń
  | { type: 'time'; minSec: number; maxSec: number; targetSec: number }; // zakres 45–60 s, odliczanie od 45 s

interface Exercise {
  id: string;            // wbudowane: stałe id, np. "builtin:pullup-overhand"; własne: UUID
  builtIn: boolean;
  nameKey?: string;      // klucz tłumaczenia (wbudowane)
  name?: string;         // nazwa wpisana przez użytkownika (własne)
  category: Category;
  unilateral: boolean;   // na nogę / na stronę
  defaultSets: number;
  defaultTarget: Target;
}

interface WorkoutItem {
  exerciseId: string;
  sets: number;
  target: Target;
}

interface RestSettings {
  straight: { betweenSetsSec: number; betweenExercisesSec: number }; // 90 / 120
  circuit: { betweenExercisesSec: number; betweenRoundsSec: number }; // 30 / 120
  betweenSidesSec: number;                                            // 0 = bez timera
}

interface Workout {
  id: string;            // wbudowane: "builtin:fbw-a", "builtin:fbw-b"; własne: UUID
  builtIn: boolean;      // true także dla zmienionej wersji FBW A/B
  nameKey?: string;
  name?: string;         // ustawione = nazwa wpisana lub zmieniona przez użytkownika
  mode: 'straight' | 'circuit';
  rest: RestSettings;
  items: WorkoutItem[];
}

interface Settings {
  lang: 'pl' | 'en';
  sound: boolean;
  countdownBeeps: boolean;
  vibration: boolean;
  keepScreenOn: boolean;
}

interface Reminder {
  weekday: 1 | 2 | 3 | 4 | 5 | 6 | 7; // ISO: 1 = poniedziałek
  time: string;                       // "HH:mm"
  enabled: boolean;
  workoutId?: string;
}

type Step =
  | { kind: 'work'; itemIndex: number; set: number; round?: number; side?: 'left' | 'right' }
  | { kind: 'rest'; reason: 'sets' | 'exercises' | 'rounds' | 'sides'; durationSec: number };

interface ActiveSession {
  workout: Workout;          // snapshot
  exercises: Exercise[];     // snapshot użytych ćwiczeń
  steps: Step[];
  index: number;
  startedAt: number;         // epoch ms
  endsAt?: number;           // epoch ms: koniec przerwy albo odliczania ćwiczenia na czas
  pausedRemainingMs?: number;
  skipped: number[];         // indeksy pominiętych kroków
}
```

- Uszkodzone lub niezgodne dane: walidacja przy odczycie, a przy błędzie wartości domyślne; aplikacja się nie wywraca. Import pliku przechodzi tę samą walidację.
- **S** Gdy IndexedDB jest niedostępne, aplikacja działa w pamięci i pokazuje baner, że dane nie zostaną zapisane.
- Safari czyści dane stron, także IndexedDB, po 7 dniach bez wizyty (ITP), ale nie dotyczy to PWA dodanej do ekranu głównego. Stąd zachęta do instalacji i eksport kopii.

## 11. UI / UX

- **M** Mobile-first, pion, 360–430 px. Główne akcje w zasięgu kciuka (dół ekranu). Elementy dotykowe ≥ 48 px.
- **M** Ekran sesji czytelny z 1–2 m: bardzo duże cyfry timera i nazwa ćwiczenia, wysoki kontrast.
- **M** Brak zoomu przy podwójnym dotknięciu przycisków (`touch-action: manipulation`).
- **S** Tryb ciemny według ustawień systemu.
- **S** `prefers-reduced-motion` ogranicza konfetti i animacje.
- **S** Dostępność: etykiety ARIA, kontrast WCAG AA, informacja przekazywana nie tylko kolorem.

## 12. Wymagania niefunkcjonalne

- W trakcie działania brak zapytań sieciowych poza pobraniem aplikacji i aktualizacji.
- Wydajność: JS poniżej ok. 150 kB (gzip), start z cache poniżej 1 s na średnim telefonie, Lighthouse (Performance, Accessibility, Best Practices) ≥ 90, spełnione kryteria instalowalności.
- Przeglądarki: iOS Safari 16.4+ (zalecane 17+), Chrome Android (2 ostatnie wersje). Desktop działa, ale nie jest celem.
- Testy jednostkowe: generator kroków (oba tryby, ćwiczenia jednostronne), timer, walidacja formularzy, odmiana liczebników, logika przypomnień. IndexedDB w testach przez `fake-indexeddb`.
- Testy E2E (Playwright, viewport mobilny): przejście całego treningu w obu trybach, wstecz i pomiń, tryb offline, zachowanie danych po przeładowaniu, edycja i przywrócenie FBW A, zmiana języka.

## 13. Stack (D10)

- React + Vite + TypeScript.
- `vite-plugin-pwa` (Workbox): Service Worker, precache, manifest. Własny kod SW (strategia `injectManifest`) na potrzeby `periodicsync` i `notificationclick`.
- Stan: Zustand z middleware `persist` i adapterem IndexedDB na `idb-keyval`. Wczytanie jest asynchroniczne, więc UI renderuje się po `persist.hasHydrated()`.
- Service Worker czyta te same klucze przez `idb-keyval` (format `persist`: `{ state, version }`).
- i18n: `react-i18next` (obsługuje polskie formy liczby mnogiej) albo lekki własny słownik z `Intl.PluralRules`.
- Routing: React Router albo proste przełączanie ekranów stanem (do decyzji przy implementacji).
- Konfetti: `canvas-confetti`, dołączone do bundla.
- Fonty systemowe, bez zewnętrznych zasobów.

## 14. Kryteria akceptacji MVP

1. Aplikację można zainstalować na ekranie głównym na Androidzie i iPhonie. Po instalacji, w trybie samolotowym, uruchamia się i pozwala przejść cały trening.
2. FBW A i FBW B są dostępne od pierwszego uruchomienia, z danymi z sekcji 4, w trybie klasycznym.
3. FBW A ma 20 kroków ćwiczeń w obu trybach; bulgarian split squat pokazuje w każdej serii osobno lewą i prawą nogę.
4. W trybie obwodu FBW A ma 4 rundy, a runda 4 zawiera tylko podciąganie i dipy.
5. Po „Zrobione” startuje przerwa właściwego typu, o długości ustawionej w podglądzie. Po jej końcu gra dźwięk, a ekran czeka na „Dalej”.
6. Plank odlicza od celu (domyślnie 45 s) do zera i kończy się sygnałem.
7. „Pomiń przerwę” od razu przechodzi dalej; „Wstecz” wraca do poprzedniego kroku ćwiczenia.
8. Pasek postępu pokazuje liczbę wykonanych kroków ćwiczeń.
9. Po ostatnim kroku pojawia się konfetti i gratulacje.
10. Można dodać własne ćwiczenie (kategoria, nazwa, serie, powtórzenia albo czas z celem, jednostronne), zbudować z niego trening i go wykonać.
11. Zmiany w FBW A zostają po przeładowaniu, a „Przywróć domyślne” przywraca wersję z sekcji 4.
12. Po przeładowaniu zostają własne ćwiczenia, treningi, tryb i przerwy treningów oraz język.
13. Przełączenie PL ↔ EN zmienia wszystkie teksty UI i nazwy wbudowanych ćwiczeń; wybór jest zapamiętany.
14. Timer pokazuje poprawny czas po zablokowaniu ekranu na 30 s i powrocie.

## 15. Decyzje (ustalone 2026-11-06)

| # | Temat | Decyzja |
|---|---|---|
| D1 | Kolejność ćwiczeń | Oba tryby w MVP: klasyczny i obwód, wybierane per trening. |
| D2 | Ćwiczenia na czas | Cel czasu ustawiany przy dodawaniu ćwiczenia i w konfiguracji treningu. Timer odlicza od celu do zera. |
| D3 | Zmiana strony | Bez timera; opcjonalnie ustawiana przerwa (S). |
| D4 | Koniec przerwy | Sygnał, potem ekran czeka na dotknięcie „Dalej”. |
| D5 | Gdzie serie i cel | Domyślne w ćwiczeniu, zmieniane w pozycji treningu (wynika z D2). |
| D6 | FBW A/B | Edytowalne, z „Przywróć domyślne”; nie można ich usunąć. |
| D7 | Przypomnienia | Tylko best effort na Androidzie (Periodic Background Sync). Na ekranie informacja, że na iOS nie działa i że godzina nie jest gwarantowana. |
| D8 | Nazwy | Podciąganie nachwytem. Kategoria „Tył uda i pośladki” (EN: Posterior chain). |
| D9 | Historia treningów | Poza MVP. |
| D10 | Stack | React + Vite + TypeScript. |
| D11 | Nazwa | Robocza: Training Buddy. |
| D12 | Domyślne przerwy | Klasyczny: 90 s między seriami, 120 s między ćwiczeniami. Obwód: 30 s między ćwiczeniami w rundzie, 120 s między rundami. |
| D13 | Przechowywanie danych | IndexedDB (`idb-keyval`) zamiast `localStorage`: jedna baza dla aplikacji i Service Workera, bez kopiowania harmonogramu. |

### Założenia przyjęte przy decyzjach (zaakceptowane 2026-11-06)

1. Plank w FBW A: cel domyślny 45 s (dół zakresu 45–60 s).
2. Koniec odliczania ćwiczenia na czas działa jak koniec przerwy: sygnał i czekanie na „Zrobione”.
3. Po końcu przerwy ekran pokazuje licznik czasu ponad przerwę („+0:12”).
4. Każdy tryb pamięta własne przerwy, więc przełączenie trybu nie gubi ustawień drugiego.
5. Wbudowane ćwiczenia (w odróżnieniu od treningów) są tylko do odczytu, z opcją „Duplikuj”.
6. Przypomnienie nie pojawia się, jeśli przeglądarka uruchomi synchronizację ponad 6 h po ustawionej godzinie.
7. `short_name` w manifeście do wybrania razem z ikoną („Training Buddy” może zostać ucięte pod ikoną).

## 16. Poza zakresem (na teraz)

- Konta, synchronizacja między urządzeniami, backend.
- Historia treningów, zapis wykonanych powtórzeń i ciężarów, progresja, wykresy.
- Web Push, eksport przypomnień do kalendarza, przypomnienia na iOS.
- Filmy i animacje instruktażowe ćwiczeń.
- Integracje: Apple Health, Google Fit, smartwatch.
