import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '2.7.1:0',
  releaseNotes: {
    en_US: `Updated Vikunja to 2.7.1.

**Security**

- Fixes 41 vulnerabilities, two rated high: deleting an account, even a bot, could give read-only collaborators admin or owner rights on its projects, and a crafted Kanban move could leak tasks to project webhooks. Among the rest, logins stayed valid briefly after logout or a password change, read-only members could see webhook URLs, turning two-factor authentication on or off did not ask for your password or a current code, and attachments and the database were saved readable by every account on the system.

**Changes**

- A Kanban view holds at most 100 manual buckets and 50 filter buckets, and one import at most 100,000 items.
- API token permissions have new names. Existing tokens are converted automatically; scripts that create tokens through the API need the new names.

**Fixes**

- This update installs. The previous one, 2.7.0:1, failed during setup and was rolled back to the version you had.
- Bulk edits no longer clear assignees, reminders or favorites you did not change.
- Tasks repeating monthly on the 31st no longer skip months.
- Quick Add Magic no longer reads a date range as a due date.

[Full upstream release notes](https://vikunja.io/changelog/vikunja-2.7.1-was-released/)`,
    es_ES: `Vikunja actualizado a 2.7.1.

**Seguridad**

- Corrige 41 vulnerabilidades, dos de gravedad alta: eliminar una cuenta, incluso la de un bot, podía dar a colaboradores de solo lectura derechos de administrador o propietario sobre sus proyectos, y un movimiento de Kanban manipulado podía filtrar tareas a los webhooks del proyecto. Entre las demás, las sesiones seguían siendo válidas un momento tras cerrar sesión o cambiar la contraseña, los miembros de solo lectura podían ver las URL de los webhooks, activar o desactivar la autenticación en dos pasos no pedía su contraseña ni un código actual, y los adjuntos y la base de datos se guardaban legibles para todas las cuentas del sistema.

**Cambios**

- Una vista Kanban admite como máximo 100 columnas manuales y 50 columnas de filtro, y una importación como máximo 100 000 elementos.
- Los permisos de los tokens de API tienen nombres nuevos. Los tokens existentes se convierten automáticamente; los scripts que crean tokens mediante la API necesitan los nombres nuevos.

**Correcciones**

- Esta actualización se instala. La anterior, 2.7.0:1, fallaba durante la configuración y se revertía a la versión que tenía.
- Las ediciones masivas ya no borran asignaciones, recordatorios ni favoritos que usted no cambió.
- Las tareas que se repiten cada mes el día 31 ya no se saltan meses.
- Quick Add Magic ya no interpreta un rango de fechas como fecha de vencimiento.

[Notas de la versión completas](https://vikunja.io/changelog/vikunja-2.7.1-was-released/)`,
    de_DE: `Vikunja auf 2.7.1 aktualisiert.

**Sicherheit**

- Behebt 41 Sicherheitslücken, zwei davon mit hohem Schweregrad: Das Löschen eines Kontos, selbst eines Bots, konnte Mitarbeitenden mit Lesezugriff Administrator- oder Eigentümerrechte an dessen Projekten geben, und eine manipulierte Kanban-Verschiebung konnte Aufgaben an Projekt-Webhooks durchsickern lassen. Unter den übrigen: Anmeldungen blieben nach dem Abmelden oder einer Passwortänderung kurz gültig, Mitglieder mit Lesezugriff konnten Webhook-URLs sehen, das Ein- oder Ausschalten der Zwei-Faktor-Authentifizierung verlangte weder Ihr Passwort noch einen aktuellen Code, und Anhänge und die Datenbank wurden für alle Konten des Systems lesbar gespeichert.

**Änderungen**

- Eine Kanban-Ansicht fasst höchstens 100 manuelle und 50 Filter-Spalten, ein Import höchstens 100.000 Einträge.
- API-Token-Berechtigungen haben neue Namen. Bestehende Tokens werden automatisch umgestellt; Skripte, die Tokens über die API erstellen, brauchen die neuen Namen.

**Fehlerbehebungen**

- Dieses Update lässt sich installieren. Das vorherige, 2.7.0:1, schlug bei der Einrichtung fehl und wurde auf Ihre bisherige Version zurückgesetzt.
- Massenbearbeitungen löschen keine Zuweisungen, Erinnerungen oder Favoriten mehr, die Sie nicht geändert haben.
- Monatlich am 31. wiederkehrende Aufgaben überspringen keine Monate mehr.
- Quick Add Magic liest einen Datumsbereich nicht mehr als Fälligkeitsdatum.

[Vollständige Versionshinweise](https://vikunja.io/changelog/vikunja-2.7.1-was-released/)`,
    pl_PL: `Vikunja zaktualizowana do 2.7.1.

**Bezpieczeństwo**

- Naprawia 41 luk, w tym dwie o wysokiej wadze: usunięcie konta, nawet konta bota, mogło dać współpracownikom z dostępem tylko do odczytu prawa administratora lub właściciela w jego projektach, a spreparowane przeniesienie w Kanbanie mogło ujawnić zadania webhookom projektu. Wśród pozostałych: sesje pozostawały przez chwilę ważne po wylogowaniu lub zmianie hasła, członkowie z dostępem tylko do odczytu widzieli adresy URL webhooków, włączanie i wyłączanie uwierzytelniania dwuskładnikowego nie wymagało hasła ani bieżącego kodu, a załączniki i baza danych były zapisywane jako czytelne dla każdego konta w systemie.

**Zmiany**

- Widok Kanban mieści najwyżej 100 ręcznych kolumn i 50 kolumn filtrów, a jeden import najwyżej 100 000 elementów.
- Uprawnienia tokenów API mają nowe nazwy. Istniejące tokeny są przekształcane automatycznie; skrypty tworzące tokeny przez API potrzebują nowych nazw.

**Poprawki**

- Ta aktualizacja się instaluje. Poprzednia, 2.7.0:1, kończyła się błędem podczas konfiguracji i była wycofywana do posiadanej wersji.
- Edycja zbiorcza nie czyści już przypisań, przypomnień ani ulubionych, których nie zmieniono.
- Zadania powtarzane co miesiąc 31. dnia nie pomijają już miesięcy.
- Quick Add Magic nie odczytuje już zakresu dat jako terminu.

[Pełne informacje o wydaniu](https://vikunja.io/changelog/vikunja-2.7.1-was-released/)`,
    fr_FR: `Vikunja mis à jour en 2.7.1.

**Sécurité**

- Corrige 41 vulnérabilités, dont deux de gravité élevée : supprimer un compte, même celui d'un bot, pouvait donner à des collaborateurs en lecture seule des droits d'administrateur ou de propriétaire sur ses projets, et un déplacement Kanban forgé pouvait divulguer des tâches aux webhooks du projet. Parmi les autres : les sessions restaient brièvement valides après une déconnexion ou un changement de mot de passe, les membres en lecture seule pouvaient voir les URL des webhooks, activer ou désactiver l'authentification à deux facteurs ne demandait ni votre mot de passe ni un code actuel, et les pièces jointes et la base de données étaient enregistrées lisibles par tous les comptes du système.

**Changements**

- Une vue Kanban contient au plus 100 colonnes manuelles et 50 colonnes de filtre, et un import au plus 100 000 éléments.
- Les permissions des jetons d'API ont de nouveaux noms. Les jetons existants sont convertis automatiquement ; les scripts qui créent des jetons via l'API ont besoin des nouveaux noms.

**Corrections**

- Cette mise à jour s'installe. La précédente, 2.7.0:1, échouait pendant la configuration et revenait à la version que vous aviez.
- Les modifications groupées n'effacent plus les assignations, rappels ou favoris que vous n'avez pas modifiés.
- Les tâches répétées chaque mois le 31 ne sautent plus de mois.
- Quick Add Magic ne lit plus une plage de dates comme une date d'échéance.

[Notes de version complètes](https://vikunja.io/changelog/vikunja-2.7.1-was-released/)`,
  },
  migrations: {
    up: async ({ effects }) => {},
    down: IMPOSSIBLE,
  },
})
