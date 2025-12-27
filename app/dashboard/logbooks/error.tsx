// app/dashboard/logbooks/error.tsx
'use client'

import { ModuleError } from '@/app/ui/errors/ModuleError'

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function LogbooksError({ error, reset }: ErrorProps) {
  return <ModuleError error={error} reset={reset} translationNamespace="logbooks" />
}
