const { PrismaClient } = require('@prisma/client');
const userService = require('../services/userService');

const prisma = new PrismaClient();

class AdminController {
  /**
   * GET /api/admin/analytics
   */
  async getAnalytics(req, res, next) {
    try {
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
        // User growth: last 7 days (SQLite compatible)
        prisma.$queryRaw`
          SELECT DATE("createdAt") as date, CAST(COUNT(*) AS INTEGER) as count
          FROM users
          WHERE "createdAt" >= date('now', '-7 days')
          GROUP BY DATE("createdAt")
          ORDER BY date ASC
        `.catch(() => []),
      ]);

      // Calculate averages
      const avgRiskScore = await prisma.screening.aggregate({
        _avg: { riskScore: true },
        _max: { riskScore: true },
        _min: { riskScore: true },
      });

      // Format risk distribution
      const distribution = {};
      for (const item of riskDistribution) {
        distribution[item.riskCategory] = item._count.id;
      }

      res.json({
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
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/admin/users
   */
  async getUsers(req, res, next) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const search = req.query.search || '';
      const result = await userService.getUsers(page, limit, search);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/admin/users/:id
   */
  async updateUser(req, res, next) {
    try {
      const user = await userService.updateUser(req.params.id, req.body);
      res.json({ success: true, message: 'User berhasil diperbarui.', data: user });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/admin/users/:id
   */
  async deleteUser(req, res, next) {
    try {
      await userService.deleteUser(req.params.id);
      res.json({ success: true, message: 'User berhasil dihapus.' });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/admin/fuzzy-rules
   */
  async getFuzzyRules(req, res, next) {
    try {
      const rules = await prisma.fuzzyRule.findMany({
        orderBy: { createdAt: 'asc' },
      });
      res.json({ success: true, data: rules });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/admin/fuzzy-rules
   */
  async createFuzzyRule(req, res, next) {
    try {
      const rule = await prisma.fuzzyRule.create({ data: req.body });
      res.status(201).json({ success: true, message: 'Rule berhasil dibuat.', data: rule });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/admin/fuzzy-rules/:id
   */
  async updateFuzzyRule(req, res, next) {
    try {
      const rule = await prisma.fuzzyRule.update({
        where: { id: req.params.id },
        data: req.body,
      });
      res.json({ success: true, message: 'Rule berhasil diperbarui.', data: rule });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/admin/fuzzy-rules/:id
   */
  async deleteFuzzyRule(req, res, next) {
    try {
      await prisma.fuzzyRule.delete({ where: { id: req.params.id } });
      res.json({ success: true, message: 'Rule berhasil dihapus.' });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/admin/fuzzy-variables
   */
  async getFuzzyVariables(req, res, next) {
    try {
      const variables = await prisma.fuzzyVariable.findMany({
        orderBy: { name: 'asc' },
      });
      res.json({ success: true, data: variables });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/admin/risk-distribution
   */
  async getRiskDistribution(req, res, next) {
    try {
      const distribution = await prisma.screening.groupBy({
        by: ['riskCategory'],
        _count: { id: true },
        _avg: { riskScore: true },
      });

      // Monthly trend (SQLite compatible)
      const monthlyTrend = await prisma.$queryRaw`
        SELECT 
          strftime('%Y-%m', "createdAt") as month,
          "riskCategory",
          CAST(COUNT(*) AS INTEGER) as count,
          AVG("riskScore") as avg_score
        FROM screenings
        WHERE "createdAt" >= date('now', '-12 months')
        GROUP BY strftime('%Y-%m', "createdAt"), "riskCategory"
        ORDER BY month ASC
      `.catch(() => []);

      res.json({
        success: true,
        data: { distribution, monthlyTrend },
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AdminController();
