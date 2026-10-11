import { ArrowLeft, CalendarDays } from "lucide-react";
import { Link, useParams } from "react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function EventDetailPage() {
  const { id } = useParams();
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
      <Button
        render={<Link to="/eventos" />}
        variant="ghost"
        className="mb-8 -ml-3 min-h-11"
      >
        <ArrowLeft className="size-4" /> Volver a eventos
      </Button>
      <Card>
        <CardContent className="p-6 sm:p-10">
          <div className="grid size-12 place-items-center rounded-xl bg-accent text-accent-foreground">
            <CalendarDays className="size-6" aria-hidden="true" />
          </div>
          <p className="mt-6 text-sm font-medium text-primary">
            Detalle de evento
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">
            Evento {id}
          </h1>
          <p className="mt-4 leading-7 text-muted-foreground">
            Esta pantalla es el punto de entrada para el detalle de eventos. El
            contenido real se integrará con el servicio de datos más adelante.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
