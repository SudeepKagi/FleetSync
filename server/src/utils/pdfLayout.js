/**
 * pdfLayout.js: Formats and draws the printable PDF layout for vehicle service and incident reports.
 * Called by: reports.controller.js to render data into a PDFKit document stream.
 */

/**
 * Builds the complete visual PDF layout for a vehicle report.
 * @param {PDFDocument} doc - PDFKit document instance
 * @param {Object} data - Contains vehicle, serviceRecords, issues, and predictedDate
 */
function buildVehiclePdf(doc, { vehicle, serviceRecords = [], issues = [], predictedDate = 'N/A' }) {
  // ─── Header & Branding ──────────────────────────────────────
  doc
    .fillColor('#0052FF')
    .fontSize(22)
    .font('Helvetica-Bold')
    .text('FleetSync', 40, 40)
    .fontSize(10)
    .font('Helvetica')
    .fillColor('#64748B')
    .text('Vehicle Service & Incident Compliance Report', 40, 68)
    .text(`Generated on: ${new Date().toLocaleString()}`, 380, 45, { align: 'right' });

  doc.moveTo(40, 85).lineTo(555, 85).strokeColor('#E2E8F0').lineWidth(1).stroke();

  // ─── Vehicle Overview Card ──────────────────────────────────
  doc.rect(40, 95, 515, 110).fillAndStroke('#F8FAFC', '#E2E8F0');

  doc
    .fillColor('#0F172A')
    .fontSize(14)
    .font('Helvetica-Bold')
    .text(`${vehicle.make} ${vehicle.model} (${vehicle.year || 'N/A'})`, 55, 108)
    .fontSize(10)
    .font('Helvetica-Bold')
    .fillColor('#0052FF')
    .text(`Registration: ${vehicle.registration_number}`, 55, 126);

  doc
    .font('Helvetica')
    .fillColor('#475569')
    .fontSize(9)
    .text(`Status: ${(vehicle.status || '').toUpperCase()}`, 55, 145)
    .text(`Current Odometer: ${(vehicle.current_odometer_km || 0).toLocaleString()} km`, 55, 160)
    .text(`Assigned Driver: ${vehicle.driver_name || 'Unassigned'}`, 55, 175);

  doc
    .text(`Last Service Date: ${vehicle.last_service_date ? new Date(vehicle.last_service_date).toLocaleDateString() : 'None'}`, 280, 145)
    .text(`Last Service Odometer: ${(vehicle.last_service_odometer_km || 0).toLocaleString()} km`, 280, 160)
    .text(`Service Interval: ${vehicle.service_interval_km || 5000} km`, 280, 175);

  // ─── Predictive Maintenance Callout ──────────────────────────
  doc.rect(40, 215, 515, 45).fillAndStroke('#EFF6FF', '#DBEAFE');
  doc
    .fillColor('#0052FF')
    .fontSize(10)
    .font('Helvetica-Bold')
    .text('PREDICTIVE MAINTENANCE FORECAST', 55, 224)
    .font('Helvetica')
    .fillColor('#1E293B')
    .fontSize(9)
    .text(
      `Based on historical rolling km/day calculations, the next scheduled service is predicted for: ${predictedDate}`,
      55,
      239
    );

  let currentY = 275;

  // ─── Service History Section ────────────────────────────────
  doc
    .fillColor('#0F172A')
    .fontSize(12)
    .font('Helvetica-Bold')
    .text('Service & Maintenance Records', 40, currentY);

  currentY += 18;

  // Table Header
  doc.rect(40, currentY, 515, 20).fill('#0F172A');
  doc
    .fillColor('#FFFFFF')
    .font('Helvetica-Bold')
    .fontSize(8.5)
    .text('Date', 50, currentY + 5)
    .text('Odometer', 140, currentY + 5)
    .text('Description', 240, currentY + 5)
    .text('Cost ($)', 480, currentY + 5, { align: 'right', width: 65 });

  currentY += 20;

  if (serviceRecords.length === 0) {
    doc
      .rect(40, currentY, 515, 25)
      .fillAndStroke('#FFFFFF', '#E2E8F0')
      .fillColor('#94A3B8')
      .font('Helvetica')
      .fontSize(9)
      .text('No service records logged for this vehicle.', 50, currentY + 7);
    currentY += 30;
  } else {
    let totalCost = 0;
    serviceRecords.slice(0, 10).forEach((rec, idx) => {
      const rowBg = idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC';
      doc.rect(40, currentY, 515, 20).fillAndStroke(rowBg, '#E2E8F0');

      doc
        .fillColor('#334155')
        .font('Helvetica')
        .fontSize(8)
        .text(new Date(rec.service_date).toLocaleDateString(), 50, currentY + 5)
        .text(`${Number(rec.odometer_km).toLocaleString()} km`, 140, currentY + 5)
        .text(rec.description || 'Routine service', 240, currentY + 5, { width: 230, height: 12, ellipsis: true })
        .text(`$${Number(rec.cost || 0).toFixed(2)}`, 480, currentY + 5, { align: 'right', width: 65 });

      totalCost += Number(rec.cost || 0);
      currentY += 20;
    });

    // Total row
    doc.rect(40, currentY, 515, 20).fillAndStroke('#F1F5F9', '#CBD5E1');
    doc
      .fillColor('#0F172A')
      .font('Helvetica-Bold')
      .fontSize(8.5)
      .text('Total Recorded Spend:', 240, currentY + 5)
      .text(`$${totalCost.toFixed(2)}`, 480, currentY + 5, { align: 'right', width: 65 });

    currentY += 30;
  }

  // ─── Reported Issues Section ────────────────────────────────
  doc
    .fillColor('#0F172A')
    .fontSize(12)
    .font('Helvetica-Bold')
    .text('Damage & Incident Reports', 40, currentY);

  currentY += 18;

  // Table Header
  doc.rect(40, currentY, 515, 20).fill('#0F172A');
  doc
    .fillColor('#FFFFFF')
    .font('Helvetica-Bold')
    .fontSize(8.5)
    .text('Reported On', 50, currentY + 5)
    .text('Damage Type', 130, currentY + 5)
    .text('Severity', 210, currentY + 5)
    .text('Issue Title', 290, currentY + 5)
    .text('Status', 480, currentY + 5, { align: 'right', width: 65 });

  currentY += 20;

  if (issues.length === 0) {
    doc
      .rect(40, currentY, 515, 25)
      .fillAndStroke('#FFFFFF', '#E2E8F0')
      .fillColor('#94A3B8')
      .font('Helvetica')
      .fontSize(9)
      .text('No incident or damage reports filed for this vehicle.', 50, currentY + 7);
  } else {
    issues.slice(0, 8).forEach((issue, idx) => {
      const rowBg = idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC';
      doc.rect(40, currentY, 515, 20).fillAndStroke(rowBg, '#E2E8F0');

      doc
        .fillColor('#334155')
        .font('Helvetica')
        .fontSize(8)
        .text(new Date(issue.created_at).toLocaleDateString(), 50, currentY + 5)
        .text((issue.damage_type || 'other').toUpperCase(), 130, currentY + 5)
        .text((issue.severity || 'minor').toUpperCase(), 210, currentY + 5)
        .text(issue.title || '', 290, currentY + 5, { width: 180, height: 12, ellipsis: true })
        .text((issue.status || 'open').toUpperCase(), 480, currentY + 5, { align: 'right', width: 65 });

      currentY += 20;
    });
  }

  // ─── Footer ─────────────────────────────────────────────────
  doc
    .fontSize(8)
    .fillColor('#94A3B8')
    .text('Generated by FleetSync — Vehicle Maintenance Report', 40, 780, {
      align: 'center',
      width: 515,
    });
}

module.exports = { buildVehiclePdf };
