/**
 * reports.controller.js: Handles PDF service history and compliance report generation.
 * Called by: GET /api/vehicles/:id/report/pdf and GET /api/reports/vehicles/:id/pdf
 */

const PDFDocument = require('pdfkit');
const pool = require('../config/db');
const { buildVehiclePdf } = require('../utils/pdfLayout');

/**
 * Generates and streams a downloadable PDF report for a vehicle.
 */
const generateVehiclePdfReport = async (req, res) => {
  const { id } = req.params;

  try {
    // 1. Fetch Vehicle & Driver details
    const vehicleRes = await pool.query(
      `SELECT v.*, d.name AS driver_name, d.license_number, d.phone AS driver_phone
       FROM vehicles v
       LEFT JOIN drivers d ON v.driver_id = d.id
       WHERE v.id = $1`,
      [id]
    );

    if (vehicleRes.rows.length === 0) {
      return res.status(404).json({ message: 'Vehicle not found.' });
    }
    const vehicle = vehicleRes.rows[0];

    // 2. Fetch Predicted Service Date from PL/pgSQL function
    let predictedDate = 'N/A';
    try {
      const predRes = await pool.query('SELECT predict_service_date($1) AS date', [id]);
      if (predRes.rows.length > 0 && predRes.rows[0].date) {
        predictedDate = new Date(predRes.rows[0].date).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        });
      }
    } catch (e) {
      console.warn('Predictive date query warning in PDF generation:', e.message);
    }

    // 3. Fetch Service Records & Reported Issues in parallel
    const [serviceRes, issuesRes] = await Promise.all([
      pool.query(`SELECT * FROM service_records WHERE vehicle_id = $1 ORDER BY service_date DESC`, [id]),
      pool.query(
        `SELECT i.*, u.name AS reporter_name FROM issues i
         LEFT JOIN users u ON i.reported_by = u.id
         WHERE i.vehicle_id = $1 ORDER BY i.created_at DESC`,
        [id]
      ),
    ]);

    // 4. Stream PDF Document to Response
    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="FleetSync_Vehicle_${vehicle.registration_number}_Report.pdf"`
    );

    doc.pipe(res);
    buildVehiclePdf(doc, {
      vehicle,
      serviceRecords: serviceRes.rows,
      issues: issuesRes.rows,
      predictedDate,
    });
    doc.end();
  } catch (err) {
    console.error('generateVehiclePdfReport error:', err);
    if (!res.headersSent) {
      res.status(500).json({ message: 'Failed to generate PDF report.' });
    }
  }
};

module.exports = { generateVehiclePdfReport };
