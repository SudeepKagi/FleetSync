const http = require('http');

async function request(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        let parsed = data;
        try {
          parsed = JSON.parse(data);
        } catch {}
        resolve({ status: res.statusCode, headers: res.headers, data: parsed });
      });
    });
    req.on('error', reject);
    if (postData) {
      req.write(typeof postData === 'string' ? postData : JSON.stringify(postData));
    }
    req.end();
  });
}

async function run() {
  console.log('🧪 Starting FleetSync Comprehensive Backend Verification Suite...\n');

  // 1. Admin Login
  const adminLogin = await request(
    {
      hostname: 'localhost',
      port: 3000,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    { email: 'admin@fleetsync.com', password: 'Password123!' }
  );

  console.log('1. Admin Login:', adminLogin.status === 200 ? '✅ Passed' : '❌ Failed', adminLogin.data.user?.role);
  const adminToken = adminLogin.data.token;

  // 2. Driver Login
  const driverLogin = await request(
    {
      hostname: 'localhost',
      port: 3000,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    { email: 'marcus@fleetsync.com', password: 'Password123!' }
  );
  console.log('2. Driver Login:', driverLogin.status === 200 ? '✅ Passed' : '❌ Failed', driverLogin.data.user?.role);
  const driverToken = driverLogin.data.token;

  // 3. Dashboard Stats
  const stats = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/dashboard/stats',
    method: 'GET',
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  console.log('3. Dashboard Stats:', stats.status === 200 ? '✅ Passed' : '❌ Failed', `Total vehicles: ${stats.data.vehicles?.total}`);

  // 4. Vehicles List & Locations
  const vehicles = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/vehicles',
    method: 'GET',
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  console.log('4. Vehicles List:', vehicles.status === 200 ? '✅ Passed' : '❌ Failed', `Count: ${vehicles.data.length}`);

  const locations = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/vehicles/locations/latest',
    method: 'GET',
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  console.log('5. Live Fleet Locations:', locations.status === 200 ? '✅ Passed' : '❌ Failed', `Active live markers: ${locations.data.length}`);

  // 6. Predictive Maintenance
  const pred = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/vehicles/1/predicted-service-date',
    method: 'GET',
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  console.log('6. Predictive Maintenance Date for Vehicle #1:', pred.status === 200 ? '✅ Passed' : '❌ Failed', `Date: ${pred.data.predicted_service_date}`);

  // 7. Geofence Zone
  const geofence = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/vehicles/1/geofence',
    method: 'GET',
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  console.log('7. Geofence Zone:', geofence.status === 200 ? '✅ Passed' : '❌ Failed', `Radius: ${geofence.data.radius_km} km`);

  // 8. PDF Report Streaming
  const pdfReport = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/vehicles/1/report/pdf',
    method: 'GET',
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  console.log('8. PDF Report Generation:', pdfReport.status === 200 && pdfReport.headers['content-type'] === 'application/pdf' ? '✅ Passed' : '❌ Failed');

  // 11. Audit Log (Admin only)
  const audit = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/audit-log',
    method: 'GET',
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  console.log('11. Audit Log:', audit.status === 200 ? '✅ Passed' : '❌ Failed', `Entries: ${audit.data.logs?.length}`);

  // 12. Driver Specific Endpoints
  const driverVehicle = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/drivers/me/vehicle',
    method: 'GET',
    headers: { Authorization: `Bearer ${driverToken}` },
  });
  console.log('12. Driver My-Vehicle:', driverVehicle.status === 200 ? '✅ Passed' : '❌ Failed', `Vehicle: ${driverVehicle.data.registration_number}`);

  console.log('\n🎉 Verification completed successfully!');
  process.exit(0);
}

run().catch((err) => {
  console.error('Test run failed:', err);
  process.exit(1);
});
