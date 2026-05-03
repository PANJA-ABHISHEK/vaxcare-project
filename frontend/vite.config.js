import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  server: {
    proxy: {
      '/login': 'http://localhost:5000',
      '/signup': 'http://localhost:5000',
      '/vaccines': 'http://localhost:5000',
      '/bookings': 'http://localhost:5000',
      '/hospitals': 'http://localhost:5000',
      '/profile': 'http://localhost:5000',
      '/notifications': 'http://localhost:5000',
      '/reminders': 'http://localhost:5000',
      '/chat': {
          target: 'ws://localhost:5000',
          ws: true
      }
    }
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        patientAppointments: resolve(__dirname, 'src/pages/patient-appointments.html'),
        patientDashboard: resolve(__dirname, 'src/pages/patient-dashboard.html'),
        patientHistory: resolve(__dirname, 'src/pages/patient-history.html'),
        patientProfile: resolve(__dirname, 'src/pages/patient-profile.html'),
        hospitalAdminDashboard: resolve(__dirname, 'src/pages/hospital-admin-dashboard.html'),
        hospitalProfile: resolve(__dirname, 'src/pages/hospital-profile.html')
      }
    }
  }
});
