// app/lib/departments/queries.ts
// ✅ USA apiClient con auto-refresh automático

import apiClient from '@/app/lib/apiClient'
import { API_BASE_URL } from '@/app/lib/env'
import type { Department } from './types'

const API_URL = API_BASE_URL

// =============== API CLIENT ===============

interface ApiResponse<T> {
  success: boolean
  data: T
}

export const departmentsApi = {
  /**
   * Obtiene todos los departamentos
   */
  getAll: async (): Promise<Department[]> => {
    const response = await apiClient.get<ApiResponse<Department[]>>(`${API_URL}/api/departments`)
    return response.data
  },

  /**
   * Obtiene un departamento por ID
   */
  getById: async (id: number): Promise<Department> => {
    const response = await apiClient.get<ApiResponse<Department>>(
      `${API_URL}/api/departments/${id}`
    )
    return response.data
  },

  /**
   * Crea un nuevo departamento
   */
  create: async (data: { name: string }): Promise<Department> => {
    const response = await apiClient.post<ApiResponse<Department>>(
      `${API_URL}/api/departments`,
      data
    )
    return response.data
  },

  /**
   * Actualiza un departamento existente
   */
  update: async (id: number, data: { name: string }): Promise<Department> => {
    const response = await apiClient.put<ApiResponse<Department>>(
      `${API_URL}/api/departments/${id}`,
      data
    )
    return response.data
  },

  /**
   * Elimina un departamento
   */
  delete: async (id: number): Promise<{ message: string }> => {
    return apiClient.delete(`${API_URL}/api/departments/${id}`)
  },
}
