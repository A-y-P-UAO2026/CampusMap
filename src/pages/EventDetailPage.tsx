import { ArrowLeft, CalendarDays, Clock, MapPin, SearchX, TriangleAlert, Users } from "lucide-react";
import { Link, useParams } from "react-router";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  formatEventDate,
  formatEventTimeRange,
  getRegistrationState,
} from "@/features/events/eventFormat";
import { useEventDetail } from "@/features/events/useEvents";

function MessageCard({
  icon,
  title,
  text,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
  action?: React.ReactNode;
}) {
  return (
    <Card>
      <CardContent className="p-6 sm:p-10">
        <div className="grid size-12 place-items-center rounded-xl bg-accent text-accent-foreground">
          {icon}
        </div>
        <h1 className="mt-6 text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-3 leading-7 text-muted-foreground">{text}</p>
        {action}
      </CardContent>
    </Card>
  );
}

export function EventDetailPage() {
  const { id } = useParams();
  const { state, reload } = useEventDetail(id);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
      <Button
        render={<Link to="/eventos" />}
        variant="ghost"
        className="mb-8 -ml-3 min-h-11"
      >
        <ArrowLeft className="size-4" /> Volver a eventos
      </Button>

      {state.status === "loading" && (
        <div
          className="h-80 animate-pulse rounded-xl bg-muted"
          role="status"
          aria-label="Cargando evento"
        />
      )}

      {state.status === "not_found" && (
        <MessageCard
          icon={<SearchX className="size-6" aria-hidden="true" />}
          title="Evento no encontrado"
          text="Es posible que el evento ya no exista o que el enlace sea incorrecto."
        />
      )}

      {state.status === "error" && (
        <MessageCard
          icon={<TriangleAlert className="size-6" aria-hidden="true" />}
          title="No pudimos cargar el evento"
          text="Revisa tu conexión e inténtalo de nuevo."
          action={
            <Button onClick={reload} variant="outline" className="mt-5 min-h-11">
              Reintentar
            </Button>
          }
        />
      )}

      {state.status === "success" && (
        <Card>
          <CardContent className="p-6 sm:p-10">
            <div className="grid size-12 place-items-center rounded-xl bg-accent text-accent-foreground">
              <CalendarDays className="size-6" aria-hidden="true" />
            </div>
            <Badge
              variant={getRegistrationState(state.event).open ? "secondary" : "outline"}
              className="mt-6"
            >
              {getRegistrationState(state.event).label}
            </Badge>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight">
              {state.event.title}
            </h1>

            <ul className="mt-6 space-y-3 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <CalendarDays className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                {formatEventDate(state.event.starts_at)}
              </li>
              <li className="flex items-start gap-2">
                <Clock className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                {formatEventTimeRange(state.event.starts_at, state.event.ends_at)}
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                {state.event.location?.name ?? "Lugar por confirmar"}
              </li>
              <li className="flex items-start gap-2">
                <Users className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                Capacidad: {state.event.capacity} personas
              </li>
            </ul>

            <p className="mt-6 leading-7 text-muted-foreground">
              {state.event.description ?? "Este evento no tiene descripción."}
            </p>

            {/* E-06: aquí irá el botón «Inscribirme», conectado a la sesión
                y a la RPC register_for_event. */}
          </CardContent>
        </Card>
      )}
    </div>
  );
}