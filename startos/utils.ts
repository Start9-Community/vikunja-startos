import { T } from '@start9labs/start-sdk'
import {
  defaultMaxAttachmentSize,
  Store,
  storeJson,
} from './fileModels/store.json'
import { sdk } from './sdk'

export const uiPort = 3456 as const
export const DATA_MOUNT = '/data' as const
export const DB_SUBPATH = 'db' as const
export const FILES_SUBPATH = 'files' as const
export const VIKUNJA_UID = 1000 as const
export const VIKUNJA_GID = 1000 as const

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
export async function plantPasswd(sub: {
  writeFile: (path: string, data: string) => Promise<void>
}): Promise<void> {
  await sub.writeFile(
    '/etc/passwd',
    'root:x:0:0:root:/root:/bin/sh\n' +
      `vikunja:x:${VIKUNJA_UID}:${VIKUNJA_GID}:vikunja:/app/vikunja:/bin/sh\n`,
  )
  await sub.writeFile('/etc/group', `root:x:0:\nvikunja:x:${VIKUNJA_GID}:\n`)
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

type CustomProvider = Extract<
  Store['smtp'],
  { selection: 'custom' }
>['value']['provider']['value']

/** Pure: a stored 'custom' SMTP provider config → SMTP credentials. */
export function customCredentials(p: CustomProvider): T.SmtpValue {
  return {
    host: p.host,
    port: Number(p.security.value.port),
    from: p.from,
    username: p.username,
    password: p.password,
    security: p.security.selection,
  }
}

/**
 * Pure: resolved SMTP credentials → VIKUNJA_MAILER_* env, or `{}` when there
 * are none (Vikunja's mailer defaults to off). The daemon and the Send Test
 * Email action resolve credentials and call this; other CLI actions don't send
 * mail, so they pass `{}` to getVikunjaEnv and never touch SMTP.
 */
export function mailerEnv(
  creds: T.SmtpValue | null,
  advanced: {
    skipTlsVerify: boolean
    authType: 'plain' | 'login' | 'cram-md5'
  },
): Record<string, string> {
  if (!creds) return {}
  const env: Record<string, string> = {
    VIKUNJA_MAILER_ENABLED: 'true',
    VIKUNJA_MAILER_HOST: creds.host,
    VIKUNJA_MAILER_PORT: String(creds.port),
    VIKUNJA_MAILER_FROMEMAIL: creds.from,
    VIKUNJA_MAILER_USERNAME: creds.username,
    VIKUNJA_MAILER_FORCESSL: creds.security === 'tls' ? 'true' : 'false',
    VIKUNJA_MAILER_SKIPTLSVERIFY: advanced.skipTlsVerify ? 'true' : 'false',
    VIKUNJA_MAILER_AUTHTYPE: advanced.authType,
  }
  if (creds.password) env.VIKUNJA_MAILER_PASSWORD = creds.password
  return env
}

/**
 * Build the env for the daemon and every CLI subcontainer. The store keys are
 * the env vars, so the stored settings pass straight through. SMTP is resolved
 * by the caller (only the daemon and Send Test Email need it) and passed in as
 * `smtp`; CLI commands that don't send mail leave it `{}`.
 */
export function getVikunjaEnv(
  store: Store | null,
  smtp: Record<string, string> = {},
): Record<string, string> {
  return {
    // Static / computed
    VIKUNJA_SERVICE_INTERFACE: `:${uiPort}`,
    VIKUNJA_SERVICE_ROOTPATH: '/app/vikunja/',
    VIKUNJA_SERVICE_TIMEZONE: 'UTC',
    VIKUNJA_SERVICE_ENABLECALDAV: 'true',
    VIKUNJA_SERVICE_ENABLETOTP: 'true',
    VIKUNJA_DATABASE_TYPE: 'sqlite',
    VIKUNJA_DATABASE_PATH: `${DATA_MOUNT}/${DB_SUBPATH}/vikunja.db`,
    VIKUNJA_FILES_BASEPATH: `${DATA_MOUNT}/${FILES_SUBPATH}`,

    // Stored settings — keys are the env vars, so these pass straight through
    VIKUNJA_SERVICE_SECRET: store?.VIKUNJA_SERVICE_SECRET ?? '',
    VIKUNJA_SERVICE_PUBLICURL: store?.VIKUNJA_SERVICE_PUBLICURL ?? '',
    VIKUNJA_SERVICE_ENABLEREGISTRATION:
      store?.VIKUNJA_SERVICE_ENABLEREGISTRATION ?? 'false',
    VIKUNJA_SERVICE_ENABLEUSERDELETION:
      store?.VIKUNJA_SERVICE_ENABLEUSERDELETION ?? 'true',
    VIKUNJA_SERVICE_ENABLELINKSHARING:
      store?.VIKUNJA_SERVICE_ENABLELINKSHARING ?? 'false',
    VIKUNJA_SERVICE_ENABLEEMAILREMINDERS:
      store?.VIKUNJA_SERVICE_ENABLEEMAILREMINDERS ?? 'false',
    VIKUNJA_FILES_MAXSIZE:
      store?.VIKUNJA_FILES_MAXSIZE ?? defaultMaxAttachmentSize,

    // SMTP — resolved by the caller (daemon / Send Test Email); `{}` otherwise
    ...smtp,
  }
}

type VikunjaSub = Parameters<
  Parameters<typeof sdk.SubContainer.withTemp<unknown>>[4]
>[0]

/**
 * Run a `vikunja` CLI command in a short-lived subcontainer from the vikunja
 * image, with the main volume mounted and /etc/passwd + /etc/group planted.
 * Used by every CLI action to avoid duplicating the boilerplate.
 *
 * The caller passes the env (built from a single store read at the action's top
 * level). This runner does no reads of its own and knows nothing about SMTP —
 * the CLI commands don't send mail, so `getVikunjaEnv(store)` is all they need.
 */
export async function withVikunjaCli<T>(
  effects: T.Effects,
  name: string,
  env: Record<string, string>,
  fn: (sub: VikunjaSub, env: Record<string, string>) => Promise<T>,
): Promise<T> {
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
