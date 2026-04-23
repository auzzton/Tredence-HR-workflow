import type { AutomationAction } from '@/types/workflow'

export const FALLBACK_ACTIONS: AutomationAction[] = [
  { id: 'send_email', label: 'Send Email', params: ['to', 'subject'] },
  { id: 'generate_doc', label: 'Generate Document', params: ['template', 'recipient'] },
  { id: 'notify_slack', label: 'Notify Slack', params: ['channel', 'message'] },
  { id: 'create_ticket', label: 'Create Ticket', params: ['project', 'summary'] },
  { id: 'update_record', label: 'Update Record', params: ['table', 'record_id'] },
  { id: 'send_webhook', label: 'Send Webhook', params: ['url', 'payload'] },
]
