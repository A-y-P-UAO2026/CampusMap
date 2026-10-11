import { ArrowRight, CalendarDays, MapPinned, Navigation } from "lucide-react";
import { Link } from "react-router";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function HomePage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
      <section className="grid gap-8 overflow-hidden rounded-2xl border bg-card p-6 sm:p-10 lg:grid-cols-[1.15fr_0.85fr] lg:p-14">
        <div className="flex flex-col justify-center">
          <Badge variant="secondary" className="mb-5 w-fit gap-1.5 px-3 py-1">
            <MapPinned className="size-3.5" aria-hidden="true" />
            Explora tu universidad
          </Badge>
          <h1 className="max-w-xl text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
            Encuentra tu camino en el campus.
          </h1>
          <p className="mt-5 max-w-lg text-base leading-7 text-muted-foreground sm:text-lg">
            Consulta ubicaciones, descubre eventos y planifica tus recorridos de
            forma sencilla.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button render={<Link to="/mapa" />} size="lg" className="min-h-11">
              Explorar mapa <ArrowRight className="size-4" />
            </Button>
            <Button
              render={<Link to="/eventos" />}
              variant="outline"
              size="lg"
              className="min-h-11"
            >
              Ver eventos
            </Button>
          </div>
        </div>
        <div className="relative min-h-64 overflow-hidden rounded-xl bg-accent p-6 sm:min-h-80">
          <div className="absolute -right-10 -top-10 size-48 rounded-full border-[24px] border-primary/10" />
          <div className="absolute -bottom-20 -left-8 size-56 rounded-full border-[32px] border-primary/10" />
          <div className="relative flex h-full flex-col justify-between">
            <div className="flex items-center justify-between text-accent-foreground">
              <span className="text-sm font-medium">Vista del campus</span>
              <Navigation className="size-5" aria-hidden="true" />
            </div>
            <div className="grid place-items-center py-8">
              <div className="grid size-20 place-items-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/20">
                <MapPinned className="size-9" aria-hidden="true" />
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Navegación clara, estés donde estés.
            </p>
          </div>
        </div>
      </section>
      <section className="mt-8 grid gap-4 md:grid-cols-2">
        <HomeFeature
          icon={MapPinned}
          title="Mapa del campus"
          description="Ubica edificios y encuentra rutas entre tus puntos de interés."
          to="/mapa"
        />
        <HomeFeature
          icon={CalendarDays}
          title="Eventos"
          description="Mantente al día con las actividades de la comunidad universitaria."
          to="/eventos"
        />
      </section>
    </div>
  );
}

function HomeFeature({
  icon: Icon,
  title,
  description,
  to,
}: {
  icon: typeof MapPinned;
  title: string;
  description: string;
  to: string;
}) {
  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardHeader className="flex-row items-start justify-between">
        <div className="grid size-10 place-items-center rounded-lg bg-accent text-accent-foreground">
          <Icon className="size-5" aria-hidden="true" />
        </div>
        <Button
          render={<Link to={to} />}
          variant="ghost"
          size="icon-sm"
          aria-label={`Ir a ${title}`}
        >
          <ArrowRight className="size-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <CardTitle>{title}</CardTitle>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          {description}
        </p>
      </CardContent>
    </Card>
  );
}
