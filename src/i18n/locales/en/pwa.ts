/** Namespace "pwa" (en). Access as t('pwa.<key>'). Owned by the pwa agent. */
const pwa: Record<string, string> = {
  'update.title': 'New version available',
  'update.body': 'Refresh now, or it applies the next time you open the app.',
  'update.sessionBody': 'Your workout goes on — refresh after it ends.',
  'update.refresh': 'Refresh',
  'update.later': 'Later',

  'chip.install': 'Install app',
  'chip.dismiss': "Don't show the install hint",

  'lockHint.text': "Don't lock your phone during the workout, or the signal may not play.",

  'install.eyebrow': 'First launch',
  'install.title': 'Install the app',
  'install.lead': 'From the Home Screen TrainBuddy works like a regular app: full screen and without internet.',
  'install.stepsLabel': 'How to install',
  'install.step1.title': 'Tap “Share”',
  'install.step1.body': 'The square with an arrow in the Safari bar. Can’t see it? Tap “⋯” first.',
  'install.step2.title': 'Choose “Add to Home Screen”',
  'install.step2.body': 'If the option is missing, scroll the list down.',
  'install.step3.title': 'Open TrainBuddy from the Home Screen',
  'install.step3.body': 'Set up your workouts in the installed app.',
  'install.warning.title': 'Browser data won’t move to the app',
  'install.warning.body':
    'Workouts and settings saved here, in Safari, stay in Safari only. The installed app starts from scratch.',
  'install.lock.title': 'During the workout',
  'install.continue': 'Continue in the browser',

  'lock.eyebrow': 'Before you start',
  'lock.title': 'Don’t lock your phone',
  'lock.illustration': 'Phone with a rest countdown and a crossed-out lock',
  'lock.tip.sound': 'Turn the volume up — the signal marks the end of a rest.',
  'lock.tip.screenOn': 'The screen won’t turn off by itself during the workout.',
  'lock.tip.screenOff': 'Keeping the screen on is disabled in settings — the phone may lock by itself.',
  'lock.tip.once': 'You will see this hint only once.',
  'lock.confirm': 'Got it, let’s go',
};
export default pwa;
