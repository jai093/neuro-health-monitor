import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function StatCardsSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="grid gap-6 sm:grid-cols-3" aria-hidden>
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i}>
          <CardHeader className="pb-2">
            <Skeleton className="h-4 w-24" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-9 w-20" />
            <Skeleton className="mt-2 h-3 w-36" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function ChartPanelSkeleton() {
  return (
    <Card className="mt-6" aria-hidden>
      <CardHeader>
        <Skeleton className="h-5 w-32" />
      </CardHeader>
      <CardContent className="h-80">
        <Skeleton className="h-full w-full rounded-xl" />
      </CardContent>
    </Card>
  );
}

export function ListSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="grid gap-4" aria-hidden>
      {Array.from({ length: rows }).map((_, i) => (
        <Card key={i}>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div className="space-y-2">
              <Skeleton className="h-5 w-44" />
              <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="h-8 w-20" />
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-3">
            {[0, 1, 2].map((j) => (
              <Skeleton key={j} className="h-24 rounded-xl" />
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function CardsGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2" aria-hidden>
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i}>
          <CardHeader className="flex flex-row items-start justify-between gap-3 pb-2">
            <Skeleton className="h-5 w-56" />
            <Skeleton className="h-6 w-24 rounded-full" />
          </CardHeader>
          <CardContent className="space-y-2">
            <Skeleton className="h-3.5 w-full" />
            <Skeleton className="h-3.5 w-5/6" />
            <Skeleton className="h-3.5 w-2/3" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function FormSkeleton() {
  return (
    <div className="grid gap-6 lg:grid-cols-3" aria-hidden>
      <Card className="lg:col-span-2">
        <CardHeader>
          <Skeleton className="h-5 w-52" />
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="space-y-1.5">
              <Skeleton className="h-3.5 w-24" />
              <Skeleton className="h-9 w-full" />
            </div>
          ))}
          <Skeleton className="h-20 sm:col-span-2" />
          <Skeleton className="h-20 sm:col-span-2" />
          <Skeleton className="h-9 w-32" />
        </CardContent>
      </Card>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-24" />
          </CardHeader>
          <CardContent className="space-y-3">
            <Skeleton className="h-16 rounded-xl" />
            <Skeleton className="h-16 rounded-xl" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-28" />
          </CardHeader>
          <CardContent className="space-y-3">
            <Skeleton className="h-4 w-44" />
            <Skeleton className="h-9 w-36" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export function EmergencySkeleton() {
  return (
    <div className="space-y-6" aria-hidden>
      <Skeleton className="h-24 w-full rounded-xl" />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-48" />
          </CardHeader>
          <CardContent className="space-y-3">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20 rounded-xl" />
            ))}
          </CardContent>
        </Card>
        <div className="space-y-6">
          {[0, 1, 2].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-5 w-40" />
              </CardHeader>
              <CardContent className="space-y-2">
                <Skeleton className="h-3.5 w-full" />
                <Skeleton className="h-3.5 w-4/5" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

export function LoadErrorCard({ onRetry }: { onRetry: () => void }) {
  return (
    <Card className="border-destructive/40" role="alert">
      <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
        <p className="font-semibold text-foreground">We couldn't load your saved data</p>
        <p className="max-w-md text-sm text-muted-foreground">
          Your records are stored only on this device. Retrying usually fixes the problem — nothing is lost by
          trying again.
        </p>
        <Button onClick={onRetry} variant="outline">
          <RefreshCw className="size-4" aria-hidden /> Retry
        </Button>
      </CardContent>
    </Card>
  );
}
