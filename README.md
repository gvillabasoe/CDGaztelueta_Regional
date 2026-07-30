# CD Gaztelueta — App de seguimiento del equipo

Aplicación web (móvil primero) para la gestión y el seguimiento de un equipo de
fútbol. Tiene **dos perfiles**: **entrenador** (gestiona todo) y **jugador**
(consulta y realiza acciones limitadas). Está construida con Next.js (App
Router) y usa una base de datos PostgreSQL a través de Prisma.

> Esta es la versión **v3**, una reorganización completa de la app con una única
> navegación de 6 pestañas compartida por ambos perfiles y un modelo de datos
> nuevo. Los permisos se aplican **en las operaciones del servidor** (Server
> Actions), no solo en la interfaz.

---

## Stack técnico

- **Next.js 14** (App Router, Server Components + Server Actions)
- **TypeScript**
- **Prisma** + **PostgreSQL** (pensado para **Neon** en producción)
- **Tailwind CSS** (paleta propia; ver más abajo)
- **jose** (sesión con JWT en cookie httpOnly) + **bcryptjs** (hash de contraseñas)
- **lucide-react** (iconos)

---

## Navegación (6 pestañas, ambos perfiles)

La barra inferior es la misma para entrenador y jugador. Cada pantalla lee el rol
de la sesión y muestra las acciones de edición solo al entrenador.

1. **Home** — Únicamente dos bloques:
   - **Próximo partido** (jornada, día, fecha, hora, rival, campo, local/visitante). Lo edita el entrenador.
   - **Clasificación oficial** (Pos, Equipo, PJ, PG, PE, PP, GF, GC, DG, Pts). CRUD manual del entrenador. La clasificación oficial **solo** aparece aquí.
2. **Liga** — Liga interna de **puntos por jugador** que concede el entrenador (sumar, restar, corregir o fijar). Ordena por puntos y, en caso de empate, alfabéticamente.
3. **Planificación** — Planificación semanal (entrenamientos y partidos), detalle de cada actividad (PDF + ejercicios), **confirmación de asistencia por actividad** y **registros** posteriores. (Sustituye a la antigua pestaña "Registro").
4. **Equipo** — Plantilla con búsqueda y ordenación (nombre, dorsal, posición), creación y edición de fichas y estadísticas.
5. **Multas** — Apartado central de multas con selector de mes, desglose por jugador y totales.
6. **Más** — Menú con **Propuestas**, **Perfil personal** y **Configuración**.

### Planificación en detalle

- **Crear planificación semanal**: se elige la semana y se añaden tantos entrenamientos y partidos como se quiera (se muestran cronológicamente). El entrenador puede guardar como borrador o **publicar**; los jugadores solo ven las publicadas.
- **Entrenamiento**: día, fecha, hora inicio, hora fin (opcional), lugar.
- **Partido**: día, fecha, hora, hora de convocatoria, campo, rival, jornada, **equipación** (local/visitante) y **convocatoria** (máximo **18** jugadores).
- **Detalle de entrenamiento**: (A) documento **PDF** (subir, ver, descargar, sustituir, eliminar) y (B) **ejercicios** (tarea, descripción, objetivo, duración, orden; reordenables). Ambos utilizables a la vez.
- **Asistencia por actividad** (independiente en cada una): al publicar, todos quedan por defecto en **"Sí, asistiré"** (verde). El jugador solo cambia la suya a **"No asistiré"** (rojo), lo que obliga a indicar **motivo** (Lesión, Enfermedad, Trabajo, Estudios, Viaje, Motivo familiar, Otro) y **explicación**. El entrenador ve y edita las de todos. Se muestra un resumen de cuántos asistirán / no asistirán.
- **Registro de entrenamiento** (solo si estaba planificado y el entrenador lo abre): por jugador, asistencia real, si la ausencia fue justificada, motivo, **nota (1–10 con decimales)** y observaciones. Editable.
- **Registro de partido** (solo si estaba planificado): titularidad, formación, posición, resultado, goles (con autor y minuto), cambios, tarjetas, **nota individual**, **nota global** y observaciones. Notas 1–10 con decimales. Editable.
- **Valoración de ejercicios**: desde el perfil del jugador, sobre el **último entrenamiento**, cada jugador valora los ejercicios de 1 a 10 (solo la suya; independiente de la nota del entrenador).

### Multas en detalle

- Selector de los 12 meses (con navegación entre meses/años). Cada mes es un periodo nuevo y se conserva el histórico.
- Por multa: jugador, fecha, concepto, importe y estado (**Pendiente/Pagado**).
- Por jugador: sus multas del mes y totales (mensual, pendiente, pagado). Total general de la plantilla calculado automáticamente.
- El entrenador añade (a uno o varios jugadores a la vez), edita, elimina y marca pagada/pendiente. El jugador solo consulta.
- Las multas creadas **durante un registro** de entrenamiento/partido aparecen en este apartado central **sin duplicarse**.

---

## Perfiles y permisos

- **Entrenador**: gestiona identidad del club, próximo partido, clasificación oficial, liga interna, fichas y estadísticas, planificaciones, PDFs, ejercicios, asistencias, registros, multas y propuestas.
- **Jugador**: consulta todo lo anterior; **solo** puede: cambiar su propia asistencia, valorar los ejercicios del último entrenamiento y crear/consultar propuestas. No edita fichas, ni estadísticas, ni multas, ni notas del entrenador.

Los permisos se comprueban en cada Server Action además de en la interfaz.

---

## Modelo de datos (resumen)

- `User` (credenciales + rol) 1–1 `Player`.
- `Player`: datos, posiciones, estadísticas manuales (convocatorias, minutos, titularidades, suplencias, goles) y `leaguePoints` (liga interna).
- `TeamProfile` (singleton id=1): nombre, información, escudo y foto de plantilla (opcionales, como override binario).
- `NextMatch` (singleton id=1): el próximo partido.
- `OfficialStanding`: filas manuales de la clasificación oficial.
- `WeeklyPlan` (semana única) → `Activity` (TRAINING | MATCH).
- `Activity`: datos de horario, campos de partido, PDF (binario), `Exercise[]`, `Attendance[]`, convocatoria (M–N con `Player`), y 1–1 con `TrainingRecord` / `MatchRecord`.
- `Attendance` (por actividad y jugador), `ExerciseRating` (por ejercicio y jugador).
- `TrainingRecord`/`MatchRecord` con sus tablas hijas (jugadores, goles, cambios, tarjetas).
- `Fine` (una multa por jugador), `Proposal`.

---

## Decisiones de diseño (v3)

- **Rutas unificadas**: un único grupo `src/app/(app)/` con un layout y una barra de 6 pestañas; cada página ramifica según el rol. Se eliminaron los árboles antiguos `/coach` y `/player`.
- **Próximo partido**: entidad propia (`NextMatch`), no se deriva de la planificación.
- **Clasificación oficial**: filas manuales; se ordena por puntos, luego diferencia de goles y luego nombre.
- **Liga interna**: campo de puntos en el jugador (fijar valor o sumar/restar).
- **Estadísticas del jugador**: campos manuales editados en la ficha.
- **Planificación unificada**: `Activity` con tipo, para no duplicar modelos de entrenamiento/partido.
- **Asistencia por defecto = "asistirá"**: no se guarda fila salvo que haya un cambio explícito; el "no asistiré" exige motivo y explicación. No existe estado "sin confirmar".
- **Multas**: una fila por jugador; el apartado Multas es la única fuente. Los registros solo **añaden** multas nuevas (nunca se recrean al editar el registro, evitando duplicados); las existentes se gestionan en Multas.
- **Escudo y foto**: override opcional en `TeamProfile`. El escudo se sirve por una ruta pública (usa el override o, si no, el `escudo.jpg` incluido). La foto de plantilla muestra un espacio reservado si aún no se ha subido (sin inventar jugadores).
- **"Último entrenamiento"**: el entrenamiento publicado más reciente con fecha ≤ hoy; si no hay, el próximo.

---

## Credenciales

**Entrenadores**

| Usuario          | Contraseña |
| ---------------- | ---------- |
| `igomeza30`      | `mister`   |
| `diegozumarraga` | `2mister`  |

**Jugadores de ejemplo** (creados por el seed): `jugador1` … `jugador7`, todos
con contraseña `gazte1234`.

Las contraseñas de los jugadores las define el entrenador al crear la ficha y
**no se muestran ni se guardan en texto plano** (se almacena solo el hash).

---

## Paleta

Blanco `#FFFFFF`, Beige `#F1E9D8`, Dorado `#C9A227`, Amarillo `#F4C20D`, Azul
marino `#16233F`, Gris `#7C818C`, Negro `#1A1A1A`. Se usa además el verde/rojo
estándar únicamente para los estados que el prompt describe con esos colores
(asistencia "Sí/No" y multas "Pagado/Pendiente").

---

## Puesta en marcha (local)

Requisitos: Node.js 18+ y una base de datos PostgreSQL.

```bash
# 1) Instalar dependencias
npm install

# 2) Variables de entorno
cp .env.example .env
#   Edita .env y define:
#   DATABASE_URL="postgresql://usuario:password@host:5432/basedatos"
#   AUTH_SECRET="una-cadena-larga-y-aleatoria"

# 3) Crear las tablas en la base de datos
npm run db:push

# 4) Cargar datos iniciales (club, entrenadores, jugadores de ejemplo, etc.)
npm run db:seed

# 5) Arrancar en desarrollo
npm run dev
```

Abre `http://localhost:3000` e inicia sesión con cualquiera de las credenciales
de arriba.

Scripts útiles:

- `npm run dev` — desarrollo
- `npm run build` — compila (`prisma generate && next build`)
- `npm run start` — producción
- `npm run db:push` — sincroniza el esquema con la base de datos
- `npm run db:seed` — carga los datos de ejemplo

---

## Despliegue (Vercel + Neon)

1. Crea una base de datos en **Neon** (o usa la integración de Vercel Storage /
   Marketplace, que inyecta `DATABASE_URL` automáticamente en el proyecto).
2. En Vercel, importa el repositorio y añade las variables de entorno:
   - `DATABASE_URL` (si no la inyecta la integración de Neon)
   - `AUTH_SECRET`
3. Prepara la base de datos **una sola vez** (desde tu máquina, apuntando a la BD
   de producción). Puedes traer las variables con `vercel env pull .env` y luego:
   ```bash
   npm run db:push
   npm run db:seed   # opcional: solo si quieres datos de ejemplo en producción
   ```
   > Nota: **no** pongas el seed dentro del `build`. El `build` sí ejecuta
   > `prisma generate` (necesario para que Next compile con el cliente de Prisma).
4. Despliega. El límite de tamaño de cuerpo de las Server Actions está configurado
   en 10 MB para permitir la subida de PDFs y fotos.

---

## Nota sobre el SQL antiguo

Si en entregas anteriores se generó un script SQL de creación de tablas
(`cd-gaztelueta-crear-tablas.sql`), **ha quedado obsoleto** con el modelo de datos
de la v3. La forma recomendada de crear las tablas es `npm run db:push` a partir
del esquema de Prisma (`prisma/schema.prisma`), que es la fuente de verdad actual.
