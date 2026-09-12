# Vikunja

## Documentation

- [Vikunja help](https://vikunja.io/help/) — how to use Vikunja day to day: the basics first, then each feature.
- [Vikunja documentation](https://vikunja.io/docs/) — the upstream setup, API and development guides.

## What you get on StartOS

- One **Web UI** interface serving Vikunja, with CalDAV at `/dav/` on the same address.
- A built-in database. There is nothing to set up or log into.
- You stay logged in across restarts and updates.
- Public registration is off. You add accounts with the **Create User** action.
- Email is optional: use your server's SMTP settings, your own SMTP server, or none.

## Getting set up

1. Before Vikunja starts for the first time, StartOS asks you to run **Create User**. Enter a username and email. Vikunja generates a password and shows it once — **save it**. You can change it in Vikunja later. If accounts already exist, after a restore for example, you won't be asked.
2. Open the **Web UI** interface and log in with that username and password.
3. To have Vikunja send email (password resets, reminders, invitations), run **Configure SMTP**, then **Send Test Email** to confirm a message arrives.

Vikunja works at every address you expose it at — your `.local` address, a LAN IP, Tor, a custom domain — including ones you add later. **Set Primary URL** only chooses which of them goes into links in emails.

## Using Vikunja

### Web interface

Projects, tasks, kanban boards, gantt charts, table views, filters, labels and attachments. To sync with a calendar or task app, point its CalDAV client at `/dav/` on any of Vikunja's addresses.

### Actions

**Accounts**

- **Create User** — add an account. You enter a username and email; Vikunja generates the password and shows it once.
- **List Users** — every account's ID, username and email.
- **Reset User Password** — pick an account from the list and get a new password for it. No email is sent. Use it when someone is locked out.
- **Delete User** — pick an account from the list and delete it, with all of its projects, tasks and attachments. This cannot be undone.
- **Enable Registration / Disable Registration** — let people sign up on their own. It is off by default; if you turn it on, turn it off again once they have signed up.
- **Enable / Disable Self-Service User Deletion** — whether people can delete their own accounts. It is on by default.

**Email**

- **Configure SMTP** — choose **Disabled**, **System** (your server's SMTP settings) or **Custom**. The **Advanced** section holds certificate-check and authentication options.
- **Send Test Email** — send one message with the current settings. Run it before relying on reminders or password resets.
- **Enable / Disable Email Reminders** — reminder emails for assigned and overdue tasks. Off by default, and they need SMTP.

**Other**

- **Set Primary URL** — which address goes into links in emails. If that address stops working, StartOS asks you to pick another.
- **Enable / Disable Link Sharing** — let people share a project through a public link. Off by default: anyone with the link can read every task and attachment in that project.
- **Set Max Attachment Size** — the upload limit, such as `20MB` or `2GB`.
- **Run Diagnostics** — Vikunja's built-in checks. Run it when something isn't working.
- **Repair** — finds and fixes database problems: tasks in the wrong order, projects you can't edit, archive or delete because their parent was deleted, attachments saved without a file type, and leftover ordering records. Choose one check or **Everything**. Leave **Dry Run** on the first time to see what it would change; if it finds something, take a backup and run it again with **Dry Run** off.
