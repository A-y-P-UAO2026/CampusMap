# CampusMap — flujo de desarrollo

## Instalación

```bash
pnpm install
cp .env.example .env
pnpm dev
```

Completar `.env` solo con las variables públicas del proyecto Supabase. Nunca incluir claves de servicio en Vite ni en el repositorio.

## Verificaciones

```bash
pnpm lint
pnpm build
```

Antes de abrir un Pull Request también se debe revisar `git diff --check`, probar las rutas afectadas y ejecutar las pruebas del módulo correspondiente.

## Base de datos

Las migraciones viven en `supabase/migrations/`. Revisarlas y probarlas localmente o en una rama aislada antes de aplicar cambios remotos. El cliente frontend debe usar el publishable key y las RPC públicas; las operaciones sensibles no deben implementarse con inserciones directas desde componentes.

## Pull Requests

Un PR debe contener una responsabilidad principal, describir la migración asociada si existe, incluir criterios de aceptación y reportar las verificaciones ejecutadas. Resolver conflictos de migración explícitamente y no reescribir migraciones ya compartidas.
