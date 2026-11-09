/** Namespace "pwa" (pl). Access as t('pwa.<key>'). Owned by the pwa agent. */
const pwa: Record<string, string> = {
  'update.title': 'Dostępna nowa wersja',
  'update.body': 'Odśwież teraz albo wejdzie sama przy następnym uruchomieniu.',
  'update.sessionBody': 'Trening trwa dalej — odświeżysz po jego zakończeniu.',
  'update.refresh': 'Odśwież',
  'update.later': 'Później',

  'chip.install': 'Zainstaluj aplikację',
  'chip.dismiss': 'Nie pokazuj zachęty do instalacji',

  'lockHint.text': 'Nie blokuj telefonu w trakcie treningu, inaczej sygnał może nie zagrać.',

  'install.eyebrow': 'Pierwsze uruchomienie',
  'install.title': 'Zainstaluj aplikację',
  'install.lead': 'Z ekranu początkowego TrainBuddy działa jak zwykła aplikacja: na pełnym ekranie i bez internetu.',
  'install.stepsLabel': 'Jak zainstalować',
  'install.step1.title': 'Dotknij „Udostępnij”',
  'install.step1.body': 'Kwadrat ze strzałką w pasku Safari. Nie widzisz go? Najpierw dotknij „⋯”.',
  'install.step2.title': 'Wybierz „Do ekranu początkowego”',
  'install.step2.body': 'Jeśli nie ma tej opcji, przewiń listę w dół.',
  'install.step3.title': 'Otwórz TrainBuddy z ekranu początkowego',
  'install.step3.body': 'Treningi ustawiaj już w zainstalowanej aplikacji.',
  'install.warning.title': 'Dane z przeglądarki nie przejdą do aplikacji',
  'install.warning.body':
    'Treningi i ustawienia zapisane tutaj, w Safari, zostaną tylko w Safari. Zainstalowana aplikacja zacznie od zera.',
  'install.lock.title': 'W trakcie treningu',
  'install.continue': 'Kontynuuj w przeglądarce',

  'lock.eyebrow': 'Zanim zaczniesz',
  'lock.title': 'Nie blokuj telefonu',
  'lock.illustration': 'Telefon z odliczaniem przerwy i przekreśloną kłódką',
  'lock.tip.sound': 'Podgłośnij telefon — sygnał oznacza koniec przerwy.',
  'lock.tip.screenOn': 'Ekran nie zgaśnie sam w trakcie treningu.',
  'lock.tip.screenOff': 'Trzymanie ekranu włączonego jest wyłączone w ustawieniach — telefon może zablokować się sam.',
  'lock.tip.once': 'Ta wskazówka pojawia się tylko raz.',
  'lock.confirm': 'Rozumiem, zaczynamy',
};
export default pwa;
