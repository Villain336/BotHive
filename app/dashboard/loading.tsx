export default function DashboardLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div>
          <div className="h-8 w-48 bg-muted rounded" />
          <div className="h-4 w-32 bg-muted rounded mt-2" />
        </div>
        <div className="h-10 w-36 bg-muted rounded" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="border rounded-lg p-6 space-y-4">
            <div className="flex justify-between">
              <div className="h-5 w-32 bg-muted rounded" />
              <div className="h-5 w-16 bg-muted rounded" />
            </div>
            <div className="h-4 w-40 bg-muted rounded" />
            <div className="h-2 w-full bg-muted rounded" />
            <div className="grid grid-cols-2 gap-2">
              <div className="h-4 w-20 bg-muted rounded" />
              <div className="h-4 w-20 bg-muted rounded" />
              <div className="h-4 w-20 bg-muted rounded" />
              <div className="h-4 w-20 bg-muted rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
