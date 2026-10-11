import { ArrowLeft, MapPinned } from "lucide-react";
import { Link } from "react-router";
import { Button } from "@/components/ui/button";

export function NotFoundPage() {
  return (
    <div className="mx-auto flex min-h-[calc(100svh-5rem)] max-w-xl flex-col items-center justify-center px-4 py-12 text-center">
      <div className="grid size-16 place-items-center rounded-full bg-accent text-accent-foreground">
        <MapPinned className="size-8" aria-hidden="true" />
      </div>
      <p className="mt-6 text-sm font-medium text-primary">404</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">
        Página no encontrada
      </h1>
      <p className="mt-3 text-muted-foreground">
        La dirección que buscas no existe o fue movida.
      </p>
      <Button render={<Link to="/" />} className="mt-7 min-h-11">
        <ArrowLeft className="size-4" /> Volver al inicio
      </Button>
    </div>
  );
}
