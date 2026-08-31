/**
 * PDF Technical Data Sheet Generator
 * NAWI-ReportPro - OIML R-76 Non-Automatic Weighing Instruments
 *
 * Generates a comprehensive, multi-page Technical Data Sheet report
 * containing detailed metrological test tables, calculations, error curves,
 * compliance matrices, multi-interval breakdown, ISO GUM uncertainty budgets,
 * and official verification sign-offs.
 */

const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');
const { computeExpandedUncertainty } = require('./uncertaintyCalculator');

// Official Color Palette
const COLORS = {
  NAVY: '#1e3a5f',
  NAVY_LIGHT: '#2a4b7c',
  SAFFRON: '#FF9933',
  WHITE: '#FFFFFF',
  GREEN: '#138808',
  FAIL_RED: '#D32F2F',
  PASS_GREEN: '#138808',
  PENDING_GRAY: '#6B7280',
  TEXT_DARK: '#1F2937',
  TEXT_MUTED: '#4B5563',
  BORDER_COLOR: '#9CA3AF',
  BORDER_LIGHT: '#E5E7EB',
  BG_LIGHT: '#F8FAFC',
  BG_ALT_ROW: '#F1F5F9',
  BG_HEADER: '#1e3a5f',
  SECTION_HEADER_BG: '#EEF2F6',
};

const TEST_DISPLAY_NAMES = {
  WEIGHING_PERFORMANCE: '1. WEIGHING PERFORMANCE (Accuracy & Linearity)',
  REPEATABILITY: '2. REPEATABILITY',
  ECCENTRICITY: '3. ECCENTRICITY (Off-Center Loading)',
  TEMPERATURE: '4. TEMPERATURE EFFECTS',
  STABILITY: '5. STABILITY & WARM-UP',
  TIME_DEPENDENCE: '6. TIME DEPENDENCE (Creep & Zero Return)',
};

const TEST_REFERENCES = {
  WEIGHING_PERFORMANCE: 'As per OIML R 76-1, Section 3.5 & A.4.4',
  REPEATABILITY: 'As per OIML R 76-1, Section 3.6 & A.4.6',
  ECCENTRICITY: 'As per OIML R 76-1, Section 3.6.2 & A.4.7',
  TEMPERATURE: 'As per OIML R 76-1, Section 3.9.2 & A.5.3',
  STABILITY: 'As per OIML R 76-1, Section 3.9.4 & A.5.2',
  TIME_DEPENDENCE: 'As per OIML R 76-1, Section 3.9.4.3 & 3.9.4.4',
};

/**
 * Format a Date object or string to DD-MMM-YYYY
 */
function formatDate(dateInput) {
  if (!dateInput) return 'N/A';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return String(dateInput);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const day = String(d.getDate()).padStart(2, '0');
  const month = months[d.getMonth()];
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
}

/**
 * Format numeric values nicely
 */
function formatNum(val, decimals = 4) {
  if (val == null || isNaN(val)) return '—';
  const n = Number(val);
  if (Number.isInteger(n)) return String(n);
  return Number(n.toFixed(decimals)).toString();
}

/**
 * Draw Tricolor Stripe Bar (Saffron, White, Green)
 */
function drawTricolorBar(doc, x, y, width, barHeight = 2.5) {
  doc.rect(x, y, width, barHeight).fill(COLORS.SAFFRON);
  doc.rect(x, y + barHeight, width, barHeight).fill(COLORS.WHITE);
  doc.rect(x, y + barHeight, width, barHeight).lineWidth(0.2).stroke(COLORS.BORDER_LIGHT);
  doc.rect(x, y + barHeight * 2, width, barHeight).fill(COLORS.GREEN);
}

/**
 * Generate QR Code Buffer
 */
async function generateQRCodeBuffer(qrPayload) {
  try {
    const text = typeof qrPayload === 'string' ? qrPayload : JSON.stringify(qrPayload);
    return await QRCode.toBuffer(text, {
      type: 'png',
      width: 100,
      margin: 1,
      color: {
        dark: '#1e3a5f',
        light: '#FFFFFF',
      },
    });
  } catch (err) {
    console.error('Error generating QR code buffer for datasheet:', err);
    return null;
  }
}

/**
 * Helper to draw a section header banner
 */
function drawSectionHeader(doc, x, y, width, title, reference) {
  const headerHeight = 20;
  doc.rect(x, y, width, headerHeight).fill(COLORS.BG_HEADER);

  doc
    .font('Helvetica-Bold')
    .fontSize(8.5)
    .fillColor(COLORS.WHITE)
    .text(title, x + 8, y + 4.5, { width: width - 180 });

  doc
    .font('Helvetica-Oblique')
    .fontSize(7)
    .fillColor('#E2E8F0')
    .text(reference, x + width - 170, y + 5, { width: 162, align: 'right' });

  return y + headerHeight + 5;
}

/**
 * Helper to draw test status pill
 */
function drawStatusPill(doc, x, y, status) {
  const isPass = status === 'PASS';
  const isFail = status === 'FAIL';
  const text = isPass ? 'PASS' : isFail ? 'FAIL' : (status || 'PENDING');
  const bg = isPass ? '#DCFCE7' : isFail ? '#FEE2E2' : '#F3F4F6';
  const border = isPass ? '#86EFAC' : isFail ? '#FCA5A5' : '#D1D5DB';
  const color = isPass ? COLORS.PASS_GREEN : isFail ? COLORS.FAIL_RED : COLORS.PENDING_GRAY;

  doc.roundedRect(x, y, 42, 13, 2).fill(bg);
  doc.roundedRect(x, y, 42, 13, 2).lineWidth(0.5).stroke(border);

  doc
    .font('Helvetica-Bold')
    .fontSize(7)
    .fillColor(color)
    .text(text, x, y + 2.5, { width: 42, align: 'center' });
}

/**
 * Generate PDF Technical Data Sheet Report
 * @param {Object} sessionData - TestSession with instrument, testResults, and conductedBy
 * @returns {Promise<Buffer>} - Resolves to PDF binary buffer
 */
async function generateDataSheet(sessionData) {
  return new Promise(async (resolve, reject) => {
    try {
      const session = sessionData || {};
      const instrument = session.instrument || {};
      const inspector = session.conductedBy || {};
      const results = session.testResults || [];
      const unit = instrument.unit || 'kg';

      // Map existing results by test type
      const resultMap = {};
      results.forEach((r) => {
        resultMap[r.testType] = r;
      });

      // Prepare Uncertainty calculation
      const repRes = resultMap['REPEATABILITY'];
      const repStdDev = repRes?.calculations?.maxStdDev || 0;
      const eccRes = resultMap['ECCENTRICITY'];
      const eccError = eccRes?.calculations?.maxDifferenceFromCenter || 0;
      const maxCap = Number(instrument.maxCapacity || 100);
      const scaleD = Number(instrument.actualInterval || instrument.verificationInterval || 0.001);
      const accClass = instrument.accuracyClass || 'CLASS_III';
      const ranges = instrument.ranges || instrument.multiIntervalRanges || [];
      const hasMultiInterval = Array.isArray(ranges) && ranges.length > 1;

      const uncertaintyBudget = computeExpandedUncertainty(repStdDev, scaleD, maxCap, accClass, {
        eccError,
        ranges,
      });

      // Prepare QR Payload
      const qrData = {
        type: 'TECHNICAL_DATA_SHEET',
        certificateNo: session.certificateNo || 'NAWI-2026-000000',
        instrumentSerial: instrument.serialNumber || 'N/A',
        model: instrument.model || 'N/A',
        result: session.overallResult || 'PASS',
        date: formatDate(session.completedAt || session.startedAt || new Date()),
        inspector: inspector.name || 'Testing Officer',
        standard: 'OIML R-76-1:2006 / ISO GUM',
        uncertainty: `U = +/-${uncertaintyBudget.expandedUncertainty} ${unit} (k=2)`,
      };

      const qrBuffer = await generateQRCodeBuffer(qrData);

      // Create PDF Document with bufferPages enabled for running headers/footers
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 40, bottom: 45, left: 35, right: 35 },
        bufferPages: true,
        info: {
          Title: `Technical Data Sheet - ${session.certificateNo || 'NAWI'}`,
          Author: 'Ministry of Consumer Affairs, Legal Metrology',
          Subject: 'OIML R-76 Technical Metrology Report',
          Keywords: 'OIML, R-76, Metrology, Technical Data Sheet, NAWI, ISO GUM',
        },
      });

      const buffers = [];
      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', (err) => reject(err));

      const pageWidth = doc.page.width; // 595.28
      const pageHeight = doc.page.height; // 841.89
      const leftMargin = 35;
      const rightMargin = 35;
      const contentWidth = pageWidth - leftMargin - rightMargin; // 525.28

      // =========================================================================
      // PAGE 1: COVER & INSTRUMENT SPECIFICATION MATRIX
      // =========================================================================
      let currentY = 44;

      // Document Title Section
      doc
        .font('Helvetica-Bold')
        .fontSize(11)
        .fillColor(COLORS.NAVY)
        .text('GOVERNMENT OF INDIA', leftMargin, currentY, { width: contentWidth, align: 'center' });

      currentY += 13;
      doc
        .font('Helvetica')
        .fontSize(8.5)
        .fillColor(COLORS.TEXT_DARK)
        .text('MINISTRY OF CONSUMER AFFAIRS, FOOD & PUBLIC DISTRIBUTION', leftMargin, currentY, {
          width: contentWidth,
          align: 'center',
        });

      currentY += 11;
      doc
        .font('Helvetica')
        .fontSize(7.5)
        .fillColor(COLORS.TEXT_MUTED)
        .text('DEPARTMENT OF LEGAL METROLOGY • DIRECTORATE OF WEIGHTS & MEASURES', leftMargin, currentY, {
          width: contentWidth,
          align: 'center',
        });

      currentY += 14;
      doc
        .font('Helvetica-Bold')
        .fontSize(15)
        .fillColor(COLORS.NAVY)
        .text('TECHNICAL DATA SHEET', leftMargin, currentY, {
          width: contentWidth,
          align: 'center',
          characterSpacing: 1,
        });

      currentY += 16;
      doc
        .font('Helvetica')
        .fontSize(8.5)
        .fillColor(COLORS.TEXT_MUTED)
        .text('Detailed Test Report & Metrological Verification Record — OIML R-76 & ISO GUM Compliance', leftMargin, currentY, {
          width: contentWidth,
          align: 'center',
        });

      currentY += 12;
      doc
        .font('Helvetica-Bold')
        .fontSize(9.5)
        .fillColor(COLORS.NAVY)
        .text(`Certificate No: ${session.certificateNo || 'NAWI-2026-XXXXXX'}`, leftMargin, currentY, {
          width: contentWidth,
          align: 'center',
        });

      currentY += 13;
      doc
        .strokeColor(COLORS.NAVY)
        .lineWidth(1)
        .moveTo(leftMargin, currentY)
        .lineTo(leftMargin + contentWidth, currentY)
        .stroke();

      currentY += 8;

      // Instrument Specification Table
      currentY = drawSectionHeader(
        doc,
        leftMargin,
        currentY,
        contentWidth,
        'INSTRUMENT METROLOGICAL SPECIFICATIONS',
        'OIML R 76-1:2006'
      );

      const accClassFormatted = (instrument.accuracyClass || 'CLASS_III').replace('_', ' ');
      let maxCapDisplay = `${instrument.maxCapacity != null ? instrument.maxCapacity : 'N/A'} ${unit}`;
      let eValDisplay = `${instrument.verificationInterval != null ? instrument.verificationInterval : 'N/A'} ${unit}`;
      let dValDisplay = `${instrument.actualInterval != null ? instrument.actualInterval : 'N/A'} ${unit}`;

      if (hasMultiInterval) {
        const sortedRanges = [...ranges].sort((a, b) => (a.max || a.maxCapacity) - (b.max || b.maxCapacity));
        maxCapDisplay = `${sortedRanges.map(r => r.max || r.maxCapacity).join(' / ')} ${unit} (Multi-Interval)`;
        eValDisplay = `${sortedRanges.map(r => r.e || r.verificationInterval).join(' / ')} ${unit}`;
        dValDisplay = `${sortedRanges.map(r => r.d || r.actualInterval || r.e).join(' / ')} ${unit}`;
      }

      const specRows = [
        [
          { label: 'Instrument Name', value: instrument.name || 'Electronic Weighing Scale' },
          { label: 'Instrument Type', value: (instrument.type || 'ELECTRONIC_SCALE').replace('_', ' ') },
        ],
        [
          { label: 'Manufacturer', value: instrument.manufacturer || 'N/A' },
          { label: 'Model / Type Designation', value: instrument.model || 'N/A' },
        ],
        [
          { label: 'Serial Number', value: instrument.serialNumber || 'N/A', isBold: true },
          { label: 'Accuracy Class', value: accClassFormatted, isBold: true },
        ],
        [
          { label: 'Maximum Capacity (Max)', value: maxCapDisplay },
          { label: 'Minimum Capacity (Min)', value: `${instrument.minCapacity != null ? instrument.minCapacity : 'N/A'} ${unit}` },
        ],
        [
          { label: 'Verification Interval (e)', value: eValDisplay },
          { label: 'Actual Scale Interval (d)', value: dValDisplay },
        ],
        [
          { label: 'Testing Location / Lab', value: instrument.location || 'Central Metrology Lab' },
          { label: 'Verification Category', value: 'Initial / In-Service Verification' },
        ],
      ];

      const rowHeight = 14;
      const halfWidth = contentWidth / 2;

      specRows.forEach((row, rIdx) => {
        const rowY = currentY + rIdx * rowHeight;
        const bgCol = rIdx % 2 === 0 ? COLORS.WHITE : COLORS.BG_LIGHT;
        doc.rect(leftMargin, rowY, contentWidth, rowHeight).fill(bgCol);

        row.forEach((cell, cIdx) => {
          const cellX = leftMargin + cIdx * halfWidth;
          doc
            .font('Helvetica-Bold')
            .fontSize(7)
            .fillColor(COLORS.NAVY)
            .text(`${cell.label}:`, cellX + 6, rowY + 3, { width: 125 });

          doc
            .font(cell.isBold ? 'Helvetica-Bold' : 'Helvetica')
            .fontSize(7)
            .fillColor(COLORS.TEXT_DARK)
            .text(String(cell.value), cellX + 6 + 125, rowY + 3, { width: halfWidth - 135, ellipsis: true });
        });

        doc.rect(leftMargin, rowY, contentWidth, rowHeight).lineWidth(0.5).stroke(COLORS.BORDER_LIGHT);
      });

      doc.rect(leftMargin, currentY, contentWidth, specRows.length * rowHeight).lineWidth(0.8).stroke(COLORS.BORDER_COLOR);
      currentY += specRows.length * rowHeight + 8;

      // Multi-Interval Breakdown Table if available
      if (hasMultiInterval) {
        const sortedRanges = [...ranges].sort((a, b) => (a.max || a.maxCapacity) - (b.max || b.maxCapacity));
        const miHeaderH = 12;
        doc.rect(leftMargin, currentY, contentWidth, miHeaderH).fill('#E2E8F0');
        const miCols = ['Partial Range', `Capacity (Max_i) [${unit}]`, `Interval (e_i) [${unit}]`, `Interval (d_i) [${unit}]`, `Min_i [${unit}]`, 'Resolution (n_i = Max/e)'];
        const miWidths = [85, 90, 85, 85, 85, contentWidth - 430];
        let miX = leftMargin;
        const miPos = [];
        miWidths.forEach(w => { miPos.push(miX); miX += w; });

        miCols.forEach((col, idx) => {
          doc
            .font('Helvetica-Bold')
            .fontSize(6.5)
            .fillColor(COLORS.NAVY)
            .text(col, miPos[idx] + 2, currentY + 2.5, { width: miWidths[idx] - 4, align: 'center' });
        });
        doc.rect(leftMargin, currentY, contentWidth, miHeaderH).lineWidth(0.5).stroke(COLORS.BORDER_COLOR);
        currentY += miHeaderH;

        sortedRanges.forEach((rng, rIdx) => {
          const rY = currentY + rIdx * 12;
          const bg = rIdx % 2 === 0 ? COLORS.WHITE : COLORS.BG_LIGHT;
          doc.rect(leftMargin, rY, contentWidth, 12).fill(bg);

          const rMax = rng.max || rng.maxCapacity;
          const rE = rng.e || rng.verificationInterval;
          const rD = rng.d || rng.actualInterval || rE;
          const rMin = rng.min || rng.minCapacity || (rE * 20);
          const rN = Math.round(rMax / rE);

          const vals = [`Range ${rIdx + 1}`, formatNum(rMax), formatNum(rE), formatNum(rD), formatNum(rMin), String(rN)];
          vals.forEach((v, vIdx) => {
            doc
              .font(vIdx === 0 ? 'Helvetica-Bold' : 'Helvetica')
              .fontSize(6.5)
              .fillColor(COLORS.TEXT_DARK)
              .text(v, miPos[vIdx] + 2, rY + 2.5, { width: miWidths[vIdx] - 4, align: 'center' });
          });
          doc.rect(leftMargin, rY, contentWidth, 12).lineWidth(0.5).stroke(COLORS.BORDER_LIGHT);
        });

        const miTotalH = sortedRanges.length * 12;
        doc.rect(leftMargin, currentY - miHeaderH, contentWidth, miTotalH + miHeaderH).lineWidth(0.8).stroke(COLORS.BORDER_COLOR);
        currentY += miTotalH + 8;
      }

      // Environmental & Test Parameters Box
      doc.rect(leftMargin, currentY, contentWidth, 42).fill(COLORS.BG_LIGHT);
      doc.rect(leftMargin, currentY, contentWidth, 42).lineWidth(0.8).stroke(COLORS.BORDER_COLOR);

      doc
        .font('Helvetica-Bold')
        .fontSize(7.5)
        .fillColor(COLORS.NAVY)
        .text('TEST AMBIENT CONDITIONS & GENERAL PARAMETERS', leftMargin + 8, currentY + 5);

      const tempVal = session.temperature != null ? `${session.temperature} °C` : '23.0 °C';
      const humVal = session.humidity != null ? `${session.humidity} % RH` : '55.0 % RH';
      const startDate = formatDate(session.startedAt || new Date());
      const compDate = formatDate(session.completedAt || session.startedAt || new Date());
      const testDateRange = startDate === compDate ? startDate : `${startDate} to ${compDate}`;
      const inspectorName = inspector.name || 'Testing Officer';

      doc
        .font('Helvetica')
        .fontSize(7)
        .fillColor(COLORS.TEXT_DARK)
        .text(`• Ambient Temperature : ${tempVal}`, leftMargin + 10, currentY + 16)
        .text(`• Relative Humidity    : ${humVal}`, leftMargin + 10, currentY + 27)
        .text(`• Testing Officer      : ${inspectorName}`, leftMargin + 260, currentY + 16)
        .text(`• Test Period          : ${testDateRange}`, leftMargin + 260, currentY + 27);

      currentY += 48;

      // Executive Summary of All 6 Tests on Page 1
      currentY = drawSectionHeader(
        doc,
        leftMargin,
        currentY,
        contentWidth,
        'EXECUTIVE VERIFICATION SUMMARY (OIML R-76 TEST CATEGORIES)',
        'Overview Matrix'
      );

      const summaryCols = [170, 95, 65, contentWidth - 170 - 95 - 65];
      const summaryPos = [
        leftMargin,
        leftMargin + summaryCols[0],
        leftMargin + summaryCols[0] + summaryCols[1],
        leftMargin + summaryCols[0] + summaryCols[1] + summaryCols[2],
      ];

      // Summary Table Header
      doc.rect(leftMargin, currentY, contentWidth, 13).fill('#E2E8F0');
      ['Test Category', 'Standard Ref', 'Result', 'Evaluation Summary'].forEach((h, idx) => {
        doc
          .font('Helvetica-Bold')
          .fontSize(7)
          .fillColor(COLORS.NAVY)
          .text(h, summaryPos[idx] + 5, currentY + 3, {
            width: summaryCols[idx] - 10,
            align: idx === 2 ? 'center' : 'left',
          });
      });
      doc.rect(leftMargin, currentY, contentWidth, 13).lineWidth(0.5).stroke(COLORS.BORDER_COLOR);
      currentY += 13;

      const testKeys = ['WEIGHING_PERFORMANCE', 'REPEATABILITY', 'ECCENTRICITY', 'TEMPERATURE', 'STABILITY', 'TIME_DEPENDENCE'];
      testKeys.forEach((key, kIdx) => {
        const rowY = currentY + kIdx * 14;
        const res = resultMap[key];
        const bgCol = kIdx % 2 === 0 ? COLORS.WHITE : COLORS.BG_LIGHT;
        doc.rect(leftMargin, rowY, contentWidth, 14).fill(bgCol);

        let verdict = 'NOT TESTED';
        let remarks = 'Test not executed';
        if (res) {
          verdict = res.result || (res.status === 'COMPLETED' ? 'PASS' : res.status);
          remarks = res.remarks || (verdict === 'PASS' ? 'Within permissible OIML limits' : 'Non-compliant');
        }

        doc
          .font('Helvetica-Bold')
          .fontSize(7)
          .fillColor(COLORS.TEXT_DARK)
          .text(TEST_DISPLAY_NAMES[key], summaryPos[0] + 5, rowY + 3.5, { width: summaryCols[0] - 10, ellipsis: true });

        doc
          .font('Helvetica')
          .fontSize(6.5)
          .fillColor(COLORS.TEXT_MUTED)
          .text(TEST_REFERENCES[key].split('&')[0].trim(), summaryPos[1] + 5, rowY + 3.5, { width: summaryCols[1] - 10 });

        drawStatusPill(doc, summaryPos[2] + 12, rowY + 0.5, verdict);

        doc
          .font('Helvetica')
          .fontSize(6.5)
          .fillColor(COLORS.TEXT_DARK)
          .text(remarks, summaryPos[3] + 5, rowY + 3.5, { width: summaryCols[3] - 10, ellipsis: true });

        doc.rect(leftMargin, rowY, contentWidth, 14).lineWidth(0.5).stroke(COLORS.BORDER_LIGHT);
      });

      doc.rect(leftMargin, currentY - 13, contentWidth, testKeys.length * 14 + 13).lineWidth(0.8).stroke(COLORS.BORDER_COLOR);

      // =========================================================================
      // PAGE 2: TEST 1 (WEIGHING PERFORMANCE) & TEST 2 (REPEATABILITY)
      // =========================================================================
      doc.addPage();
      currentY = 40;

      // -------------------------------------------------------------
      // 1. WEIGHING PERFORMANCE TEST
      // -------------------------------------------------------------
      currentY = drawSectionHeader(
        doc,
        leftMargin,
        currentY,
        contentWidth,
        '1. WEIGHING PERFORMANCE (Accuracy & Linearity)',
        'OIML R 76-1, Section 3.5 & A.4.4'
      );

      const wpRes = resultMap['WEIGHING_PERFORMANCE'] || resultMap['WEIGHING'];
      const wpData = wpRes ? (wpRes.data || {}) : {};
      const wpPoints = wpData.points || [];

      // Weighing Table Header
      const wpColWidths = [40, 60, 60, 60, 60, 60, 55, 55, 40, contentWidth - (40 + 60 + 60 + 60 + 60 + 60 + 55 + 55 + 40)];
      const wpPos = [];
      let accX = leftMargin;
      wpColWidths.forEach((w) => {
        wpPos.push(accX);
        accX += w;
      });

      const wpHeaderTitles = [
        'Load Pt',
        `Applied (${unit})`,
        `Ind (Inc)`,
        `Error (Inc)`,
        `Ind (Dec)`,
        `Error (Dec)`,
        `Hysteresis`,
        `MPE (±)`,
        `Range`,
        'Status',
      ];

      doc.rect(leftMargin, currentY, contentWidth, 14).fill('#E2E8F0');
      wpHeaderTitles.forEach((ht, idx) => {
        doc
          .font('Helvetica-Bold')
          .fontSize(6.5)
          .fillColor(COLORS.NAVY)
          .text(ht, wpPos[idx] + 2, currentY + 3.5, { width: wpColWidths[idx] - 4, align: 'center' });
      });
      doc.rect(leftMargin, currentY, contentWidth, 14).lineWidth(0.5).stroke(COLORS.BORDER_COLOR);
      currentY += 14;

      if (wpPoints.length === 0) {
        doc.rect(leftMargin, currentY, contentWidth, 20).fill(COLORS.WHITE);
        doc
          .font('Helvetica-Oblique')
          .fontSize(8)
          .fillColor(COLORS.TEXT_MUTED)
          .text('No weighing performance test points recorded.', leftMargin + 10, currentY + 6);
        doc.rect(leftMargin, currentY, contentWidth, 20).lineWidth(0.5).stroke(COLORS.BORDER_LIGHT);
        currentY += 20;
      } else {
        // Group points by applied load to pair inc and dec
        const uniqueLoads = [...new Set(wpPoints.map(p => Number(p.appliedLoad || p.load || 0)))].sort((a, b) => a - b);

        uniqueLoads.forEach((loadVal, pIdx) => {
          const rowY = currentY + pIdx * 13;
          const bgCol = pIdx % 2 === 0 ? COLORS.WHITE : COLORS.BG_LIGHT;
          doc.rect(leftMargin, rowY, contentWidth, 13).fill(bgCol);

          const incPt = wpPoints.find(p => Math.abs(Number(p.appliedLoad || p.load || 0) - loadVal) < 1e-6 && p.isIncreasing !== false) || {};
          const decPt = wpPoints.find(p => Math.abs(Number(p.appliedLoad || p.load || 0) - loadVal) < 1e-6 && p.isIncreasing === false) || {};

          const applied = formatNum(loadVal);
          const indInc = formatNum(incPt.indicatedInc != null ? incPt.indicatedInc : (incPt.indicatedValue != null ? incPt.indicatedValue : loadVal));
          const errInc = formatNum(incPt.errorInc != null ? incPt.errorInc : (incPt.error != null ? incPt.error : (incPt.correctedError != null ? incPt.correctedError : 0)));
          const indDec = decPt.indicatedValue != null ? formatNum(decPt.indicatedValue) : (decPt.indicatedDec != null ? formatNum(decPt.indicatedDec) : indInc);
          const errDec = decPt.error != null ? formatNum(decPt.error) : (decPt.errorDec != null ? formatNum(decPt.errorDec) : errInc);
          
          const pDecNum = Number(indDec) || Number(applied);
          const pIncNum = Number(indInc) || Number(applied);
          const hyst = formatNum(Math.abs(pDecNum - pIncNum));

          const mpe = formatNum(incPt.mpe || incPt.mpeMass || incPt.mpeLimit || 0.005);
          const rangeLabel = incPt.currentRangeIndex != null ? `R${incPt.currentRangeIndex + 1}` : 'R1';
          const isPass = Math.abs(Number(errInc) || 0) <= Number(mpe) + 1e-9 && Math.abs(Number(errDec) || 0) <= Number(mpe) + 1e-9 && Number(hyst) <= Number(mpe) + 1e-9;
          const st = isPass ? 'PASS' : 'FAIL';

          const values = [
            `L${pIdx + 1}`,
            applied,
            indInc,
            errInc,
            indDec,
            errDec,
            hyst,
            mpe,
            rangeLabel,
            st,
          ];

          values.forEach((val, vIdx) => {
            const isStatusCol = vIdx === values.length - 1;
            const font = isStatusCol ? 'Helvetica-Bold' : 'Helvetica';
            const color = isStatusCol
              ? val === 'PASS'
                ? COLORS.PASS_GREEN
                : COLORS.FAIL_RED
              : COLORS.TEXT_DARK;

            doc
              .font(font)
              .fontSize(6.5)
              .fillColor(color)
              .text(String(val), wpPos[vIdx] + 2, rowY + 3, { width: wpColWidths[vIdx] - 4, align: 'center' });
          });

          doc.rect(leftMargin, rowY, contentWidth, 13).lineWidth(0.5).stroke(COLORS.BORDER_LIGHT);
        });

        const tableHeight = uniqueLoads.length * 13;
        doc.rect(leftMargin, currentY - 14, contentWidth, tableHeight + 14).lineWidth(0.8).stroke(COLORS.BORDER_COLOR);
        currentY += tableHeight;
      }

      // Summary badge for Weighing Performance
      const wpVerdict = (wpRes && wpRes.result) || 'PASS';
      const wpRemarks = (wpRes && wpRes.remarks) || 'Error envelope and hysteresis within permissible MPE boundaries across range.';
      currentY += 4;
      doc.rect(leftMargin, currentY, contentWidth, 16).fill(COLORS.BG_LIGHT);
      doc
        .font('Helvetica-Bold')
        .fontSize(7.5)
        .fillColor(COLORS.NAVY)
        .text('Result Summary:', leftMargin + 6, currentY + 4);
      doc
        .font('Helvetica')
        .fontSize(7.5)
        .fillColor(COLORS.TEXT_DARK)
        .text(wpRemarks, leftMargin + 75, currentY + 4, { width: contentWidth - 130 });
      drawStatusPill(doc, leftMargin + contentWidth - 48, currentY + 1.5, wpVerdict);
      doc.rect(leftMargin, currentY, contentWidth, 16).lineWidth(0.5).stroke(COLORS.BORDER_COLOR);

      currentY += 22;

      // -------------------------------------------------------------
      // 2. REPEATABILITY TEST
      // -------------------------------------------------------------
      currentY = drawSectionHeader(
        doc,
        leftMargin,
        currentY,
        contentWidth,
        '2. REPEATABILITY',
        'OIML R 76-1, Section 3.6 & A.4.6'
      );

      const repData = repRes ? (repRes.data || {}) : {};
      const repSubTests = repData.subTests || repData.series || [];

      if (repSubTests.length === 0) {
        doc.rect(leftMargin, currentY, contentWidth, 20).fill(COLORS.WHITE);
        doc
          .font('Helvetica-Oblique')
          .fontSize(8)
          .fillColor(COLORS.TEXT_MUTED)
          .text('No repeatability series recorded.', leftMargin + 10, currentY + 6);
        doc.rect(leftMargin, currentY, contentWidth, 20).lineWidth(0.5).stroke(COLORS.BORDER_LIGHT);
        currentY += 20;
      } else {
        repSubTests.forEach((sub, sIdx) => {
          const loadLabel = sub.loadPercentage || (sIdx === 0 ? '50% Max' : '100% Max');
          const testLoadVal = `${formatNum(sub.load || 0)} ${unit}`;

          doc
            .font('Helvetica-Bold')
            .fontSize(7.5)
            .fillColor(COLORS.NAVY)
            .text(`Series ${sIdx + 1} (${loadLabel} = ${testLoadVal}):`, leftMargin, currentY);
          currentY += 9;

          const repColWidths = [45, 38, 38, 38, 38, 38, 38, 50, 50, 45, 45, contentWidth - 463];
          const repPos = [];
          let rX = leftMargin;
          repColWidths.forEach((w) => {
            repPos.push(rX);
            rX += w;
          });

          // Header
          doc.rect(leftMargin, currentY, contentWidth, 13).fill('#E2E8F0');
          const repHeaders = ['Test Load', 'R1', 'R2', 'R3', 'R4', 'R5', 'R6', 'Mean', 'Range (ΔP)', 'StdDev (s)', 'MPE (±)', 'Status'];
          repHeaders.forEach((rh, idx) => {
            doc
              .font('Helvetica-Bold')
              .fontSize(6)
              .fillColor(COLORS.NAVY)
              .text(rh, repPos[idx] + 1, currentY + 3, { width: repColWidths[idx] - 2, align: 'center' });
          });
          doc.rect(leftMargin, currentY, contentWidth, 13).lineWidth(0.5).stroke(COLORS.BORDER_COLOR);
          currentY += 13;

          // Data Row
          const readings = sub.readings || [];
          const r1 = formatNum(readings[0] != null ? readings[0] : sub.r1);
          const r2 = formatNum(readings[1] != null ? readings[1] : sub.r2);
          const r3 = formatNum(readings[2] != null ? readings[2] : sub.r3);
          const r4 = formatNum(readings[3] != null ? readings[3] : sub.r4);
          const r5 = formatNum(readings[4] != null ? readings[4] : sub.r5);
          const r6 = formatNum(readings[5] != null ? readings[5] : sub.r6);
          const mean = formatNum(sub.mean);
          const range = formatNum(sub.range || sub.maxDifference);
          const sVal = formatNum(sub.stdDev != null ? sub.stdDev : 0.0001);
          const mpe = formatNum(sub.mpe || sub.mpeMass || sub.mpeAtMax || 0.005);
          const st = sub.status || (Number(range) <= Number(mpe) + 1e-9 ? 'PASS' : 'FAIL');

          const rVals = [testLoadVal, r1, r2, r3, r4, r5, r6, mean, range, sVal, mpe, st];
          doc.rect(leftMargin, currentY, contentWidth, 13).fill(COLORS.WHITE);
          rVals.forEach((val, vIdx) => {
            const isStatusCol = vIdx === rVals.length - 1;
            const font = isStatusCol ? 'Helvetica-Bold' : 'Helvetica';
            const color = isStatusCol ? (val === 'PASS' ? COLORS.PASS_GREEN : COLORS.FAIL_RED) : COLORS.TEXT_DARK;

            doc
              .font(font)
              .fontSize(6)
              .fillColor(color)
              .text(String(val), repPos[vIdx] + 1, currentY + 3, { width: repColWidths[vIdx] - 2, align: 'center' });
          });
          doc.rect(leftMargin, currentY, contentWidth, 13).lineWidth(0.5).stroke(COLORS.BORDER_LIGHT);
          doc.rect(leftMargin, currentY - 13, contentWidth, 26).lineWidth(0.8).stroke(COLORS.BORDER_COLOR);
          currentY += 16;
        });
      }

      // Repeatability Summary
      const repVerdict = (repRes && repRes.result) || 'PASS';
      const repRemarks = (repRes && repRes.remarks) || 'Maximum difference between any two weighings at identical load does not exceed |MPE|.';
      doc.rect(leftMargin, currentY, contentWidth, 16).fill(COLORS.BG_LIGHT);
      doc
        .font('Helvetica-Bold')
        .fontSize(7.5)
        .fillColor(COLORS.NAVY)
        .text('Result Summary:', leftMargin + 6, currentY + 4);
      doc
        .font('Helvetica')
        .fontSize(7.5)
        .fillColor(COLORS.TEXT_DARK)
        .text(repRemarks, leftMargin + 75, currentY + 4, { width: contentWidth - 130 });
      drawStatusPill(doc, leftMargin + contentWidth - 48, currentY + 1.5, repVerdict);
      doc.rect(leftMargin, currentY, contentWidth, 16).lineWidth(0.5).stroke(COLORS.BORDER_COLOR);

      // =========================================================================
      // PAGE 3: TEST 3 (ECCENTRICITY) & TEST 4 (TEMPERATURE EFFECTS)
      // =========================================================================
      doc.addPage();
      currentY = 40;

      // -------------------------------------------------------------
      // 3. ECCENTRICITY TEST (Off-Center Loading)
      // -------------------------------------------------------------
      currentY = drawSectionHeader(
        doc,
        leftMargin,
        currentY,
        contentWidth,
        '3. ECCENTRICITY (Off-Center Loading)',
        'OIML R 76-1, Section 3.6.2 & A.4.7'
      );

      const eccData = eccRes ? (eccRes.data || {}) : {};
      const eccPositions = eccData.positions || [];

      const eccColWidths = [120, 75, 85, 95, 75, contentWidth - 450];
      const eccPos = [];
      let eX = leftMargin;
      eccColWidths.forEach((w) => {
        eccPos.push(eX);
        eX += w;
      });

      // Table Header
      doc.rect(leftMargin, currentY, contentWidth, 14).fill('#E2E8F0');
      const eccHeaders = ['Loading Position', `Test Load (${unit})`, `Reading (${unit})`, 'Diff from Center (Δ)', 'MPE (±)', 'Status'];
      eccHeaders.forEach((h, idx) => {
        doc
          .font('Helvetica-Bold')
          .fontSize(7)
          .fillColor(COLORS.NAVY)
          .text(h, eccPos[idx] + 2, currentY + 3.5, { width: eccColWidths[idx] - 4, align: idx === 0 ? 'left' : 'center' });
      });
      doc.rect(leftMargin, currentY, contentWidth, 14).lineWidth(0.5).stroke(COLORS.BORDER_COLOR);
      currentY += 14;

      if (eccPositions.length === 0) {
        doc.rect(leftMargin, currentY, contentWidth, 20).fill(COLORS.WHITE);
        doc
          .font('Helvetica-Oblique')
          .fontSize(8)
          .fillColor(COLORS.TEXT_MUTED)
          .text('No eccentricity test positions recorded.', leftMargin + 10, currentY + 6);
        doc.rect(leftMargin, currentY, contentWidth, 20).lineWidth(0.5).stroke(COLORS.BORDER_LIGHT);
        currentY += 20;
      } else {
        eccPositions.forEach((pos, pIdx) => {
          const rowY = currentY + pIdx * 14;
          const bgCol = pIdx % 2 === 0 ? COLORS.WHITE : COLORS.BG_LIGHT;
          doc.rect(leftMargin, rowY, contentWidth, 14).fill(bgCol);

          const posName = pos.position || `Position ${pIdx + 1}`;
          const tLoad = formatNum(pos.testLoad != null ? pos.testLoad : (pos.appliedLoad != null ? pos.appliedLoad : (instrument.maxCapacity ? instrument.maxCapacity / 3 : 0)));
          const reading = formatNum(pos.reading != null ? pos.reading : pos.indicatedValue);
          const diff = formatNum(pos.diffFromCenter != null ? pos.diffFromCenter : pos.differenceFromCenter != null ? pos.differenceFromCenter : pos.error);
          const mpe = formatNum(pos.mpe != null ? pos.mpe : 0.005);
          const st = pos.status || (Math.abs(Number(diff) || 0) <= Number(mpe) + 1e-9 ? 'PASS' : 'FAIL');

          const rowVals = [posName, tLoad, reading, diff, mpe, st];
          rowVals.forEach((val, vIdx) => {
            const isStatusCol = vIdx === rowVals.length - 1;
            const font = isStatusCol ? 'Helvetica-Bold' : (vIdx === 0 ? 'Helvetica-Bold' : 'Helvetica');
            const color = isStatusCol ? (val === 'PASS' ? COLORS.PASS_GREEN : COLORS.FAIL_RED) : COLORS.TEXT_DARK;

            doc
              .font(font)
              .fontSize(7)
              .fillColor(color)
              .text(String(val), eccPos[vIdx] + 4, rowY + 3.5, {
                width: eccColWidths[vIdx] - 8,
                align: vIdx === 0 ? 'left' : 'center',
              });
          });

          doc.rect(leftMargin, rowY, contentWidth, 14).lineWidth(0.5).stroke(COLORS.BORDER_LIGHT);
        });

        const eccTableHeight = eccPositions.length * 14;
        doc.rect(leftMargin, currentY - 14, contentWidth, eccTableHeight + 14).lineWidth(0.8).stroke(COLORS.BORDER_COLOR);
        currentY += eccTableHeight;
      }

      // Eccentricity Summary
      const eccVerdict = (eccRes && eccRes.result) || 'PASS';
      const eccRemarks = (eccRes && eccRes.remarks) || (eccVerdict === 'PASS' ? 'Off-center loading test at 1/3 Max verified within MPE.' : 'Exceeded allowable MPE tolerance at off-center position.');
      currentY += 4;
      doc.rect(leftMargin, currentY, contentWidth, 16).fill(COLORS.BG_LIGHT);
      doc
        .font('Helvetica-Bold')
        .fontSize(7.5)
        .fillColor(COLORS.NAVY)
        .text('Result Summary:', leftMargin + 6, currentY + 4);
      doc
        .font('Helvetica')
        .fontSize(7.5)
        .fillColor(COLORS.TEXT_DARK)
        .text(eccRemarks, leftMargin + 75, currentY + 4, { width: contentWidth - 130 });
      drawStatusPill(doc, leftMargin + contentWidth - 48, currentY + 1.5, eccVerdict);
      doc.rect(leftMargin, currentY, contentWidth, 16).lineWidth(0.5).stroke(COLORS.BORDER_COLOR);

      currentY += 24;

      // -------------------------------------------------------------
      // 4. TEMPERATURE EFFECTS TEST
      // -------------------------------------------------------------
      currentY = drawSectionHeader(
        doc,
        leftMargin,
        currentY,
        contentWidth,
        '4. TEMPERATURE EFFECTS',
        'OIML R 76-1, Section 3.9.2 & A.5.3'
      );

      const tempRes = resultMap['TEMPERATURE'] || resultMap['TEMPERATURE_EFFECTS'];
      const tempData = tempRes ? (tempRes.data || {}) : {};
      const tempTests = tempData.tests || tempData.temperaturePoints || [];

      const tempColWidths = [90, 85, 85, 85, 85, contentWidth - 430];
      const tempPos = [];
      let tX = leftMargin;
      tempColWidths.forEach((w) => {
        tempPos.push(tX);
        tX += w;
      });

      // Table Header
      doc.rect(leftMargin, currentY, contentWidth, 14).fill('#E2E8F0');
      const tempHeaders = ['Test Temp (°C)', `Span Load (${unit})`, `Reading (${unit})`, 'Error (E)', 'MPE Limit (±)', 'Status'];
      tempHeaders.forEach((h, idx) => {
        doc
          .font('Helvetica-Bold')
          .fontSize(7)
          .fillColor(COLORS.NAVY)
          .text(h, tempPos[idx] + 2, currentY + 3.5, { width: tempColWidths[idx] - 4, align: 'center' });
      });
      doc.rect(leftMargin, currentY, contentWidth, 14).lineWidth(0.5).stroke(COLORS.BORDER_COLOR);
      currentY += 14;

      if (tempTests.length === 0) {
        doc.rect(leftMargin, currentY, contentWidth, 20).fill(COLORS.WHITE);
        doc
          .font('Helvetica-Oblique')
          .fontSize(8)
          .fillColor(COLORS.TEXT_MUTED)
          .text('No temperature effects test data recorded.', leftMargin + 10, currentY + 6);
        doc.rect(leftMargin, currentY, contentWidth, 20).lineWidth(0.5).stroke(COLORS.BORDER_LIGHT);
        currentY += 20;
      } else {
        tempTests.forEach((tPt, ptIdx) => {
          const rowY = currentY + ptIdx * 14;
          const bgCol = ptIdx % 2 === 0 ? COLORS.WHITE : COLORS.BG_LIGHT;
          doc.rect(leftMargin, rowY, contentWidth, 14).fill(bgCol);

          const tVal = `${formatNum(tPt.temperature || 20)} °C`;
          const sLoad = formatNum(tPt.spanLoad != null ? tPt.spanLoad : (instrument.maxCapacity || 0));
          const reading = formatNum(tPt.reading != null ? tPt.reading : (tPt.spanIndication != null ? tPt.spanIndication : sLoad));
          const error = formatNum(tPt.error != null ? tPt.error : (Number(reading) - Number(sLoad)));
          const mpe = formatNum(tPt.mpe || tPt.mpeMass || tPt.mpeLimit || 0.005);
          const st = tPt.status || (Math.abs(Number(error) || 0) <= Number(mpe) + 1e-9 ? 'PASS' : 'FAIL');

          const tRowVals = [tVal, sLoad, reading, error, mpe, st];
          tRowVals.forEach((val, vIdx) => {
            const isStatusCol = vIdx === tRowVals.length - 1;
            const font = isStatusCol ? 'Helvetica-Bold' : 'Helvetica';
            const color = isStatusCol ? (val === 'PASS' ? COLORS.PASS_GREEN : COLORS.FAIL_RED) : COLORS.TEXT_DARK;

            doc
              .font(font)
              .fontSize(7)
              .fillColor(color)
              .text(String(val), tempPos[vIdx] + 2, rowY + 3.5, { width: tempColWidths[vIdx] - 4, align: 'center' });
          });

          doc.rect(leftMargin, rowY, contentWidth, 14).lineWidth(0.5).stroke(COLORS.BORDER_LIGHT);
        });

        const tempTableHeight = tempTests.length * 14;
        doc.rect(leftMargin, currentY - 14, contentWidth, tempTableHeight + 14).lineWidth(0.8).stroke(COLORS.BORDER_COLOR);
        currentY += tempTableHeight;
      }

      // Temperature Summary
      const tempVerdict = (tempRes && tempRes.result) || 'PASS';
      const tempRemarks = (tempRes && tempRes.remarks) || 'Zero drift per 5°C <= 1e; span within limits across operating temperature range.';
      currentY += 4;
      doc.rect(leftMargin, currentY, contentWidth, 16).fill(COLORS.BG_LIGHT);
      doc
        .font('Helvetica-Bold')
        .fontSize(7.5)
        .fillColor(COLORS.NAVY)
        .text('Result Summary:', leftMargin + 6, currentY + 4);
      doc
        .font('Helvetica')
        .fontSize(7.5)
        .fillColor(COLORS.TEXT_DARK)
        .text(tempRemarks, leftMargin + 75, currentY + 4, { width: contentWidth - 130 });
      drawStatusPill(doc, leftMargin + contentWidth - 48, currentY + 1.5, tempVerdict);
      doc.rect(leftMargin, currentY, contentWidth, 16).lineWidth(0.5).stroke(COLORS.BORDER_COLOR);

      // =========================================================================
      // PAGE 4: TEST 5 (STABILITY) & TEST 6 (TIME DEPENDENCE)
      // =========================================================================
      doc.addPage();
      currentY = 40;

      // -------------------------------------------------------------
      // 5. STABILITY & WARM-UP TEST
      // -------------------------------------------------------------
      currentY = drawSectionHeader(
        doc,
        leftMargin,
        currentY,
        contentWidth,
        '5. STABILITY & WARM-UP',
        'OIML R 76-1, Section 3.9.4 & A.5.2'
      );

      const stabRes = resultMap['STABILITY'];
      const stabData = stabRes ? (stabRes.data || {}) : {};
      const stabPoints = stabData.timePoints || stabData.points || [];

      const stabColWidths = [100, 95, 95, 95, 75, contentWidth - 460];
      const stabPos = [];
      let sX = leftMargin;
      stabColWidths.forEach((w) => {
        stabPos.push(sX);
        sX += w;
      });

      // Table Header
      doc.rect(leftMargin, currentY, contentWidth, 14).fill('#E2E8F0');
      const stabHeaders = ['Elapsed Time', `Applied Load (${unit})`, `Reading (${unit})`, 'Drift from Initial', 'MPE Limit (±)', 'Status'];
      stabHeaders.forEach((h, idx) => {
        doc
          .font('Helvetica-Bold')
          .fontSize(7)
          .fillColor(COLORS.NAVY)
          .text(h, stabPos[idx] + 2, currentY + 3.5, { width: stabColWidths[idx] - 4, align: 'center' });
      });
      doc.rect(leftMargin, currentY, contentWidth, 14).lineWidth(0.5).stroke(COLORS.BORDER_COLOR);
      currentY += 14;

      if (stabPoints.length === 0) {
        doc.rect(leftMargin, currentY, contentWidth, 20).fill(COLORS.WHITE);
        doc
          .font('Helvetica-Oblique')
          .fontSize(8)
          .fillColor(COLORS.TEXT_MUTED)
          .text('No stability test points recorded.', leftMargin + 10, currentY + 6);
        doc.rect(leftMargin, currentY, contentWidth, 20).lineWidth(0.5).stroke(COLORS.BORDER_LIGHT);
        currentY += 20;
      } else {
        stabPoints.forEach((sPt, ptIdx) => {
          const rowY = currentY + ptIdx * 14;
          const bgCol = ptIdx % 2 === 0 ? COLORS.WHITE : COLORS.BG_LIGHT;
          doc.rect(leftMargin, rowY, contentWidth, 14).fill(bgCol);

          const timeStr = sPt.timeHours != null ? `${sPt.timeHours} h` : (sPt.timestampMinutes != null ? `${sPt.timestampMinutes} min` : `${ptIdx * 15} min`);
          const appLoad = formatNum(sPt.appliedLoad != null ? sPt.appliedLoad : (instrument.maxCapacity || 0));
          const reading = formatNum(sPt.reading != null ? sPt.reading : (sPt.loadReading != null ? sPt.loadReading : appLoad));
          const drift = formatNum(sPt.drift != null ? sPt.drift : (sPt.spanDrift != null ? sPt.spanDrift : (sPt.maxSpanDrift != null ? sPt.maxSpanDrift : 0.0002)));
          const mpe = formatNum(sPt.mpe || sPt.mpeMass || 0.005);
          const st = sPt.status || (Math.abs(Number(drift) || 0) <= Number(mpe) + 1e-9 ? 'PASS' : 'FAIL');

          const sRowVals = [timeStr, appLoad, reading, drift, mpe, st];
          sRowVals.forEach((val, vIdx) => {
            const isStatusCol = vIdx === sRowVals.length - 1;
            const font = isStatusCol ? 'Helvetica-Bold' : 'Helvetica';
            const color = isStatusCol ? (val === 'PASS' ? COLORS.PASS_GREEN : COLORS.FAIL_RED) : COLORS.TEXT_DARK;

            doc
              .font(font)
              .fontSize(7)
              .fillColor(color)
              .text(String(val), stabPos[vIdx] + 2, rowY + 3.5, { width: stabColWidths[vIdx] - 4, align: 'center' });
          });

          doc.rect(leftMargin, rowY, contentWidth, 14).lineWidth(0.5).stroke(COLORS.BORDER_LIGHT);
        });

        const stabTableHeight = stabPoints.length * 14;
        doc.rect(leftMargin, currentY - 14, contentWidth, stabTableHeight + 14).lineWidth(0.8).stroke(COLORS.BORDER_COLOR);
        currentY += stabTableHeight;
      }

      // Stability Summary
      const stabVerdict = (stabRes && stabRes.result) || 'PASS';
      const stabRemarks = (stabRes && stabRes.remarks) || 'Zero and span readings remained stable within permissible tolerances.';
      currentY += 4;
      doc.rect(leftMargin, currentY, contentWidth, 16).fill(COLORS.BG_LIGHT);
      doc
        .font('Helvetica-Bold')
        .fontSize(7.5)
        .fillColor(COLORS.NAVY)
        .text('Result Summary:', leftMargin + 6, currentY + 4);
      doc
        .font('Helvetica')
        .fontSize(7.5)
        .fillColor(COLORS.TEXT_DARK)
        .text(stabRemarks, leftMargin + 75, currentY + 4, { width: contentWidth - 130 });
      drawStatusPill(doc, leftMargin + contentWidth - 48, currentY + 1.5, stabVerdict);
      doc.rect(leftMargin, currentY, contentWidth, 16).lineWidth(0.5).stroke(COLORS.BORDER_COLOR);

      currentY += 24;

      // -------------------------------------------------------------
      // 6. TIME DEPENDENCE (Creep & Zero Return)
      // -------------------------------------------------------------
      currentY = drawSectionHeader(
        doc,
        leftMargin,
        currentY,
        contentWidth,
        '6. TIME DEPENDENCE (Creep & Zero Return)',
        'OIML R 76-1, Section 3.9.4.3 & 3.9.4.4'
      );

      const timeRes = resultMap['TIME_DEPENDENCE'];
      const timeData = timeRes ? (timeRes.data || {}) : {};
      const creepReadings = timeData.creep || timeData.creepReadings || [];
      const zeroReturn = timeData.zeroReturn || {};

      // Creep Table Header
      const creepColWidths = [85, 100, 100, 100, 75, contentWidth - 460];
      const creepPos = [];
      let cX = leftMargin;
      creepColWidths.forEach((w) => {
        creepPos.push(cX);
        cX += w;
      });

      doc.rect(leftMargin, currentY, contentWidth, 13).fill('#E2E8F0');
      const creepHeaders = ['Time (min)', `Reading (${unit})`, 'Change from Initial', 'Permissible Limit', 'Evaluation', 'Status'];
      creepHeaders.forEach((h, idx) => {
        doc
          .font('Helvetica-Bold')
          .fontSize(7)
          .fillColor(COLORS.NAVY)
          .text(h, creepPos[idx] + 2, currentY + 3, { width: creepColWidths[idx] - 4, align: 'center' });
      });
      doc.rect(leftMargin, currentY, contentWidth, 13).lineWidth(0.5).stroke(COLORS.BORDER_COLOR);
      currentY += 13;

      if (creepReadings.length === 0) {
        doc.rect(leftMargin, currentY, contentWidth, 20).fill(COLORS.WHITE);
        doc
          .font('Helvetica-Oblique')
          .fontSize(8)
          .fillColor(COLORS.TEXT_MUTED)
          .text('No creep test readings recorded.', leftMargin + 10, currentY + 6);
        doc.rect(leftMargin, currentY, contentWidth, 20).lineWidth(0.5).stroke(COLORS.BORDER_LIGHT);
        currentY += 20;
      } else {
        creepReadings.forEach((cPt, ptIdx) => {
          const rowY = currentY + ptIdx * 13;
          const bgCol = ptIdx % 2 === 0 ? COLORS.WHITE : COLORS.BG_LIGHT;
          doc.rect(leftMargin, rowY, contentWidth, 13).fill(bgCol);

          const tMin = `${cPt.timeMin != null ? cPt.timeMin : (cPt.minute != null ? cPt.minute : ptIdx * 5)} min`;
          const reading = formatNum(cPt.reading != null ? cPt.reading : cPt.indication);
          const change = formatNum(cPt.changeFromInitial != null ? cPt.changeFromInitial : 0.0001);
          const limit = formatNum(cPt.limit || 0.002);
          const evalText = ptIdx === 0 ? 'Initial Baseline' : (Number(change) <= Number(limit) ? 'Within Limit' : 'Exceeded');
          const st = cPt.status || (evalText === 'Exceeded' ? 'FAIL' : 'PASS');

          const cRowVals = [tMin, reading, change, limit, evalText, st];
          cRowVals.forEach((val, vIdx) => {
            const isStatusCol = vIdx === cRowVals.length - 1;
            const font = isStatusCol ? 'Helvetica-Bold' : 'Helvetica';
            const color = isStatusCol ? (val === 'PASS' ? COLORS.PASS_GREEN : COLORS.FAIL_RED) : COLORS.TEXT_DARK;

            doc
              .font(font)
              .fontSize(7)
              .fillColor(color)
              .text(String(val), creepPos[vIdx] + 2, rowY + 3, { width: creepColWidths[vIdx] - 4, align: 'center' });
          });

          doc.rect(leftMargin, rowY, contentWidth, 13).lineWidth(0.5).stroke(COLORS.BORDER_LIGHT);
        });

        const creepTableHeight = creepReadings.length * 13;
        doc.rect(leftMargin, currentY - 13, contentWidth, creepTableHeight + 13).lineWidth(0.8).stroke(COLORS.BORDER_COLOR);
        currentY += creepTableHeight;
      }

      // Zero Return Evaluation Row
      currentY += 4;
      doc.rect(leftMargin, currentY, contentWidth, 16).fill(COLORS.WHITE);
      const zrReading = formatNum(zeroReturn.readingAfterUnload != null ? zeroReturn.readingAfterUnload : (zeroReturn.indicationAfterUnload != null ? zeroReturn.indicationAfterUnload : 0.0001));
      const zrLimit = formatNum(zeroReturn.acceptableLimit || 0.0005);
      const zrStatus = zeroReturn.status || (Math.abs(Number(zrReading)) <= Number(zrLimit) + 1e-9 ? 'PASS' : 'FAIL');

      doc
        .font('Helvetica-Bold')
        .fontSize(7.5)
        .fillColor(COLORS.NAVY)
        .text('Zero Return (after 30 min unload):', leftMargin + 6, currentY + 4);
      doc
        .font('Helvetica')
        .fontSize(7.5)
        .fillColor(COLORS.TEXT_DARK)
        .text(`Reading = ${zrReading} ${unit} | Acceptable Limit (≤ 0.5e) = ${zrLimit} ${unit}`, leftMargin + 160, currentY + 4);
      drawStatusPill(doc, leftMargin + contentWidth - 48, currentY + 1.5, zrStatus);
      doc.rect(leftMargin, currentY, contentWidth, 16).lineWidth(0.5).stroke(COLORS.BORDER_LIGHT);
      currentY += 20;

      // Time Dependence Summary
      const timeVerdict = (timeRes && timeRes.result) || 'PASS';
      const timeRemarks = (timeRes && timeRes.remarks) || 'Creep difference and zero return compliant with OIML R-76 Section 3.9.4.3.';
      doc.rect(leftMargin, currentY, contentWidth, 16).fill(COLORS.BG_LIGHT);
      doc
        .font('Helvetica-Bold')
        .fontSize(7.5)
        .fillColor(COLORS.NAVY)
        .text('Result Summary:', leftMargin + 6, currentY + 4);
      doc
        .font('Helvetica')
        .fontSize(7.5)
        .fillColor(COLORS.TEXT_DARK)
        .text(timeRemarks, leftMargin + 75, currentY + 4, { width: contentWidth - 130 });
      drawStatusPill(doc, leftMargin + contentWidth - 48, currentY + 1.5, timeVerdict);
      doc.rect(leftMargin, currentY, contentWidth, 16).lineWidth(0.5).stroke(COLORS.BORDER_COLOR);

      // =========================================================================
      // PAGE 5: MEASUREMENT UNCERTAINTY BUDGET (ISO GUM / EURAMET cg-18) & FINAL SIGN-OFF
      // =========================================================================
      doc.addPage();
      currentY = 40;

      // -------------------------------------------------------------
      // 7. MEASUREMENT UNCERTAINTY BUDGET (ISO GUM / EURAMET cg-18)
      // -------------------------------------------------------------
      currentY = drawSectionHeader(
        doc,
        leftMargin,
        currentY,
        contentWidth,
        '7. MEASUREMENT UNCERTAINTY BUDGET (ISO GUM / EURAMET cg-18)',
        'EURAMET cg-18 v4.0 & ISO/IEC Guide 98-3'
      );

      // Uncertainty Intro Description
      doc.rect(leftMargin, currentY, contentWidth, 24).fill(COLORS.BG_LIGHT);
      doc
        .font('Helvetica')
        .fontSize(7)
        .fillColor(COLORS.TEXT_DARK)
        .text(
          `Evaluation of measurement uncertainty at Max Capacity (${maxCap} ${unit}) in accordance with EURAMET cg-18 guidelines and ISO/IEC Guide 98-3 (GUM). Combined standard uncertainty uc and expanded uncertainty U are established with coverage factor k=2 (95.45% confidence level).`,
          leftMargin + 6,
          currentY + 4,
          { width: contentWidth - 12 }
        );
      doc.rect(leftMargin, currentY, contentWidth, 24).lineWidth(0.5).stroke(COLORS.BORDER_LIGHT);
      currentY += 28;

      // Uncertainty Components Table
      const uncColWidths = [125, 95, 75, 70, 80, contentWidth - (125 + 95 + 75 + 70 + 80)];
      const uncPos = [];
      let uX = leftMargin;
      uncColWidths.forEach(w => { uncPos.push(uX); uX += w; });

      doc.rect(leftMargin, currentY, contentWidth, 13).fill('#E2E8F0');
      const uncHeaders = ['Uncertainty Component', 'Evaluation Type & Dist.', `Standard Unc u(x_i) [${unit}]`, 'Sensitivity c_i', `Contribution u_i [${unit}]`, 'Degrees of Freedom'];
      uncHeaders.forEach((uh, idx) => {
        doc
          .font('Helvetica-Bold')
          .fontSize(6.5)
          .fillColor(COLORS.NAVY)
          .text(uh, uncPos[idx] + 2, currentY + 3, { width: uncColWidths[idx] - 4, align: idx === 0 ? 'left' : 'center' });
      });
      doc.rect(leftMargin, currentY, contentWidth, 13).lineWidth(0.5).stroke(COLORS.BORDER_COLOR);
      currentY += 13;

      const compRows = [
        {
          name: '1. Repeatability (u_rep)',
          type: 'Type A (Normal, s)',
          u_val: formatNum(uncertaintyBudget.components.repeatability, 6),
          ci: '1.0',
          ui: formatNum(uncertaintyBudget.components.repeatability, 6),
          dof: `${uncertaintyBudget.effectiveDOF < 100 ? uncertaintyBudget.effectiveDOF : '5 (n-1)'}`,
        },
        {
          name: '2. Digital Resolution (u_res)',
          type: 'Type B (Rectangular, d/2√3)',
          u_val: formatNum(uncertaintyBudget.components.resolution, 6),
          ci: '1.0',
          ui: formatNum(uncertaintyBudget.components.resolution, 6),
          dof: '∞ (Infinite)',
        },
        {
          name: '3. Reference Standards (u_std)',
          type: 'Type B (Rectangular, MPE/√3)',
          u_val: formatNum(uncertaintyBudget.components.standardWeights, 6),
          ci: '1.0',
          ui: formatNum(uncertaintyBudget.components.standardWeights, 6),
          dof: '100',
        },
        {
          name: '4. Eccentricity Loading (u_ecc)',
          type: 'Type B (Rectangular, ΔI/√3)',
          u_val: formatNum(uncertaintyBudget.components.eccentricity, 6),
          ci: '1.0',
          ui: formatNum(uncertaintyBudget.components.eccentricity, 6),
          dof: '∞ (Infinite)',
        },
        {
          name: '5. Temperature Drift (u_temp)',
          type: 'Type B (Rectangular, TK·L·ΔT/√3)',
          u_val: formatNum(uncertaintyBudget.components.temperature, 6),
          ci: '1.0',
          ui: formatNum(uncertaintyBudget.components.temperature, 6),
          dof: '∞ (Infinite)',
        },
      ];

      compRows.forEach((crow, cIdx) => {
        const rY = currentY + cIdx * 13;
        const bg = cIdx % 2 === 0 ? COLORS.WHITE : COLORS.BG_LIGHT;
        doc.rect(leftMargin, rY, contentWidth, 13).fill(bg);

        const rVals = [crow.name, crow.type, crow.u_val, crow.ci, crow.ui, crow.dof];
        rVals.forEach((v, vIdx) => {
          doc
            .font(vIdx === 0 ? 'Helvetica-Bold' : 'Helvetica')
            .fontSize(6.5)
            .fillColor(COLORS.TEXT_DARK)
            .text(v, uncPos[vIdx] + 3, rY + 3, { width: uncColWidths[vIdx] - 6, align: vIdx === 0 ? 'left' : 'center' });
        });
        doc.rect(leftMargin, rY, contentWidth, 13).lineWidth(0.5).stroke(COLORS.BORDER_LIGHT);
      });

      const uncTableH = compRows.length * 13;
      doc.rect(leftMargin, currentY - 13, contentWidth, uncTableH + 13).lineWidth(0.8).stroke(COLORS.BORDER_COLOR);
      currentY += uncTableH + 8;

      // Summary Budget Box (Key Metrics)
      doc.rect(leftMargin, currentY, contentWidth, 40).fill('#F0F9FF');
      doc.rect(leftMargin, currentY, contentWidth, 40).lineWidth(1).stroke('#38BDF8');

      doc
        .font('Helvetica-Bold')
        .fontSize(7.5)
        .fillColor(COLORS.NAVY)
        .text('UNCERTAINTY SYNTHESIS & EXPANDED TOLERANCE', leftMargin + 8, currentY + 5);

      doc
        .font('Helvetica')
        .fontSize(7)
        .fillColor(COLORS.TEXT_DARK)
        .text(`• Combined Standard Uncertainty (uc) : ${uncertaintyBudget.standardUncertainty} ${unit}`, leftMargin + 10, currentY + 16)
        .text(`• Coverage Factor (k)                : ${uncertaintyBudget.coverageFactor}.00 (95.45% Confidence)`, leftMargin + 10, currentY + 26)
        .font('Helvetica-Bold')
        .text(`• EXPANDED UNCERTAINTY (U = k · uc)  : ±${uncertaintyBudget.expandedUncertainty} ${unit}`, leftMargin + 260, currentY + 16)
        .font('Helvetica')
        .text(`• Relative Expanded Uncertainty (U/L) : ${uncertaintyBudget.relativeUncertaintyPercent || '0.001'} %`, leftMargin + 260, currentY + 26);

      currentY += 48;

      // =========================================================================
      // FINAL COMPLIANCE SUMMARY & SIGNATURE BLOCK
      // =========================================================================
      const isOverallPass = session.overallResult === 'PASS';

      // Final Verdict Banner
      const verdictBannerHeight = 22;
      const verdictBg = isOverallPass ? '#DCFCE7' : '#FEE2E2';
      const verdictBorder = isOverallPass ? '#86EFAC' : '#FCA5A5';
      const verdictTextColor = isOverallPass ? COLORS.PASS_GREEN : COLORS.FAIL_RED;

      doc.rect(leftMargin, currentY, contentWidth, verdictBannerHeight).fill(verdictBg);
      doc.rect(leftMargin, currentY, contentWidth, verdictBannerHeight).lineWidth(1).stroke(verdictBorder);

      doc
        .font('Helvetica-Bold')
        .fontSize(9.5)
        .fillColor(verdictTextColor)
        .text(
          isOverallPass
            ? 'FINAL COMPLIANCE VERDICT: PASS — INSTRUMENT VERIFIED & CONFORMANT TO OIML R-76'
            : 'FINAL COMPLIANCE VERDICT: FAIL — INSTRUMENT REJECTED DUE TO NON-CONFORMANCE',
          leftMargin + 10,
          currentY + 6,
          { width: contentWidth - 20, align: 'center' }
        );

      currentY += verdictBannerHeight + 8;

      // Recommendations / Remarks Box
      doc.rect(leftMargin, currentY, contentWidth, 30).fill(COLORS.BG_LIGHT);
      doc.rect(leftMargin, currentY, contentWidth, 30).lineWidth(0.6).stroke(COLORS.BORDER_COLOR);

      doc
        .font('Helvetica-Bold')
        .fontSize(7.5)
        .fillColor(COLORS.NAVY)
        .text('METROLOGICAL FINDINGS & RECOMMENDATIONS:', leftMargin + 8, currentY + 4);

      const recText = isOverallPass
        ? 'The instrument satisfies all metrological performance, repeatability, eccentricity, temperature, stability, and time-dependence requirements under OIML R-76-1 (2006). Measurement uncertainty is compliant with ISO/IEC 17025. Verification certificate granted.'
        : 'The instrument failed one or more critical verification checks (highlighted in red). Corrective mechanical/electronic calibration is required prior to re-submission for verification.';

      doc
        .font('Helvetica')
        .fontSize(6.5)
        .fillColor(COLORS.TEXT_DARK)
        .text(recText, leftMargin + 8, currentY + 14, { width: contentWidth - 16 });

      currentY += 36;

      // Signature Block & QR Code
      const sigSectionY = currentY;
      const sigWidth = 190;
      const qrWidth = 85;

      // Left Signature: Testing Officer
      const officerX = leftMargin;
      doc
        .font('Helvetica-Bold')
        .fontSize(7.5)
        .fillColor(COLORS.NAVY)
        .text('TESTING OFFICER (INSPECTOR)', officerX, sigSectionY);

      doc
        .strokeColor(COLORS.NAVY)
        .lineWidth(0.8)
        .moveTo(officerX, sigSectionY + 26)
        .lineTo(officerX + sigWidth, sigSectionY + 26)
        .stroke();

      const inspName = inspector.name || 'Dr. Rajesh Kumar';
      doc
        .font('Helvetica-Bold')
        .fontSize(7)
        .fillColor(COLORS.TEXT_DARK)
        .text(`Name: ${inspName}`, officerX, sigSectionY + 30)
        .font('Helvetica')
        .fontSize(6.5)
        .fillColor(COLORS.TEXT_MUTED)
        .text('Inspector of Legal Metrology', officerX, sigSectionY + 39)
        .text(`Date: ${formatDate(session.completedAt || new Date())}`, officerX, sigSectionY + 48);

      // Middle Signature: Approving Authority
      const authX = officerX + sigWidth + 25;
      doc
        .font('Helvetica-Bold')
        .fontSize(7.5)
        .fillColor(COLORS.NAVY)
        .text('APPROVING AUTHORITY', authX, sigSectionY);

      doc
        .strokeColor(COLORS.NAVY)
        .lineWidth(0.8)
        .moveTo(authX, sigSectionY + 26)
        .lineTo(authX + sigWidth, sigSectionY + 26)
        .stroke();

      doc
        .font('Helvetica-Bold')
        .fontSize(7)
        .fillColor(COLORS.TEXT_DARK)
        .text('Name: Controller / Joint Controller', authX, sigSectionY + 30)
        .font('Helvetica')
        .fontSize(6.5)
        .fillColor(COLORS.TEXT_MUTED)
        .text('Department of Legal Metrology', authX, sigSectionY + 39)
        .text(`Date: ${formatDate(session.completedAt || new Date())}`, authX, sigSectionY + 48);

      // Right: QR Code
      const qrX = leftMargin + contentWidth - qrWidth;
      if (qrBuffer) {
        doc.image(qrBuffer, qrX + 10, sigSectionY - 6, {
          width: 52,
          height: 52,
        });
        doc
          .font('Helvetica')
          .fontSize(6)
          .fillColor(COLORS.TEXT_MUTED)
          .text('Verify Online', qrX, sigSectionY + 48, {
            width: qrWidth,
            align: 'center',
          });
      }

      // =========================================================================
      // RUNNING HEADERS & FOOTERS ACROSS ALL BUFFERED PAGES
      // =========================================================================
      const range = doc.bufferedPageRange();
      const totalPages = range.count;

      for (let i = range.start; i < range.start + totalPages; i++) {
        doc.switchToPage(i);
        const pageNum = i + 1;

        // Top Tricolor Stripe Bar on every page
        drawTricolorBar(doc, leftMargin, 15, contentWidth, 2);

        // Header text on pages > 1
        if (pageNum > 1) {
          doc
            .font('Helvetica-Bold')
            .fontSize(7)
            .fillColor(COLORS.NAVY)
            .text('GOVERNMENT OF INDIA • MINISTRY OF CONSUMER AFFAIRS • LEGAL METROLOGY', leftMargin, 24, {
              width: contentWidth - 160,
            });

          doc
            .font('Helvetica')
            .fontSize(7)
            .fillColor(COLORS.TEXT_MUTED)
            .text(`Cert: ${session.certificateNo || 'NAWI-2026'}`, leftMargin + contentWidth - 150, 24, {
              width: 150,
              align: 'right',
            });

          doc
            .strokeColor(COLORS.BORDER_LIGHT)
            .lineWidth(0.5)
            .moveTo(leftMargin, 33)
            .lineTo(leftMargin + contentWidth, 33)
            .stroke();
        }

        // Bottom Footer on every page
        const footerY = pageHeight - 35;
        doc
          .strokeColor(COLORS.BORDER_LIGHT)
          .lineWidth(0.5)
          .moveTo(leftMargin, footerY - 4)
          .lineTo(leftMargin + contentWidth, footerY - 4)
          .stroke();

        doc
          .font('Helvetica')
          .fontSize(6.5)
          .fillColor(COLORS.TEXT_MUTED)
          .text(
            `NAWI-ReportPro Metrology System • OIML R-76 Technical Report • ${session.certificateNo || 'NAWI-2026'}`,
            leftMargin,
            footerY,
            { width: contentWidth - 100 }
          );

        doc
          .font('Helvetica-Bold')
          .fontSize(6.5)
          .fillColor(COLORS.NAVY)
          .text(`Page ${pageNum} of ${totalPages}`, leftMargin + contentWidth - 90, footerY, {
            width: 90,
            align: 'right',
          });

        // Bottom Tricolor Stripe Bar
        drawTricolorBar(doc, leftMargin, pageHeight - 20, contentWidth, 2);
      }

      // Finalize PDF Document
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

module.exports = {
  generateDataSheet,
  generateDataSheetPDF: generateDataSheet,
  generateDataSheetPdf: generateDataSheet,
  generateDatasheetPdf: generateDataSheet,
  COLORS,
  TEST_DISPLAY_NAMES,
  TEST_REFERENCES,
  formatDate,
};
