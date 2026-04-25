import { VersionInfo } from '@start9labs/start-sdk'

export const v_2_3_0 = VersionInfo.of({
  version: '2.3.0:0',
  releaseNotes: {
    en_US: 'Initial StartOS package for Vikunja 2.3.0.',
    es_ES: 'Paquete inicial de StartOS para Vikunja 2.3.0.',
    de_DE: 'Erstes StartOS-Paket für Vikunja 2.3.0.',
    pl_PL: 'Pierwszy pakiet StartOS dla Vikunja 2.3.0.',
    fr_FR: 'Premier paquet StartOS pour Vikunja 2.3.0.',
  },
  migrations: {
    up: async ({ effects }) => {},
    down: async ({ effects }) => {},
  },
})
