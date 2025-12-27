// app/components/booking/BookingWizard/steps/ConfirmationStep.tsx

import { FaArrowLeft, FaSpinner, FaCar } from 'react-icons/fa'
import { MdLocalParking } from 'react-icons/md'
import { useTranslations, useLocale } from 'next-intl'
import type { BookingWizardState, BookingWizardActions, WizardVariant } from '../types'

interface ConfirmationStepProps {
  variant: WizardVariant
  state: BookingWizardState
  actions: BookingWizardActions
}

// GitHub-style for full variant
const fullStyles = {
  card: 'bg-[#f6f8fa] dark:bg-[#161b22] border border-[#d0d7de] dark:border-[#30363d] rounded-md p-4 sm:p-5',
  sectionTitle: 'text-lg font-medium text-[#24292f] dark:text-[#f0f6fc]',
  buttonSuccess:
    'px-4 py-2 bg-[#1a7f37] hover:bg-[#116329] dark:bg-[#238636] dark:hover:bg-[#2ea043] disabled:bg-[#d0d7de] dark:disabled:bg-[#30363d] disabled:text-[#8c959f] text-white rounded-md font-medium transition text-sm',
  buttonSecondary:
    'px-4 py-2 bg-[#f6f8fa] hover:bg-[#eaeef2] dark:bg-[#21262d] dark:hover:bg-[#30363d] text-[#24292f] dark:text-[#c9d1d9] rounded-md font-medium transition text-sm',
}

// Modern indigo for modal variant
const modalStyles = {
  card: 'space-y-4 sm:space-y-5',
  title: 'text-base font-semibold text-gray-900 dark:text-gray-100 mb-1',
  subtitle: 'text-sm text-gray-600 dark:text-gray-400',
  buttonSuccess:
    'flex-1 px-4 sm:px-5 py-2.5 sm:py-3 text-sm font-medium text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 rounded-lg sm:rounded-xl transition-all duration-200 shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed',
  buttonSecondary:
    'px-4 sm:px-5 py-2.5 sm:py-3 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-lg sm:rounded-xl transition-all duration-200',
}

export default function ConfirmationStep({ variant, state, actions }: ConfirmationStepProps) {
  const t = useTranslations('booking')
  const locale = useLocale()
  const normalizeLevel = (levelCode: string) => levelCode.replace('-', '')

  if (variant === 'full') {
    return (
      <div className={fullStyles.card}>
        <h2 className={fullStyles.sectionTitle}>{t('confirmation.title')}</h2>

        <div className="space-y-2 p-3 sm:p-4 bg-[#f6f8fa] dark:bg-[#0d1117] border border-[#d0d7de] dark:border-[#30363d] rounded-md text-sm">
          {state.vehicleId && (
            <>
              <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
                <span className="text-[#57606a] dark:text-[#8b949e]">
                  {t('confirmation.vehicleLabel')}
                </span>
                <span className="font-medium text-[#24292f] dark:text-[#f0f6fc]">
                  {state.vehicleData.plate_number} - {state.vehicleData.model}
                </span>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
                <span className="text-[#57606a] dark:text-[#8b949e]">
                  {t('confirmation.owner')}
                </span>
                <span className="font-medium text-[#24292f] dark:text-[#f0f6fc]">
                  {state.vehicleData.owner_name}
                </span>
              </div>
            </>
          )}
          {!state.vehicleId && (
            <div className="text-sm text-[#57606a] dark:text-[#8b949e] italic">
              {t('vehicle.noVehicle')}
            </div>
          )}
          <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0 pt-2 border-t border-[#d0d7de] dark:border-[#30363d]">
            <span className="text-[#57606a] dark:text-[#8b949e]">{t('confirmation.spot')}</span>
            <span className="font-medium text-[#24292f] dark:text-[#f0f6fc]">
              {t('dates.floor', { level: normalizeLevel(state.reservationData.level_code) })} - Nº{' '}
              {state.reservationData.spot_number}
            </span>
          </div>
          <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
            <span className="text-[#57606a] dark:text-[#8b949e]">{t('dates.checkin')}:</span>
            <span className="font-medium text-[#24292f] dark:text-[#f0f6fc]">
              {state.reservationData.expected_checkin_date}{' '}
              {state.reservationData.expected_checkin_time}
            </span>
          </div>
          <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
            <span className="text-[#57606a] dark:text-[#8b949e]">{t('dates.checkout')}:</span>
            <span className="font-medium text-[#24292f] dark:text-[#f0f6fc]">
              {state.reservationData.expected_checkout_date}{' '}
              {state.reservationData.expected_checkout_time}
            </span>
          </div>
          <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
            <span className="text-[#57606a] dark:text-[#8b949e]">{t('confirmation.days')}</span>
            <span className="font-medium text-[#24292f] dark:text-[#f0f6fc]">
              {actions.calculateDays()}
            </span>
          </div>
          {state.reservationData.total_amount && (
            <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0 pt-2 border-t border-[#d0d7de] dark:border-[#30363d]">
              <span className="font-medium text-[#24292f] dark:text-[#c9d1d9]">
                {t('confirmation.price')}
              </span>
              <span className="font-bold text-[#1a7f37] dark:text-[#3fb950]">
                €{parseFloat(state.reservationData.total_amount).toFixed(2)}
              </span>
            </div>
          )}
          {!state.reservationData.total_amount && (
            <div className="text-xs text-[#57606a] dark:text-[#8b949e] pt-2 border-t border-[#d0d7de] dark:border-[#30363d]">
              {t('confirmation.priceAuto')}
            </div>
          )}
        </div>

        {/* Botones - RESPONSIVE */}
        <div className="flex flex-col sm:flex-row gap-2 mt-4">
          <button
            onClick={actions.prevStep}
            className={
              fullStyles.buttonSecondary +
              ' flex-1 flex items-center justify-center gap-2 order-2 sm:order-1'
            }
          >
            <FaArrowLeft className="w-3 h-3" /> {t('actions.back')}
          </button>
          <button
            onClick={actions.handleCreateReservation}
            disabled={state.loading}
            className={
              fullStyles.buttonSuccess +
              ' flex-1 flex items-center justify-center gap-2 order-1 sm:order-2'
            }
          >
            {state.loading ? (
              <>
                <FaSpinner className="w-4 h-4 animate-spin" />
                {t('actions.creating')}
              </>
            ) : (
              t('actions.confirmBooking')
            )}
          </button>
        </div>
      </div>
    )
  }

  // Modal variant
  return (
    <div className={modalStyles.card}>
      <div>
        <h3 className={modalStyles.title}>{t('confirmation.title')}</h3>
        <p className={modalStyles.subtitle}>{t('confirmation.subtitle')}</p>
      </div>

      <div className="space-y-4 p-4 sm:p-5 bg-gradient-to-br from-gray-50 to-slate-50 dark:from-slate-800/60 dark:to-slate-900/60 rounded-lg sm:rounded-xl border border-gray-100 dark:border-slate-700/50">
        {/* Vehículo */}
        {state.vehicleId && (
          <div className="space-y-2 sm:space-y-3 pb-3 sm:pb-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              <FaCar className="w-4 h-4" />
              {t('confirmation.vehicle')}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
              <div>
                <span className="text-xs text-gray-600 dark:text-gray-400">
                  {t('confirmation.plate')}
                </span>
                <p className="font-mono font-semibold text-gray-900 dark:text-gray-100 text-sm sm:text-base">
                  {state.vehicleData.plate_number}{' '}
                  {state.vehicleData.model && `- ${state.vehicleData.model}`}
                </p>
              </div>
              <div>
                <span className="text-xs text-gray-600 dark:text-gray-400">
                  {t('confirmation.owner')}
                </span>
                <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm sm:text-base">
                  {state.vehicleData.owner_name}
                </p>
              </div>
            </div>
          </div>
        )}
        {!state.vehicleId && (
          <div className="p-3 bg-gray-100 dark:bg-slate-800 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400 italic text-center">
              {t('vehicle.noVehicle')}
            </p>
          </div>
        )}

        {/* Reserva */}
        <div className="space-y-2 sm:space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            <MdLocalParking className="w-4 h-4" />
            {t('confirmation.booking')}
          </div>
          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            <div>
              <span className="text-xs text-gray-600 dark:text-gray-400">
                {t('confirmation.spot')}
              </span>
              <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm sm:text-base">
                {normalizeLevel(state.reservationData.level_code)} ·{' '}
                {state.reservationData.spot_number}
              </p>
            </div>
            <div>
              <span className="text-xs text-gray-600 dark:text-gray-400">
                {t('confirmation.days')}
              </span>
              <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm sm:text-base">
                {actions.calculateDays()}
              </p>
            </div>
            <div>
              <span className="text-xs text-gray-600 dark:text-gray-400">
                {t('confirmation.entry')}
              </span>
              <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm sm:text-base">
                {new Date(
                  `${state.reservationData.expected_checkin_date}T${state.reservationData.expected_checkin_time}`
                ).toLocaleString(locale, {
                  day: '2-digit',
                  month: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
            <div>
              <span className="text-xs text-gray-600 dark:text-gray-400">
                {t('confirmation.exit')}
              </span>
              <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm sm:text-base">
                {new Date(
                  `${state.reservationData.expected_checkout_date}T${state.reservationData.expected_checkout_time}`
                ).toLocaleString(locale, {
                  day: '2-digit',
                  month: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          </div>
        </div>

        {/* Precio */}
        {state.reservationData.total_amount && (
          <div className="pt-3 sm:pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {t('confirmation.priceTotal')}
              </span>
              <span className="text-xl sm:text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                €{parseFloat(state.reservationData.total_amount).toFixed(2)}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Botones - RESPONSIVE */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-2 sm:pt-4">
        <button
          onClick={actions.prevStep}
          className={`${modalStyles.buttonSecondary} order-2 sm:order-1`}
        >
          {t('actions.back')}
        </button>
        <button
          onClick={actions.handleCreateReservation}
          disabled={state.loading}
          className={`${modalStyles.buttonSuccess} order-1 sm:order-2`}
        >
          {state.loading ? (
            <span className="flex items-center justify-center gap-2">
              <FaSpinner className="w-4 h-4 animate-spin" />
              {t('actions.creating')}
            </span>
          ) : (
            t('actions.confirmBooking')
          )}
        </button>
      </div>
    </div>
  )
}
