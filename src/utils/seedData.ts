// Simplified demo data seeder

export const seedDemoData = async () => {
  console.log('Demo data will be implemented once database services are ready');
};

export const initializeDemoData = () => {
  if (process.env.NODE_ENV === 'development' || window.location.hostname === 'localhost') {
    setTimeout(seedDemoData, 1000);
  }
};