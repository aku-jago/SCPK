/**
 * Recommendation Service
 * Generates personalized health recommendations based on risk category and screening inputs
 */
class RecommendationService {
  /**
   * Generate recommendations based on screening results
   */
  generateRecommendations(screeningData, riskCategory) {
    const recommendations = [];

    // Always add based on risk category
    recommendations.push(...this._getRiskBasedRecommendations(riskCategory));

    // Add based on specific input factors
    recommendations.push(...this._getFactorBasedRecommendations(screeningData));

    // Deduplicate by title
    const seen = new Set();
    return recommendations.filter((rec) => {
      if (seen.has(rec.title)) return false;
      seen.add(rec.title);
      return true;
    });
  }

  _getRiskBasedRecommendations(riskCategory) {
    const recommendations = {
      RENDAH: [
        {
          title: 'Pertahankan Gaya Hidup Sehat',
          description: 'Tingkat risiko Anda rendah, tetapi tetap penting untuk menjaga kesehatan paru-paru. Lanjutkan pola hidup sehat, hindari paparan asap rokok, dan lakukan olahraga teratur minimal 150 menit per minggu.',
          priority: 'LOW',
          category: 'LIFESTYLE',
        },
        {
          title: 'Pemeriksaan Kesehatan Rutin',
          description: 'Lakukan pemeriksaan kesehatan umum setiap tahun untuk memantau kondisi kesehatan Anda secara keseluruhan.',
          priority: 'LOW',
          category: 'MEDICAL_CHECKUP',
        },
      ],
      SEDANG: [
        {
          title: 'Konsultasi dengan Dokter',
          description: 'Dengan tingkat risiko sedang, sangat disarankan untuk berkonsultasi dengan dokter umum atau spesialis paru. Lakukan pemeriksaan fungsi paru (spirometri) untuk menilai kondisi paru-paru Anda.',
          priority: 'MEDIUM',
          category: 'MEDICAL_CHECKUP',
        },
        {
          title: 'Program Berhenti Merokok',
          description: 'Pertimbangkan untuk mengikuti program berhenti merokok. Konsultasikan dengan dokter mengenai terapi penggantian nikotin (NRT) atau obat bantu berhenti merokok.',
          priority: 'HIGH',
          category: 'LIFESTYLE',
        },
        {
          title: 'Perbaiki Pola Makan',
          description: 'Tingkatkan asupan buah dan sayuran, terutama yang kaya antioksidan seperti brokoli, bayam, tomat, dan buah berry. Kurangi makanan olahan dan tinggi lemak.',
          priority: 'MEDIUM',
          category: 'DIET',
        },
      ],
      TINGGI: [
        {
          title: 'Segera Konsultasi Dokter Spesialis Paru',
          description: 'Tingkat risiko Anda tinggi. Segera jadwalkan konsultasi dengan dokter spesialis paru (pulmonolog). Pertimbangkan untuk melakukan CT Scan dosis rendah (LDCT) sebagai skrining lanjutan.',
          priority: 'HIGH',
          category: 'MEDICAL_CHECKUP',
        },
        {
          title: 'Berhenti Merokok Sekarang',
          description: 'Berhenti merokok adalah langkah paling penting yang dapat Anda ambil. Setiap hari tanpa rokok mengurangi risiko Anda. Hubungi hotline berhenti merokok atau kunjungi klinik berhenti merokok terdekat.',
          priority: 'URGENT',
          category: 'LIFESTYLE',
        },
        {
          title: 'Pemeriksaan Fungsi Paru',
          description: 'Lakukan tes spirometri dan rontgen dada untuk mengevaluasi kondisi paru-paru Anda saat ini. Ini penting untuk deteksi dini.',
          priority: 'HIGH',
          category: 'MEDICAL_CHECKUP',
        },
        {
          title: 'Kelola Stres dan Kesehatan Mental',
          description: 'Proses berhenti merokok dan menghadapi risiko kesehatan dapat menyebabkan stres. Pertimbangkan konseling atau bergabung dengan support group.',
          priority: 'MEDIUM',
          category: 'MENTAL_HEALTH',
        },
      ],
      SANGAT_TINGGI: [
        {
          title: '⚠️ Segera Kunjungi Dokter Spesialis',
          description: 'Tingkat risiko Anda sangat tinggi. SEGERA jadwalkan pemeriksaan dengan dokter spesialis paru. Lakukan CT Scan dosis rendah (LDCT) dan pemeriksaan lengkap termasuk biopsi jika diperlukan.',
          priority: 'URGENT',
          category: 'EMERGENCY',
        },
        {
          title: 'Hentikan Merokok Segera',
          description: 'Berhenti merokok SEKARANG JUGA. Setiap batang rokok meningkatkan risiko Anda secara signifikan. Minta bantuan medis untuk program berhenti merokok intensif.',
          priority: 'URGENT',
          category: 'LIFESTYLE',
        },
        {
          title: 'Pemeriksaan Komprehensif',
          description: 'Lakukan pemeriksaan komprehensif meliputi: CT Scan dosis rendah, tes fungsi paru lengkap, pemeriksaan darah tumor marker, dan konsultasi onkologi jika diperlukan.',
          priority: 'URGENT',
          category: 'MEDICAL_CHECKUP',
        },
        {
          title: 'Dukungan Keluarga dan Psikologis',
          description: 'Libatkan keluarga dalam perjalanan kesehatan Anda. Pertimbangkan konseling psikologis untuk membantu menghadapi situasi ini dan membuat keputusan yang tepat.',
          priority: 'HIGH',
          category: 'MENTAL_HEALTH',
        },
        {
          title: 'Perubahan Lingkungan',
          description: 'Hindari semua paparan lingkungan yang berisiko: asap rokok pasif, polusi udara, bahan kimia berbahaya. Gunakan masker saat diperlukan dan pastikan ventilasi rumah baik.',
          priority: 'HIGH',
          category: 'LIFESTYLE',
        },
      ],
    };

    return recommendations[riskCategory] || [];
  }

  _getFactorBasedRecommendations(data) {
    const recs = [];

    // High cigarette consumption
    if (data.isSmoker && data.cigarettesPerDay >= 20) {
      recs.push({
        title: 'Kurangi Konsumsi Rokok Secara Bertahap',
        description: `Anda merokok ${data.cigarettesPerDay} batang per hari. Mulailah mengurangi 2-3 batang per minggu. Target: kurangi 50% dalam 1 bulan pertama. Gunakan pengganti nikotin jika diperlukan.`,
        priority: 'HIGH',
        category: 'LIFESTYLE',
      });
    }

    // Long smoking duration
    if (data.isSmoker && data.smokingDurationYears >= 10) {
      recs.push({
        title: 'Evaluasi Dampak Jangka Panjang Merokok',
        description: `Anda telah merokok selama ${data.smokingDurationYears} tahun. Risiko penyakit paru-paru meningkat seiring waktu. Pertimbangkan untuk melakukan rontgen dada atau CT scan dosis rendah (LDCT) sebagai skrining pencegahan.`,
        priority: 'HIGH',
        category: 'MEDICAL_CHECKUP',
      });
    }

    // Passive smoker
    if (!data.isSmoker && data.isPassiveSmoker) {
      recs.push({
        title: 'Hindari Paparan Asap Rokok',
        description: 'Meskipun Anda tidak merokok, paparan asap rokok pasif dapat meningkatkan risiko penyakit paru-paru. Usahakan untuk menghindari lingkungan yang penuh asap rokok dan pastikan rumah memiliki ventilasi yang baik.',
        priority: 'MEDIUM',
        category: 'LIFESTYLE',
      });
    }

    // Long cough duration
    if (data.coughDuration >= 6) {
      recs.push({
        title: 'Evaluasi Batuk Kronis',
        description: `Batuk Anda telah berlangsung ${data.coughDuration} bulan. Batuk kronis lebih dari 3 bulan perlu evaluasi medis. Lakukan pemeriksaan rontgen dada dan tes sputum.`,
        priority: 'HIGH',
        category: 'MEDICAL_CHECKUP',
      });
    }

    // BMI issues
    if (data.bmi < 18.5) {
      recs.push({
        title: 'Tingkatkan Berat Badan',
        description: `BMI Anda ${data.bmi.toFixed(1)} (underweight). Berat badan kurang dapat melemahkan sistem kekebalan tubuh. Konsultasikan dengan ahli gizi untuk program nutrisi yang tepat.`,
        priority: 'MEDIUM',
        category: 'DIET',
      });
    } else if (data.bmi >= 30) {
      recs.push({
        title: 'Program Penurunan Berat Badan',
        description: `BMI Anda ${data.bmi.toFixed(1)} (obesitas). Kelebihan berat badan meningkatkan risiko berbagai penyakit. Mulailah program penurunan berat badan dengan diet seimbang dan olahraga teratur.`,
        priority: 'MEDIUM',
        category: 'DIET',
      });
    }

    // Family history
    if (data.familyHistory) {
      recs.push({
        title: 'Skrining Rutin karena Riwayat Keluarga',
        description: 'Dengan adanya riwayat kanker paru-paru dalam keluarga, Anda memiliki risiko genetik yang lebih tinggi. Lakukan skrining paru-paru setiap 6-12 bulan.',
        priority: 'HIGH',
        category: 'MEDICAL_CHECKUP',
      });
    }

    // High environmental exposure
    if (data.environmentalExposure >= 7) {
      recs.push({
        title: 'Kurangi Paparan Lingkungan Berbahaya',
        description: 'Paparan lingkungan Anda tergolong tinggi. Gunakan alat pelindung diri (masker N95) saat berada di lingkungan berpolusi. Pertimbangkan pemasangan air purifier di rumah.',
        priority: 'HIGH',
        category: 'LIFESTYLE',
      });
    }

    // Chest pain
    if (data.chestPainScale >= 6) {
      recs.push({
        title: 'Evaluasi Nyeri Dada Segera',
        description: 'Nyeri dada yang signifikan perlu evaluasi medis segera. Lakukan pemeriksaan EKG dan rontgen dada. Jangan abaikan nyeri dada yang berulang atau memburuk.',
        priority: 'URGENT',
        category: 'MEDICAL_CHECKUP',
      });
    }

    // Exercise recommendation
    recs.push({
      title: 'Mulai Program Olahraga',
      description: 'Olahraga teratur membantu memperkuat paru-paru dan meningkatkan sirkulasi. Mulailah dengan jalan cepat 30 menit sehari, 5 hari seminggu. Tingkatkan secara bertahap.',
      priority: 'MEDIUM',
      category: 'EXERCISE',
    });

    return recs;
  }
}

module.exports = new RecommendationService();
