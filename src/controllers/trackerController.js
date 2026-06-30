const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.logCigarettes = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { count } = req.body;

    if (count === undefined || count < 0) {
      return res.status(400).json({ success: false, message: 'Jumlah rokok tidak valid' });
    }

    // Use current date
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find if there's an entry for today
    // In SQLite, dates can be tricky. We use GTE today and LT tomorrow.
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const existingLog = await prisma.cigaretteLog.findFirst({
      where: {
        userId,
        date: {
          gte: today,
          lt: tomorrow
        }
      }
    });

    if (existingLog) {
      const updatedLog = await prisma.cigaretteLog.update({
        where: { id: existingLog.id },
        data: { count }
      });
      return res.json({ success: true, data: updatedLog });
    } else {
      const newLog = await prisma.cigaretteLog.create({
        data: {
          userId,
          count,
          date: new Date()
        }
      });
      return res.json({ success: true, data: newLog });
    }
  } catch (error) {
    next(error);
  }
};

exports.getHistory = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const days = parseInt(req.query.days) || 7;

    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - days);
    pastDate.setHours(0, 0, 0, 0);

    const logs = await prisma.cigaretteLog.findMany({
      where: {
        userId,
        date: {
          gte: pastDate
        }
      },
      orderBy: {
        date: 'asc'
      }
    });

    // Format logs to ensure we have a record for each day, filling gaps with 0
    const history = [];
    let totalCount = 0;
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateString = d.toISOString().split('T')[0];
      
      const logForDay = logs.find(l => {
        const ld = new Date(l.date);
        return ld.toISOString().split('T')[0] === dateString;
      });

      const count = logForDay ? logForDay.count : 0;
      totalCount += count;
      history.push({ date: dateString, count });
    }

    const average = days > 0 ? (totalCount / days).toFixed(1) : 0;
    
    // Generate AI recommendation (harsh)
    let recommendation = '';
    let recommendationTitle = '';
    let color = '';

    if (average == 0) {
      recommendationTitle = 'Hebat! Anda Bebas Rokok';
      recommendation = 'Pertahankan gaya hidup sehat Anda. Paru-paru Anda saat ini berterima kasih kepada Anda.';
      color = 'var(--success)';
    } else if (average <= 5) {
      recommendationTitle = 'Peringatan Ringan';
      recommendation = 'Meski sedikit, setiap batang rokok tetap merusak sel paru-paru Anda. Segera hentikan sebelum terlambat dan menumpuk jadi masalah serius.';
      color = 'var(--warning)';
    } else if (average <= 15) {
      recommendationTitle = 'Teguran Keras AI';
      recommendation = 'Paru-parumu bukan knalpot! Menghisap rata-rata ' + average + ' batang sehari sudah terbukti secara medis meningkatkan risiko kanker secara drastis. Ubah kebiasaanmu dari sekarang!';
      color = 'var(--orange-500)';
    } else {
      recommendationTitle = 'Peringatan Darurat Kritis';
      recommendation = 'Anda benar-benar menghancurkan paru-paru Anda! Rata-rata ' + average + ' batang per hari adalah tiket ekspres menuju penyakit pernapasan kronis dan kanker. Tubuh Anda bukan asbak, segera hentikan sekarang juga!';
      color = 'var(--danger)';
    }

    res.json({
      success: true,
      data: {
        history,
        average,
        totalCount,
        aiMessage: {
          title: recommendationTitle,
          content: recommendation,
          color: color
        }
      }
    });
  } catch (error) {
    next(error);
  }
};
