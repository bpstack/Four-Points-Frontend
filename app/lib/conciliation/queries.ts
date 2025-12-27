// app/lib/conciliation/queries.ts
'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/app/lib/apiClient'
import { API_BASE_URL } from '@/app/lib/env'
import type {
  ConciliationSummary,
  ConciliationDetail,
  ConciliationFormData,
  ConciliationStatus,
  MonthlySummary,
  CreateConciliationDTO,
} from './types'

const API_BASE = API_BASE_URL

// ═══════════════════════════════════════════════════════
// TIPOS DE RESPUESTA DEL BACKEND
// ═══════════════════════════════════════════════════════

interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
  code?: string
}

// ═══════════════════════════════════════════════════════
// QUERY KEYS
// ═══════════════════════════════════════════════════════

export const conciliationKeys = {
  all: ['conciliation'] as const,
  lists: () => [...conciliationKeys.all, 'list'] as const,
  detail: (id: number) => [...conciliationKeys.all, 'detail', id] as const,
  byDay: (date: string) => [...conciliationKeys.all, 'day', date] as const,
  monthly: (year: number, month: number) =>
    [...conciliationKeys.all, 'monthly', year, month] as const,
  missingDays: (year: number, month: number) =>
    [...conciliationKeys.all, 'missing', year, month] as const,
}

// ═══════════════════════════════════════════════════════
// QUERIES - DAILY
// ═══════════════════════════════════════════════════════

/**
 * Obtener todas las conciliaciones
 */
export function useConciliations() {
  return useQuery({
    queryKey: conciliationKeys.lists(),
    queryFn: async (): Promise<ConciliationSummary[]> => {
      const response = await apiClient.get<ApiResponse<ConciliationSummary[]>>(
        `${API_BASE}/api/conciliations`
      )
      return response.data
    },
    staleTime: 30 * 1000,
  })
}

/**
 * Obtener conciliación por fecha específica
 * Retorna null si no existe (el día no tiene conciliación iniciada)
 */
export function useConciliationByDay(date: string) {
  return useQuery({
    queryKey: conciliationKeys.byDay(date),
    queryFn: async (): Promise<ConciliationDetail | null> => {
      const response = await apiClient.get<ApiResponse<ConciliationDetail | null>>(
        `${API_BASE}/api/conciliations/day/${date}`
      )
      // El backend retorna { success: true, data: null } si no existe
      return response.data
    },
    staleTime: 30 * 1000,
    retry: false,
  })
}

/**
 * Obtener conciliación por ID
 */
export function useConciliationById(id: number) {
  return useQuery({
    queryKey: conciliationKeys.detail(id),
    queryFn: async (): Promise<ConciliationDetail> => {
      const response = await apiClient.get<ApiResponse<ConciliationDetail>>(
        `${API_BASE}/api/conciliations/${id}`
      )
      return response.data
    },
    staleTime: 30 * 1000,
    enabled: id > 0,
  })
}

// ═══════════════════════════════════════════════════════
// QUERIES - MONTHLY
// ═══════════════════════════════════════════════════════

/**
 * Obtener resumen mensual
 * Solo se ejecuta si year y month son válidos
 */
export function useMonthlySummary(year: number, month: number) {
  return useQuery({
    queryKey: conciliationKeys.monthly(year, month),
    queryFn: async (): Promise<MonthlySummary> => {
      const response = await apiClient.get<ApiResponse<MonthlySummary>>(
        `${API_BASE}/api/conciliations/monthly-summary/${year}/${month}`
      )
      return response.data
    },
    staleTime: 5 * 60 * 1000,
    // Solo ejecutar si year y month son números válidos
    enabled: !isNaN(year) && !isNaN(month) && year > 0 && month >= 1 && month <= 12,
  })
}

/**
 * Obtener días faltantes del mes
 */
export function useMissingDays(year: number, month: number) {
  return useQuery({
    queryKey: conciliationKeys.missingDays(year, month),
    queryFn: async (): Promise<string[]> => {
      const response = await apiClient.get<ApiResponse<string[]>>(
        `${API_BASE}/api/conciliations/monthly-summary/${year}/${month}/missing-days`
      )
      return response.data
    },
    staleTime: 5 * 60 * 1000,
    // Solo ejecutar si year y month son números válidos
    enabled: !isNaN(year) && !isNaN(month) && year > 0 && month >= 1 && month <= 12,
  })
}

// ═══════════════════════════════════════════════════════
// MUTATIONS - CREATE/UPDATE
// ═══════════════════════════════════════════════════════

/**
 * Crear nueva conciliación
 */
export function useCreateConciliation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateConciliationDTO): Promise<ConciliationDetail> => {
      const response = await apiClient.post<ApiResponse<ConciliationDetail>>(
        `${API_BASE}/api/conciliations`,
        data
      )
      return response.data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: conciliationKeys.lists() })
      queryClient.invalidateQueries({ queryKey: conciliationKeys.byDay(variables.date) })
    },
  })
}

/**
 * Actualizar formulario completo
 */
export function useUpdateConciliationForm() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      formData,
    }: {
      id: number
      formData: ConciliationFormData
    }): Promise<{ total_reception: number; total_housekeeping: number; difference: number }> => {
      const response = await apiClient.put<
        ApiResponse<{ total_reception: number; total_housekeeping: number; difference: number }>
      >(`${API_BASE}/api/conciliations/${id}/form`, formData)
      return response.data
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: conciliationKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: conciliationKeys.lists() })
      queryClient.invalidateQueries({ queryKey: conciliationKeys.all })
    },
  })
}

/**
 * Actualizar estado
 */
export function useUpdateConciliationStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      status,
    }: {
      id: number
      status: ConciliationStatus
    }): Promise<{ success: boolean; status: ConciliationStatus }> => {
      // Este endpoint retorna { success, status } directamente, no { success, data }
      return apiClient.patch(`${API_BASE}/api/conciliations/${id}/status`, { status })
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: conciliationKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: conciliationKeys.lists() })
      queryClient.invalidateQueries({ queryKey: conciliationKeys.all })
    },
  })
}

/**
 * Recalcular totales
 */
export function useRecalculateConciliation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (
      id: number
    ): Promise<{ total_reception: number; total_housekeeping: number; difference: number }> => {
      const response = await apiClient.post<
        ApiResponse<{ total_reception: number; total_housekeeping: number; difference: number }>
      >(`${API_BASE}/api/conciliations/${id}/recalculate`)
      return response.data
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: conciliationKeys.detail(id) })
    },
  })
}

/**
 * Eliminar conciliación (soft delete)
 */
export function useDeleteConciliation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: number): Promise<void> => {
      await apiClient.delete(`${API_BASE}/api/conciliations/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: conciliationKeys.lists() })
    },
  })
}

// ═══════════════════════════════════════════════════════
// MUTATIONS - MONTHLY
// ═══════════════════════════════════════════════════════

/**
 * Actualizar estado del resumen mensual
 */
export function useUpdateMonthlySummaryStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      year,
      month,
      status,
    }: {
      year: number
      month: number
      status: ConciliationStatus
    }): Promise<{ success: boolean }> => {
      return apiClient.patch(
        `${API_BASE}/api/conciliations/monthly-summary/${year}/${month}/status`,
        { status }
      )
    },
    onSuccess: (_, { year, month }) => {
      queryClient.invalidateQueries({ queryKey: conciliationKeys.monthly(year, month) })
    },
  })
}
