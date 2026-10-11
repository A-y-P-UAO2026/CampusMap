import { Compass, MapPinned, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export function MapPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
      <div className="mb-8">
        <Badge variant="secondary" className="mb-4">
          Mapa
        </Badge>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Mapa del campus
        </h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Busca un edificio o punto de interés para comenzar a explorar.
        </p>
      </div>
      <div className="grid gap-6 lg:grid-cols-[minmax(260px,340px)_1fr]">
        <Card className="h-fit">
          <CardContent className="space-y-5 pt-6">
            <label htmlFor="location-search" className="text-sm font-medium">
              Buscar ubicación
            </label>
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                id="location-search"
                placeholder="Ej. Biblioteca"
                className="h-11 pl-9"
              />
            </div>
            <div className="rounded-lg bg-muted p-4 text-sm text-muted-foreground">
              Las ubicaciones y rutas estarán disponibles cuando se conecte el
              módulo del mapa.
            </div>
          </CardContent>
        </Card>
        <Card className="min-h-[420px] overflow-hidden border-dashed bg-muted/40">
          <CardContent className="grid min-h-[420px] place-items-center p-6 text-center">
            <div>
              <div className="mx-auto grid size-16 place-items-center rounded-full bg-accent text-accent-foreground">
                <MapPinned className="size-8" aria-hidden="true" />
              </div>
              <h2 className="mt-5 text-lg font-medium">Área del mapa</h2>
              <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
                Aquí se integrará el mapa interactivo y el cálculo de rutas del
                campus.
              </p>
              <Compass
                className="mx-auto mt-6 size-5 text-muted-foreground"
                aria-hidden="true"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
