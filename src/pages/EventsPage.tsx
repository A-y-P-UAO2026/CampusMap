import { ArrowRight, CalendarDays } from "lucide-react";
import { Link } from "react-router";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function EventsPage() {
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
      <Card className="border-dashed">
        <CardHeader>
          <div className="flex size-11 items-center justify-center rounded-lg bg-accent text-accent-foreground">
            <CalendarDays className="size-5" aria-hidden="true" />
          </div>
          <CardTitle className="pt-3">Próximamente</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="max-w-xl text-sm leading-6 text-muted-foreground">
            El listado de eventos se conectará a Supabase en una próxima etapa.
            Esta vista ya está preparada para la navegación del módulo.
          </p>
          <Button
            render={<Link to="/eventos/ejemplo" />}
            variant="outline"
            className="mt-5 min-h-11"
          >
            Ver detalle de ejemplo <ArrowRight className="size-4" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
