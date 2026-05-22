import { FileHelper, smtpShape, z } from '@start9labs/start-sdk'
import { sdk } from '../sdk'

export const defaultMaxAttachmentSize = '20MB'

const smtpAdvancedShape = z
  .object({
    skipTlsVerify: z.boolean().catch(false),
    authType: z.enum(['plain', 'login', 'cram-md5']).catch('plain'),
  })
  .catch({ skipTlsVerify: false, authType: 'plain' })

// Keys are the Vikunja env vars they populate, and values are stored in the
// exact string form the env expects ('true'/'false', size strings, etc.), so
// reading the store is a shortcut to getting the env — getVikunjaEnv just
// passes them through. The exceptions are `initialUserCreated` (internal
// package state, never an env var) and the SMTP fields, which can't be flat
// env values: system credentials are read from StartOS at runtime, so they
// stay structured and resolve to VIKUNJA_MAILER_* in getVikunjaEnv.
const shape = z.object({
  initialUserCreated: z.boolean().catch(false),

  VIKUNJA_SERVICE_SECRET: z.string().optional().catch(undefined),
  VIKUNJA_SERVICE_PUBLICURL: z.string().catch(''),
  VIKUNJA_SERVICE_ENABLEREGISTRATION: z.enum(['true', 'false']).catch('false'),
  VIKUNJA_SERVICE_ENABLEUSERDELETION: z.enum(['true', 'false']).catch('true'),
  VIKUNJA_SERVICE_ENABLELINKSHARING: z.enum(['true', 'false']).catch('false'),
  VIKUNJA_SERVICE_ENABLEEMAILREMINDERS: z
    .enum(['true', 'false'])
    .catch('false'),
  VIKUNJA_FILES_MAXSIZE: z.string().catch(defaultMaxAttachmentSize),

  smtp: smtpShape,
  smtpAdvanced: smtpAdvancedShape,
})

export const storeJson = FileHelper.json(
  { base: sdk.volumes.startos, subpath: './store.json' },
  shape,
)

export type Store = z.infer<typeof shape>
