import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

function mondayOf(d: Date) {
  const x = new Date(d);
  const day = (x.getDay() + 6) % 7; // 0 = lunes
  x.setDate(x.getDate() - day);
  x.setHours(0, 0, 0, 0);
  return x;
}
function addDays(d: Date, n: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

async function main() {
  // Limpieza (hijos -> padres)
  await prisma.exerciseRating.deleteMany();
  await prisma.attendance.deleteMany();
  await prisma.trainingPlayer.deleteMany();
  await prisma.trainingRecord.deleteMany();
  await prisma.matchGoal.deleteMany();
  await prisma.substitution.deleteMany();
  await prisma.matchCard.deleteMany();
  await prisma.matchPlayer.deleteMany();
  await prisma.matchRecord.deleteMany();
  await prisma.exercise.deleteMany();
  await prisma.activity.deleteMany();
  await prisma.weeklyPlan.deleteMany();
  await prisma.fine.deleteMany();
  await prisma.proposal.deleteMany();
  await prisma.officialStanding.deleteMany();
  await prisma.nextMatch.deleteMany();
  await prisma.teamProfile.deleteMany();
  await prisma.player.deleteMany();
  await prisma.user.deleteMany();

  // Club
  await prisma.teamProfile.create({
    data: {
      id: 1,
      name: "CD Gaztelueta",
      info: "Equipo del CD Gaztelueta. Nuestro sea, nuestro sea.",
    },
  });

  // Próximo partido
  const now = new Date();
  const monday = mondayOf(now);
  await prisma.nextMatch.create({
    data: {
      id: 1,
      matchday: 1,
      date: addDays(monday, 6),
      time: "17:00",
      opponent: "CD Rival",
      place: "Campo Municipal",
      isHome: true,
    },
  });

  // Entrenadores
  const misterHash = await bcrypt.hash("mister", 10);
  const mister2Hash = await bcrypt.hash("2mister", 10);
  await prisma.user.create({
    data: { username: "igomeza30", password: misterHash, role: "COACH" },
  });
  await prisma.user.create({
    data: { username: "diegozumarraga", password: mister2Hash, role: "COACH" },
  });

  // Jugadores de ejemplo
  const playerHash = await bcrypt.hash("gazte1234", 10);
  const demo: {
    username: string;
    firstName: string;
    lastName: string;
    nickname?: string;
    number: number;
    age: number;
    isCaptain?: boolean;
    positions: string[];
    leaguePoints: number;
    stats: [number, number, number, number, number]; // callups, minutes, starts, bench, goals
  }[] = [
    { username: "jugador1", firstName: "Aitor", lastName: "Etxeberria", nickname: "Etxe", number: 1, age: 17, positions: ["Portero"], leaguePoints: 8, stats: [10, 900, 10, 0, 0] },
    { username: "jugador2", firstName: "Mikel", lastName: "Agirre", number: 4, age: 16, isCaptain: true, positions: ["Defensa central"], leaguePoints: 14, stats: [11, 980, 11, 0, 1] },
    { username: "jugador3", firstName: "Jon", lastName: "Beristain", number: 6, age: 17, positions: ["Mediocentro", "Interior"], leaguePoints: 11, stats: [9, 720, 7, 2, 2] },
    { username: "jugador4", firstName: "Unai", lastName: "Larrañaga", nickname: "Larra", number: 8, age: 16, positions: ["Centrocampista"], leaguePoints: 6, stats: [8, 540, 5, 3, 1] },
    { username: "jugador5", firstName: "Iker", lastName: "Zubizarreta", number: 10, age: 17, positions: ["Extremo", "Interior"], leaguePoints: 17, stats: [12, 1010, 12, 0, 7] },
    { username: "jugador6", firstName: "Ander", lastName: "Goikoetxea", number: 9, age: 16, positions: ["Delantero"], leaguePoints: 12, stats: [12, 860, 9, 3, 9] },
    { username: "jugador7", firstName: "Julen", lastName: "Arrieta", number: 2, age: 16, positions: ["Lateral"], leaguePoints: 5, stats: [7, 480, 4, 3, 0] },
  ];

  const players = [];
  for (const d of demo) {
    const user = await prisma.user.create({
      data: {
        username: d.username,
        password: playerHash,
        role: "PLAYER",
        player: {
          create: {
            firstName: d.firstName,
            lastName: d.lastName,
            nickname: d.nickname ?? null,
            number: d.number,
            age: d.age,
            isCaptain: d.isCaptain ?? false,
            positions: d.positions,
            leaguePoints: d.leaguePoints,
            callups: d.stats[0],
            minutes: d.stats[1],
            starts: d.stats[2],
            benchCount: d.stats[3],
            goalsCount: d.stats[4],
          },
        },
      },
      include: { player: true },
    });
    if (user.player) players.push(user.player);
  }

  // Clasificación oficial
  await prisma.officialStanding.createMany({
    data: [
      { teamName: "CD Gaztelueta", played: 3, won: 2, drawn: 1, lost: 0, goalsFor: 7, goalsAgainst: 2, points: 7 },
      { teamName: "CD Rival", played: 3, won: 2, drawn: 0, lost: 1, goalsFor: 6, goalsAgainst: 4, points: 6 },
      { teamName: "Club Atlético Norte", played: 3, won: 1, drawn: 1, lost: 1, goalsFor: 4, goalsAgainst: 4, points: 4 },
      { teamName: "Deportivo Sur", played: 3, won: 0, drawn: 1, lost: 2, goalsFor: 2, goalsAgainst: 5, points: 1 },
    ],
  });

  // Planificación de la semana actual (publicada)
  const calledIds = players.slice(0, Math.min(18, players.length)).map((p) => ({ id: p.id }));
  await prisma.weeklyPlan.create({
    data: {
      weekStart: monday,
      published: true,
      activities: {
        create: [
          {
            type: "TRAINING",
            date: addDays(monday, 1),
            startTime: "20:30",
            endTime: "22:00",
            place: "Campo Gaztelueta",
            orderIndex: 0,
            exercises: {
              create: [
                { task: "Rondo 4x2", description: "Dos toques máximo.", objective: "Circulación rápida", duration: "15 min", orderIndex: 0 },
                { task: "Salida de balón", description: "Desde portero.", objective: "Construir desde atrás", duration: "20 min", orderIndex: 1 },
                { task: "Partido reducido", objective: "Transiciones", duration: "25 min", orderIndex: 2 },
              ],
            },
          },
          {
            type: "TRAINING",
            date: addDays(monday, 3),
            startTime: "20:30",
            endTime: "22:00",
            place: "Campo Gaztelueta",
            orderIndex: 1,
            exercises: {
              create: [
                { task: "Finalización", objective: "Definición en área", duration: "20 min", orderIndex: 0 },
                { task: "Estrategia a balón parado", objective: "Córners", duration: "15 min", orderIndex: 1 },
              ],
            },
          },
          {
            type: "MATCH",
            date: addDays(monday, 6),
            startTime: "17:00",
            callTime: "16:00",
            place: "Campo Municipal",
            opponent: "CD Rival",
            matchday: 1,
            kitLocal: true,
            orderIndex: 2,
            calledPlayers: { connect: calledIds },
          },
        ],
      },
    },
  });

  // Multas de ejemplo (mes actual y anterior, estados variados)
  if (players.length >= 3) {
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 5);
    const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 12);
    await prisma.fine.createMany({
      data: [
        { playerId: players[0].id, date: thisMonth, concept: "Llegar tarde al entrenamiento", amount: 5, paid: false },
        { playerId: players[1].id, date: thisMonth, concept: "Móvil en la charla", amount: 3, paid: true },
        { playerId: players[2].id, date: prevMonth, concept: "Falta injustificada", amount: 10, paid: false },
      ],
    });
  }

  // Propuesta de ejemplo
  if (players.length > 0) {
    await prisma.proposal.create({
      data: {
        playerId: players[0].id,
        title: "Cena de equipo",
        message: "Propongo una cena el próximo viernes para celebrar el buen inicio de temporada.",
        status: "PENDIENTE",
      },
    });
  }

  console.log("✅ Datos iniciales creados.");
  console.log("Entrenadores: igomeza30 / mister  ·  diegozumarraga / 2mister");
  console.log("Jugadores de ejemplo: jugador1 … jugador7  ·  contraseña: gazte1234");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
