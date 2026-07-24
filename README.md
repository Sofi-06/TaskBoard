# TaskBoard

Backend modular construido con NestJS, TypeScript, Prisma y PostgreSQL.

## Alcance actual

- Base del proyecto
- Módulo `Courses`
- CRUD básico de cursos
- Validación de entrada
- Soft delete mediante `archivedAt`

## Requisitos

- Node.js 20+ recomendado
- PostgreSQL

## Instalación

1. Instala dependencias.
2. Copia `.env.example` a `.env` y ajusta `DATABASE_URL`.
3. Ejecuta Prisma generate y migrations.
4. Inicia la app en modo desarrollo.

## Scripts

- `npm run start:dev`
- `npm run build`
- `npm run prisma:generate`
- `npm run prisma:migrate`
- `npm run prisma:studio`

## Estado funcional esperado

- `POST /courses`
- `GET /courses`
- `GET /courses/:id`
- `PATCH /courses/:id`
- `DELETE /courses/:id`
