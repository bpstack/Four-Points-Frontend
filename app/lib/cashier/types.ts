// app/lib/cashier/types.ts

export type ShiftType = 'night' | 'morning' | 'afternoon' | 'closing'
export type ShiftStatus = 'open' | 'in_progress' | 'closed' | 'audited'
export type VoucherStatus = 'pending' | 'justified' | 'cancelled'

// ═══════════════════════════════════════════════════════
// SHIFTS
// ═══════════════════════════════════════════════════════

export interface CashierShiftUser {
  user_id: string
  username: string
  is_primary: 0 | 1
}

export interface CashierShift {
  id: number
  shift_date: string
  shift_type: ShiftType
  status: ShiftStatus
  initial_fund: string // DECIMAL viene como string
  income: string
  cash_counted: string
  cash_expected: string
  difference: string
  payments_total: string
  grand_total: string
  notes: string | null
  created_at: string
  updated_at: string
  closed_at: string | null
  closed_by_id: string | null
  opened_by: string | null
  income_breakdown: Record<string, number> | null

  // ✅ Relaciones opcionales
  users?: CashierShiftUser[]
  denominations?: CashierDenomination[]
  payments?: CashierPayment[]
  vouchers?: CashierVoucher[]
}

// ═══════════════════════════════════════════════════════
// DAILY
// ═══════════════════════════════════════════════════════

export interface CashierDaily {
  id: number
  date: string
  total_cash: string
  total_card: string
  total_bacs: string
  total_web_payment: string
  total_transfer: string
  total_other: string
  grand_total: string
  status: 'open' | 'closed'
  closed_by: string | null
  closed_at: string | null
  notes: string | null
  created_at: string
  updated_at: string

  // ✅ Relaciones opcionales (cuando se pide con detalles)
  shifts?: CashierShift[]
  active_vouchers?: CashierVoucher[]
  active_vouchers_total?: string
  all_shifts_closed?: boolean
  can_close?: boolean
  validation_errors?: string[]
}

// ═══════════════════════════════════════════════════════
// VOUCHERS
// ═══════════════════════════════════════════════════════

export interface CashierVoucher {
  id: number
  amount: string
  reason: string
  status: VoucherStatus
  notes: string | null
  created_at: string
  created_by: string | null
  created_by_username?: string
  shift_id?: number | null
}

export interface VoucherStats {
  total_count: number
  pending_count: number
  pending_amount: string
  justified_count: number
  justified_amount: string
  cancelled_count: number
  cancelled_amount: string
}

// ═══════════════════════════════════════════════════════
// DENOMINATIONS & PAYMENTS
// ═══════════════════════════════════════════════════════

export interface CashierDenomination {
  id: number
  shift_id: number
  denomination: string
  quantity: number
  total: string
}

export interface CashierPayment {
  id: number
  shift_id: number
  payment_method_id: number
  payment_method_name: string
  amount: string
}

export interface PaymentMethod {
  id: number
  name: string
  is_active: boolean
}

// ═══════════════════════════════════════════════════════
// DTOs (para enviar al backend)
// ═══════════════════════════════════════════════════════

export interface InitializeDayDTO {
  opened_by: string
  primary_user_id: string
  secondary_user_ids?: string[]
  initial_fund?: number
}

export interface UpdateShiftDTO {
  income?: number
  income_breakdown?: Record<string, number>
  comments?: string // Se mapea a 'notes' en backend
}

export interface DenominationInput {
  denomination: number
  quantity: number
}

export interface PaymentInput {
  payment_method_id: number
  amount: number
}

export interface CreateVoucherDTO {
  amount: number
  reason: string
  created_by: string
  notes?: string
}

export interface UpdateVoucherDTO {
  amount?: number
  reason?: string
  notes?: string
}

// ═══════════════════════════════════════════════════════
// REPORTS
// ═══════════════════════════════════════════════════════

export interface MonthlyReport {
  period: {
    year: number
    month: number
    start: string
    end: string
    total_days: number
    days_closed: number
    days_open: number
  }
  totals: {
    total_cash: number
    total_card: number
    total_bacs: number
    total_web_payment: number
    total_transfer: number
    total_other: number
    grand_total: number
  }
  payment_methods_breakdown: Array<{
    method_name: string
    total_amount: number
    percentage: number
  }>
  daily_breakdown: Array<{
    date: string
    status: 'open' | 'closed'
    total_cash: number
    grand_total: number
    has_discrepancy: boolean
  }>
  validation_errors: string[]
}

export interface DashboardOverview {
  today: {
    date: string
    total_shifts: number
    open_shifts: number
    closed_shifts: number
    total_cash: number
    total_payments: number
    grand_total: number
  }
  vouchers: {
    active_count: number
    active_amount: number
    total_repaid: number
    oldest_active_date: string | null
  }
}

export interface VoucherHistoryItem extends CashierVoucher {
  shift_date?: string
  shift_type?: string
}

export interface VouchersHistoryResponse {
  vouchers: VoucherHistoryItem[]
  pagination?: {
    total: number
    page: number
    limit: number
  }
}

// ═══════════════════════════════════════════════════════
// HISTORY & AUDIT
// ═══════════════════════════════════════════════════════

export type HistoryAction =
  | 'created'
  | 'updated'
  | 'deleted'
  | 'status_changed'
  | 'adjustment'
  | 'voucher_created'
  | 'voucher_repaid'
  | 'daily_closed'
  | 'daily_reopened'

export interface CashierHistory {
  id: number
  shift_id: number
  action: HistoryAction
  table_affected: string | null
  record_id: number | null
  field_changed: string | null
  old_value: string | null
  new_value: string | null
  changed_by: string | null
  changed_at: string
  notes: string | null
}

export interface HistoryWithDetails extends CashierHistory {
  shift_date?: string
  shift_type?: string
  username?: string
  shift_status?: string
}

export interface HistoryFilters {
  shift_id?: number
  action?: string
  table_affected?: string
  changed_by?: string
  from_date?: string
  to_date?: string
  limit?: number
  offset?: number
  sort?: string
  order?: 'ASC' | 'DESC'
}

export interface HistoryStats {
  total_entries: number
  actions_breakdown: Array<{
    action: string
    count: number
  }>
  most_active_users: Array<{
    user_id: string
    username: string
    actions_count: number
  }>
  recent_activity: HistoryWithDetails[]
}
