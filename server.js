const express = require ('express');
const customerRoutes = require('./Routes/Routes');
const addressRoutes = require('./Routes/Routes');
const userRoutes = require('./Routes/Routes');
const storeRoutes = require('./Routes/Routes');
const ordersRoute = require('./Routes/Routes');
const createrole = require('./Routes/Routes');
const reportsRoute = require('./Routes/Routes');
const historyRoute = require('./Routes/Routes');
const paymentRoutes = require('./Routes/Routes');
const MapStoreUserRoutes = require('./Routes/Routes');
const cityRoutes=require('./Routes/Routes')
const permissionRoutes=require('./Routes/Routes');
const OrderStatusRoutes=require('./Routes/Routes');
const InventoryRoutes = require('./Routes/Routes');
const FeedbackRoutes = require('./Routes/Routes');
const DashboardRoutes = require('./Routes/Routes');
const ProjectTypeRoutes = require('./Routes/Routes');
const referenceRoutes = require('./Routes/Routes');
const holidayCalenderRoutes = require('./Routes/Routes');
const TenantRoutes = require('./Routes/Routes');
const {initializeCronJobs} = require('./middleware/cronJobs');
const chatbotRoutes = require('./Routes/Routes');



const cors = require('cors');
const authRoutes = require('./Routes/Routes');
const path = require('path');
const bodyParser = require('body-parser');
const app = express();
const PORT = 3000;


app.use(cors());
app.use(bodyParser.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/uploads', express.static('/imlystudios/uploads'));

// Middleware
app.use(express.json());

//console.log('initializeCronJobs function imported:', typeof (initializeCronJobs));
// Initialize cron jobs
initializeCronJobs();

  
// Authentication routes
app.use('/api/auth', authRoutes);

// Routes
app.use('/api/customers', customerRoutes);
app.use('/api/users', userRoutes);
app.use('/api/stores', storeRoutes);
app.use('/api/orders', ordersRoute);
app.use('/api/userrole',createrole);
app.use('/api/orderhistory',historyRoute);
app.use('/api/payments',paymentRoutes);
app.use('/api/mapstoreusers',MapStoreUserRoutes);
app.use('/api/cities',cityRoutes);
app.use('/api/permissions',permissionRoutes);
app.use('/api/address', addressRoutes);
app.use('/api/Orderstatus', OrderStatusRoutes);
app.use('/api/reports', reportsRoute);
app.use('/api/InventoryFile', InventoryRoutes);
app.use('/api/Feedback', FeedbackRoutes);
app.use('/api/Dashboard', DashboardRoutes);
app.use('/api/ProjectTypeRoutes',ProjectTypeRoutes);
app.use('/api/referenceRoutes',referenceRoutes);
app.use('/api/holidayCalender',holidayCalenderRoutes);
app.use('/api/Tenant',TenantRoutes);
app.use('/api/auth', chatbotRoutes);
  

// Error Handling Middleware
app.use((err, req, res, next) => {
    console.error('Server Error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log('Cron jobs initialized');
});



