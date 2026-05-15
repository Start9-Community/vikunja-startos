import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'

export const v_2_3_0 = VersionInfo.of({
  version: '2.3.0:1',
  releaseNotes: {
    en_US:
      'Package polish: updated to start-sdk 1.5.1, refactored install task flow, added on-install instructions, and localized input validation messages.',
    es_ES:
      'Mejoras del paquete: actualizado a start-sdk 1.5.1, flujo de tareas de instalación reestructurado, instrucciones de instalación añadidas y mensajes de validación localizados.',
    de_DE:
      'Paketpflege: Aktualisierung auf start-sdk 1.5.1, überarbeiteter Installations-Task-Ablauf, neue Installationshinweise und lokalisierte Validierungsmeldungen.',
    pl_PL:
      'Drobne ulepszenia pakietu: aktualizacja do start-sdk 1.5.1, przebudowany przepływ zadań instalacyjnych, instrukcje po instalacji oraz zlokalizowane komunikaty walidacji.',
    fr_FR:
      'Améliorations du paquet : passage à start-sdk 1.5.1, refonte du flux des tâches d’installation, ajout d’instructions à l’installation et messages de validation localisés.',
  },
  migrations: {
    up: async ({ effects }) => {},
    down: IMPOSSIBLE,
  },
})
