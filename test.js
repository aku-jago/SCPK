const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const [
    totalUsers,
    totalScreenings,
    riskDistribution,
    recentScreenings,
    userGrowth,
  ] = await Promise.all([
    prisma.user.count({ where: { role: 'USER' } }),
    prisma.screening.count(),
    prisma.screening.groupBy({
      by: ['riskCategory'],
      _count: { id: true },
    }),
    prisma.screening.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        user: { select: { name: true, email: true } },
      },
    }),
    // User growth: last 7 days
    prisma.$queryRaw`
      SELECT DATE("createdAt") as date, COUNT(*)::int as count
      FROM users
      WHERE "createdAt" >= NOW() - INTERVAL '7 days'
      GROUP BY DATE("createdAt")
      ORDER BY date ASC
    `.catch(() => []),
  ]);

  const avgRiskScore = await prisma.screening.aggregate({
    _avg: { riskScore: true },
    _max: { riskScore: true },
    _min: { riskScore: true },
  });

  const distribution = {};
  for (const item of riskDistribution) {
    distribution[item.riskCategory] = item._count.id;
  }

  const result = {
    success: true,
    data: {
      overview: {
        totalUsers,
        totalScreenings,
        avgRiskScore: Math.round((avgRiskScore._avg.riskScore || 0) * 100) / 100,
        maxRiskScore: avgRiskScore._max.riskScore || 0,
        minRiskScore: avgRiskScore._min.riskScore || 0,
      },
      riskDistribution: distribution,
      recentScreenings,
      userGrowth,
    },
  };
  
  console.log(JSON.stringify(result, null, 2));
}

main().catch(console.error);
