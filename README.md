# CampusMap

CampusMap es una plataforma universitaria para explorar el mapa del campus, buscar ubicaciones, calcular rutas y gestionar eventos.

## Tecnologías

- React 19 + TypeScript
- Vite
- Tailwind CSS v4
- shadcn/ui con Base UI
- React Router
- Supabase Auth y PostgreSQL
- Docker para el entorno local de Supabase

## Requisitos

- Node.js 20 o superior
- pnpm
- Docker Engine y Docker Compose
- Supabase CLI instalada como dependencia del proyecto

## Instalación

Desde la raíz del proyecto:

```bash
pnpm install
pnpm add -D supabase
```

Inicializa la configuración local de Supabase si todavía no existe:

```bash
pnpm supabase init
```

## Ejecutar Supabase localmente

Verifica que Docker esté iniciado:

```bash
docker info
```

Inicia los servicios locales:

```bash
pnpm supabase start
```

Aplica las migraciones locales desde `supabase/migrations/`:

```bash
pnpm supabase db reset
```

Este comando reinicia la base de datos local y ejecuta las migraciones desde cero. No modifica el proyecto remoto de Supabase.

Para consultar las URLs y claves locales:

```bash
pnpm supabase status
```

## Variables de entorno

Crea `.env.local` en la raíz del proyecto y usa las credenciales locales mostradas por `pnpm supabase status`:

```env
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_PUBLISHABLE_KEY=tu_clave_publishable_local
```

No subas `.env`, `.env.local` ni claves privadas al repositorio. No uses la `Secret Key` en el frontend.

## Ejecutar el frontend

```bash
pnpm dev
```

La aplicación estará disponible normalmente en:

```text
http://localhost:5173
```

## Comandos útiles

```bash
# Verificar TypeScript y generar el build
pnpm build

# Ejecutar ESLint
pnpm lint

# Reiniciar la base local y aplicar todas las migraciones
pnpm supabase db reset

# Detener los servicios locales
pnpm supabase stop
```

## Aplicar migraciones remotas

No ejecutes este proceso hasta revisar y probar la migración localmente:

```bash
pnpm supabase login
pnpm supabase link --project-ref TU_PROJECT_REF
pnpm supabase db push
```

`pnpm supabase db push` modifica la base de datos remota. Las migraciones aplicadas no deben editarse; los cambios posteriores deben crearse en un nuevo archivo dentro de `supabase/migrations/`.

## Arquitectura

```text
src/
├── algorithms/    Algoritmos como Dijkstra
├── components/    Componentes reutilizables y UI
├── features/      Módulos por dominio
├── hooks/         Hooks compartidos
├── layouts/       Layouts de la aplicación
├── lib/           Supabase y utilidades
├── pages/         Pantallas y rutas
├── services/      Acceso a datos y RPC
├── structures/    Graph, Trie, MinHeap, Queue y Stack
└── types/         Contratos TypeScript compartidos
```

La migración inicial está en [`supabase/migrations/`](supabase/migrations/). Los contratos están en [`src/types/`](src/types/).

## Distribución del trabajo

El plan detallado para los dos desarrolladores está en [`docs/development-plan.md`](docs/development-plan.md):

- Desarrollador 1: navegación, Graph, Dijkstra, Trie, Stack y mapa SVG.
- Desarrollador 2: eventos, MinHeap, Queue, autenticación e inscripciones.

## Flujo de ramas

No trabajar directamente sobre `main`. Usar ramas independientes:

```bash
git checkout -b feat/navigation-module
git checkout -b feat/events-module
```

Antes de abrir un Pull Request:

```bash
pnpm lint
pnpm build
git diff --check
```
