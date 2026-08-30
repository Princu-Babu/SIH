/**
 * PDF Certificate Generator
 * NAWI-ReportPro - OIML R-76 Non-Automatic Weighing Instruments
 *
 * Generates an official Indian Legal Metrology Test Certificate (Single-Page A4)
 * conforming to Ministry of Consumer Affairs, Food & Public Distribution standards.
 */

const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');

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

      // Prepare QR Payload
      const qrData = {
        certificateNo: session.certificateNo || 'NAWI-2026-000000',
        instrumentSerial: instrument.serialNumber || 'N/A',
        model: instrument.model || 'N/A',
        result: session.overallResult || 'PASS',
        date: formatDate(session.completedAt || session.startedAt || new Date()),
        inspector: inspector.name || 'Testing Officer',
        standard: 'OIML R-76-1:2006',
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
      drawTricolorBar(doc, leftMargin, 20, contentWidth, 2.5);

      // 2. DOCUMENT HEADER
      let currentY = 32;

      // Government of India
      doc
        .font('Helvetica-Bold')
        .fontSize(12)
        .fillColor(COLORS.NAVY)
        .text('GOVERNMENT OF INDIA', leftMargin, currentY, {
          width: contentWidth,
          align: 'center',
          characterSpacing: 0.8,
        });

      currentY += 15;
      doc
        .font('Helvetica')
        .fontSize(9.5)
        .fillColor(COLORS.TEXT_DARK)
        .text('MINISTRY OF CONSUMER AFFAIRS, FOOD & PUBLIC DISTRIBUTION', leftMargin, currentY, {
          width: contentWidth,
          align: 'center',
        });

      currentY += 12;
      doc
        .font('Helvetica-Bold')
        .fontSize(8)
        .fillColor(COLORS.TEXT_MUTED)
        .text('DEPARTMENT OF LEGAL METROLOGY • CENTRAL VERIFICATION LABORATORY', leftMargin, currentY, {
          width: contentWidth,
          align: 'center',
        });

      // Title & Subtitle
      currentY += 14;
      doc
        .font('Helvetica-Bold')
        .fontSize(16)
        .fillColor(COLORS.NAVY)
        .text('TEST CERTIFICATE', leftMargin, currentY, {
          width: contentWidth,
          align: 'center',
          characterSpacing: 1.2,
        });

      currentY += 18;
      doc
        .font('Helvetica')
        .fontSize(9)
        .fillColor(COLORS.TEXT_MUTED)
        .text('Non-Automatic Weighing Instrument — OIML R-76 Compliance', leftMargin, currentY, {
          width: contentWidth,
          align: 'center',
        });

      // Certificate Number Banner
      currentY += 14;
      const certNoText = `Certificate No: ${session.certificateNo || 'NAWI-2026-XXXXXX'}`;
      doc
        .font('Helvetica-Bold')
        .fontSize(10)
        .fillColor(COLORS.NAVY)
        .text(certNoText, leftMargin, currentY, {
          width: contentWidth,
          align: 'center',
        });

      // Horizontal Divider
      currentY += 15;
      doc
        .strokeColor(COLORS.NAVY)
        .lineWidth(1)
        .moveTo(leftMargin, currentY)
        .lineTo(leftMargin + contentWidth, currentY)
        .stroke();

      currentY += 8;

      // 3. INSTRUMENT DETAILS TABLE (Bordered)
      const tableX = leftMargin;
      const tableWidth = contentWidth;

      // Table Header Banner
      const instHeaderHeight = 16;
      doc.rect(tableX, currentY, tableWidth, instHeaderHeight).fill(COLORS.BG_HEADER);
      doc
        .font('Helvetica-Bold')
        .fontSize(8.5)
        .fillColor(COLORS.WHITE)
        .text('INSTRUMENT IDENTIFICATION & SPECIFICATIONS', tableX + 8, currentY + 4, {
          width: tableWidth - 16,
          align: 'left',
        });

      currentY += instHeaderHeight;

      // Instrument Details Grid
      const accuracyClassFormatted = (instrument.accuracyClass || 'CLASS_III').replace('_', ' ');
      const unit = instrument.unit || 'kg';
      const maxCap = instrument.maxCapacity != null ? `${instrument.maxCapacity} ${unit}` : 'N/A';
      const minCap = instrument.minCapacity != null ? `${instrument.minCapacity} ${unit}` : 'N/A';
      const eVal = instrument.verificationInterval != null ? `${instrument.verificationInterval} ${unit}` : 'N/A';
      const dVal = instrument.actualInterval != null ? `${instrument.actualInterval} ${unit}` : 'N/A';

      const instRows = [
        [
          { label: 'Instrument Name', value: instrument.name || 'Electronic Weighing Scale' },
          { label: 'Instrument Type', value: (instrument.type || 'ELECTRONIC_SCALE').replace('_', ' ') },
        ],
        [
          { label: 'Manufacturer', value: instrument.manufacturer || 'N/A' },
          { label: 'Model', value: instrument.model || 'N/A' },
        ],
        [
          { label: 'Serial Number', value: instrument.serialNumber || 'N/A', isBold: true },
          { label: 'Accuracy Class', value: accuracyClassFormatted, isBold: true },
        ],
        [
          { label: 'Max Capacity (Max)', value: maxCap },
          { label: 'Min Capacity (Min)', value: minCap },
        ],
        [
          { label: 'Verification Interval (e)', value: eVal },
          { label: 'Actual Scale Interval (d)', value: dVal },
        ],
        [
          { label: 'Testing Location', value: instrument.location || 'Central Verification Centre' },
          { label: 'Test Standard', value: 'OIML R-76-1 (Edition 2006)' },
        ],
      ];

      const rowHeight = 14;
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
            .fontSize(7.5)
            .fillColor(COLORS.NAVY)
            .text(`${cell.label}:`, cellX + 6, rowY + 3.5, { width: labelWidth });

          // Value
          doc
            .font(cell.isBold ? 'Helvetica-Bold' : 'Helvetica')
            .fontSize(7.5)
            .fillColor(COLORS.TEXT_DARK)
            .text(String(cell.value), cellX + 6 + labelWidth, rowY + 3.5, {
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

      currentY += instTableTotalHeight + 10;

      // 4. TEST SUMMARY TABLE (6 Rows)
      const testHeaderHeight = 16;
      doc.rect(tableX, currentY, tableWidth, testHeaderHeight).fill(COLORS.BG_HEADER);
      doc
        .font('Helvetica-Bold')
        .fontSize(8.5)
        .fillColor(COLORS.WHITE)
        .text('METROLOGICAL VERIFICATION TEST RESULTS (OIML R-76)', tableX + 8, currentY + 4, {
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
      const subHeaderHeight = 13;
      doc.rect(tableX, currentY, tableWidth, subHeaderHeight).fill('#E2E8F0');
      const subCols = ['Test Type', 'Standard Reference', 'Status', 'Remarks / Evaluation'];
      subCols.forEach((colName, cIdx) => {
        const align = cIdx === 2 ? 'center' : 'left';
        const pX = colPositions[cIdx] + 5;
        doc
          .font('Helvetica-Bold')
          .fontSize(7.5)
          .fillColor(COLORS.NAVY)
          .text(colName, pX, currentY + 3, { width: colWidths[cIdx] - 10, align });
      });
      doc.rect(tableX, currentY, tableWidth, subHeaderHeight).lineWidth(0.5).stroke(COLORS.BORDER_COLOR);
      currentY += subHeaderHeight;

      // 6 Test Rows
      const testRowHeight = 15;
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
          .fontSize(7.5)
          .fillColor(COLORS.TEXT_DARK)
          .text(`${tIdx + 1}. ${TEST_DISPLAY_NAMES[testType]}`, colPositions[0] + 5, rowY + 4, {
            width: colWidths[0] - 10,
            ellipsis: true,
          });

        // Reference
        doc
          .font('Helvetica')
          .fontSize(7)
          .fillColor(COLORS.TEXT_MUTED)
          .text(TEST_REFERENCES[testType], colPositions[1] + 5, rowY + 4, {
            width: colWidths[1] - 10,
          });

        // Status Badge
        doc
          .font('Helvetica-Bold')
          .fontSize(8)
          .fillColor(statusColor)
          .text(statusText, colPositions[2], rowY + 3.5, {
            width: colWidths[2],
            align: 'center',
          });

        // Remarks
        doc
          .font('Helvetica')
          .fontSize(7)
          .fillColor(COLORS.TEXT_DARK)
          .text(remarksText, colPositions[3] + 5, rowY + 4, {
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

      currentY += testTableTotalHeight + 10;

      // 5. TEST CONDITIONS & OVERALL RESULT BOXES
      const boxY = currentY;
      const boxHeight = 62;
      const leftBoxWidth = 270;
      const rightBoxWidth = tableWidth - leftBoxWidth - 10;
      const rightBoxX = tableX + leftBoxWidth + 10;

      // Left Box: Test Conditions
      doc.rect(tableX, boxY, leftBoxWidth, boxHeight).fill(COLORS.BG_LIGHT);
      doc.rect(tableX, boxY, leftBoxWidth, boxHeight).lineWidth(0.8).stroke(COLORS.BORDER_COLOR);

      doc
        .font('Helvetica-Bold')
        .fontSize(8)
        .fillColor(COLORS.NAVY)
        .text('ENVIRONMENTAL & TEST CONDITIONS', tableX + 8, boxY + 6);

      const tempStr = session.temperature != null ? `${session.temperature} °C` : '23.0 °C (Nominal)';
      const humStr = session.humidity != null ? `${session.humidity} % RH` : '55.0 % RH';
      const startDateStr = formatDate(session.startedAt || new Date());
      const compDateStr = formatDate(session.completedAt || session.startedAt || new Date());
      const dateRangeStr = startDateStr === compDateStr ? startDateStr : `${startDateStr} to ${compDateStr}`;

      doc
        .font('Helvetica')
        .fontSize(7.5)
        .fillColor(COLORS.TEXT_DARK)
        .text(`• Ambient Temperature : ${tempStr}`, tableX + 8, boxY + 20)
        .text(`• Relative Humidity    : ${humStr}`, tableX + 8, boxY + 32)
        .text(`• Verification Period : ${dateRangeStr}`, tableX + 8, boxY + 44);

      // Right Box: Overall Verdict
      const isOverallPass = session.overallResult === 'PASS';
      const verdictColor = isOverallPass ? COLORS.PASS_GREEN : COLORS.FAIL_RED;
      const verdictBg = isOverallPass ? '#F0FDF4' : '#FEF2F2';
      const verdictBorder = isOverallPass ? '#86EFAC' : '#FCA5A5';

      doc.rect(rightBoxX, boxY, rightBoxWidth, boxHeight).fill(verdictBg);
      doc.rect(rightBoxX, boxY, rightBoxWidth, boxHeight).lineWidth(1.2).stroke(verdictBorder);

      doc
        .font('Helvetica-Bold')
        .fontSize(8)
        .fillColor(COLORS.TEXT_MUTED)
        .text('OVERALL VERDICT', rightBoxX, boxY + 8, {
          width: rightBoxWidth,
          align: 'center',
        });

      doc
        .font('Helvetica-Bold')
        .fontSize(20)
        .fillColor(verdictColor)
        .text(isOverallPass ? 'PASS' : 'FAIL', rightBoxX, boxY + 20, {
          width: rightBoxWidth,
          align: 'center',
          characterSpacing: 2,
        });

      doc
        .font('Helvetica-Bold')
        .fontSize(7)
        .fillColor(verdictColor)
        .text(isOverallPass ? 'VERIFIED & CONFORMANT' : 'REJECTED - NON-CONFORMANT', rightBoxX, boxY + 46, {
          width: rightBoxWidth,
          align: 'center',
        });

      currentY += boxHeight + 12;

      // 6. SIGNATURE BLOCK & QR CODE
      const sigSectionY = currentY;
      const sigWidth = 190;
      const qrWidth = 85;

      // Left Signature: Testing Officer
      const officerX = tableX;
      doc
        .font('Helvetica-Bold')
        .fontSize(8)
        .fillColor(COLORS.NAVY)
        .text('TESTING OFFICER (INSPECTOR)', officerX, sigSectionY);

      doc
        .strokeColor(COLORS.NAVY)
        .lineWidth(0.8)
        .moveTo(officerX, sigSectionY + 36)
        .lineTo(officerX + sigWidth, sigSectionY + 36)
        .stroke();

      const inspName = inspector.name || 'Dr. Rajesh Kumar';
      const inspDesig = 'Inspector of Legal Metrology';
      doc
        .font('Helvetica-Bold')
        .fontSize(7.5)
        .fillColor(COLORS.TEXT_DARK)
        .text(`Name: ${inspName}`, officerX, sigSectionY + 41)
        .font('Helvetica')
        .fontSize(7)
        .fillColor(COLORS.TEXT_MUTED)
        .text(`Designation: ${inspDesig}`, officerX, sigSectionY + 51)
        .text(`Date: ${formatDate(session.completedAt || new Date())}`, officerX, sigSectionY + 61);

      // Middle Signature: Approving Authority
      const authX = officerX + sigWidth + 25;
      doc
        .font('Helvetica-Bold')
        .fontSize(8)
        .fillColor(COLORS.NAVY)
        .text('APPROVING AUTHORITY', authX, sigSectionY);

      doc
        .strokeColor(COLORS.NAVY)
        .lineWidth(0.8)
        .moveTo(authX, sigSectionY + 36)
        .lineTo(authX + sigWidth, sigSectionY + 36)
        .stroke();

      doc
        .font('Helvetica-Bold')
        .fontSize(7.5)
        .fillColor(COLORS.TEXT_DARK)
        .text('Name: Controller / Joint Controller', authX, sigSectionY + 41)
        .font('Helvetica')
        .fontSize(7)
        .fillColor(COLORS.TEXT_MUTED)
        .text('Department of Legal Metrology', authX, sigSectionY + 51)
        .text(`Date: ${formatDate(session.completedAt || new Date())}`, authX, sigSectionY + 61);

      // Right: QR Code
      const qrX = tableX + tableWidth - qrWidth;
      if (qrBuffer) {
        doc.image(qrBuffer, qrX + 10, sigSectionY - 4, {
          width: 65,
          height: 65,
        });
        doc
          .font('Helvetica')
          .fontSize(6)
          .fillColor(COLORS.TEXT_MUTED)
          .text('Scan for Verification', qrX, sigSectionY + 62, {
            width: qrWidth,
            align: 'center',
          });
      }

      // 7. FOOTER & BOTTOM TRICOLOR BAR
      const footerY = pageHeight - 45;

      doc
        .strokeColor(COLORS.BORDER_LIGHT)
        .lineWidth(0.5)
        .moveTo(leftMargin, footerY - 5)
        .lineTo(leftMargin + contentWidth, footerY - 5)
        .stroke();

      const validityPeriod = isOverallPass ? '12 months from the verification date' : 'Not Applicable (Failed Verification)';
      doc
        .font('Helvetica-Oblique')
        .fontSize(6.5)
        .fillColor(COLORS.TEXT_MUTED)
        .text(
          `This certificate is valid for ${validityPeriod}. Document generated by NAWI-ReportPro Metrological Verification System.`,
          leftMargin,
          footerY,
          { width: contentWidth, align: 'center' }
        );

      drawTricolorBar(doc, leftMargin, pageHeight - 25, contentWidth, 2.5);

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
