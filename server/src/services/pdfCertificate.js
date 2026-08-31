/**
 * PDF Certificate Generator
 * NAWI-ReportPro - OIML R-76 Non-Automatic Weighing Instruments
 *
 * Generates an official Indian Legal Metrology Test Certificate (Single-Page A4)
 * conforming to Ministry of Consumer Affairs, Food & Public Distribution standards.
 * Features Multi-Interval / Multi-Range specs and ISO GUM Expanded Uncertainty Budget.
 */

const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');
const { computeExpandedUncertainty } = require('./uncertaintyCalculator');

// Official Color Palette
const COLORS = {
  NAVY: '#1e3a5f',
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
  BG_HEADER: '#1e3a5f',
};

const TEST_DISPLAY_NAMES = {
  WEIGHING_PERFORMANCE: 'Weighing Performance (Accuracy & Linearity)',
  REPEATABILITY: 'Repeatability',
  ECCENTRICITY: 'Eccentricity (Off-Center Loading)',
  TEMPERATURE: 'Temperature Effects',
  STABILITY: 'Stability & Warm-up',
  TIME_DEPENDENCE: 'Time Dependence (Creep & Zero Return)',
};

const TEST_REFERENCES = {
  WEIGHING_PERFORMANCE: 'OIML R 76-1 Sec 3.5',
  REPEATABILITY: 'OIML R 76-1 Sec 3.6',
  ECCENTRICITY: 'OIML R 76-1 Sec 3.6.2',
  TEMPERATURE: 'OIML R 76-1 Sec 3.9.2',
  STABILITY: 'OIML R 76-1 Sec 3.9.4',
  TIME_DEPENDENCE: 'OIML R 76-1 Sec 3.9.4.3',
};

const TEST_ORDER = [
  'WEIGHING_PERFORMANCE',
  'REPEATABILITY',
  'ECCENTRICITY',
  'TEMPERATURE',
  'STABILITY',
  'TIME_DEPENDENCE',
];

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
 * Draw Tricolor Stripe Bar (Saffron, White, Green)
 */
function drawTricolorBar(doc, x, y, width, barHeight = 3) {
  // Saffron stripe
  doc.rect(x, y, width, barHeight).fill(COLORS.SAFFRON);
  // White stripe with light border
  doc.rect(x, y + barHeight, width, barHeight).fill(COLORS.WHITE);
  doc.rect(x, y + barHeight, width, barHeight).lineWidth(0.2).stroke(COLORS.BORDER_LIGHT);
  // Green stripe
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
      width: 90,
      margin: 1,
      color: {
        dark: '#1e3a5f',
        light: '#FFFFFF',
      },
    });
  } catch (err) {
    console.error('Error generating QR code buffer:', err);
    return null;
  }
}

/**
 * Generate PDF Test Certificate
 * @param {Object} sessionData - TestSession with instrument, testResults, and conductedBy
 * @returns {Promise<Buffer>} - Resolves to PDF binary buffer
 */
async function generateCertificate(sessionData) {
  return new Promise(async (resolve, reject) => {
    try {
      // Normalization of session data
      const session = sessionData || {};
      const instrument = session.instrument || {};
      const inspector = session.conductedBy || {};
      const results = session.testResults || [];

      // Map existing results by test type
      const resultMap = {};
      results.forEach((r) => {
        resultMap[r.testType] = r;
      });

      // Compute measurement uncertainty budget
      const repResult = resultMap['REPEATABILITY'];
      const repStdDev = repResult?.calculations?.maxStdDev || 0;
      const eccResult = resultMap['ECCENTRICITY'];
      const eccError = eccResult?.calculations?.maxDifferenceFromCenter || 0;
      const scaleD = Number(instrument.actualInterval || instrument.verificationInterval || 0.001);
      const maxCap = Number(instrument.maxCapacity || 100);
      const accClass = instrument.accuracyClass || 'CLASS_III';

      const uncertaintyBudget = computeExpandedUncertainty(repStdDev, scaleD, maxCap, accClass, {
        eccError,
        ranges: instrument.ranges || instrument.multiIntervalRanges,
      });

      // Prepare QR Payload
      const qrData = {
        certificateNo: session.certificateNo || 'NAWI-2026-000000',
        instrumentSerial: instrument.serialNumber || 'N/A',
        model: instrument.model || 'N/A',
        result: session.overallResult || 'PASS',
        date: formatDate(session.completedAt || session.startedAt || new Date()),
        inspector: inspector.name || 'Testing Officer',
        standard: 'OIML R-76-1:2006',
        uncertainty: `U = +/-${uncertaintyBudget.expandedUncertainty} ${instrument.unit || 'kg'} (k=2)`,
      };

      const qrBuffer = await generateQRCodeBuffer(qrData);

      // Create PDF Document (A4: 595.28 x 841.89 points)
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 25, bottom: 25, left: 35, right: 35 },
        info: {
          Title: `Test Certificate - ${session.certificateNo || 'NAWI'}`,
          Author: 'Ministry of Consumer Affairs, Legal Metrology',
          Subject: 'OIML R-76 Verification Certificate',
          Keywords: 'OIML, R-76, Legal Metrology, Test Certificate, NAWI',
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

      // 1. TOP TRICOLOR STRIPE BAR
      drawTricolorBar(doc, leftMargin, 18, contentWidth, 2.5);

      // 2. DOCUMENT HEADER
      let currentY = 28;

      // Government of India
      doc
        .font('Helvetica-Bold')
        .fontSize(11.5)
        .fillColor(COLORS.NAVY)
        .text('GOVERNMENT OF INDIA', leftMargin, currentY, {
          width: contentWidth,
          align: 'center',
          characterSpacing: 0.8,
        });

      currentY += 14;
      doc
        .font('Helvetica')
        .fontSize(9)
        .fillColor(COLORS.TEXT_DARK)
        .text('MINISTRY OF CONSUMER AFFAIRS, FOOD & PUBLIC DISTRIBUTION', leftMargin, currentY, {
          width: contentWidth,
          align: 'center',
        });

      currentY += 11;
      doc
        .font('Helvetica-Bold')
        .fontSize(7.5)
        .fillColor(COLORS.TEXT_MUTED)
        .text('DEPARTMENT OF LEGAL METROLOGY • CENTRAL VERIFICATION LABORATORY', leftMargin, currentY, {
          width: contentWidth,
          align: 'center',
        });

      // Title & Subtitle
      currentY += 13;
      doc
        .font('Helvetica-Bold')
        .fontSize(15)
        .fillColor(COLORS.NAVY)
        .text('TEST CERTIFICATE', leftMargin, currentY, {
          width: contentWidth,
          align: 'center',
          characterSpacing: 1.2,
        });

      currentY += 16;
      doc
        .font('Helvetica')
        .fontSize(8.5)
        .fillColor(COLORS.TEXT_MUTED)
        .text('Non-Automatic Weighing Instrument — OIML R-76 & ISO/IEC 17025 Compliance', leftMargin, currentY, {
          width: contentWidth,
          align: 'center',
        });

      // Certificate Number Banner
      currentY += 12;
      const certNoText = `Certificate No: ${session.certificateNo || 'NAWI-2026-XXXXXX'}`;
      doc
        .font('Helvetica-Bold')
        .fontSize(9.5)
        .fillColor(COLORS.NAVY)
        .text(certNoText, leftMargin, currentY, {
          width: contentWidth,
          align: 'center',
        });

      // Horizontal Divider
      currentY += 13;
      doc
        .strokeColor(COLORS.NAVY)
        .lineWidth(1)
        .moveTo(leftMargin, currentY)
        .lineTo(leftMargin + contentWidth, currentY)
        .stroke();

      currentY += 7;

      // 3. INSTRUMENT DETAILS TABLE (Bordered)
      const tableX = leftMargin;
      const tableWidth = contentWidth;

      // Table Header Banner
      const instHeaderHeight = 15;
      doc.rect(tableX, currentY, tableWidth, instHeaderHeight).fill(COLORS.BG_HEADER);
      doc
        .font('Helvetica-Bold')
        .fontSize(8)
        .fillColor(COLORS.WHITE)
        .text('INSTRUMENT IDENTIFICATION & METROLOGICAL SPECIFICATIONS', tableX + 8, currentY + 3.5, {
          width: tableWidth - 16,
          align: 'left',
        });

      currentY += instHeaderHeight;

      // Check multi-interval ranges
      const ranges = instrument.ranges || instrument.multiIntervalRanges || [];
      const hasMultiInterval = Array.isArray(ranges) && ranges.length > 1;

      const accuracyClassFormatted = (instrument.accuracyClass || 'CLASS_III').replace('_', ' ');
      const unit = instrument.unit || 'kg';

      let maxCapDisplay = `${instrument.maxCapacity != null ? instrument.maxCapacity : 'N/A'} ${unit}`;
      let eValDisplay = `${instrument.verificationInterval != null ? instrument.verificationInterval : 'N/A'} ${unit}`;
      let dValDisplay = `${instrument.actualInterval != null ? instrument.actualInterval : 'N/A'} ${unit}`;

      if (hasMultiInterval) {
        const sortedRanges = [...ranges].sort((a, b) => (a.max || a.maxCapacity) - (b.max || b.maxCapacity));
        maxCapDisplay = `${sortedRanges.map(r => r.max || r.maxCapacity).join(' / ')} ${unit} (Multi-Interval)`;
        eValDisplay = `${sortedRanges.map(r => r.e || r.verificationInterval).join(' / ')} ${unit}`;
        dValDisplay = `${sortedRanges.map(r => r.d || r.actualInterval || r.e).join(' / ')} ${unit}`;
      }

      const minCap = instrument.minCapacity != null ? `${instrument.minCapacity} ${unit}` : 'N/A';

      const instRows = [
        [
          { label: 'Instrument Name', value: instrument.name || 'Electronic Weighing Scale' },
          { label: 'Instrument Type', value: (instrument.type || 'ELECTRONIC_SCALE').replace('_', ' ') },
        ],
        [
          { label: 'Manufacturer', value: instrument.manufacturer || 'N/A' },
          { label: 'Model / Type', value: instrument.model || 'N/A' },
        ],
        [
          { label: 'Serial Number', value: instrument.serialNumber || 'N/A', isBold: true },
          { label: 'Accuracy Class', value: accuracyClassFormatted, isBold: true },
        ],
        [
          { label: 'Max Capacity (Max)', value: maxCapDisplay },
          { label: 'Min Capacity (Min)', value: minCap },
        ],
        [
          { label: 'Verification Interval (e)', value: eValDisplay },
          { label: 'Actual Interval (d)', value: dValDisplay },
        ],
        [
          { label: 'Testing Location', value: instrument.location || 'Central Verification Centre' },
          { label: 'Metrological Standard', value: 'OIML R-76-1:2006 / ISO GUM' },
        ],
      ];

      const rowHeight = 13.5;
      const halfWidth = tableWidth / 2;

      instRows.forEach((row, rIdx) => {
        const rowY = currentY + rIdx * rowHeight;
        const bgCol = rIdx % 2 === 0 ? COLORS.WHITE : COLORS.BG_LIGHT;
        doc.rect(tableX, rowY, tableWidth, rowHeight).fill(bgCol);

        // Draw cells
        row.forEach((cell, cIdx) => {
          const cellX = tableX + cIdx * halfWidth;
          const labelWidth = 115;
          const valueWidth = halfWidth - labelWidth - 8;

          // Label
          doc
            .font('Helvetica-Bold')
            .fontSize(7)
            .fillColor(COLORS.NAVY)
            .text(`${cell.label}:`, cellX + 6, rowY + 3, { width: labelWidth });

          // Value
          doc
            .font(cell.isBold ? 'Helvetica-Bold' : 'Helvetica')
            .fontSize(7)
            .fillColor(COLORS.TEXT_DARK)
            .text(String(cell.value), cellX + 6 + labelWidth, rowY + 3, {
              width: valueWidth,
              ellipsis: true,
            });
        });

        // Cell border
        doc.rect(tableX, rowY, tableWidth, rowHeight).lineWidth(0.5).stroke(COLORS.BORDER_LIGHT);
      });

      // Outer table border
      const instTableTotalHeight = instRows.length * rowHeight;
      doc
        .rect(tableX, currentY - instHeaderHeight, tableWidth, instTableTotalHeight + instHeaderHeight)
        .lineWidth(0.8)
        .stroke(COLORS.BORDER_COLOR);

      currentY += instTableTotalHeight + 8;

      // 4. TEST SUMMARY TABLE (6 Rows)
      const testHeaderHeight = 15;
      doc.rect(tableX, currentY, tableWidth, testHeaderHeight).fill(COLORS.BG_HEADER);
      doc
        .font('Helvetica-Bold')
        .fontSize(8)
        .fillColor(COLORS.WHITE)
        .text('METROLOGICAL VERIFICATION TEST RESULTS (OIML R-76)', tableX + 8, currentY + 3.5, {
          width: tableWidth - 16,
          align: 'left',
        });

      currentY += testHeaderHeight;

      // Column widths: Test Type (175), Reference (95), Status (70), Remarks (185.28)
      const colWidths = [175, 95, 70, tableWidth - 175 - 95 - 70];
      const colPositions = [
        tableX,
        tableX + colWidths[0],
        tableX + colWidths[0] + colWidths[1],
        tableX + colWidths[0] + colWidths[1] + colWidths[2],
      ];

      // Subheader row
      const subHeaderHeight = 12;
      doc.rect(tableX, currentY, tableWidth, subHeaderHeight).fill('#E2E8F0');
      const subCols = ['Test Type', 'Standard Reference', 'Status', 'Remarks / Evaluation'];
      subCols.forEach((colName, cIdx) => {
        const align = cIdx === 2 ? 'center' : 'left';
        const pX = colPositions[cIdx] + 5;
        doc
          .font('Helvetica-Bold')
          .fontSize(7)
          .fillColor(COLORS.NAVY)
          .text(colName, pX, currentY + 2.5, { width: colWidths[cIdx] - 10, align });
      });
      doc.rect(tableX, currentY, tableWidth, subHeaderHeight).lineWidth(0.5).stroke(COLORS.BORDER_COLOR);
      currentY += subHeaderHeight;

      // 6 Test Rows
      const testRowHeight = 14;
      TEST_ORDER.forEach((testType, tIdx) => {
        const rowY = currentY + tIdx * testRowHeight;
        const testRes = resultMap[testType];
        const bgCol = tIdx % 2 === 0 ? COLORS.WHITE : COLORS.BG_LIGHT;
        doc.rect(tableX, rowY, tableWidth, testRowHeight).fill(bgCol);

        let statusText = 'NOT TESTED';
        let statusColor = COLORS.PENDING_GRAY;
        let remarksText = 'Test pending execution';

        if (testRes) {
          if (testRes.result === 'PASS' || (testRes.status === 'COMPLETED' && testRes.result !== 'FAIL')) {
            statusText = 'PASS';
            statusColor = COLORS.PASS_GREEN;
            remarksText = testRes.remarks || 'Complies with OIML R-76 MPE limits';
          } else if (testRes.result === 'FAIL' || testRes.status === 'FAILED') {
            statusText = 'FAIL';
            statusColor = COLORS.FAIL_RED;
            remarksText = testRes.remarks || 'Non-conformance: Exceeds permissible MPE';
          } else if (testRes.status === 'IN_PROGRESS') {
            statusText = 'IN PROGRESS';
            statusColor = COLORS.SAFFRON;
            remarksText = testRes.remarks || 'Measurement in progress';
          }
        }

        // Test name
        doc
          .font('Helvetica-Bold')
          .fontSize(7)
          .fillColor(COLORS.TEXT_DARK)
          .text(`${tIdx + 1}. ${TEST_DISPLAY_NAMES[testType]}`, colPositions[0] + 5, rowY + 3.5, {
            width: colWidths[0] - 10,
            ellipsis: true,
          });

        // Reference
        doc
          .font('Helvetica')
          .fontSize(6.5)
          .fillColor(COLORS.TEXT_MUTED)
          .text(TEST_REFERENCES[testType], colPositions[1] + 5, rowY + 3.5, {
            width: colWidths[1] - 10,
          });

        // Status Badge
        doc
          .font('Helvetica-Bold')
          .fontSize(7.5)
          .fillColor(statusColor)
          .text(statusText, colPositions[2], rowY + 3, {
            width: colWidths[2],
            align: 'center',
          });

        // Remarks
        doc
          .font('Helvetica')
          .fontSize(6.5)
          .fillColor(COLORS.TEXT_DARK)
          .text(remarksText, colPositions[3] + 5, rowY + 3.5, {
            width: colWidths[3] - 10,
            ellipsis: true,
          });

        doc.rect(tableX, rowY, tableWidth, testRowHeight).lineWidth(0.5).stroke(COLORS.BORDER_LIGHT);
      });

      // Outer table border
      const testTableTotalHeight = TEST_ORDER.length * testRowHeight;
      doc
        .rect(tableX, currentY - subHeaderHeight - testHeaderHeight, tableWidth, testTableTotalHeight + subHeaderHeight + testHeaderHeight)
        .lineWidth(0.8)
        .stroke(COLORS.BORDER_COLOR);

      currentY += testTableTotalHeight + 8;

      // 5. TEST CONDITIONS, UNCERTAINTY & OVERALL RESULT BOXES
      const boxY = currentY;
      const boxHeight = 66;
      const leftBoxWidth = 330;
      const rightBoxWidth = tableWidth - leftBoxWidth - 10;
      const rightBoxX = tableX + leftBoxWidth + 10;

      // Left Box: Test Conditions & Measurement Uncertainty
      doc.rect(tableX, boxY, leftBoxWidth, boxHeight).fill(COLORS.BG_LIGHT);
      doc.rect(tableX, boxY, leftBoxWidth, boxHeight).lineWidth(0.8).stroke(COLORS.BORDER_COLOR);

      doc
        .font('Helvetica-Bold')
        .fontSize(7.5)
        .fillColor(COLORS.NAVY)
        .text('ENVIRONMENTAL CONDITIONS & MEASUREMENT UNCERTAINTY (ISO GUM / cg-18)', tableX + 6, boxY + 5);

      const tempStr = session.temperature != null ? `${session.temperature} °C` : '23.0 °C (Nominal)';
      const humStr = session.humidity != null ? `${session.humidity} % RH` : '55.0 % RH';
      const startDateStr = formatDate(session.startedAt || new Date());
      const compDateStr = formatDate(session.completedAt || session.startedAt || new Date());
      const dateRangeStr = startDateStr === compDateStr ? startDateStr : `${startDateStr} to ${compDateStr}`;

      doc
        .font('Helvetica')
        .fontSize(7)
        .fillColor(COLORS.TEXT_DARK)
        .text(`• Ambient Conditions : ${tempStr} | ${humStr}`, tableX + 6, boxY + 18)
        .text(`• Verification Period: ${dateRangeStr}`, tableX + 6, boxY + 29)
        .text(`• Standard Uncertainty (uc): ${uncertaintyBudget.standardUncertainty} ${unit}`, tableX + 6, boxY + 40)
        .font('Helvetica-Bold')
        .text(`• Expanded Uncertainty (U) : ±${uncertaintyBudget.expandedUncertainty} ${unit} (k=2, 95% conf.)`, tableX + 6, boxY + 51);

      // Right Box: Overall Verdict
      const isOverallPass = session.overallResult === 'PASS';
      const verdictColor = isOverallPass ? COLORS.PASS_GREEN : COLORS.FAIL_RED;
      const verdictBg = isOverallPass ? '#F0FDF4' : '#FEF2F2';
      const verdictBorder = isOverallPass ? '#86EFAC' : '#FCA5A5';

      doc.rect(rightBoxX, boxY, rightBoxWidth, boxHeight).fill(verdictBg);
      doc.rect(rightBoxX, boxY, rightBoxWidth, boxHeight).lineWidth(1.2).stroke(verdictBorder);

      doc
        .font('Helvetica-Bold')
        .fontSize(7.5)
        .fillColor(COLORS.TEXT_MUTED)
        .text('OVERALL VERDICT', rightBoxX, boxY + 6, {
          width: rightBoxWidth,
          align: 'center',
        });

      doc
        .font('Helvetica-Bold')
        .fontSize(18)
        .fillColor(verdictColor)
        .text(isOverallPass ? 'PASS' : 'FAIL', rightBoxX, boxY + 18, {
          width: rightBoxWidth,
          align: 'center',
          characterSpacing: 2,
        });

      doc
        .font('Helvetica-Bold')
        .fontSize(6.5)
        .fillColor(verdictColor)
        .text(isOverallPass ? 'VERIFIED & CONFORMANT' : 'REJECTED - NON-CONFORMANT', rightBoxX, boxY + 46, {
          width: rightBoxWidth,
          align: 'center',
        });

      currentY += boxHeight + 10;

      // 6. SIGNATURE BLOCK & QR CODE
      const sigSectionY = currentY;
      const sigWidth = 190;
      const qrWidth = 85;

      // Left Signature: Testing Officer
      const officerX = tableX;
      doc
        .font('Helvetica-Bold')
        .fontSize(7.5)
        .fillColor(COLORS.NAVY)
        .text('TESTING OFFICER (INSPECTOR)', officerX, sigSectionY);

      doc
        .strokeColor(COLORS.NAVY)
        .lineWidth(0.8)
        .moveTo(officerX, sigSectionY + 34)
        .lineTo(officerX + sigWidth, sigSectionY + 34)
        .stroke();

      const inspName = inspector.name || 'Dr. Rajesh Kumar';
      const inspDesig = 'Inspector of Legal Metrology';
      doc
        .font('Helvetica-Bold')
        .fontSize(7)
        .fillColor(COLORS.TEXT_DARK)
        .text(`Name: ${inspName}`, officerX, sigSectionY + 38)
        .font('Helvetica')
        .fontSize(6.5)
        .fillColor(COLORS.TEXT_MUTED)
        .text(`Designation: ${inspDesig}`, officerX, sigSectionY + 48)
        .text(`Date: ${formatDate(session.completedAt || new Date())}`, officerX, sigSectionY + 58);

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
        .moveTo(authX, sigSectionY + 34)
        .lineTo(authX + sigWidth, sigSectionY + 34)
        .stroke();

      doc
        .font('Helvetica-Bold')
        .fontSize(7)
        .fillColor(COLORS.TEXT_DARK)
        .text('Name: Controller / Joint Controller', authX, sigSectionY + 38)
        .font('Helvetica')
        .fontSize(6.5)
        .fillColor(COLORS.TEXT_MUTED)
        .text('Department of Legal Metrology', authX, sigSectionY + 48)
        .text(`Date: ${formatDate(session.completedAt || new Date())}`, authX, sigSectionY + 58);

      // Right: QR Code
      const qrX = tableX + tableWidth - qrWidth;
      if (qrBuffer) {
        doc.image(qrBuffer, qrX + 10, sigSectionY - 6, {
          width: 62,
          height: 62,
        });
        doc
          .font('Helvetica')
          .fontSize(6)
          .fillColor(COLORS.TEXT_MUTED)
          .text('Scan for Verification', qrX, sigSectionY + 58, {
            width: qrWidth,
            align: 'center',
          });
      }

      // 7. FOOTER & BOTTOM TRICOLOR BAR
      const footerY = pageHeight - 40;

      doc
        .strokeColor(COLORS.BORDER_LIGHT)
        .lineWidth(0.5)
        .moveTo(leftMargin, footerY - 4)
        .lineTo(leftMargin + contentWidth, footerY - 4)
        .stroke();

      const validityPeriod = isOverallPass ? '12 months from verification date' : 'Not Applicable (Failed Verification)';
      doc
        .font('Helvetica-Oblique')
        .fontSize(6)
        .fillColor(COLORS.TEXT_MUTED)
        .text(
          `This certificate is valid for ${validityPeriod}. Conforms to OIML R-76-1:2006 & Legal Metrology Act, 2009. Generated by NAWI-ReportPro.`,
          leftMargin,
          footerY,
          { width: contentWidth, align: 'center' }
        );

      drawTricolorBar(doc, leftMargin, pageHeight - 22, contentWidth, 2.5);

      // Finalize PDF Document
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

module.exports = {
  generateCertificate,
  generateCertificatePDF: generateCertificate,
  generateCertificatePdf: generateCertificate,
  COLORS,
  TEST_DISPLAY_NAMES,
  TEST_REFERENCES,
  formatDate,
};
