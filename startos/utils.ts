import { T } from '@start9labs/start-sdk'
import { defaultMaxAttachmentSize, storeJson } from './fileModels/store.json'
import { sdk } from './sdk'

export const uiPort = 3456 as const
export const DATA_MOUNT = '/data' as const
export const DB_SUBPATH = 'db' as const
export const FILES_SUBPATH = 'files' as const
export const VIKUNJA_UID = 1000 as const
export const VIKUNJA_GID = 1000 as const
export const VIKUNJA_ROOTPATH = '/app/vikunja/' as const

export const dataMount = sdk.Mounts.of().mountVolume({
  volumeId: 'main',
  subpath: null,
  mountpoint: DATA_MOUNT,
  readonly: false,
})

/**
 * Scratch-image /etc/passwd plant.
 *
 * The upstream `vikunja/vikunja` image is `FROM scratch` with `USER 1000`.
 * Scratch has no `/etc/passwd` or `/etc/group`, so start-container's USER
 * resolution fails. We plant minimal entries for root:0:0 and vikunja:1000:1000
 * into every subcontainer's rootfs before executing anything.
 */
const PASSWD_CONTENT =
  'root:x:0:0:root:/root:/bin/sh\n' +
  `vikunja:x:${VIKUNJA_UID}:${VIKUNJA_GID}:vikunja:/app/vikunja:/bin/sh\n`
const GROUP_CONTENT = `root:x:0:\nvikunja:x:${VIKUNJA_GID}:\n`

export async function plantPasswd(sub: {
  writeFile: (path: string, data: string) => Promise<void>
}): Promise<void> {
  await sub.writeFile('/etc/passwd', PASSWD_CONTENT)
  await sub.writeFile('/etc/group', GROUP_CONTENT)
}

/**
 * Read the URLs of the 'webui' service interface (excluding localhost and
 * link-local). Used to populate the Set Primary URL dropdown and to auto-seed
 * a .local URL on install.
 */
export async function getPrimaryUrls(effects: T.Effects): Promise<string[]> {
  return sdk.serviceInterface
    .getOwn(effects, 'webui', (i) => i?.addressInfo?.nonLocal.format() || [])
    .const()
}

export interface ResolvedSmtp {
  host: string
  port: number
  from: string
  username: string
  password: string | null | undefined
  security: 'tls' | 'starttls'
}

/**
 * Convert stored smtp + smtpAdvanced into the env vars Vikunja expects.
 * Returns an empty object when SMTP is disabled (only VIKUNJA_MAILER_ENABLED
 * needs to be set by the caller).
 */
export function buildMailerEnv(
  resolved: ResolvedSmtp,
  advanced: {
    skipTlsVerify: boolean
    authType: 'plain' | 'login' | 'cram-md5'
  },
): Record<string, string> {
  const env: Record<string, string> = {
    VIKUNJA_MAILER_ENABLED: 'true',
    VIKUNJA_MAILER_HOST: resolved.host,
    VIKUNJA_MAILER_PORT: String(resolved.port),
    VIKUNJA_MAILER_FROMEMAIL: resolved.from,
    VIKUNJA_MAILER_USERNAME: resolved.username,
    VIKUNJA_MAILER_FORCESSL: resolved.security === 'tls' ? 'true' : 'false',
    VIKUNJA_MAILER_SKIPTLSVERIFY: advanced.skipTlsVerify ? 'true' : 'false',
    VIKUNJA_MAILER_AUTHTYPE: advanced.authType,
  }
  if (resolved.password) {
    env.VIKUNJA_MAILER_PASSWORD = resolved.password
  }
  return env
}

/**
 * Resolve the SMTP configuration currently stored in store.json into the
 * env-var fragment Vikunja reads. Pulls from the StartOS system SMTP reactively
 * so that a change to system SMTP (via /system/email) triggers a daemon
 * restart via the enclosing .const() context.
 */
export async function resolveSmtpEnv(
  effects: T.Effects,
): Promise<Record<string, string>> {
  const store = await storeJson
    .read((s) => ({ smtp: s.smtp, smtpAdvanced: s.smtpAdvanced }))
    .const(effects)

  const sel = store?.smtp?.selection ?? 'disabled'
  const advanced = store?.smtpAdvanced ?? {
    skipTlsVerify: false,
    authType: 'plain' as const,
  }

  if (sel === 'system') {
    const sys = await sdk.getSystemSmtp(effects).const()
    if (!sys) return { VIKUNJA_MAILER_ENABLED: 'false' }
    const customFrom = (
      store?.smtp as { value?: { customFrom?: string } } | undefined
    )?.value?.customFrom
    return buildMailerEnv(
      {
        host: sys.host,
        port: sys.port,
        from: customFrom || sys.from,
        username: sys.username,
        password: sys.password ?? undefined,
        security: sys.security === 'tls' ? 'tls' : 'starttls',
      },
      advanced,
    )
  }

  if (sel === 'custom') {
    const value = (
      store?.smtp as
        | {
            value?: {
              provider: {
                value: {
                  host: string
                  from: string
                  username: string
                  password?: string | null
                  security: {
                    selection: 'tls' | 'starttls'
                    value: { port: string }
                  }
                }
              }
            }
          }
        | undefined
    )?.value

    if (!value) return { VIKUNJA_MAILER_ENABLED: 'false' }
    const p = value.provider.value
    return buildMailerEnv(
      {
        host: p.host,
        port: Number(p.security.value.port),
        from: p.from,
        username: p.username,
        password: p.password ?? undefined,
        security: p.security.selection,
      },
      advanced,
    )
  }

  return { VIKUNJA_MAILER_ENABLED: 'false' }
}

/**
 * Shared env fragment for daemon and CLI subcontainers.
 *
 * The full env fragment passed to both the long-lived daemon and every
 * temp CLI subcontainer. Pulls the currently-stored values reactively.
 *
 * Every CLI subcontainer needs the SAME env as the daemon, not just the
 * database path — otherwise CORS links or email templates break silently
 * (e.g. `vikunja user create` composes confirmation emails using
 * VIKUNJA_SERVICE_PUBLICURL).
 */
export async function getVikunjaEnv(
  effects: T.Effects,
): Promise<Record<string, string>> {
  const store = await storeJson
    .read((s) => ({
      jwtSecret: s.jwtSecret,
      primaryUrl: s.primaryUrl,
      enableRegistration: s.enableRegistration,
      enableUserDeletion: s.enableUserDeletion,
      enableLinkSharing: s.enableLinkSharing,
      enableEmailReminders: s.enableEmailReminders,
      maxAttachmentSize: s.maxAttachmentSize,
    }))
    .const(effects)

  const smtpEnv = await resolveSmtpEnv(effects)

  return {
    // Service
    VIKUNJA_SERVICE_INTERFACE: `:${uiPort}`,
    VIKUNJA_SERVICE_ROOTPATH: VIKUNJA_ROOTPATH,
    VIKUNJA_SERVICE_PUBLICURL: store?.primaryUrl || '',
    VIKUNJA_SERVICE_SECRET: store?.jwtSecret || '',
    VIKUNJA_SERVICE_TIMEZONE: 'UTC',
    VIKUNJA_SERVICE_ENABLECALDAV: 'true',
    VIKUNJA_SERVICE_ENABLETOTP: 'true',
    VIKUNJA_SERVICE_ENABLEREGISTRATION: store?.enableRegistration
      ? 'true'
      : 'false',
    VIKUNJA_SERVICE_ENABLELINKSHARING: store?.enableLinkSharing
      ? 'true'
      : 'false',
    VIKUNJA_SERVICE_ENABLEUSERDELETION: store?.enableUserDeletion
      ? 'true'
      : 'false',
    VIKUNJA_SERVICE_ENABLEEMAILREMINDERS: store?.enableEmailReminders
      ? 'true'
      : 'false',

    // Database
    VIKUNJA_DATABASE_TYPE: 'sqlite',
    VIKUNJA_DATABASE_PATH: `${DATA_MOUNT}/${DB_SUBPATH}/vikunja.db`,

    // Files
    VIKUNJA_FILES_BASEPATH: `${DATA_MOUNT}/${FILES_SUBPATH}`,
    VIKUNJA_FILES_MAXSIZE: store?.maxAttachmentSize || defaultMaxAttachmentSize,

    // Mailer (may include VIKUNJA_MAILER_ENABLED=false and nothing else)
    ...smtpEnv,
  }
}

type VikunjaSub = Parameters<
  Parameters<typeof sdk.SubContainer.withTemp<unknown>>[4]
>[0]

/**
 * Create a short-lived SubContainer from the vikunja image with the main
 * volume mounted and /etc/passwd + /etc/group planted. Used by every CLI
 * action (user create, user delete, doctor, testmail, etc.) to avoid
 * duplicating the boilerplate.
 */
export async function withVikunjaCli<T>(
  effects: T.Effects,
  name: string,
  fn: (sub: VikunjaSub, env: Record<string, string>) => Promise<T>,
): Promise<T> {
  const env = await getVikunjaEnv(effects)
  return sdk.SubContainer.withTemp(
    effects,
    { imageId: 'vikunja' },
    dataMount,
    name,
    async (sub) => {
      await plantPasswd(sub)
      return fn(sub, env)
    },
  )
}

/**
 * Vikunja boots its full runtime for every CLI invocation, so most command
 * output is prefixed with structured `time=YYYY-MM-DDT… level=INFO …` log
 * lines from migration and mailer init. Strip those — the user wants the
 * command's actual output, not the bootstrap noise.
 */
export function stripVikunjaLogs(text: string): string {
  return text
    .split('\n')
    .filter((line) => !/^time=\d{4}-\d{2}-\d{2}T/.test(line.trim()))
    .join('\n')
    .trim()
}
