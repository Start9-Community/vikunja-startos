import { sdk } from '../sdk'
import { toggleRegistration } from './accounts/toggleRegistration'
import { toggleUserDeletion } from './accounts/toggleUserDeletion'
import { userCreate } from './accounts/userCreate'
import { userDelete } from './accounts/userDelete'
import { userList } from './accounts/userList'
import { userResetPassword } from './accounts/userResetPassword'
import { manageSmtp } from './email/manageSmtp'
import { testmail } from './email/testmail'
import { toggleEmailReminders } from './email/toggleEmailReminders'
import { doctor } from './other/doctor'
import { maxAttachmentSize } from './other/maxAttachmentSize'
import { setPrimaryUrl } from './other/setPrimaryUrl'
import { toggleLinkSharing } from './other/toggleLinkSharing'

export const actions = sdk.Actions.of()
  // Group: Accounts
  .addAction(userCreate)
  .addAction(userList)
  .addAction(userResetPassword)
  .addAction(userDelete)
  .addAction(toggleRegistration)
  .addAction(toggleUserDeletion)
  // Group: Email
  .addAction(manageSmtp)
  .addAction(testmail)
  .addAction(toggleEmailReminders)
  // Group: Other
  .addAction(setPrimaryUrl)
  .addAction(toggleLinkSharing)
  .addAction(maxAttachmentSize)
  .addAction(doctor)
