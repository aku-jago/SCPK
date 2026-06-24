const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

class KnowledgeBaseController {
  /**
   * GET /api/knowledge-base
   */
  async getAll(req, res, next) {
    try {
      const { category, published } = req.query;
      const where = {};
      if (category) where.category = category;
      if (published !== undefined) where.isPublished = published === 'true';

      const articles = await prisma.knowledgeBase.findMany({
        where,
        orderBy: { createdAt: 'desc' },
      });
      
      const mapped = articles.map(art => ({
        ...art,
        tags: art.tags ? art.tags.split(',').map(t => t.trim()) : []
      }));

      res.json({ success: true, data: mapped });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/knowledge-base/:id
   */
  async getById(req, res, next) {
    try {
      const article = await prisma.knowledgeBase.findUnique({
        where: { id: req.params.id },
      });
      if (!article) {
        return res.status(404).json({ success: false, message: 'Artikel tidak ditemukan.' });
      }
      // Increment view count
      const updated = await prisma.knowledgeBase.update({
        where: { id: req.params.id },
        data: { viewCount: { increment: 1 } },
      });
      
      res.json({
        success: true,
        data: {
          ...updated,
          tags: updated.tags ? updated.tags.split(',').map(t => t.trim()) : []
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/knowledge-base
   */
  async create(req, res, next) {
    try {
      const data = { ...req.body };
      if (Array.isArray(data.tags)) data.tags = data.tags.join(', ');
      
      const article = await prisma.knowledgeBase.create({ data });
      
      res.status(201).json({
        success: true,
        message: 'Artikel berhasil dibuat.',
        data: {
          ...article,
          tags: article.tags ? article.tags.split(',').map(t => t.trim()) : []
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/knowledge-base/:id
   */
  async update(req, res, next) {
    try {
      const data = { ...req.body };
      if (Array.isArray(data.tags)) data.tags = data.tags.join(', ');
      
      const article = await prisma.knowledgeBase.update({
        where: { id: req.params.id },
        data,
      });
      
      res.json({
        success: true,
        message: 'Artikel berhasil diperbarui.',
        data: {
          ...article,
          tags: article.tags ? article.tags.split(',').map(t => t.trim()) : []
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/knowledge-base/:id
   */
  async delete(req, res, next) {
    try {
      await prisma.knowledgeBase.delete({ where: { id: req.params.id } });
      res.json({ success: true, message: 'Artikel berhasil dihapus.' });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new KnowledgeBaseController();
