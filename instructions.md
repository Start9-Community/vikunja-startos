# Vikunja

Public registration is **off** by default. Create your first account using the **Create User** critical task that appears immediately after install — open it before doing anything else. You provide only a username and email; Vikunja generates a strong password and returns it (you can change it later in the app).

## Documentation

- [Vikunja help](https://vikunja.io/help/) — Learn how to use Vikunja day to day. Start with the basics, then jump to the feature you need. 
- [Vikunja documentation](https://vikunja.io/docs/) — upstream setup, API and development guides.

## What you get on StartOS

- A single **Web UI** interface serving Vikunja's frontend and API at `/`, and CalDAV at `/dav/`.
- An embedded SQLite database — you never configure or log into a database, and there is no Postgres or MySQL sidecar.
- A persistent JWT secret generated once on install, so container restarts and updates do not log you out.
- Public registration disabled by default; you create users through StartOS actions instead.
- SMTP that can be left off, sourced from StartOS's system SMTP (configured under **System → Email**), or pointed at a custom SMTP server.

## Getting set up

1. After installing, Vikunja posts one **critical** task — **Create User**. Open it, provide a username and email; Vikunja generates a strong password and returns it. **Save it** (you can change it in Vikunja later). The task disappears once the first user exists.
2. Your primary URL is set automatically to your `.local` address, so Vikunja is reachable right away. If you want to use a Tor `.onion` or a custom clearnet domain instead — it's what Vikunja uses for invitation emails, password-reset links, and the CORS allow-list — change it with the **Set Primary URL** action.
3. If you want Vikunja to send email (password resets, reminders, invites), run **Configure SMTP** under the **Email** group. Pick **System** to reuse StartOS's system SMTP, or **Custom** to enter provider credentials. Confirm with **Send Test Email**.
4. Open the **Web UI** interface and log in with the credentials from step 1.

## Using Vikunja

### Web interface

The Web UI is the Vikunja frontend — projects, tasks, kanban boards, gantt charts, table views, filters, labels, and attachments. CalDAV is reachable at `/dav/` on the same interface; point your CalDAV client at the primary URL.

### Actions

The actions are organized into three groups in the StartOS UI:

**Accounts**

- **Create User** — create a Vikunja user. You provide a username and email; Vikunja generates and returns a strong password (change it later in the app if you like). This is the critical install task until the first user exists, and stays available afterward for adding more users.
- **List Users** — show every Vikunja user with ID, username, and email.
- **Reset User Password** — generate a new password for a user and return it (no email sent). Use this to recover access if you're locked out.
- **Delete User** — immediately and irreversibly delete a user and all of their projects, tasks, and attachments. StartOS shows a warning before it runs.
- **Enable Registration / Disable Registration** — toggle public signups. Default is disabled; enable briefly if you want users to self-register, then disable again.
- **Enable Self-Service User Deletion / Disable Self-Service User Deletion** — control whether users can delete their own accounts without admin approval. Default is enabled.

**Email**

- **Configure SMTP** — pick **Disabled**, **System** (reuse StartOS system SMTP), or **Custom** (enter your own SMTP credentials). Advanced TLS-verify and auth-type options are tucked under the Advanced section.
- **Send Test Email** — deliver a single test message through the configured SMTP. Use this before relying on Vikunja to send reminders or password resets.
- **Enable Email Reminders / Disable Email Reminders** — toggle Vikunja's reminder emails for assigned and overdue tasks. Default is disabled; enabling without SMTP configured does nothing (you'll see a warning).

**Other**

- **Set Primary URL** — change which of your Vikunja URLs is the canonical one. If the previously chosen URL ever becomes unavailable (e.g., you remove a clearnet domain), StartOS posts a critical task asking you to pick a new one before Vikunja can run again.
- **Enable Link Sharing / Disable Link Sharing** — toggle whether users can share projects via public links. Default is disabled because anyone with a shared link can read every task and attachment on the shared project.
- **Set Max Attachment Size** — change the upload size limit for task attachments. Accepts human-readable strings like `20MB`, `200MB`, `2GB`.
- **Run Diagnostics** — runs Vikunja's built-in `doctor` command and returns the output. Use this when troubleshooting install or startup problems.

## Limitations

- **SQLite only.** PostgreSQL and MySQL/MariaDB backends are not exposed. SQLite fits the home-server and small-team use case StartOS targets.
