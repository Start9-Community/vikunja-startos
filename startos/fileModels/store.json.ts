import { FileHelper, smtpShape, z } from '@start9labs/start-sdk'
import { sdk } from '../sdk'

export const defaultMaxAttachmentSize = '20MB'

const smtpAdvancedShape = z
  .object({
    skipTlsVerify: z.boolean().catch(false),
    authType: z.enum(['plain', 'login', 'cram-md5']).catch('plain'),
  })
  .catch({ skipTlsVerify: false, authType: 'plain' })

const shape = z.object({
  jwtSecret: z.string().optional().catch(undefined),
  primaryUrl: z.string().catch(''),
  initialUserCreated: z.boolean().catch(false),

  smtp: smtpShape,
  smtpAdvanced: smtpAdvancedShape,

  enableRegistration: z.boolean().catch(false),
  enableUserDeletion: z.boolean().catch(true),
  enableLinkSharing: z.boolean().catch(false),
  enableEmailReminders: z.boolean().catch(false),

  maxAttachmentSize: z.string().catch(defaultMaxAttachmentSize),
})

export const storeJson = FileHelper.json(
  { base: sdk.volumes.main, subpath: './store.json' },
  shape,
)
