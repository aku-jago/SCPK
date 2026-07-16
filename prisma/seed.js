const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // ============================================
  // 1. Create Admin User
  // ============================================
  const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'Admin@123456', 12);
  
  const admin = await prisma.user.upsert({
    where: { email: process.env.ADMIN_EMAIL || 'admin@scpk.com' },
    update: {},
    create: {
      email: process.env.ADMIN_EMAIL || 'admin@scpk.com',
      password: hashedPassword,
      name: 'Administrator',
      role: 'ADMIN',
      phone: '+62812345678',
      gender: 'MALE',
    },
  });
  console.log(`✅ Admin user created: ${admin.email}`);

  // ============================================
  // 2. Create Fuzzy Variables (Input + Output)
  // ============================================
  const fuzzyVariables = [
    {
      name: 'age',
      label: 'Usia',
      type: 'INPUT',
      minValue: 15,
      maxValue: 80,
      unit: 'tahun',
      membershipFunctions: [
        { name: 'muda', type: 'trapezoid', params: [15, 15, 25, 35] },
        { name: 'dewasa', type: 'triangle', params: [30, 45, 60] },
        { name: 'tua', type: 'trapezoid', params: [55, 65, 80, 80] },
      ],
    },
    {
      name: 'cigarettesPerDay',
      label: 'Jumlah Rokok per Hari',
      type: 'INPUT',
      minValue: 0,
      maxValue: 60,
      unit: 'batang',
      membershipFunctions: [
        { name: 'ringan', type: 'trapezoid', params: [0, 0, 5, 15] },
        { name: 'sedang', type: 'triangle', params: [10, 20, 30] },
        { name: 'berat', type: 'trapezoid', params: [25, 35, 60, 60] },
      ],
    },
    {
      name: 'coughDuration',
      label: 'Durasi Batuk',
      type: 'INPUT',
      minValue: 0,
      maxValue: 24,
      unit: 'bulan',
      membershipFunctions: [
        { name: 'singkat', type: 'trapezoid', params: [0, 0, 1, 3] },
        { name: 'sedang', type: 'triangle', params: [2, 6, 10] },
        { name: 'lama', type: 'trapezoid', params: [8, 12, 24, 24] },
      ],
    },
    {
      name: 'bmi',
      label: 'Body Mass Index',
      type: 'INPUT',
      minValue: 10,
      maxValue: 50,
      unit: 'kg/m²',
      membershipFunctions: [
        { name: 'kurus', type: 'trapezoid', params: [10, 10, 16, 18.5] },
        { name: 'normal', type: 'triangle', params: [17, 22, 27] },
        { name: 'gemuk', type: 'triangle', params: [25, 29, 33] },
        { name: 'obesitas', type: 'trapezoid', params: [30, 35, 50, 50] },
      ],
    },
    {
      name: 'familyHistory',
      label: 'Riwayat Keluarga',
      type: 'INPUT',
      minValue: 0,
      maxValue: 1,
      unit: null,
      membershipFunctions: [
        { name: 'tidak_ada', type: 'singleton', params: [0] },
        { name: 'ada', type: 'singleton', params: [1] },
      ],
    },
    {
      name: 'environmentalExposure',
      label: 'Paparan Lingkungan',
      type: 'INPUT',
      minValue: 1,
      maxValue: 10,
      unit: 'skala',
      membershipFunctions: [
        { name: 'rendah', type: 'trapezoid', params: [1, 1, 2, 4] },
        { name: 'sedang', type: 'triangle', params: [3, 5, 7] },
        { name: 'tinggi', type: 'trapezoid', params: [6, 8, 10, 10] },
      ],
    },
    {
      name: 'chestPainScale',
      label: 'Skala Nyeri Dada',
      type: 'INPUT',
      minValue: 1,
      maxValue: 10,
      unit: 'skala',
      membershipFunctions: [
        { name: 'ringan', type: 'trapezoid', params: [1, 1, 2, 4] },
        { name: 'sedang', type: 'triangle', params: [3, 5, 7] },
        { name: 'berat', type: 'trapezoid', params: [6, 8, 10, 10] },
      ],
    },
    {
      name: 'riskLevel',
      label: 'Tingkat Risiko',
      type: 'OUTPUT',
      minValue: 0,
      maxValue: 100,
      unit: 'persen',
      membershipFunctions: [
        { name: 'rendah', type: 'linear_decrease', params: [0, 30] },
        { name: 'sedang', type: 'triangle', params: [25, 50, 75] },
        { name: 'tinggi', type: 'triangle', params: [60, 75, 90] },
        { name: 'sangat_tinggi', type: 'linear_increase', params: [80, 100] },
      ],
    },
  ];

  for (const variable of fuzzyVariables) {
    await prisma.fuzzyVariable.upsert({
      where: { name: variable.name },
      update: variable,
      create: variable,
    });
  }
  console.log(`✅ ${fuzzyVariables.length} fuzzy variables created`);

  // ============================================
  // 3. Create Fuzzy Rules
  // ============================================
  const fuzzyRules = [
    // Low risk rules
    {
      name: 'R1 - Muda, Ringan, Singkat → Rendah',
      conditions: [
        { variable: 'age', value: 'muda' },
        { variable: 'cigarettesPerDay', value: 'ringan' },
        { variable: 'coughDuration', value: 'singkat' },
      ],
      consequent: 'rendah',
      weight: 1.0,
    },
    {
      name: 'R2 - Muda, Ringan, Normal BMI → Rendah',
      conditions: [
        { variable: 'age', value: 'muda' },
        { variable: 'cigarettesPerDay', value: 'ringan' },
        { variable: 'bmi', value: 'normal' },
      ],
      consequent: 'rendah',
      weight: 1.0,
    },
    {
      name: 'R3 - Dewasa, Ringan, Singkat, Tanpa Riwayat → Rendah',
      conditions: [
        { variable: 'age', value: 'dewasa' },
        { variable: 'cigarettesPerDay', value: 'ringan' },
        { variable: 'coughDuration', value: 'singkat' },
        { variable: 'familyHistory', value: 'tidak_ada' },
      ],
      consequent: 'rendah',
      weight: 0.9,
    },
    // Medium risk rules
    {
      name: 'R4 - Dewasa, Sedang, Sedang → Sedang',
      conditions: [
        { variable: 'age', value: 'dewasa' },
        { variable: 'cigarettesPerDay', value: 'sedang' },
        { variable: 'coughDuration', value: 'sedang' },
      ],
      consequent: 'sedang',
      weight: 1.0,
    },
    {
      name: 'R5 - Muda, Sedang, Paparan Sedang → Sedang',
      conditions: [
        { variable: 'age', value: 'muda' },
        { variable: 'cigarettesPerDay', value: 'sedang' },
        { variable: 'environmentalExposure', value: 'sedang' },
      ],
      consequent: 'sedang',
      weight: 1.0,
    },
    {
      name: 'R6 - Dewasa, Ringan, Lama, Nyeri Sedang → Sedang',
      conditions: [
        { variable: 'age', value: 'dewasa' },
        { variable: 'cigarettesPerDay', value: 'ringan' },
        { variable: 'coughDuration', value: 'lama' },
        { variable: 'chestPainScale', value: 'sedang' },
      ],
      consequent: 'sedang',
      weight: 1.0,
    },
    {
      name: 'R7 - Muda, Berat, Singkat → Sedang',
      conditions: [
        { variable: 'age', value: 'muda' },
        { variable: 'cigarettesPerDay', value: 'berat' },
        { variable: 'coughDuration', value: 'singkat' },
      ],
      consequent: 'sedang',
      weight: 0.9,
    },
    // High risk rules
    {
      name: 'R8 - Dewasa, Berat, Sedang, Riwayat Ada → Tinggi',
      conditions: [
        { variable: 'age', value: 'dewasa' },
        { variable: 'cigarettesPerDay', value: 'berat' },
        { variable: 'coughDuration', value: 'sedang' },
        { variable: 'familyHistory', value: 'ada' },
      ],
      consequent: 'tinggi',
      weight: 1.0,
    },
    {
      name: 'R9 - Tua, Sedang, Sedang → Tinggi',
      conditions: [
        { variable: 'age', value: 'tua' },
        { variable: 'cigarettesPerDay', value: 'sedang' },
        { variable: 'coughDuration', value: 'sedang' },
      ],
      consequent: 'tinggi',
      weight: 1.0,
    },
    {
      name: 'R10 - Dewasa, Berat, Lama → Tinggi',
      conditions: [
        { variable: 'age', value: 'dewasa' },
        { variable: 'cigarettesPerDay', value: 'berat' },
        { variable: 'coughDuration', value: 'lama' },
      ],
      consequent: 'tinggi',
      weight: 1.0,
    },
    {
      name: 'R11 - Dewasa, Sedang, Nyeri Berat, Paparan Tinggi → Tinggi',
      conditions: [
        { variable: 'age', value: 'dewasa' },
        { variable: 'cigarettesPerDay', value: 'sedang' },
        { variable: 'chestPainScale', value: 'berat' },
        { variable: 'environmentalExposure', value: 'tinggi' },
      ],
      consequent: 'tinggi',
      weight: 1.0,
    },
    // Very high risk rules
    {
      name: 'R12 - Tua, Berat, Lama, Riwayat Ada → Sangat Tinggi',
      conditions: [
        { variable: 'age', value: 'tua' },
        { variable: 'cigarettesPerDay', value: 'berat' },
        { variable: 'coughDuration', value: 'lama' },
        { variable: 'familyHistory', value: 'ada' },
      ],
      consequent: 'sangat_tinggi',
      weight: 1.0,
    },
    {
      name: 'R13 - Tua, Berat, Lama, Paparan Tinggi → Sangat Tinggi',
      conditions: [
        { variable: 'age', value: 'tua' },
        { variable: 'cigarettesPerDay', value: 'berat' },
        { variable: 'coughDuration', value: 'lama' },
        { variable: 'environmentalExposure', value: 'tinggi' },
      ],
      consequent: 'sangat_tinggi',
      weight: 1.0,
    },
    {
      name: 'R14 - Tua, Berat, Nyeri Berat, Riwayat Ada → Sangat Tinggi',
      conditions: [
        { variable: 'age', value: 'tua' },
        { variable: 'cigarettesPerDay', value: 'berat' },
        { variable: 'chestPainScale', value: 'berat' },
        { variable: 'familyHistory', value: 'ada' },
      ],
      consequent: 'sangat_tinggi',
      weight: 1.0,
    },
    {
      name: 'R15 - Dewasa, Berat, Lama, Nyeri Berat, Paparan Tinggi → Sangat Tinggi',
      conditions: [
        { variable: 'age', value: 'dewasa' },
        { variable: 'cigarettesPerDay', value: 'berat' },
        { variable: 'coughDuration', value: 'lama' },
        { variable: 'chestPainScale', value: 'berat' },
        { variable: 'environmentalExposure', value: 'tinggi' },
      ],
      consequent: 'sangat_tinggi',
      weight: 1.0,
    },
    {
      name: 'R16 - Tua, Sedang, Lama, Nyeri Berat → Tinggi',
      conditions: [
        { variable: 'age', value: 'tua' },
        { variable: 'cigarettesPerDay', value: 'sedang' },
        { variable: 'coughDuration', value: 'lama' },
        { variable: 'chestPainScale', value: 'berat' },
      ],
      consequent: 'tinggi',
      weight: 1.0,
    },
    {
      name: 'R17 - Muda, Berat, Lama, Riwayat Ada → Tinggi',
      conditions: [
        { variable: 'age', value: 'muda' },
        { variable: 'cigarettesPerDay', value: 'berat' },
        { variable: 'coughDuration', value: 'lama' },
        { variable: 'familyHistory', value: 'ada' },
      ],
      consequent: 'tinggi',
      weight: 0.9,
    },
    {
      name: 'R18 - Dewasa, Sedang, Singkat, Tanpa Riwayat → Sedang',
      conditions: [
        { variable: 'age', value: 'dewasa' },
        { variable: 'cigarettesPerDay', value: 'sedang' },
        { variable: 'coughDuration', value: 'singkat' },
        { variable: 'familyHistory', value: 'tidak_ada' },
      ],
      consequent: 'sedang',
      weight: 0.8,
    },
    {
      name: 'R19 - Tua, Ringan, Singkat → Sedang',
      conditions: [
        { variable: 'age', value: 'tua' },
        { variable: 'cigarettesPerDay', value: 'ringan' },
        { variable: 'coughDuration', value: 'singkat' },
      ],
      consequent: 'sedang',
      weight: 0.8,
    },
    {
      name: 'R20 - Obesitas, Berat, Paparan Tinggi → Tinggi',
      conditions: [
        { variable: 'bmi', value: 'obesitas' },
        { variable: 'cigarettesPerDay', value: 'berat' },
        { variable: 'environmentalExposure', value: 'tinggi' },
      ],
      consequent: 'tinggi',
      weight: 1.0,
    },
    // ── Additional rules for better coverage ──

    // Young + heavy smoker combinations
    {
      name: 'R21 - Muda, Berat, Sedang Batuk → Tinggi',
      conditions: [
        { variable: 'age', value: 'muda' },
        { variable: 'cigarettesPerDay', value: 'berat' },
        { variable: 'coughDuration', value: 'sedang' },
      ],
      consequent: 'tinggi',
      weight: 0.9,
    },
    {
      name: 'R22 - Muda, Berat, Lama Batuk → Tinggi',
      conditions: [
        { variable: 'age', value: 'muda' },
        { variable: 'cigarettesPerDay', value: 'berat' },
        { variable: 'coughDuration', value: 'lama' },
      ],
      consequent: 'tinggi',
      weight: 1.0,
    },
    {
      name: 'R23 - Muda, Sedang, Lama Batuk → Sedang',
      conditions: [
        { variable: 'age', value: 'muda' },
        { variable: 'cigarettesPerDay', value: 'sedang' },
        { variable: 'coughDuration', value: 'lama' },
      ],
      consequent: 'sedang',
      weight: 1.0,
    },

    // 2-condition fallback rules — ensure extreme single factors produce results
    {
      name: 'R24 - Berat Rokok, Lama Batuk → Tinggi',
      conditions: [
        { variable: 'cigarettesPerDay', value: 'berat' },
        { variable: 'coughDuration', value: 'lama' },
      ],
      consequent: 'tinggi',
      weight: 0.9,
    },
    {
      name: 'R25 - Sedang Rokok, Lama Batuk → Sedang',
      conditions: [
        { variable: 'cigarettesPerDay', value: 'sedang' },
        { variable: 'coughDuration', value: 'lama' },
      ],
      consequent: 'sedang',
      weight: 0.9,
    },
    {
      name: 'R26 - Paparan Tinggi, Nyeri Berat → Tinggi',
      conditions: [
        { variable: 'environmentalExposure', value: 'tinggi' },
        { variable: 'chestPainScale', value: 'berat' },
      ],
      consequent: 'tinggi',
      weight: 0.8,
    },
    {
      name: 'R27 - Riwayat Ada, Lama Batuk → Sedang',
      conditions: [
        { variable: 'familyHistory', value: 'ada' },
        { variable: 'coughDuration', value: 'lama' },
      ],
      consequent: 'sedang',
      weight: 0.8,
    },
    {
      name: 'R28 - Riwayat Ada, Berat Rokok → Tinggi',
      conditions: [
        { variable: 'familyHistory', value: 'ada' },
        { variable: 'cigarettesPerDay', value: 'berat' },
      ],
      consequent: 'tinggi',
      weight: 0.9,
    },
    {
      name: 'R29 - Riwayat Ada, Nyeri Berat → Tinggi',
      conditions: [
        { variable: 'familyHistory', value: 'ada' },
        { variable: 'chestPainScale', value: 'berat' },
      ],
      consequent: 'tinggi',
      weight: 0.8,
    },

    // Dewasa/Tua with heavy overall risk
    {
      name: 'R30 - Dewasa, Berat, Paparan Tinggi → Tinggi',
      conditions: [
        { variable: 'age', value: 'dewasa' },
        { variable: 'cigarettesPerDay', value: 'berat' },
        { variable: 'environmentalExposure', value: 'tinggi' },
      ],
      consequent: 'tinggi',
      weight: 1.0,
    },
    {
      name: 'R31 - Dewasa, Berat, Nyeri Berat → Tinggi',
      conditions: [
        { variable: 'age', value: 'dewasa' },
        { variable: 'cigarettesPerDay', value: 'berat' },
        { variable: 'chestPainScale', value: 'berat' },
      ],
      consequent: 'tinggi',
      weight: 1.0,
    },
    {
      name: 'R32 - Dewasa, Berat, Riwayat Ada → Tinggi',
      conditions: [
        { variable: 'age', value: 'dewasa' },
        { variable: 'cigarettesPerDay', value: 'berat' },
        { variable: 'familyHistory', value: 'ada' },
      ],
      consequent: 'tinggi',
      weight: 1.0,
    },
    {
      name: 'R33 - Dewasa, Lama Batuk, Nyeri Berat, Riwayat Ada → Sangat Tinggi',
      conditions: [
        { variable: 'age', value: 'dewasa' },
        { variable: 'coughDuration', value: 'lama' },
        { variable: 'chestPainScale', value: 'berat' },
        { variable: 'familyHistory', value: 'ada' },
      ],
      consequent: 'sangat_tinggi',
      weight: 1.0,
    },

    // Tua + moderate factors → still elevated
    {
      name: 'R34 - Tua, Sedang Rokok, Lama Batuk → Tinggi',
      conditions: [
        { variable: 'age', value: 'tua' },
        { variable: 'cigarettesPerDay', value: 'sedang' },
        { variable: 'coughDuration', value: 'lama' },
      ],
      consequent: 'tinggi',
      weight: 1.0,
    },
    {
      name: 'R35 - Tua, Ringan Rokok, Lama Batuk, Riwayat Ada → Sedang',
      conditions: [
        { variable: 'age', value: 'tua' },
        { variable: 'cigarettesPerDay', value: 'ringan' },
        { variable: 'coughDuration', value: 'lama' },
        { variable: 'familyHistory', value: 'ada' },
      ],
      consequent: 'sedang',
      weight: 0.9,
    },
  ];

  // Clear existing rules and recreate
  await prisma.fuzzyRule.deleteMany({});
  for (const rule of fuzzyRules) {
    await prisma.fuzzyRule.create({ data: rule });
  }
  console.log(`✅ ${fuzzyRules.length} fuzzy rules created`);

  // ============================================
  // 4. Create Knowledge Base Articles
  // ============================================
  const knowledgeBaseArticles = [
    {
      title: 'Apa Itu Kanker Paru-Paru?',
      summary: 'Pengenalan komprehensif tentang kanker paru-paru, jenis, dan perkembangannya.',
      category: 'LUNG_CANCER',
      tags: 'kanker, paru-paru, pengantar, jenis',
      isPublished: true,
      content: `# Apa Itu Kanker Paru-Paru?

Kanker paru-paru adalah pertumbuhan sel abnormal yang tidak terkendali di dalam satu atau kedua paru-paru. Sel-sel abnormal ini tidak menjalankan fungsi sel paru-paru normal dan tidak berkembang menjadi jaringan paru-paru yang sehat. Sebaliknya, sel-sel ini dapat membentuk tumor dan mengganggu fungsi paru-paru.

## Jenis Kanker Paru-Paru

### 1. Non-Small Cell Lung Cancer (NSCLC)
Merupakan jenis yang paling umum, mencakup sekitar 85% dari semua kasus kanker paru-paru. Jenis ini terbagi menjadi:
- **Adenokarsinoma**: Paling umum, biasanya ditemukan di bagian luar paru-paru
- **Karsinoma Sel Skuamosa**: Biasanya ditemukan di dekat saluran udara utama
- **Karsinoma Sel Besar**: Dapat ditemukan di bagian mana saja dari paru-paru

### 2. Small Cell Lung Cancer (SCLC)
Mencakup sekitar 15% kasus. Jenis ini tumbuh lebih cepat dan lebih agresif, biasanya terkait erat dengan kebiasaan merokok.

## Faktor Risiko Utama
- Merokok (penyebab utama ~80% kasus)
- Paparan asap rokok pasif
- Paparan radon
- Paparan asbes dan bahan kimia berbahaya
- Riwayat keluarga
- Polusi udara`,
    },
    {
      title: 'Bahaya Merokok Terhadap Kesehatan Paru-Paru',
      summary: 'Memahami dampak merokok terhadap sistem pernapasan dan risiko kanker.',
      category: 'SMOKING_RISKS',
      tags: 'merokok, bahaya, paru-paru, nikotin',
      isPublished: true,
      content: `# Bahaya Merokok Terhadap Kesehatan Paru-Paru

Merokok adalah penyebab utama kanker paru-paru. Sekitar 80% kematian akibat kanker paru-paru disebabkan oleh merokok, dan banyak lainnya disebabkan oleh paparan asap rokok pasif.

## Dampak Merokok pada Paru-Paru

### Kerusakan Langsung
1. **Kerusakan Silia**: Merokok melumpuhkan dan menghancurkan silia, rambut halus yang membersihkan saluran udara
2. **Peradangan Kronis**: Asap rokok menyebabkan peradangan yang terus-menerus
3. **Mutasi DNA**: Bahan kimia dalam rokok merusak DNA sel paru-paru
4. **Penumpukan Tar**: Tar menumpuk di paru-paru dan menyumbat alveoli

### Risiko Berdasarkan Jumlah Rokok
- **1-10 batang/hari**: Risiko 5x lebih tinggi dibanding non-perokok
- **11-20 batang/hari**: Risiko 10x lebih tinggi
- **21+ batang/hari**: Risiko 15-30x lebih tinggi

## Manfaat Berhenti Merokok
- Setelah 1 tahun: Risiko berkurang 50%
- Setelah 5 tahun: Risiko berkurang hingga setengah
- Setelah 10 tahun: Risiko hampir sama dengan non-perokok`,
    },
    {
      title: 'Deteksi Dini Kanker Paru-Paru',
      summary: 'Pentingnya deteksi dini dan metode skrining yang tersedia.',
      category: 'EARLY_DETECTION',
      tags: 'deteksi-dini, skrining, ct-scan, gejala',
      isPublished: true,
      content: `# Deteksi Dini Kanker Paru-Paru

Deteksi dini kanker paru-paru sangat penting karena tingkat keberhasilan pengobatan jauh lebih tinggi ketika kanker ditemukan pada tahap awal.

## Mengapa Deteksi Dini Penting?

- **Stadium 1**: Tingkat kelangsungan hidup 5 tahun mencapai 68-92%
- **Stadium 2**: Tingkat kelangsungan hidup 5 tahun 53-60%
- **Stadium 3**: Tingkat kelangsungan hidup 5 tahun 13-36%
- **Stadium 4**: Tingkat kelangsungan hidup 5 tahun hanya 1-10%

## Gejala yang Harus Diwaspadai
1. Batuk yang tidak kunjung sembuh
2. Perubahan pada batuk kronis
3. Batuk berdarah
4. Sesak napas
5. Nyeri dada yang memburuk saat bernapas dalam
6. Penurunan berat badan tanpa sebab
7. Kelelahan yang tidak biasa

## Metode Skrining
### Low-Dose CT Scan (LDCT)
Metode skrining yang direkomendasikan untuk individu berisiko tinggi:
- Usia 50-80 tahun
- Riwayat merokok 20 pack-years atau lebih
- Masih merokok atau berhenti dalam 15 tahun terakhir

### Self-Screening AI
Platform kami menggunakan teknologi AI Fuzzy Tsukamoto untuk membantu mengklasifikasikan tingkat risiko berdasarkan berbagai faktor, memberikan rekomendasi awal sebelum konsultasi medis.`,
    },
    {
      title: 'Tips Pencegahan Kanker Paru-Paru',
      summary: 'Langkah-langkah praktis untuk mengurangi risiko kanker paru-paru.',
      category: 'PREVENTION',
      tags: 'pencegahan, tips, gaya-hidup, kesehatan',
      isPublished: true,
      content: `# Tips Pencegahan Kanker Paru-Paru

## 1. Berhenti Merokok
Langkah paling efektif untuk mencegah kanker paru-paru.

### Strategi Berhenti Merokok
- Konsultasi dengan dokter tentang terapi penggantian nikotin
- Pertimbangkan obat resep (varenicline, bupropion)
- Bergabung dengan program berhenti merokok
- Gunakan aplikasi pendukung

## 2. Hindari Paparan Asap Rokok Pasif
- Minta orang tidak merokok di dalam rumah
- Pilih restoran dan tempat umum bebas asap rokok
- Jauhkan anak-anak dari lingkungan perokok

## 3. Pola Makan Sehat
- Perbanyak buah dan sayuran (5+ porsi per hari)
- Konsumsi makanan kaya antioksidan
- Kurangi makanan olahan dan daging merah

## 4. Olahraga Teratur
- Minimal 150 menit aktivitas aerobik per minggu
- Latihan pernapasan untuk memperkuat paru-paru
- Yoga dan meditasi untuk manajemen stres

## 5. Kurangi Paparan Lingkungan
- Periksa kadar radon di rumah
- Gunakan APD di tempat kerja berisiko
- Gunakan masker saat kualitas udara buruk`,
    },
  ];

  await prisma.knowledgeBase.deleteMany({});
  for (const article of knowledgeBaseArticles) {
    await prisma.knowledgeBase.create({ data: article });
  }
  console.log(`✅ ${knowledgeBaseArticles.length} knowledge base articles created`);

  // ============================================
  // 5. Create Demo User with Sample Screening
  // ============================================
  const demoPassword = await bcrypt.hash('Demo@123456', 12);
  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@scpk.com' },
    update: {},
    create: {
      email: 'demo@scpk.com',
      password: demoPassword,
      name: 'Demo User',
      role: 'USER',
      phone: '+62898765432',
      gender: 'MALE',
      dateOfBirth: new Date('1985-06-15'),
    },
  });

  // Create a sample screening for the demo user
  await prisma.screening.create({
    data: {
      userId: demoUser.id,
      age: 40,
      cigarettesPerDay: 15,
      coughDuration: 3,
      weight: 72,
      height: 170,
      bmi: 24.91,
      familyHistory: false,
      environmentalExposure: 5,
      chestPainScale: 3,
      riskScore: 42.5,
      riskCategory: 'SEDANG',
      fuzzyInputs: {
        age: { muda: 0, dewasa: 0.67, tua: 0 },
        cigarettesPerDay: { ringan: 0, sedang: 1.0, berat: 0 },
        coughDuration: { singkat: 0, sedang: 0.75, lama: 0 },
        bmi: { kurus: 0, normal: 0.59, gemuk: 0, obesitas: 0 },
      },
      fuzzyRuleResults: [
        { rule: 'R4', firingStrength: 0.67, output: 50 },
        { rule: 'R18', firingStrength: 0, output: 0 },
      ],
      defuzzificationResult: {
        method: 'tsukamoto_weighted_average',
        result: 42.5,
      },
      recommendations: {
        create: [
          {
            title: 'Kurangi Konsumsi Rokok',
            description: 'Dengan 15 batang per hari, Anda berada di kategori perokok sedang. Mulailah mengurangi 1-2 batang per minggu. Pertimbangkan terapi penggantian nikotin.',
            priority: 'HIGH',
            category: 'LIFESTYLE',
          },
          {
            title: 'Periksakan Diri ke Dokter',
            description: 'Dengan risiko sedang, disarankan untuk melakukan pemeriksaan kesehatan paru-paru setiap 6-12 bulan. Konsultasikan dengan dokter spesialis paru.',
            priority: 'MEDIUM',
            category: 'MEDICAL_CHECKUP',
          },
          {
            title: 'Tingkatkan Aktivitas Fisik',
            description: 'Olahraga teratur minimal 30 menit per hari dapat membantu memperkuat fungsi paru-paru. Mulailah dengan jalan cepat atau bersepeda.',
            priority: 'MEDIUM',
            category: 'EXERCISE',
          },
        ],
      },
    },
  });
  console.log(`✅ Demo user created with sample screening: ${demoUser.email}`);

  console.log('\n🎉 Database seeding completed successfully!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`Admin Login: ${process.env.ADMIN_EMAIL || 'admin@scpk.com'} / ${process.env.ADMIN_PASSWORD || 'Admin@123456'}`);
  console.log(`Demo Login:  demo@scpk.com / Demo@123456`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
