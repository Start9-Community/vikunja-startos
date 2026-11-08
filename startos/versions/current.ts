import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '2.8.0:0',
  releaseNotes: {
    en_US: `Updated Vikunja to 2.8.0. Requires StartOS 0.4.1 or later.

**Security**

- Fixes 19 vulnerabilities, three rated high. The most serious let any signed-in user read other users' files, such as attachments and data exports, and let overdue-task webhooks send other users' private projects to an outside address. Among the rest, a used two-factor code could be replayed in altered form, a failed Trello import wrote the Trello API token to the logs, and crafted calendar syncs, imports, exports, images or task descriptions could tie up the server's memory or CPU.

**New**

- Deleted tasks and projects go to a trash bin, with an undo button, and can be restored for 30 days.
- After 10 failed sign-ins, Vikunja locks the account until its password is reset. With SMTP set up, the owner is emailed a reset link. Reset User Password now unlocks the account too, and List Users shows each account's status.
- Quick Add Magic understands phrases like "in two weeks", and time-tracking entries show who tracked them.

**Changes**

- Reminders and overdue notices now follow task subscriptions: unsubscribing from a task stops them, even for its creator and assignees. The update subscribes creators and assignees to their existing tasks, so anyone who had unsubscribed from one needs to unsubscribe again.

**Fixes**

- Memory use no longer grows while the service runs.

[Full upstream release notes](https://vikunja.io/changelog/vikunja-2.8.0-was-released/)`,
    es_ES: `Vikunja actualizado a 2.8.0. Requiere StartOS 0.4.1 o posterior.

**Seguridad**

- Corrige 19 vulnerabilidades, tres de gravedad alta. Las más graves permitían a cualquier usuario con sesión iniciada leer archivos de otros usuarios, como adjuntos y exportaciones de datos, y hacían que los webhooks de tareas vencidas enviaran proyectos privados de otros usuarios a una dirección externa. Entre las demás, un código de doble factor ya usado podía reutilizarse modificado, una importación fallida de Trello escribía el token de la API de Trello en los registros, y sincronizaciones de calendario, importaciones, exportaciones, imágenes o descripciones de tareas manipuladas podían acaparar la memoria o la CPU del servidor.

**Novedades**

- Las tareas y proyectos eliminados van a una papelera, con un botón de deshacer, y pueden restaurarse durante 30 días.
- Tras 10 inicios de sesión fallidos, Vikunja bloquea la cuenta hasta que se restablezca su contraseña. Con SMTP configurado, el propietario recibe por correo un enlace de restablecimiento. Restablecer contraseña de usuario ahora también desbloquea la cuenta, y Listar usuarios muestra el estado de cada cuenta.
- Quick Add Magic entiende frases como «en dos semanas», y las entradas de seguimiento de tiempo muestran quién las registró.

**Cambios**

- Los recordatorios y avisos de vencimiento ahora siguen las suscripciones a tareas: cancelar la suscripción a una tarea los detiene, incluso para su creador y sus asignados. La actualización suscribe a creadores y asignados a sus tareas existentes, así que quien hubiera cancelado la suscripción a una debe cancelarla de nuevo.

**Correcciones**

- El uso de memoria ya no crece mientras el servicio está en ejecución.

[Notas de la versión completas](https://vikunja.io/changelog/vikunja-2.8.0-was-released/)`,
    de_DE: `Vikunja auf 2.8.0 aktualisiert. Erfordert StartOS 0.4.1 oder neuer.

**Sicherheit**

- Behebt 19 Sicherheitslücken, drei davon mit hohem Schweregrad. Die schwersten erlaubten jedem angemeldeten Benutzer, Dateien anderer Benutzer wie Anhänge und Datenexporte zu lesen, und ließen Webhooks für überfällige Aufgaben private Projekte anderer Benutzer an eine externe Adresse senden. Unter den übrigen: Ein bereits verwendeter Zwei-Faktor-Code ließ sich abgewandelt erneut verwenden, ein fehlgeschlagener Trello-Import schrieb das Trello-API-Token in die Protokolle, und manipulierte Kalendersynchronisationen, Importe, Exporte, Bilder oder Aufgabenbeschreibungen konnten Speicher oder CPU des Servers blockieren.

**Neu**

- Gelöschte Aufgaben und Projekte landen in einem Papierkorb, mit einer Rückgängig-Schaltfläche, und lassen sich 30 Tage lang wiederherstellen.
- Nach 10 fehlgeschlagenen Anmeldungen sperrt Vikunja das Konto, bis sein Passwort zurückgesetzt wird. Ist SMTP eingerichtet, erhält der Inhaber einen Link zum Zurücksetzen per E-Mail. "Benutzerpasswort zurücksetzen" entsperrt das Konto jetzt ebenfalls, und "Benutzer auflisten" zeigt den Status jedes Kontos.
- Quick Add Magic versteht Ausdrücke wie "in zwei Wochen", und Zeiterfassungseinträge zeigen, wer sie erfasst hat.

**Änderungen**

- Erinnerungen und Überfälligkeitshinweise richten sich jetzt nach Aufgabenabonnements: Wer eine Aufgabe abbestellt, erhält sie nicht mehr, auch als Ersteller oder zugewiesene Person. Das Update abonniert Ersteller und zugewiesene Personen für ihre bestehenden Aufgaben; wer eine davon abbestellt hatte, muss sie erneut abbestellen.

**Fehlerbehebungen**

- Der Speicherverbrauch steigt während der Laufzeit des Dienstes nicht mehr an.

[Vollständige Versionshinweise](https://vikunja.io/changelog/vikunja-2.8.0-was-released/)`,
    pl_PL: `Zaktualizowano Vikunja do wersji 2.8.0. Wymaga StartOS 0.4.1 lub nowszego.

**Bezpieczeństwo**

- Naprawia 19 luk, trzy o wysokiej wadze. Najpoważniejsze pozwalały każdemu zalogowanemu użytkownikowi odczytać pliki innych użytkowników, takie jak załączniki i eksporty danych, oraz sprawiały, że webhooki zaległych zadań wysyłały prywatne projekty innych użytkowników na zewnętrzny adres. Wśród pozostałych: użyty kod dwuskładnikowy można było ponownie wykorzystać w zmienionej postaci, nieudany import z Trello zapisywał token API Trello w logach, a spreparowane synchronizacje kalendarza, importy, eksporty, obrazy lub opisy zadań mogły zająć pamięć lub procesor serwera.

**Nowości**

- Usunięte zadania i projekty trafiają do kosza, z przyciskiem cofnięcia, i można je przywrócić przez 30 dni.
- Po 10 nieudanych logowaniach Vikunja blokuje konto do czasu zresetowania hasła. Gdy SMTP jest skonfigurowany, właściciel otrzymuje e-mailem link do resetu. Resetuj hasło użytkownika teraz także odblokowuje konto, a Lista użytkowników pokazuje stan każdego konta.
- Quick Add Magic rozumie wyrażenia takie jak „za dwa tygodnie”, a wpisy śledzenia czasu pokazują, kto je zarejestrował.

**Zmiany**

- Przypomnienia i powiadomienia o zaległościach podążają teraz za subskrypcjami zadań: rezygnacja z subskrypcji zadania je wyłącza, także dla twórcy i przypisanych osób. Aktualizacja subskrybuje twórców i przypisane osoby do ich istniejących zadań, więc kto zrezygnował z któregoś, musi zrobić to ponownie.

**Poprawki**

- Zużycie pamięci nie rośnie już podczas działania usługi.

[Pełne informacje o wydaniu](https://vikunja.io/changelog/vikunja-2.8.0-was-released/)`,
    fr_FR: `Vikunja mis à jour vers 2.8.0. Nécessite StartOS 0.4.1 ou une version ultérieure.

**Sécurité**

- Corrige 19 vulnérabilités, dont trois de gravité élevée. Les plus graves permettaient à tout utilisateur connecté de lire les fichiers d'autres utilisateurs, comme les pièces jointes et les exports de données, et faisaient envoyer par les webhooks de tâches en retard les projets privés d'autres utilisateurs vers une adresse externe. Parmi les autres, un code à deux facteurs déjà utilisé pouvait être rejoué sous une forme modifiée, un import Trello échoué écrivait le jeton d'API Trello dans les journaux, et des synchronisations de calendrier, imports, exports, images ou descriptions de tâches malveillants pouvaient monopoliser la mémoire ou le processeur du serveur.

**Nouveautés**

- Les tâches et projets supprimés vont dans une corbeille, avec un bouton d'annulation, et peuvent être restaurés pendant 30 jours.
- Après 10 connexions échouées, Vikunja verrouille le compte jusqu'à la réinitialisation de son mot de passe. Si SMTP est configuré, le titulaire reçoit un lien de réinitialisation par e-mail. Réinitialiser le mot de passe utilisateur déverrouille désormais aussi le compte, et Lister les utilisateurs affiche le statut de chaque compte.
- Quick Add Magic comprend des expressions comme « dans deux semaines », et les entrées de suivi du temps indiquent qui les a saisies.

**Changements**

- Les rappels et avis de retard suivent désormais les abonnements aux tâches : se désabonner d'une tâche les arrête, même pour son créateur et ses assignés. La mise à jour abonne les créateurs et assignés à leurs tâches existantes ; qui s'était désabonné de l'une d'elles doit donc se désabonner à nouveau.

**Corrections**

- La consommation de mémoire n'augmente plus pendant le fonctionnement du service.

[Notes de version complètes](https://vikunja.io/changelog/vikunja-2.8.0-was-released/)`,
  },
  migrations: {
    up: async ({ effects }) => {},
    down: IMPOSSIBLE,
  },
})
