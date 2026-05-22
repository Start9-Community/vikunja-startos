import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'

export const v_2_3_0 = VersionInfo.of({
  version: '2.3.0:0',
  releaseNotes: {
    en_US: 'Initial release of Vikunja for StartOS.',
    es_ES: 'Lanzamiento inicial de Vikunja para StartOS.',
    de_DE: 'Erste Veröffentlichung von Vikunja für StartOS.',
    pl_PL: 'Pierwsze wydanie Vikunja dla StartOS.',
    fr_FR: 'Version initiale de Vikunja pour StartOS.',
  },
  migrations: {
    up: async ({ effects }) => {},
    down: IMPOSSIBLE,
  },
})
