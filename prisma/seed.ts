import { PrismaClient, MatchStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

function daysFromNow(d: number, hour = 11): Date {
  const date = new Date();
  date.setDate(date.getDate() + d);
  date.setHours(hour, 0, 0, 0);
  return date;
}

async function main() {
  console.log("Limpiando datos anteriores…");
  await prisma.fine.deleteMany();
  await prisma.matchGoal.deleteMany();
  await prisma.substitution.deleteMany();
  await prisma.matchCard.deleteMany();
  await prisma.matchPlayer.deleteMany();
  await prisma.matchRecord.deleteMany();
  await prisma.trainingPlayer.deleteMany();
  await prisma.trainingRecord.deleteMany();
  await prisma.leagueMatch.deleteMany();
  await prisma.player.deleteMany();
  await prisma.user.deleteMany();
  await prisma.team.deleteMany();

  // ── Entrenador ──────────────────────────────────────────────────
  console.log("Creando entrenador…");
  await prisma.user.create({
    data: {
      username: "entrenador",
      password: await bcrypt.hash("entrenador1234", 10),
      role: "COACH",
    },
  });

  // ── Equipos de la liga ──────────────────────────────────────────
  console.log("Creando equipos…");
  const own = await prisma.team.create({
    data: { name: "CD Gaztelueta", isOwn: true },
  });
  const rivalNames = [
    "Athletic Club B",
    "Getxo FT",
    "Areeta FC",
    "Deusto SC",
    "Santurtzi CD",
  ];
  const rivals = [];
  for (const name of rivalNames) {
    rivals.push(await prisma.team.create({ data: { name } }));
  }
  const teams = [own, ...rivals]; // índices 0..5

  // ── Jornadas / partidos de liga ─────────────────────────────────
  console.log("Creando jornadas…");
  type Fx = [number, number, number | null, number | null];
  const schedule: {
    matchday: number;
    date: Date;
    status: MatchStatus;
    fixtures: Fx[];
  }[] = [
    {
      matchday: 1,
      date: daysFromNow(-21),
      status: "FINISHED",
      fixtures: [
        [0, 1, 2, 1],
        [2, 3, 1, 1],
        [4, 5, 0, 2],
      ],
    },
    {
      matchday: 2,
      date: daysFromNow(-14),
      status: "FINISHED",
      fixtures: [
        [0, 2, 3, 0],
        [1, 3, 2, 2],
        [4, 5, 1, 1],
      ],
    },
    {
      matchday: 3,
      date: daysFromNow(-7),
      status: "FINISHED",
      fixtures: [
        [0, 4, 1, 1],
        [1, 5, 0, 1],
        [2, 3, 2, 0],
      ],
    },
    {
      matchday: 4,
      date: daysFromNow(3),
      status: "SCHEDULED",
      fixtures: [
        [0, 5, null, null],
        [1, 4, null, null],
        [2, 3, null, null],
      ],
    },
    {
      matchday: 5,
      date: daysFromNow(10),
      status: "SCHEDULED",
      fixtures: [
        [0, 1, null, null],
        [2, 4, null, null],
        [3, 5, null, null],
      ],
    },
  ];

  for (const jornada of schedule) {
    for (const [h, a, hg, ag] of jornada.fixtures) {
      await prisma.leagueMatch.create({
        data: {
          matchday: jornada.matchday,
          date: jornada.date,
          status: jornada.status,
          homeTeamId: teams[h].id,
          awayTeamId: teams[a].id,
          homeGoals: hg,
          awayGoals: ag,
        },
      });
    }
  }

  // ── Jugadores + credenciales ────────────────────────────────────
  console.log("Creando jugadores…");
  const playersData = [
    {
      firstName: "Iker",
      lastName: "Etxeberria",
      nickname: "Iker",
      number: 1,
      age: 17,
      isCaptain: false,
      positions: ["Portero"],
      username: "iker",
    },
    {
      firstName: "Ander",
      lastName: "Muñoz",
      nickname: "Ander",
      number: 2,
      age: 16,
      isCaptain: false,
      positions: ["Lateral derecho"],
      username: "ander",
    },
    {
      firstName: "Unai",
      lastName: "Agirre",
      nickname: "Unai",
      number: 4,
      age: 17,
      isCaptain: true,
      positions: ["Defensa central"],
      username: "unai",
    },
    {
      firstName: "Jon",
      lastName: "Zubizarreta",
      nickname: "Zubi",
      number: 6,
      age: 16,
      isCaptain: false,
      positions: ["Mediocentro", "Interior"],
      username: "zubi",
    },
    {
      firstName: "Gorka",
      lastName: "Iparragirre",
      nickname: "Gorka",
      number: 8,
      age: 17,
      isCaptain: false,
      positions: ["Interior"],
      username: "gorka",
    },
    {
      firstName: "Mikel",
      lastName: "Garmendia",
      nickname: "Garmen",
      number: 9,
      age: 17,
      isCaptain: false,
      positions: ["Delantero"],
      username: "mikel",
    },
    {
      firstName: "Aitor",
      lastName: "Lorea",
      nickname: "Aitor",
      number: 11,
      age: 16,
      isCaptain: false,
      positions: ["Extremo", "Segundo delantero"],
      username: "aitor",
    },
  ];

  const players = [];
  for (const p of playersData) {
    const user = await prisma.user.create({
      data: {
        username: p.username,
        password: await bcrypt.hash("gazte1234", 10),
        role: "PLAYER",
        player: {
          create: {
            firstName: p.firstName,
            lastName: p.lastName,
            nickname: p.nickname,
            number: p.number,
            age: p.age,
            isCaptain: p.isCaptain,
            positions: p.positions,
          },
        },
      },
      include: { player: true },
    });
    if (user.player) players.push(user.player);
  }

  // ── Entrenamientos con notas ────────────────────────────────────
  console.log("Creando entrenamientos…");
  const trainingGrades1 = [7.5, 6.0, 8.0, 7.0, 6.5, 8.5, 7.0];
  const trainingGrades2 = [8.0, 6.5, 7.5, 7.5, 7.0, 8.0, 6.0];

  await prisma.trainingRecord.create({
    data: {
      date: daysFromNow(-5),
      players: {
        create: players.map((pl, i) => ({
          playerId: pl.id,
          attended: i !== 4, // Gorka faltó
          justified: i === 4 ? true : null,
          absenceReason: i === 4 ? "Motivos médicos" : null,
          grade: i === 4 ? null : trainingGrades1[i],
          observations: null,
        })),
      },
      fines: {
        create: [
          {
            amount: 5,
            reason: "Llegar tarde al entrenamiento",
            players: { connect: [{ id: players[1].id }] },
          },
        ],
      },
    },
  });

  await prisma.trainingRecord.create({
    data: {
      date: daysFromNow(-2),
      players: {
        create: players.map((pl, i) => ({
          playerId: pl.id,
          attended: true,
          justified: null,
          absenceReason: null,
          grade: trainingGrades2[i],
          observations: null,
        })),
      },
    },
  });

  // ── Partido con notas, goles, cambio, tarjeta y multa ───────────
  console.log("Creando partido…");
  const matchGrades = [7.0, 6.5, 8.0, 7.5, 6.0, 8.5, 7.0];
  await prisma.matchRecord.create({
    data: {
      date: daysFromNow(-7),
      opponent: "Areeta FC",
      formation: "4-3-3",
      teamGoals: 3,
      opponentGoals: 1,
      globalGrade: 7.5,
      generalObservations: "Buen partido, dominamos la segunda parte.",
      players: {
        create: players.map((pl, i) => ({
          playerId: pl.id,
          isStarter: i < 6,
          position: pl.positions[0] ?? null,
          grade: matchGrades[i],
          observations: null,
        })),
      },
      goals: {
        create: [
          { playerId: players[5].id, minute: 23 },
          { playerId: players[5].id, minute: 58 },
          { playerId: players[6].id, minute: 74 },
        ],
      },
      substitutions: {
        create: [
          { playerOutId: players[4].id, playerInId: players[6].id, minute: 65 },
        ],
      },
      cards: {
        create: [{ playerId: players[2].id, type: "YELLOW" }],
      },
      fines: {
        create: [
          {
            amount: 10,
            reason: "Tarjeta por protestar",
            players: { connect: [{ id: players[2].id }] },
          },
        ],
      },
    },
  });

  console.log("\n✅ Seed completado.");
  console.log("   Entrenador →  usuario: entrenador   contraseña: entrenador1234");
  console.log("   Jugador    →  usuario: unai          contraseña: gazte1234");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
