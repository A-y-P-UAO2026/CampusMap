import { useState, type SubmitEvent } from "react";
import { ArrowLeft, MapPinned, UserPlus } from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { isRegisterableRole, registerAccount, type RegisterableRole, } from "@/services/auth";
import { getSafeRedirect, withRedirect } from "@/features/auth/Redirect";

const selectClassName =
  "h-11 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 text-base outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm";

export function RegisterPage() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<RegisterableRole>("student");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchParams] = useSearchParams();
  const redirectTo = getSafeRedirect(searchParams.get("redirect"));

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const result = await registerAccount({ email, password, fullName, role });

      navigate(withRedirect("/login", redirectTo), {
        replace: true,
        state: { registered: true, needsEmailConfirmation: !result.session },
      });
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "No se pudo crear la cuenta. Inténtalo de nuevo.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-svh items-center justify-center bg-muted/30 px-4 py-8 sm:px-6">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto grid size-12 place-items-center rounded-xl bg-primary text-primary-foreground">
            <MapPinned className="size-6" aria-hidden="true" />
          </div>
          <CardTitle className="pt-3 text-xl font-semibold tracking-tight">
            Crear cuenta
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label htmlFor="fullName" className="text-base font-medium">
                Nombre completo
              </label>
              <Input
                id="fullName"
                name="fullName"
                type="text"
                required
                autoComplete="name"
                placeholder="Ana Pérez"
                className="h-11 px-4 text-base md:text-base"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="email" className="text-base font-medium">
                Correo electrónico
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="nombre@auo.edu.co"
                className="h-11 px-4 text-base md:text-base"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="role" className="text-base font-medium">
                Rol
              </label>
              <select
                id="role"
                name="role"
                required
                className={selectClassName}
                value={role}
                onChange={(event) => {
                  if (isRegisterableRole(event.target.value)) {
                    setRole(event.target.value);
                  }
                }}
              >
                <option value="student">Estudiante</option>
                <option value="staff">Staff</option>
              </select>
            </div>
            <div className="space-y-2">
              <label htmlFor="password" className="text-base font-medium">
                Contraseña
              </label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                minLength={6}
                autoComplete="new-password"
                placeholder="Mínimo 6 caracteres"
                className="h-11 px-4 text-base md:text-base"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </div>
            {error ? (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            ) : null}
            <Button
              type="submit"
              className="min-h-11 w-full"
              disabled={isSubmitting}
            >
              <UserPlus className="size-4" />
              {isSubmitting ? "Creando cuenta…" : "Registrarme"}
            </Button>
          </form>
          <p className="mt-4 text-center text-base text-muted-foreground">
            ¿Ya tienes cuenta?{" "}
            <Link to={withRedirect("/login", redirectTo)} className="font-medium text-foreground underline-offset-4 hover:underline">
              Inicia sesión
            </Link>
          </p>
          <Button
            render={<Link to="/" />}
            variant="ghost"
            className="mt-2 min-h-11 w-full"
          >
            <ArrowLeft className="size-4" /> Volver al inicio
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
