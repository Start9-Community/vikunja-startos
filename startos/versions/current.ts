import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '2.6.0:3',
  releaseNotes: {
    en_US: `Installs, updates and restores no longer fail on servers with many attachments or slower disks.

- Open UI opens Vikunja at its primary URL when your connection can reach it.
- A task asks you to choose a primary URL while it is unset or its hostname is no longer offered. Email links follow the chosen hostname's current address, or prefer a public domain (HTTPS first), then .local, then another offered address. With none offered, the stored URL is retained.
- Every Enable and Disable action asks for confirmation before running.
- Run Diagnostics and Repair show their report in a box you can copy or download.
- The Auth Type and Repair Operation fields explain each of their options.`,
    es_ES: `Las instalaciones, actualizaciones y restauraciones ya no fallan en servidores con muchos adjuntos o discos más lentos.

- Abrir interfaz abre Vikunja en su URL principal cuando su conexión puede alcanzarla.
- Una tarea le pide elegir una URL principal si no está configurada o su nombre de host ya no se ofrece. Los enlaces de correo siguen la dirección actual del host elegido o prefieren un dominio público (HTTPS primero), luego .local y luego otra dirección ofrecida. Si no se ofrece ninguna, se conserva la URL guardada.
- Todas las acciones de Habilitar y Deshabilitar piden confirmación antes de ejecutarse.
- Ejecutar diagnósticos y Reparar muestran su informe en un cuadro que puede copiar o descargar.
- Los campos Tipo de autenticación y Operación de reparación explican cada una de sus opciones.`,
    de_DE: `Installationen, Updates und Wiederherstellungen schlagen auf Servern mit vielen Anhängen oder langsameren Datenträgern nicht mehr fehl.

- „Oberfläche öffnen“ öffnet Vikunja unter seiner primären URL, wenn Ihre Verbindung sie erreichen kann.
- Eine Aufgabe fordert zur Wahl einer primären URL auf, solange sie fehlt oder ihr Hostname nicht mehr angeboten wird. E-Mail-Links folgen der aktuellen Adresse des gewählten Hostnamens oder bevorzugen eine öffentliche Domain (HTTPS zuerst), dann .local, dann eine andere angebotene Adresse. Ohne angebotene Adresse bleibt die gespeicherte URL erhalten.
- Alle Aktivieren- und Deaktivieren-Aktionen fragen vor der Ausführung nach einer Bestätigung.
- „Diagnose ausführen“ und „Reparieren“ zeigen ihren Bericht in einem Feld, das Sie kopieren oder herunterladen können.
- Die Felder „Authentifizierungstyp“ und „Reparaturvorgang“ erklären jede ihrer Optionen.`,
    pl_PL: `Instalacje, aktualizacje i przywracanie nie kończą się już błędem na serwerach z wieloma załącznikami lub wolniejszymi dyskami.

- „Otwórz interfejs” otwiera Vikunja pod jego głównym adresem URL, gdy Twoje połączenie może go osiągnąć.
- Zadanie prosi o wybór głównego adresu URL, gdy nie jest ustawiony lub jego nazwa hosta nie jest już oferowana. Linki w e-mailach używają bieżącego adresu wybranego hosta albo preferują domenę publiczną (najpierw HTTPS), potem .local, potem inny oferowany adres. Gdy żadnego nie ma, zapisany adres URL pozostaje.
- Wszystkie akcje Włącz i Wyłącz proszą o potwierdzenie przed uruchomieniem.
- Uruchom diagnostykę i Napraw pokazują raport w polu, które można skopiować lub pobrać.
- Pola Typ uwierzytelniania i Operacja naprawy objaśniają każdą ze swoich opcji.`,
    fr_FR: `Les installations, mises à jour et restaurations n'échouent plus sur les serveurs comportant de nombreuses pièces jointes ou des disques plus lents.

- Ouvrir l'interface ouvre Vikunja à son URL principale lorsque votre connexion peut l'atteindre.
- Une tâche demande de choisir une URL principale tant qu'elle est absente ou que son nom d'hôte n'est plus proposé. Les liens des e-mails suivent l'adresse actuelle de l'hôte choisi ou privilégient un domaine public (HTTPS d'abord), puis .local, puis une autre adresse proposée. Sans adresse proposée, l'URL enregistrée est conservée.
- Toutes les actions Activer et Désactiver demandent une confirmation avant de s'exécuter.
- Lancer le diagnostic et Réparer affichent leur rapport dans un cadre que vous pouvez copier ou télécharger.
- Les champs Type d'authentification et Opération de réparation expliquent chacune de leurs options.`,
  },
  migrations: {
    up: async ({ effects }) => {},
    down: IMPOSSIBLE,
  },
})
