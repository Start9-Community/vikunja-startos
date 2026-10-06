import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '2.6.0:3',
  releaseNotes: {
    en_US: `Installs, updates and restores no longer fail on servers with many attachments or slower disks.

- Open UI opens Vikunja at its primary URL.
- Until a primary URL is chosen, or while the chosen one is not one of Vikunja's addresses, email links use Vikunja's public domain if it has one, otherwise its .local address, and a task asks you to choose one.
- Every Enable and Disable action asks for confirmation before running.
- Run Diagnostics and Repair show their report in a box you can copy or download.
- The Auth Type and Repair Operation fields explain each of their options.`,
    es_ES: `Las instalaciones, actualizaciones y restauraciones ya no fallan en servidores con muchos adjuntos o discos más lentos.

- Abrir interfaz abre Vikunja en su URL principal.
- Hasta que se elija una URL principal, o mientras la elegida no sea una de las direcciones de Vikunja, los enlaces de correo usan el dominio público de Vikunja si tiene uno o, si no, su dirección .local, y una tarea le pide elegir una.
- Todas las acciones de Habilitar y Deshabilitar piden confirmación antes de ejecutarse.
- Ejecutar diagnósticos y Reparar muestran su informe en un cuadro que puede copiar o descargar.
- Los campos Tipo de autenticación y Operación de reparación explican cada una de sus opciones.`,
    de_DE: `Installationen, Updates und Wiederherstellungen schlagen auf Servern mit vielen Anhängen oder langsameren Datenträgern nicht mehr fehl.

- „Oberfläche öffnen“ öffnet Vikunja unter seiner primären URL.
- Solange keine primäre URL gewählt ist oder die gewählte keine Adresse von Vikunja ist, verwenden E-Mail-Links die öffentliche Domain von Vikunja, falls vorhanden, sonst seine .local-Adresse, und eine Aufgabe fordert Sie auf, eine zu wählen.
- Alle Aktivieren- und Deaktivieren-Aktionen fragen vor der Ausführung nach einer Bestätigung.
- „Diagnose ausführen“ und „Reparieren“ zeigen ihren Bericht in einem Feld, das Sie kopieren oder herunterladen können.
- Die Felder „Authentifizierungstyp“ und „Reparaturvorgang“ erklären jede ihrer Optionen.`,
    pl_PL: `Instalacje, aktualizacje i przywracanie nie kończą się już błędem na serwerach z wieloma załącznikami lub wolniejszymi dyskami.

- „Otwórz interfejs” otwiera Vikunja pod jego głównym adresem URL.
- Dopóki główny adres URL nie zostanie wybrany lub gdy wybrany nie jest jednym z adresów Vikunja, linki w e-mailach używają domeny publicznej Vikunja, jeśli ją ma, a w przeciwnym razie jego adresu .local, a zadanie prosi o wybranie adresu.
- Wszystkie akcje Włącz i Wyłącz proszą o potwierdzenie przed uruchomieniem.
- Uruchom diagnostykę i Napraw pokazują raport w polu, które można skopiować lub pobrać.
- Pola Typ uwierzytelniania i Operacja naprawy objaśniają każdą ze swoich opcji.`,
    fr_FR: `Les installations, mises à jour et restaurations n'échouent plus sur les serveurs comportant de nombreuses pièces jointes ou des disques plus lents.

- Ouvrir l'interface ouvre Vikunja à son URL principale.
- Tant qu'aucune URL principale n'est choisie, ou tant que celle choisie n'est pas l'une des adresses de Vikunja, les liens des e-mails utilisent le domaine public de Vikunja s'il en a un, sinon son adresse .local, et une tâche vous demande d'en choisir une.
- Toutes les actions Activer et Désactiver demandent une confirmation avant de s'exécuter.
- Lancer le diagnostic et Réparer affichent leur rapport dans un cadre que vous pouvez copier ou télécharger.
- Les champs Type d'authentification et Opération de réparation expliquent chacune de leurs options.`,
  },
  migrations: {
    up: async ({ effects }) => {},
    down: IMPOSSIBLE,
  },
})
