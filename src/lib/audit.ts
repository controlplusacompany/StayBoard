import { supabaseService } from './supabase';

export type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'FAILED_LOGIN';
export type EntityType = 'BOOKING' | 'ROOM' | 'PAYMENT' | 'GUEST' | 'SETTING';

/**
 * Logs an activity to the audit_logs table.
 * This should be used for all sensitive operations in the PMS.
 */
export async function logAudit(params: {
  userId?: string;
  action: AuditAction;
  entityType: EntityType;
  entityId: string;
  oldData?: any;
  newData?: any;
}) {
  try {
    const { error } = await supabaseService
      .from('audit_logs')
      .insert({
        user_id: params.userId,
        action: params.action,
        entity_type: params.entityType,
        entity_id: params.entityId,
        old_data: params.oldData,
        new_data: params.newData
      });

    if (error) {
      console.error('Failed to write audit log:', error);
    }
  } catch (err) {
    console.error('Audit logging crash:', err);
  }
}
