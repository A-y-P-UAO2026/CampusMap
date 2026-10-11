import { ArrowLeft, LogIn, MapPinned } from "lucide-react";
import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export function LoginPage() {
  return (
    <div className="flex min-h-svh items-center justify-center bg-muted/30 px-4 py-8 sm:px-6">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto grid size-12 place-items-center rounded-xl bg-primary text-primary-foreground">
            <MapPinned className="size-6" aria-hidden="true" />
          </div>
          <CardTitle className="pt-3 text-xl">Iniciar sesión</CardTitle>
          <p className="text-sm text-muted-foreground">
            Accede a tu cuenta universitaria
          </p>
        </CardHeader>
        <CardContent>
          <form
            className="space-y-4"
            onSubmit={(event) => event.preventDefault()}
          >
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Correo institucional
              </label>
              <Input
                id="email"
                type="email"
                placeholder="nombre@universidad.edu"
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                Contraseña
              </label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                className="h-11"
              />
            </div>
            <Button type="submit" className="min-h-11 w-full">
              <LogIn className="size-4" /> Continuar
            </Button>
          </form>
          <Button
            render={<Link to="/" />}
            variant="ghost"
            className="mt-4 min-h-11 w-full"
          >
            <ArrowLeft className="size-4" /> Volver al inicio
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
