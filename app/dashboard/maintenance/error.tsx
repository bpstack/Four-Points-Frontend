// app/dashboard/maintenance/error.tsx
'use client'

import { ModuleError } from '@/app/ui/errors/ModuleError'

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function MaintenanceError({ error, reset }: ErrorProps) {
  return <ModuleError error={error} reset={reset} translationNamespace="maintenance" />
}
