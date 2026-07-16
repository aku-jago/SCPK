/**
 * PDF Report Generator using jsPDF
 * Generates screening result PDF reports with branding
 */
const PDFGenerator = {
  async generateReport(screeningData) {
    // Load jsPDF dynamically
    if (!window.jspdf) {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.2/jspdf.umd.min.js';
      document.head.appendChild(script);
      await new Promise((resolve) => { script.onload = resolve; });
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const data = screeningData;

    // Colors
    const pink = [236, 72, 153];
    const purple = [168, 85, 247];
    const dark = [31, 41, 55];
    const gray = [107, 114, 128];
    const white = [255, 255, 255];

    // ── Header ──
    doc.setFillColor(...pink);
    doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(...white);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('LunarHealth Self-Screening Platform', 20, 20);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Sistem AI Deteksi Dini & Klasifikasi Tingkat Risiko Kanker Paru-Paru', 20, 30);

    // ── Report Title ──
    doc.setTextColor(...dark);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Laporan Hasil Screening', 20, 55);

    doc.setTextColor(...gray);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    const date = new Date(data.createdAt).toLocaleDateString('id-ID', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    });
    doc.text(`Tanggal: ${date}`, 20, 63);
    doc.text(`ID Screening: ${data.id || '-'}`, 20, 69);

    // ── Risk Score ──
    doc.setFillColor(249, 250, 251);
    doc.roundedRect(20, 78, 170, 50, 4, 4, 'F');

    doc.setTextColor(...dark);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Hasil Analisis AI', 30, 92);

    doc.setFontSize(36);
    const riskColors = { RENDAH: [34, 197, 94], SEDANG: [234, 179, 8], TINGGI: [249, 115, 22], SANGAT_TINGGI: [239, 68, 68] };
    const rColor = riskColors[data.riskCategory] || gray;
    doc.setTextColor(...rColor);
    doc.text(`${data.riskScore}`, 30, 115);

    doc.setFontSize(14);
    const riskLabels = { RENDAH: 'Risiko Rendah', SEDANG: 'Risiko Sedang', TINGGI: 'Risiko Tinggi', SANGAT_TINGGI: 'Risiko Sangat Tinggi' };
    doc.text(riskLabels[data.riskCategory] || data.riskCategory, 75, 115);

    doc.setTextColor(...gray);
    doc.setFontSize(9);
    doc.text('Skor Risiko (0-100)', 30, 122);

    // ── Input Parameters ──
    let y = 142;
    doc.setTextColor(...dark);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Parameter Input', 20, y);
    y += 10;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    const params = [
      ['Usia', `${data.age} tahun`],
      ['Rokok per Hari', `${data.cigarettesPerDay} batang`],
      ['Durasi Batuk', `${data.coughDuration} bulan`],
      ['Berat Badan', `${data.weight} kg`],
      ['Tinggi Badan', `${data.height} cm`],
      ['BMI', `${data.bmi} kg/m²`],
      ['Riwayat Keluarga', data.familyHistory ? 'Ya' : 'Tidak'],
      ['Paparan Lingkungan', `${data.environmentalExposure}/10`],
      ['Skala Nyeri Dada', `${data.chestPainScale}/10`],
    ];

    params.forEach(([label, value], i) => {
      const bgColor = i % 2 === 0 ? [249, 250, 251] : [255, 255, 255];
      doc.setFillColor(...bgColor);
      doc.rect(20, y - 4, 170, 8, 'F');
      doc.setTextColor(...gray);
      doc.text(label, 25, y);
      doc.setTextColor(...dark);
      doc.setFont('helvetica', 'bold');
      doc.text(value, 140, y);
      doc.setFont('helvetica', 'normal');
      y += 8;
    });

    // ── Recommendations ──
    y += 8;
    if (data.recommendations && data.recommendations.length > 0) {
      doc.setTextColor(...dark);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Rekomendasi', 20, y);
      y += 10;

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      data.recommendations.forEach((rec, i) => {
        if (y > 270) { doc.addPage(); y = 20; }
        doc.setTextColor(...pink);
        doc.setFont('helvetica', 'bold');
        doc.text(`${i + 1}. ${rec.title}`, 25, y);
        y += 5;
        doc.setTextColor(...gray);
        doc.setFont('helvetica', 'normal');
        const lines = doc.splitTextToSize(rec.description, 155);
        doc.text(lines, 25, y);
        y += lines.length * 4 + 4;
      });
    }

    // ── Footer ──
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFillColor(...pink);
      doc.rect(0, 285, 210, 12, 'F');
      doc.setTextColor(...white);
      doc.setFontSize(7);
      doc.text('⚠️ Hasil ini bukan diagnosis medis. Selalu konsultasikan dengan dokter untuk evaluasi lebih lanjut.', 20, 291);
      doc.text(`Halaman ${i}/${pageCount}`, 180, 291);
    }

    // Save
    doc.save(`LunarHealth_Screening_Report_${new Date().toISOString().slice(0, 10)}.pdf`);
  },
};
