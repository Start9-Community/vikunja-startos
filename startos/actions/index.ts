import { sdk } from '../sdk'
import { createInitialUser } from './createInitialUser'
import { doctor } from './doctor'
import { manageSmtp } from './manageSmtp'
import { maxAttachmentSize } from './maxAttachmentSize'
import { setPrimaryUrl } from './setPrimaryUrl'
import { testmail } from './testmail'
import { toggleEmailReminders } from './toggleEmailReminders'
import { toggleLinkSharing } from './toggleLinkSharing'
import { toggleRegistration } from './toggleRegistration'
import { toggleUserDeletion } from './toggleUserDeletion'
import { userCreate } from './userCreate'
import { userDelete } from './userDelete'
import { userList } from './userList'
import { userResetPassword } from './userResetPassword'

export const actions = sdk.Actions.of()
  // === Accounts ===
  .addAction(createInitialUser)
  .addAction(userCreate)
  .addAction(userList)
  .addAction(userDelete)
  .addAction(userResetPassword)
  .addAction(toggleRegistration)
  .addAction(toggleUserDeletion)
  // === Email ===
  .addAction(manageSmtp)
  .addAction(toggleEmailReminders)
  .addAction(testmail)
  // === Other ===
  .addAction(setPrimaryUrl)
  .addAction(toggleLinkSharing)
  .addAction(maxAttachmentSize)
  .addAction(doctor)
