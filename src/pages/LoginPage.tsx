import { ArrowLeft, LogIn, MapPinned } from "lucide-react";
import { type FormEvent, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";

type LoginLocationState = {
  registered?: boolean;
  needsEmailConfirmation?: boolean;
};

export function LoginPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const locationState = location.state as LoginLocationState | null;
  const registered = Boolean(locationState?.registered);
  const needsEmailConfirmation = Boolean(locationState?.needsEmailConfirmation);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (signInError) {
        throw signInError;
      }

      navigate("/", { replace: true });
    } catch (caughtError) {
      const message =
        caughtError instanceof Error
          ? caughtError.message === "Invalid login credentials"
            ? "Credenciales inválidas. Verifica tu correo o contraseña."
            : caughtError.message
        : "Ocurrió un error al iniciar sesión. Inténtalo de nuevo.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-svh items-center justify-center bg-muted/30 px-4 py-8 sm:px-6">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto grid size-12 place-items-center rounded-xl bg-primary text-primary-foreground">
            <MapPinned className="size-6" aria-hidden="true" />
          </div>
          <CardTitle className="pt-3 text-xl">Iniciar sesión</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleLogin}>
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Correo institucional
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="nombre@universidad.edu"
                className="h-11"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                Contraseña
              </label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                placeholder="••••••••"
                className="h-11"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </div>
            {error ? (
              <p className="rounded-lg bg-destructive/10 p-2 text-center text-sm font-medium text-destructive">
                {error}
              </p>
            ) : null}
            <Button type="submit" className="min-h-11 w-full" disabled={loading}>
              <LogIn className="size-4" />
              {loading ? "Ingresando...": "Iniciar sesión"}
            </Button>
          </form>

          {registered ? (
            <p className="mt-4 text-center text-sm text-muted-foreground" role="status">
              {needsEmailConfirmation
                ? "Cuenta creada."
                : "Cuenta creada. Ya puedes iniciar sesión."}
            </p>
          ) : null}

          <p className="mt-4 text-center text-sm text-muted-foreground">
            ¿No tienes cuenta?{" "}
            <Link
              to="/registro"
              className="font-medium text-foreground underline-offset-4 hover:underline"
            >
              Regístrate
            </Link>
          </p>

          <Button render={<Link to="/" />} variant="ghost" className="mt-4 min-h-11 w-full">
            <ArrowLeft className="size-4" /> Volver al inicio
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
