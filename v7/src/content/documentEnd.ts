import { captureDomPhase } from './domCapture'
import { contentTabId, getContentTabId } from './tabContext'

import { installCrashNet } from '@/shared/crashNet'
import { Logger } from '@/shared/logger'

Logger.setContext('content-end')
installCrashNet('content')

captureDomPhase('document_end', contentTabId, getContentTabId).catch(() => {})
