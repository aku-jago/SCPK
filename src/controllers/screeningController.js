const screeningService = require('../services/screeningService');

class ScreeningController {
  /**
   * POST /api/screening
   * Create a new screening
   */
  async create(req, res, next) {
    try {
      const result = await screeningService.createScreening(req.user.id, req.body);
      res.status(201).json({
        success: true,
        message: 'Screening berhasil dilakukan.',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/screening/:id
   * Get screening by ID
   */
  async getById(req, res, next) {
    try {
      const screening = await screeningService.getScreeningById(
        req.params.id,
        req.user.id
      );
      res.json({
        success: true,
        data: screening,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/screening/:id/result
   * Get detailed screening result
   */
  async getResult(req, res, next) {
    try {
      const result = await screeningService.getScreeningResult(
        req.params.id,
        req.user.id
      );
      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/screening/history
   * Get screening history
   */
  async getHistory(req, res, next) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const result = await screeningService.getHistory(req.user.id, page, limit);
      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ScreeningController();
