const { PrismaClient } = require('@prisma/client');
const fuzzyTsukamotoService = require('./fuzzyTsukamotoService');
const recommendationService = require('./recommendationService');

const prisma = new PrismaClient();

/**
 * Screening Service
 * Orchestrates the entire screening flow:
 * 1. Validate and prepare inputs
 * 2. Calculate BMI
 * 3. Run Fuzzy Tsukamoto inference
 * 4. Generate recommendations
 * 5. Save results to database
 */
class ScreeningService {
  /**
   * Create a new screening
   */
  async createScreening(userId, inputData) {
    // Calculate BMI: weight(kg) / height(m)²
    const heightInMeters = inputData.height / 100;
    const bmi = Math.round((inputData.weight / (heightInMeters * heightInMeters)) * 100) / 100;

    // Prepare fuzzy inputs
    const fuzzyInputData = {
      age: inputData.age,
      cigarettesPerDay: inputData.cigarettesPerDay,
      coughDuration: inputData.coughDuration,
      bmi: bmi,
      familyHistory: inputData.familyHistory ? 1 : 0,
      environmentalExposure: inputData.environmentalExposure,
      chestPainScale: inputData.chestPainScale,
    };

    // Run Fuzzy Tsukamoto inference
    const inferenceResult = await fuzzyTsukamotoService.infer(fuzzyInputData);

    // Generate recommendations
    const screeningData = { ...inputData, bmi };
    const recommendations = recommendationService.generateRecommendations(
      screeningData,
      inferenceResult.riskCategory
    );

    // Save to database
    const screening = await prisma.screening.create({
      data: {
        userId,
        age: inputData.age,
        isSmoker: inputData.isSmoker,
        smokingDurationYears: inputData.smokingDurationYears,
        isPassiveSmoker: inputData.isPassiveSmoker,
        cigarettesPerDay: inputData.cigarettesPerDay,
        coughDuration: inputData.coughDuration,
        weight: inputData.weight,
        height: inputData.height,
        bmi,
        familyHistory: inputData.familyHistory,
        environmentalExposure: inputData.environmentalExposure,
        chestPainScale: inputData.chestPainScale,
        riskScore: inferenceResult.riskScore,
        riskCategory: inferenceResult.riskCategory,
        fuzzyInputs: inferenceResult.fuzzyInputs,
        fuzzyRuleResults: inferenceResult.ruleResults,
        defuzzificationResult: inferenceResult.defuzzificationResult,
        recommendations: {
          create: recommendations,
        },
      },
      include: {
        recommendations: true,
      },
    });

    return {
      screening,
      inference: {
        riskScore: inferenceResult.riskScore,
        riskCategory: inferenceResult.riskCategory,
        riskLabel: inferenceResult.riskLabel,
        riskColor: inferenceResult.riskColor,
      },
    };
  }

  /**
   * Get screening by ID
   */
  async getScreeningById(screeningId, userId) {
    const screening = await prisma.screening.findFirst({
      where: { id: screeningId, userId },
      include: {
        recommendations: true,
      },
    });

    if (!screening) {
      const error = new Error('Screening tidak ditemukan.');
      error.statusCode = 404;
      throw error;
    }

    return screening;
  }

  /**
   * Get screening result with full detail
   */
  async getScreeningResult(screeningId, userId) {
    const screening = await this.getScreeningById(screeningId, userId);

    // Enrich with labels
    const riskLabel = fuzzyTsukamotoService.getRiskLabel(screening.riskCategory);
    const riskColor = fuzzyTsukamotoService.getRiskColor(screening.riskCategory);

    return {
      ...screening,
      riskLabel,
      riskColor,
    };
  }

  /**
   * Get screening history for a user
   */
  async getHistory(userId, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const [screenings, total] = await Promise.all([
      prisma.screening.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          recommendations: true,
        },
      }),
      prisma.screening.count({ where: { userId } }),
    ]);

    // Enrich with labels
    const enriched = screenings.map((s) => ({
      ...s,
      riskLabel: fuzzyTsukamotoService.getRiskLabel(s.riskCategory),
      riskColor: fuzzyTsukamotoService.getRiskColor(s.riskCategory),
    }));

    return {
      screenings: enriched,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}

module.exports = new ScreeningService();
