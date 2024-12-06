const cron = require('node-cron');
const preDeliveryController = require('../Controllers/OrderHistoryController'); 

const initializeCronJobs = () => {
    // Schedule job to run daily at a specific time (e.g., 9:00 AM)
    cron.schedule(process.env.EVERY_DAY_AT_JOB, async () => {
        try {
            console.log('Running pre-delivery notifications job...');
            const result = await preDeliveryController.schedulePreDeliveryNotifications();
            console.log('Pre-delivery notification job completed with results:', result);
        } catch (error) {
            console.error('Pre-delivery notification job failed:', error);
        }
    });
};
console.log('initializeCronJobs function loaded successfully');

module.exports = { initializeCronJobs };
