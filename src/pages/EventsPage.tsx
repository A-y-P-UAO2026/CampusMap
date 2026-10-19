import { CalendarDays, TriangleAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EventCard } from "@/features/events/EventCard";
import { useUpcomingEvents } from "@/features/events/useEvents";

function EventsSkeleton() {
  return (
    <div
      className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
      role="status"
      aria-label="Cargando eventos"
    >
      {[0, 1, 2].map((n) => (
        <div key={n} className="h-56 animate-pulse rounded-xl bg-muted" />
      ))}
    </div>
  );
}

export function EventsPage() {
  const { state, reload } = useUpcomingEvents();

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
      <div className="mb-8">
        <Badge variant="secondary" className="mb-4">
          Comunidad
        </Badge>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Eventos del campus
        </h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Descubre las próximas actividades de la comunidad universitaria.
        </p>
      </div>

      {state.status === "loading" && <EventsSkeleton />}

      {state.status === "error" && (
        <Card className="border-dashed">
          <CardHeader>
            <div className="flex size-11 items-center justify-center rounded-lg bg-accent text-accent-foreground">
              <TriangleAlert className="size-5" aria-hidden="true" />
            </div>
            <CardTitle className="pt-3">No pudimos cargar los eventos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="max-w-xl text-sm leading-6 text-muted-foreground">
              Revisa tu conexión e inténtalo de nuevo.
            </p>
            <Button onClick={reload} variant="outline" className="mt-5 min-h-11">
              Reintentar
            </Button>
          </CardContent>
        </Card>
      )}

      {state.status === "success" && state.events.length === 0 && (
        <Card className="border-dashed">
          <CardHeader>
            <div className="flex size-11 items-center justify-center rounded-lg bg-accent text-accent-foreground">
              <CalendarDays className="size-5" aria-hidden="true" />
            </div>
            <CardTitle className="pt-3">No hay eventos próximos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="max-w-xl text-sm leading-6 text-muted-foreground">
              Cuando se publiquen nuevas actividades aparecerán aquí.
            </p>
          </CardContent>
        </Card>
      )}

      {state.status === "success" && state.events.length > 0 && (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {state.events.map((event) => (
            <li key={event.id}>
              <EventCard event={event} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}