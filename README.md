# CD Gaztelueta — App de seguimiento del equipo

Aplicación web **mobile-first** para el seguimiento de un equipo de fútbol, con dos
perfiles (entrenador y jugador). Construida con **Next.js 14 (App Router)**,
**TypeScript**, **Prisma** y **PostgreSQL (Neon)**. Lista para desplegar en **Vercel**.

La app implementa exactamente lo descrito en los documentos de requisitos (base +
ampliación de planificación semanal): ni una funcionalidad, campo o color de más.

---

## Stack

- **Next.js 14** (App Router, Server Components y Server Actions)
- **TypeScript**
- **Prisma ORM** + **PostgreSQL (Neon)**
- **Tailwind CSS** (paleta principal restringida a los 7 colores solicitados)
- Sesión propia con **cookie firmada (JWT con `jose`)** y contraseñas con **bcrypt**

---

## Puesta en marcha (local)

Requisitos: Node.js 18.18+ y una base de datos PostgreSQL (recomendado: Neon).

```bash
# 1) Instalar dependencias
npm install

# 2) Configurar variables de entorno
cp .env.example .env
#    Edita .env y rellena DATABASE_URL (cadena "pooled" de Neon) y AUTH_SECRET
#    Genera un AUTH_SECRET con:  openssl rand -base64 32

# 3) Crear las tablas en la base de datos
npm run db:push

# 4) Cargar datos de ejemplo (liga, jugadores, registros y una planificación)
npm run db:seed

# 5) Arrancar en desarrollo
npm run dev
```

Abre http://localhost:3000

### Credenciales de ejemplo (tras el seed)

| Perfil                | Usuario          | Contraseña  |
| --------------------- | ---------------- | ----------- |
| Entrenador principal  | `igomeza30`      | `mister`    |
| Segundo entrenador    | `diegozumarraga` | `2mister`   |
| Jugador               | `unai`           | `gazte1234` |

> Los dos usuarios del cuerpo técnico acceden al perfil de entrenador (Home, Liga,
> Registro y Mi Equipo). El resto de jugadores del seed usan la contraseña
> `gazte1234` y como usuario su nombre en minúsculas (`iker`, `ander`, `zubi`,
> `gorka`, `mikel`, `aitor`).

---

## Despliegue en Vercel

1. Sube el repositorio a GitHub.
2. En [Neon](https://neon.tech) crea un proyecto y copia la **cadena de conexión
   _pooled_** (la que contiene `-pooler`, terminada en `?sslmode=require`).
3. En Vercel, importa el repo y añade las **Environment Variables**:
   - `DATABASE_URL` → la cadena pooled de Neon
   - `AUTH_SECRET` → una cadena aleatoria larga
4. Antes del primer despliegue (o una sola vez desde tu equipo, con el `.env`
   apuntando a Neon), ejecuta:
   ```bash
   npm run db:push
   npm run db:seed
   ```
5. Deploy. El `build` de Vercel ejecuta `prisma generate` automáticamente.

---

## Estructura del proyecto

```
prisma/
  schema.prisma        Modelo de datos (equipo, liga, registros y planificación)
  seed.ts              Datos de ejemplo
src/
  middleware.ts        Protección de rutas por rol
  app/
    login/             Inicio de sesión
    coach/             Entrenador: home · liga · registro · equipo
      registro/
        planificacion/nueva · [id]        Crear / editar planificación semanal
        entrenamiento/ · nuevo/[id] · editar/[id]   Registro y edición de entrenamientos
        partido/nuevo · editar/[id]       Registro y edición de partidos
    player/            Jugador: home · liga · perfil
    api/auth/          login / logout
    api/plan-file/[id] Descarga/visualización del archivo de una planificación
  components/          Cabecera, navegación, escudo, tabla, vista de liga…
  lib/                 Prisma, sesión, clasificación, formato, semana, planificación
  actions/             Server Actions (entrenamiento, partido, ficha, planificación, valoración)
```

---

## Pantallas implementadas

**Entrenador**

- **Home**: próximo partido destacado, clasificación de la liga, nota media de
  entrenamientos y nota media de partidos.
- **Liga**: apartados _Clasificación_ y _Jornadas_ (por defecto la jornada en juego
  o la más cercana a hoy).
- **Registro**:
  - _Crear Planificación Semanal_ y lista de planificaciones guardadas (editar y ver
    el archivo adjunto).
  - _Nuevo registro_: los botones de entrenamiento y partido se **bloquean si no hay
    una planificación semanal**. Para registrar un entrenamiento se selecciona antes
    a cuál de los entrenamientos planificados corresponde; después se usa el
    formulario de registro de entrenamientos existente. El partido usa el formulario
    de registro de partidos existente.
  - _Registros guardados_: lista de entrenamientos y partidos ya registrados, que
    pueden abrirse y editarse.
- **Mi Equipo**: fichas de los jugadores y botón _Crear ficha_.

**Jugador**

- **Mi Perfil**: _último entrenamiento_ con sus ejercicios, donde el jugador valora
  cada ejercicio (de 1 a 10, con decimales) desde su propio perfil; y _archivos de
  planificación_ subidos por el entrenador.
- **Home**: marcador de posición (su contenido se definirá más adelante).
- **Liga**: misma vista de liga que el entrenador.

---

## La planificación semanal (ampliación)

- **Crear/editar** una planificación por semana: se elige la semana y se añaden
  tantos **entrenamientos** como se quiera (día y hora), y dentro de cada uno tantos
  **ejercicios** como se quiera (tarea, descripción, objetivo y duración).
- **Archivo**: botón para subir un archivo, visible después por entrenador y
  jugadores desde sus perfiles.
- **Ficha del partido**: fecha, lugar, hora, hora de convocatoria, **equipación**
  (switch Local/Visitante) y **convocatoria** (máximo 18 jugadores).
- **Guardar y editar**: la planificación guardada se puede volver a abrir y modificar.

---

## Decisiones de interpretación

Para respetar el requisito de "no añadir nada que no esté en el documento", estas son
las interpretaciones tomadas, todas mínimas y necesarias para que las funciones
descritas puedan existir:

**Base**

- **Clasificación**: se calcula automáticamente a partir de los resultados (3 puntos
  victoria, 1 empate); se muestran puntos, partidos jugados y diferencia de goles.
- **Datos de la liga**: al no describirse pantalla para introducirlos, se cargan por
  _seed_.
- **Registro de partido**: se incluyen fecha y rival como identificadores mínimos del
  partido; el resto de campos son los del documento.
- **Fotografía de la ficha**: se guarda incrustada (redimensionada en el navegador) en
  la base de datos, para no depender de almacenamiento externo.

**Planificación semanal**

- El botón **_Crear Planificación Semanal_** vive en la pantalla **Registro**, por
  estar directamente ligado al registro (que depende de la planificación).
- **Una planificación por semana**: la semana es única, de modo que "la planificación
  semanal correspondiente" nunca es ambigua; volver a planificar esa semana **edita**
  la existente en lugar de duplicarla. La semana se elige con un selector de semana y
  se guarda como su lunes.
- **Archivo**: un archivo por planificación (subir otro lo reemplaza). Se guarda en la
  base de datos y se sirve mediante una ruta propia que lo muestra en línea. No se
  imponen desde la app tipos ni límites de tamaño; el proveedor de hosting puede tener
  su propio máximo de tamaño de subida.
- **Ficha del partido ≠ registro del partido**: la ficha de la planificación (datos
  previos: fecha, lugar, hora, convocatoria…) es independiente del registro posterior
  del partido (resultado, notas, goles…). Ambos se conservan.
- **Bloqueo de registros**: el registro de entrenamiento se habilita cuando existe al
  menos un entrenamiento planificado pendiente de registrar; el de partido, cuando
  existe al menos una planificación.
- **Edición de la planificación**: se conservan los identificadores de entrenamientos
  y ejercicios existentes, de modo que las **valoraciones de los jugadores** y el
  **enlace con los registros** no se pierden al editar.
- **"Último entrenamiento" (jugador)**: es el entrenamiento planificado más reciente
  cuya fecha y hora ya han pasado; si todos son futuros, se muestra el más próximo.
- **Cuerpo técnico**: los dos usuarios entrenador indicados (`igomeza30`,
  `diegozumarraga`) sustituyen al usuario de ejemplo anterior. Se conservan los
  jugadores de ejemplo, necesarios para las convocatorias, los registros y las
  valoraciones.

---

## Paleta de colores

La interfaz usa como colores **principales**: blanco, beige, dorado, amarillo, azul
marino, gris y negro. De forma puntual pueden emplearse otros colores para
situaciones concretas, sin sustituir la paleta principal. La tarjeta roja se muestra
con una etiqueta de texto ("Roja") y la amarilla con el amarillo de la paleta.
