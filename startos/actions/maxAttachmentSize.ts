import { storeJson } from '../fileModels/store.json'
import { i18n } from '../i18n'
import { sdk } from '../sdk'

const { InputSpec, Value } = sdk

const inputSpec = InputSpec.of({
  size: Value.text({
    name: i18n('Maximum Attachment Size'),
    description: i18n(
      'Maximum upload size for task attachments, as a human-readable string (e.g. 20MB, 200MB, 2GB). Vikunja defaults to 20MB.',
    ),
    required: true,
    default: '20MB',
    placeholder: '20MB',
    patterns: [
      {
        regex: '^[0-9]+(?:\\.[0-9]+)?\\s*(?:[KMGT]i?B|B)?$',
        description: 'Enter a size like 20MB, 500MB, or 2GB.',
      },
    ],
  }),
})

export const maxAttachmentSize = sdk.Action.withInput(
  'max-attachment-size',

  {
    name: i18n('Set Max Attachment Size'),
    description: i18n(
      'Change the maximum size of task attachments users can upload.',
    ),
    warning: null,
    allowedStatuses: 'any',
    group: 'Other',
    visibility: 'enabled',
  },

  inputSpec,

  async ({ effects }) => ({
    size:
      (await storeJson.read((s) => s.maxAttachmentSize).once()) || '20MB',
  }),

  async ({ effects, input }) =>
    storeJson.merge(effects, { maxAttachmentSize: input.size }),
)
