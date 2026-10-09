import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '2.7.0:0',
  releaseNotes: {
    en_US: `Updated Vikunja to 2.7.0.

**Security**

- Fixes six vulnerabilities, one rated high. A page on localhost could take over your session, revoked sessions kept receiving live notifications, removed collaborators kept receiving webhooks, read-only shares on child projects were ignored, members with write access could delete admin link shares, and a saved filter could fill the database.

**Features**

- An MCP server lets an AI assistant work with your tasks: create a token under Settings → MCP, read-only if you prefer.
- A new date picker everywhere you pick a date, with shortcuts like "tomorrow" and keyboard support.
- Overdue-task emails are split into "Assigned to you" and "Tasks you follow".
- Imports run in the background and no longer time out.

**Fixes**

- Apple Calendar no longer fails with "the calendar could not be found" over CalDAV.
- Pasting rich text into a description keeps its formatting.

[Full upstream release notes](https://vikunja.io/changelog/vikunja-2.7.0-was-released/)`,
    es_ES: `Vikunja actualizado a 2.7.0.

**Seguridad**

- Corrige seis vulnerabilidades, una de gravedad alta. Una página en localhost podía apoderarse de su sesión, las sesiones revocadas seguían recibiendo notificaciones en vivo, los colaboradores eliminados seguían recibiendo webhooks, los recursos compartidos de solo lectura en proyectos hijos se ignoraban, los miembros con acceso de escritura podían borrar enlaces compartidos de administrador y un filtro guardado podía llenar la base de datos.

**Funciones**

- Un servidor MCP permite que un asistente de IA trabaje con sus tareas: cree un token en Ajustes → MCP, de solo lectura si lo prefiere.
- Un nuevo selector de fecha en todos los lugares donde se elige una fecha, con atajos como «mañana» y uso con el teclado.
- Los correos de tareas vencidas se dividen en «Asignadas a usted» y «Tareas que sigue».
- Las importaciones se ejecutan en segundo plano y ya no agotan el tiempo de espera.

**Correcciones**

- Apple Calendar ya no falla con «no se pudo encontrar el calendario» por CalDAV.
- Pegar texto enriquecido en una descripción conserva su formato.

[Notas de la versión completas](https://vikunja.io/changelog/vikunja-2.7.0-was-released/)`,
    de_DE: `Vikunja auf 2.7.0 aktualisiert.

**Sicherheit**

- Behebt sechs Sicherheitslücken, eine davon als hoch eingestuft. Eine Seite auf localhost konnte Ihre Sitzung übernehmen, widerrufene Sitzungen erhielten weiterhin Live-Benachrichtigungen, entfernte Mitarbeiter erhielten weiterhin Webhooks, Nur-Lese-Freigaben in Unterprojekten wurden ignoriert, Mitglieder mit Schreibzugriff konnten Admin-Linkfreigaben löschen und ein gespeicherter Filter konnte die Datenbank füllen.

**Funktionen**

- Ein MCP-Server lässt einen KI-Assistenten mit Ihren Aufgaben arbeiten: Erstellen Sie unter Einstellungen → MCP ein Token, auf Wunsch nur lesend.
- Eine neue Datumsauswahl überall dort, wo ein Datum gewählt wird, mit Kürzeln wie „morgen“ und Tastaturbedienung.
- E-Mails zu überfälligen Aufgaben sind in „Ihnen zugewiesen“ und „Aufgaben, denen Sie folgen“ aufgeteilt.
- Importe laufen im Hintergrund und brechen nicht mehr wegen Zeitüberschreitung ab.

**Fehlerbehebungen**

- Apple Kalender scheitert über CalDAV nicht mehr mit „Der Kalender konnte nicht gefunden werden“.
- Eingefügter formatierter Text behält in einer Beschreibung seine Formatierung.

[Vollständige Versionshinweise](https://vikunja.io/changelog/vikunja-2.7.0-was-released/)`,
    pl_PL: `Vikunja zaktualizowana do 2.7.0.

**Bezpieczeństwo**

- Naprawia sześć luk, w tym jedną o wysokiej wadze. Strona na localhost mogła przejąć Twoją sesję, unieważnione sesje nadal otrzymywały powiadomienia na żywo, usunięci współpracownicy nadal otrzymywali webhooki, udostępnienia tylko do odczytu w projektach podrzędnych były ignorowane, członkowie z prawem zapisu mogli usuwać linki udostępniania administratora, a zapisany filtr mógł zapełnić bazę danych.

**Funkcje**

- Serwer MCP pozwala asystentowi AI pracować z Twoimi zadaniami: utwórz token w Ustawienia → MCP, w razie potrzeby tylko do odczytu.
- Nowy selektor daty wszędzie tam, gdzie wybiera się datę, ze skrótami takimi jak „jutro” i obsługą klawiatury.
- E-maile o zaległych zadaniach są podzielone na „Przypisane do Ciebie” i „Zadania, które obserwujesz”.
- Importy działają w tle i nie przekraczają już limitu czasu.

**Poprawki**

- Kalendarz Apple nie zawodzi już przez CalDAV z komunikatem „nie można znaleźć kalendarza”.
- Wklejony tekst sformatowany zachowuje formatowanie w opisie.

[Pełne informacje o wydaniu](https://vikunja.io/changelog/vikunja-2.7.0-was-released/)`,
    fr_FR: `Vikunja mis à jour en 2.7.0.

**Sécurité**

- Corrige six vulnérabilités, dont une de gravité élevée. Une page sur localhost pouvait prendre le contrôle de votre session, les sessions révoquées continuaient de recevoir des notifications en direct, les collaborateurs retirés continuaient de recevoir des webhooks, les partages en lecture seule des sous-projets étaient ignorés, les membres avec accès en écriture pouvaient supprimer des partages de lien administrateur et un filtre enregistré pouvait remplir la base de données.

**Fonctionnalités**

- Un serveur MCP permet à un assistant IA de travailler avec vos tâches : créez un jeton dans Paramètres → MCP, en lecture seule si vous préférez.
- Un nouveau sélecteur de date partout où une date est choisie, avec des raccourcis comme « demain » et une prise en charge du clavier.
- Les e-mails de tâches en retard sont séparés en « Assignées à vous » et « Tâches que vous suivez ».
- Les imports s'exécutent en arrière-plan et n'expirent plus.

**Corrections**

- Apple Calendar n'échoue plus avec « le calendrier est introuvable » via CalDAV.
- Coller du texte enrichi dans une description conserve sa mise en forme.

[Notes de version complètes](https://vikunja.io/changelog/vikunja-2.7.0-was-released/)`,
  },
  migrations: {
    up: async ({ effects }) => {},
    down: IMPOSSIBLE,
  },
})
