# Training Buddy

Prywatna aplikacja PWA (tylko frontend, offline, mobile-first), która prowadzi przez trening siłowy z masą ciała krok po kroku: ćwiczenie → przerwa z odliczaniem i sygnałem → następne ćwiczenie. Ma wbudowane treningi FBW A/B, własne ćwiczenia i treningi, tryb klasyczny i obwodowy oraz interfejs po polsku i angielsku. Dane są tylko na urządzeniu (IndexedDB), bez kont i serwera.

Stack: Vite, React 19, TypeScript (strict), Zustand (persist → IndexedDB), vite-plugin-pwa (`injectManifest`, `src/sw.ts`), Vitest, Playwright.

Zakres tej wersji to MVP: tickety T1–T8. Wznowienie sesji, pauza/±15 s/wibracje (T9), eksport/import (T10) i przypomnienia (T11) nie są zbudowane.

## Skrypty

Wymagany Node.js 20+ (budowane na 24). Najpierw `npm install`.

| Polecenie | Co robi |
|---|---|
| `npm run dev` | serwer deweloperski Vite na http://localhost:5173 (bez Service Workera) |
| `npm run build` | sprawdzenie typów (`tsc -b`) i build produkcyjny do `dist/` (z `sw.js` i manifestem) |
| `npm run preview` | serwuje zbudowany `dist/` na http://localhost:4173 (z Service Workerem) |
| `npm test` | testy jednostkowe i komponentów (Vitest) |
| `npm run e2e` | testy E2E w Playwright (Chromium, widok telefonu); sam buduje aplikację i uruchamia `preview` na porcie 4173. Za pierwszym razem: `npx playwright install chromium` |
| `npm run typecheck` | samo sprawdzenie typów (także specy E2E) |

## Instalacja na telefonie

Service Worker (offline i instalacja) działa tylko w bezpiecznym kontekście: przez HTTPS albo na `localhost`.

1. Zbuduj aplikację (`npm run build`) i wrzuć zawartość `dist/` na dowolny statyczny hosting z HTTPS (np. GitHub Pages, Netlify, Cloudflare Pages). Aplikacja używa ścieżek względnych, więc działa także w podkatalogu.
2. Otwórz adres na telefonie:
   - **iPhone (Safari):** „Udostępnij” (w nowym Safari najpierw „⋯”) → „Do ekranu początkowego”. Uruchamiaj z ikony: dane z Safari nie przechodzą do zainstalowanej aplikacji.
   - **Android (Chrome):** chip „Zainstaluj aplikację” na ekranie startowym albo menu ⋮ → „Zainstaluj aplikację”.
3. Po pierwszym uruchomieniu aplikacja działa bez internetu.

Szybki test w sieci lokalnej: `npm run dev -- --host` i otwarcie na telefonie adresu `http://<IP-komputera>:5173`. Tak sprawdzisz wygląd i działanie treningu, ale **bez Service Workera**: w trybie dev SW nie jest rejestrowany, a na zwykłym `http` pod adresem IP (innym niż `localhost`) przeglądarka i tak go nie dopuści. Nie da się więc w ten sposób przetestować offline ani instalacji. To samo dotyczy `npm run preview -- --host` otwartego z telefonu.

## Dokumentacja

- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md): struktura katalogów, store'y, przepływ nawigacji i sesji.
- [`docs/requirements.md`](docs/requirements.md): wymagania (FR/BR/EC/AC) i decyzje produktowe D1–D50, sekcja „Refined Requirements”.
- [`docs/tickets.md`](docs/tickets.md): tickety T1–T11 (MVP = T1–T8).
- [`DECISIONS.md`](DECISIONS.md): decyzje podjęte podczas budowy MVP i znane ograniczenia do sprawdzenia na urządzeniu (szczegółowe pliki per obszar w `docs/decisions/`).
