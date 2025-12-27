// app/dashboard/logbooks/loading.tsx
/**
 * Route-level Loading State for Logbooks
 */

function DatePickerSkeleton() {
  return (
    <div className="flex gap-1 overflow-hidden py-2">
      {[...Array(7)].map((_, i) => (
        <div
          key={i}
          className="flex-shrink-0 w-12 h-16 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"
        />
      ))}
    </div>
  )
}

function LogbookEntrySkeleton() {
  return (
    <div className="bg-white dark:bg-[#151b23] rounded-lg border border-gray-200 dark:border-gray-800 p-4 animate-pulse">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full" />
          <div className="space-y-1">
            <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded" />
            <div className="h-3 w-16 bg-gray-100 dark:bg-gray-800 rounded" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-5 w-14 bg-gray-200 dark:bg-gray-700 rounded-full" />
          <div className="h-5 w-16 bg-gray-200 dark:bg-gray-700 rounded-full" />
        </div>
      </div>
      <div className="space-y-2 mb-3">
        <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded" />
        <div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-700 rounded" />
      </div>
      <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-800">
        <div className="h-3 w-20 bg-gray-100 dark:bg-gray-800 rounded" />
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="h-6 w-6 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>
      </div>
    </div>
  )
}

export default function LogbooksLoading() {
  return (
    <div className="min-h-screen bg-white dark:bg-[#010409] p-4 md:p-6">
      <div className="max-w-4xl mx-auto space-y-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="space-y-1">
            <div className="h-7 w-28 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            <div className="h-4 w-44 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
          </div>
          <div className="h-8 w-28 bg-gray-200 dark:bg-gray-700 rounded-md animate-pulse" />
        </div>

        {/* Month Navigation */}
        <div className="flex items-center justify-between">
          <div className="w-9 h-9 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          <div className="flex items-center gap-2">
            <div className="h-5 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            <div className="w-6 h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          </div>
          <div className="w-9 h-9 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        </div>

        {/* Date Picker Skeleton */}
        <DatePickerSkeleton />

        {/* Entries List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            <div className="h-3 w-20 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
          </div>

          {[...Array(4)].map((_, i) => (
            <LogbookEntrySkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  )
}
