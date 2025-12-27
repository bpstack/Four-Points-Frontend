// app/components/booking/BookingWizard/steps/VehicleStep.tsx

import { FaSpinner } from 'react-icons/fa'
import { useTranslations } from 'next-intl'
import { SlidePanelSection, FormField, inputClassName, Alert } from '@/app/ui/panels'
import type { BookingWizardState, BookingWizardActions, WizardVariant } from '../types'

interface VehicleStepProps {
  variant: WizardVariant
  state: BookingWizardState
  actions: BookingWizardActions
  onCancel?: () => void
}

// Styles for full variant (GitHub-style)
const fullStyles = {
  card: 'bg-[#f6f8fa] dark:bg-[#161b22] border border-[#d0d7de] dark:border-[#30363d] rounded-md p-4 sm:p-5',
  sectionTitle: 'text-lg font-medium text-[#24292f] dark:text-[#f0f6fc]',
  label: 'block text-sm font-medium text-[#24292f] dark:text-[#c9d1d9] mb-1',
  input:
    'w-full px-3 py-2 bg-white dark:bg-[#0d1117] border border-[#d0d7de] dark:border-[#30363d] rounded-md text-[#24292f] dark:text-[#c9d1d9] placeholder-[#57606a] dark:placeholder-[#8b949e] focus:outline-none focus:ring-1 focus:ring-[#0969da] dark:focus:ring-[#1f6feb] text-sm',
  buttonPrimary:
    'px-4 py-2 bg-[#0969da] hover:bg-[#0550ae] dark:bg-[#1f6feb] dark:hover:bg-[#1158c7] disabled:bg-[#d0d7de] dark:disabled:bg-[#30363d] disabled:text-[#8c959f] text-white rounded-md font-medium transition text-sm',
  buttonSecondary:
    'px-4 py-2 bg-[#f6f8fa] hover:bg-[#eaeef2] dark:bg-[#21262d] dark:hover:bg-[#30363d] text-[#24292f] dark:text-[#c9d1d9] rounded-md font-medium transition text-sm',
}

export default function VehicleStep({ variant, state, actions, onCancel }: VehicleStepProps) {
  const t = useTranslations('booking')

  // Full variant - mantiene estilos GitHub originales con botones
  if (variant === 'full') {
    return (
      <div className={fullStyles.card}>
        <div className="flex gap-2 items-center mb-4">
          <h2 className={fullStyles.sectionTitle}>{t('vehicle.title')}</h2>
        </div>

        <Alert variant="info" className="mb-4">
          <p>{t('vehicle.infoAlert')}</p>
        </Alert>

        {/* Búsqueda de vehículos existentes */}
        <div className="mb-3 sm:mb-4">
          <label className={fullStyles.label}>{t('vehicle.searchLabel')}</label>
          <div className="relative">
            <input
              type="text"
              placeholder={t('vehicle.searchPlaceholder')}
              onChange={(e) => actions.handleSearchVehicles(e.target.value)}
              className={fullStyles.input}
            />
            {state.searchingVehicles && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <FaSpinner className="w-4 h-4 animate-spin text-[#57606a] dark:text-[#8b949e]" />
              </div>
            )}

            {state.showVehicleSearch && state.vehicleSearchResults.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white dark:bg-[#161b22] border border-[#d0d7de] dark:border-[#30363d] rounded-md shadow-lg max-h-48 overflow-y-auto">
                {state.vehicleSearchResults.map((vehicle) => (
                  <button
                    key={vehicle.id}
                    onClick={() => actions.handleSelectExistingVehicle(vehicle)}
                    className="w-full px-3 py-2 text-left hover:bg-[#f6f8fa] dark:hover:bg-[#21262d] transition-colors border-b border-[#d0d7de] dark:border-[#30363d] last:border-b-0"
                  >
                    <div className="font-medium text-[#24292f] dark:text-[#f0f6fc]">
                      {vehicle.plate_number}
                    </div>
                    <div className="text-xs text-[#57606a] dark:text-[#8b949e]">
                      {vehicle.owner_name} {vehicle.model && `• ${vehicle.model}`}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
          <p className="text-xs text-[#57606a] dark:text-[#8b949e] mt-1">
            {t('vehicle.searchHint')}
          </p>
        </div>

        {/* Separador */}
        <div className="relative mb-3">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[#d0d7de] dark:border-[#30363d]"></div>
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-[#f6f8fa] dark:bg-[#161b22] px-2 text-[#57606a] dark:text-[#8b949e]">
              {t('vehicle.newVehicleTitle')}
            </span>
          </div>
        </div>

        {/* Formulario nuevo vehículo */}
        <div className="space-y-3">
          <div>
            <label className={fullStyles.label}>{t('vehicle.plateNumber')}</label>
            <input
              type="text"
              value={state.vehicleData.plate_number}
              onChange={(e) =>
                actions.setVehicleData({ plate_number: e.target.value.toUpperCase() })
              }
              className={fullStyles.input + ' uppercase'}
              placeholder={t('vehicle.platePlaceholder')}
            />
          </div>

          <div>
            <label className={fullStyles.label}>{t('vehicle.owner')}</label>
            <input
              type="text"
              value={state.vehicleData.owner_name}
              onChange={(e) => actions.setVehicleData({ owner_name: e.target.value })}
              className={fullStyles.input}
              placeholder={t('vehicle.ownerPlaceholder')}
            />
          </div>

          <div>
            <label className={fullStyles.label}>{t('vehicle.modelOptional')}</label>
            <input
              type="text"
              value={state.vehicleData.model}
              onChange={(e) => actions.setVehicleData({ model: e.target.value })}
              className={fullStyles.input}
              placeholder={t('vehicle.modelPlaceholder')}
            />
          </div>
        </div>

        {/* Botones - solo para full variant */}
        <div className="grid grid-cols-2 gap-2 pt-3">
          <button onClick={onCancel} className={fullStyles.buttonSecondary}>
            {t('actions.cancel')}
          </button>
          <button
            onClick={actions.handleCreateVehicle}
            disabled={
              state.loading || !state.vehicleData.plate_number || !state.vehicleData.owner_name
            }
            className={fullStyles.buttonPrimary + ' flex items-center justify-center gap-2'}
          >
            {state.loading ? (
              <>
                <FaSpinner className="w-4 h-4 animate-spin" />
                {t('actions.creating')}
              </>
            ) : (
              t('actions.createAndContinue')
            )}
          </button>
        </div>
      </div>
    )
  }

  // Modal variant - usa estilos de SlidePanel (sin botones, van en footer)
  return (
    <div className="space-y-6">
      {/* Búsqueda de vehículos existentes */}
      <SlidePanelSection title={t('vehicle.searchTitle')}>
        <div className="relative">
          <input
            type="text"
            placeholder={t('vehicle.searchPlaceholder')}
            onChange={(e) => actions.handleSearchVehicles(e.target.value)}
            className={inputClassName}
          />
          {state.searchingVehicles && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <FaSpinner className="w-4 h-4 animate-spin text-gray-400" />
            </div>
          )}

          {state.showVehicleSearch && state.vehicleSearchResults.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white dark:bg-[#1c2128] border border-gray-200 dark:border-gray-700 rounded-md shadow-lg max-h-48 overflow-y-auto">
              {state.vehicleSearchResults.map((vehicle) => (
                <button
                  key={vehicle.id}
                  onClick={() => actions.handleSelectExistingVehicle(vehicle)}
                  className="w-full px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors border-b border-gray-100 dark:border-gray-700 last:border-b-0"
                >
                  <div className="font-medium text-gray-900 dark:text-gray-100">
                    {vehicle.plate_number}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {vehicle.owner_name} {vehicle.model && `• ${vehicle.model}`}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t('vehicle.searchHint')}</p>
      </SlidePanelSection>

      {/* Separador */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-white dark:bg-[#151b23] px-2 text-gray-500 dark:text-gray-400">
            {t('vehicle.newVehicle')}
          </span>
        </div>
      </div>

      {/* Formulario nuevo vehículo */}
      <SlidePanelSection title={t('vehicle.dataTitle')}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label={t('vehicle.plateNumber')} required>
            <input
              type="text"
              value={state.vehicleData.plate_number}
              onChange={(e) =>
                actions.setVehicleData({ plate_number: e.target.value.toUpperCase() })
              }
              className={inputClassName}
              placeholder={t('vehicle.platePlaceholder')}
            />
          </FormField>

          <FormField label={t('vehicle.owner')} required>
            <input
              type="text"
              value={state.vehicleData.owner_name}
              onChange={(e) => actions.setVehicleData({ owner_name: e.target.value })}
              className={inputClassName}
              placeholder={t('vehicle.ownerPlaceholder')}
            />
          </FormField>

          <FormField label={t('vehicle.model')} className="sm:col-span-2">
            <input
              type="text"
              value={state.vehicleData.model}
              onChange={(e) => actions.setVehicleData({ model: e.target.value })}
              className={inputClassName}
              placeholder={t('vehicle.modelPlaceholder')}
            />
          </FormField>
        </div>
      </SlidePanelSection>
    </div>
  )
}
