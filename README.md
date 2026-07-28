# CD Gaztelueta — App de seguimiento del equipo

Aplicación web **mobile-first** para el seguimiento de un equipo de fútbol, con dos
perfiles (entrenador y jugador). Construida con **Next.js 14 (App Router)**,
**TypeScript**, **Prisma** y **PostgreSQL (Neon)**. Lista para desplegar en **Vercel**.

La app implementa exactamente lo descrito en el documento de requisitos: ni una
funcionalidad, campo o color de más.

---

## Stack

- **Next.js 14** (App Router, Server Components y Server Actions)
- **TypeScript**
- **Prisma ORM** + **PostgreSQL (Neon)**
- **Tailwind CSS** (paleta restringida a los 7 colores solicitados)
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

# 4) Cargar datos de ejemplo (liga, jugadores, registros)
npm run db:seed

# 5) Arrancar en desarrollo
npm run dev
```

Abre http://localhost:3000

### Credenciales de ejemplo (tras el seed)

| Perfil     | Usuario      | Contraseña        |
| ---------- | ------------ | ----------------- |
| Entrenador | `entrenador` | `entrenador1234`  |
| Jugador    | `unai`       | `gazte1234`       |

> El resto de jugadores del seed usan la contraseña `gazte1234` y como usuario su
> nombre en minúsculas (`iker`, `ander`, `zubi`, `gorka`, `mikel`, `aitor`).

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
  schema.prisma        Modelo de datos
  seed.ts              Datos de ejemplo
src/
  middleware.ts        Protección de rutas por rol
  app/
    login/             Inicio de sesión
    coach/             Entrenador: home · liga · registro · equipo
    player/            Jugador:    home · liga · perfil
    api/auth/          login / logout
  components/          Cabecera, navegación, escudo, tabla, vista de liga…
  lib/                 Prisma, sesión, cálculo de clasificación, formato
  actions/             Server Actions (guardar entrenamiento / partido / ficha)
```

---

## Pantallas implementadas

**Entrenador**

- **Home**: próximo partido destacado, clasificación de la liga, nota media de
  entrenamientos y nota media de partidos.
- **Liga**: apartados _Clasificación_ y _Jornadas_ (con navegación entre
  jornadas; por defecto se muestra la jornada en juego o la más cercana a hoy).
- **Registro**: elección entre _Entrenamiento_ y _Partido_, con su formulario
  completo (asistencia, notas, observaciones, goles, cambios, tarjetas… y multas).
- **Mi Equipo**: fichas de los jugadores y botón _Crear ficha_ (con foto, datos y
  credenciales de acceso del jugador).

**Jugador**

- **Home** y **Mi Perfil**: marcadores de posición (su contenido se definirá más
  adelante, según el documento).
- **Liga**: misma vista de liga que el entrenador.

---

## Decisiones de interpretación

Para respetar el requisito de "no añadir nada que no esté en el documento", estas son
las únicas interpretaciones que se han tomado, todas mínimas y necesarias para que las
funciones descritas puedan existir:

- **Clasificación**: se calcula automáticamente a partir de los resultados de los
  partidos de liga (3 puntos victoria, 1 empate). Se muestran los puntos, los
  partidos jugados y la diferencia de goles.
- **Datos de la liga** (clasificación y jornadas): al no describirse ninguna
  pantalla para introducirlos, se cargan mediante el _seed_.
- **Registro de partido**: se incluyen fecha y rival como identificadores mínimos
  del partido (inherentes al concepto de "un partido"); el resto de campos son los
  del documento.
- **Tarjeta roja**: como el color rojo no forma parte de la paleta permitida, la
  tarjeta roja se representa con una etiqueta de texto ("Roja"); la amarilla usa el
  color amarillo de la paleta.
- **Fotografía de la ficha**: se guarda como imagen incrustada (redimensionada en el
  navegador) en la base de datos, para no depender de servicios externos de
  almacenamiento.

---

## Paleta de colores

Se usan exclusivamente: blanco, beige, dorado, amarillo, azul marino, gris y negro.
