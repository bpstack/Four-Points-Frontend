// app/components/booking/BookingWizard/steps/DateOnlyStep.tsx

import { FaCalendar } from 'react-icons/fa'
import { useTranslations } from 'next-intl'
import { formatDateLocal, formatDateForInput } from '@/app/lib/helpers/date'
import SimpleCalendar from '@/app/ui/calendar/simplecalendar'
import TimePicker from '@/app/ui/calendar/timepicker'
import {
  SlidePanelSection,
  FormField,
  inputClassName,
  selectClassName,
  textareaClassName,
  Alert,
} from '@/app/ui/panels'
import type { BookingWizardState, BookingWizardActions } from '../types'

interface DateOnlyStepProps {
  state: BookingWizardState
  actions: BookingWizardActions
}

export default function DateOnlyStep({ state, actions }: DateOnlyStepProps) {
  const t = useTranslations('booking')

  return (
    <div className="space-y-6">
      {/* Fechas */}
      <SlidePanelSection title={t('dates.sectionTitle')}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* CHECK-IN */}
          <div className="relative calendar-container">
            <FormField label={t('dates.checkinDate')} required>
              <button
                type="button"
                onClick={() => {
                  actions.setShowCheckinCalendar(!state.showCheckinCalendar)
                  actions.setShowCheckoutCalendar(false)
                }}
                className={`${inputClassName} text-left flex justify-between items-center`}
              >
                <span
                  className={state.reservationData.expected_checkin_date ? '' : 'text-gray-400'}
                >
                  {state.reservationData.expected_checkin_date
                    ? formatDateLocal(new Date(state.reservationData.expected_checkin_date))
                    : t('dates.selectDate')}
                </span>
                <FaCalendar className="w-4 h-4 text-gray-400" />
              </button>
            </FormField>

            {state.showCheckinCalendar && (
              <div className="absolute z-40 mt-1 left-0 right-0 sm:right-auto sm:w-[290px]">
                <SimpleCalendar
                  selectedDate={
                    state.reservationData.expected_checkin_date
                      ? new Date(state.reservationData.expected_checkin_date)
                      : undefined
                  }
                  onSelect={(d) => {
                    if (d) {
                      actions.setReservationData({ expected_checkin_date: formatDateForInput(d) })
                    }
                    actions.setShowCheckinCalendar(false)
                  }}
                  onClose={() => actions.setShowCheckinCalendar(false)}
                />
              </div>
            )}

            <div className="mt-2">
              <TimePicker
                value={state.reservationData.expected_checkin_time}
                onChange={(time) => actions.setReservationData({ expected_checkin_time: time })}
                openTo="right"
                label={t('dates.checkinTime')}
              />
            </div>
          </div>

          {/* CHECK-OUT */}
          <div className="relative calendar-container">
            <FormField label={t('dates.checkoutDate')} required>
              <button
                type="button"
                onClick={() => {
                  actions.setShowCheckoutCalendar(!state.showCheckoutCalendar)
                  actions.setShowCheckinCalendar(false)
                }}
                className={`${inputClassName} text-left flex justify-between items-center`}
              >
                <span
                  className={state.reservationData.expected_checkout_date ? '' : 'text-gray-400'}
                >
                  {state.reservationData.expected_checkout_date
                    ? formatDateLocal(new Date(state.reservationData.expected_checkout_date))
                    : t('dates.selectDate')}
                </span>
                <FaCalendar className="w-4 h-4 text-gray-400" />
              </button>
            </FormField>

            {state.showCheckoutCalendar && (
              <div className="absolute z-40 mt-1 left-0 right-0 sm:left-auto sm:right-0 sm:w-[290px]">
                <SimpleCalendar
                  selectedDate={
                    state.reservationData.expected_checkout_date
                      ? new Date(state.reservationData.expected_checkout_date)
                      : undefined
                  }
                  onSelect={(d) => {
                    if (d) {
                      actions.setReservationData({ expected_checkout_date: formatDateForInput(d) })
                    }
                    actions.setShowCheckoutCalendar(false)
                  }}
                  onClose={() => actions.setShowCheckoutCalendar(false)}
                />
              </div>
            )}

            <div className="mt-2">
              <TimePicker
                value={state.reservationData.expected_checkout_time}
                onChange={(time) => actions.setReservationData({ expected_checkout_time: time })}
                openTo="left"
                label={t('dates.checkoutTime')}
              />
            </div>
          </div>
        </div>

        {/* Duration info */}
        {actions.calculateDays() > 0 && (
          <Alert variant="info" className="mt-4">
            <p>
              {t('dates.duration')}{' '}
              <span className="font-semibold">
                {t('dates.durationDays', { count: actions.calculateDays() })}
              </span>
            </p>
          </Alert>
        )}
      </SlidePanelSection>

      {/* Detalles adicionales */}
      <SlidePanelSection title={t('details.title')}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label={t('details.priceTotal')}>
            <input
              type="number"
              step="0.01"
              value={state.reservationData.total_amount}
              onChange={(e) => actions.setReservationData({ total_amount: e.target.value })}
              placeholder={t('details.priceAutoPlaceholder')}
              className={inputClassName}
            />
          </FormField>

          <FormField label={t('details.bookingSource')}>
            <select
              value={state.reservationData.booking_source}
              onChange={(e) => actions.setReservationData({ booking_source: e.target.value })}
              className={selectClassName}
            >
              <option value="direct">{t('sources.direct')}</option>
              <option value="booking">{t('sources.booking_com')}</option>
              <option value="airbnb">{t('sources.airbnb')}</option>
              <option value="phone">{t('sources.phone')}</option>
              <option value="email">{t('sources.email')}</option>
              <option value="walkin">{t('sources.walkin')}</option>
            </select>
          </FormField>
        </div>

        <FormField label={t('details.notes')} className="mt-4">
          <textarea
            value={state.reservationData.notes}
            onChange={(e) => actions.setReservationData({ notes: e.target.value })}
            rows={3}
            placeholder={t('details.notesPlaceholder')}
            className={textareaClassName}
          />
        </FormField>
      </SlidePanelSection>
    </div>
  )
}
