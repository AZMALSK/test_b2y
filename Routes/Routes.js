const express = require('express');
const router = express.Router();
const customerController = require('../Controllers/CustomerCon');
const userController= require('../Controllers/UserCon')
const storeController= require('../Controllers/StoreCon');
const roleController= require('../Controllers/RoleCon');
const AddressController=require('../Controllers/Address')
const CityController=require('../Controllers/CitiesbyState');
const StateController=require('../Controllers/StatesbyCountry');
const PermissionController=require('../Controllers/PermissionCon');
const OrderStatusController=require('../Controllers/OrderStatusController');
const ReportsController=require('../Controllers/ReportsController');
const InventoryController=require('../Controllers/InventoryController');
const FeedbackController=require('../Controllers/FeedBackController');
const DashboardController=require('../Controllers/DashboardController');
const ProjectTypeController=require('../Controllers/ProjectTypeController');
const referenceController = require('../Controllers/referenceController');
const HolidayCalendarController = require('../Controllers/HolidayCalendarController');

const { createOrderOrUpdate,updateOrder,getOrderById,deleteOrderById,getAllOrders,GetSaleOrderReport,updateSubOrderStatus,triggerAdvanceMeasurementPaymentEmail} = require('../Controllers/ordercontroller');
const { getAllPayments, getPaymentById,getPaymentByPaymentId,createOrUpdatePayment } = require('../Controllers/PaymentController'); 
const { getAllOrderHistories, getOrderHistoryById,getOrderHistoryByOrderHistoryId,createOrUpdateOrderHistory,getOrderHistoryDocument,getusertasks,updateFinalMeasurementStatus,checkStatusAndSendEmail,checkPaymentStatusAndSendEmail,updateProgressStatus ,getTasksForUser,schedulePreDeliveryNotifications} = require('../Controllers/OrderHistoryController'); 
const { createOrUpdateMapStoreUser, getAllMapStoreUsers, getMapStoreUserById,getMapStoreUserByUserId ,deleteMapStoreUser} = require('../Controllers/MapStoreUserController');

const upload = require('../middleware/multerconfig');
const authController = require('../Controllers/AuthController');
const { verifyToken, isAdmin, isUser } = require('../middleware/VerifyToken');

// Authentication routes
router.post('/login', authController.loginUser);

//Routes for Customers
router.post('/createOrUpdateCustomer', customerController.createOrUpdateCustomer);
router.get('/getAllCustomers', customerController.getAllCustomers);
router.get('/getCustomerById/:id', customerController.getCustomerById); 
router.delete('/deleteCustomer/:id', customerController.deleteCustomer); 
router.get('/getOrderByCustomerId/:id', customerController.getOrderByCustomerId);
router.get('/getCustomerByIdWithoutAddress/:id', customerController.getCustomerByIdWithoutAddress);



//Routes for Address
router.post('/createOrUpdateAddress',AddressController.createOrUpdateAddress);
router.get('/getAllAddresses', AddressController.getAllAddresses);
router.get('/getAddressById/:id', AddressController.getAddressById); 
router.delete('/deleteAddress/:id', AddressController.deleteAddress); 
router.get('/getAddressDetailsById/:id',AddressController.getAddressDetailsById);
router.get('/getAddressesByCustomerId/:customerId',AddressController.getAddressesByCustomerId);

//Routes for Users
router.post('/createOrUpdateUser',userController.createOrUpdateUser);
router.get('/getAllUsers', verifyToken, isUser, userController.getAllUsers);
router.get('/getUserById/:id', verifyToken, isUser, userController.getUserById);
router.put('/updateUser/:id', verifyToken, isUser, userController.updateUser);
router.delete('/deleteUser/:id', verifyToken, isAdmin, userController.deleteUser);

//Routes for Stores
router.post('/createOrUpdateStore', storeController.createOrUpdateStore);
router.get('/getAllStores', storeController.getAllStores);
router.get('/getStoreById/:id', storeController.getStoreById); 
router.delete('/deleteStore/:id', storeController.deleteStore);
router.get('/getStoresForUser',verifyToken, isUser, storeController.getStoresForUser);

//Routes for Orders
// router.post('/createOrder',createOrder);
router.post('/createOrderOrUpdate',createOrderOrUpdate);
router.put('/updateOrder/:OrderID', updateOrder);
router.get('/getOrderById/:OrderID', getOrderById);
router.delete('/deleteOrderById/:OrderID', deleteOrderById);
router.get('/getAllOrders', getAllOrders);
router.post('/GetSaleOrderReport',GetSaleOrderReport);
router.post('/updateSubOrderStatus',updateSubOrderStatus);
router.post('/triggerAdvanceMeasurementPaymentEmail',triggerAdvanceMeasurementPaymentEmail);




//Routes for Roles
router.post('/createOrUpdateRole',roleController.createOrUpdateRole);
router.get('/getAllRoles',roleController.getAllRoles);
router.get('/getRoleById/:id', roleController.getRoleById); 
router.delete('/deleteRole/:id',roleController.deleteRole);

// Routes for OrderHistory
router.get('/order-histories', getAllOrderHistories);
router.get('/order-history/:OrderID', getOrderHistoryById);
router.get('/orderhistory/:OrderHistoryID', getOrderHistoryByOrderHistoryId);
router.post('/order-histories/createorderhistory', createOrUpdateOrderHistory);
router.get('/getusertasks', getusertasks);
router.post('/checkStatusAndSendEmail', checkStatusAndSendEmail);
router.post('/updateFinalMeasurementStatus', updateFinalMeasurementStatus);
router.post('/checkPaymentStatusAndSendEmail', checkPaymentStatusAndSendEmail);
router.post('/updateProgressStatus', updateProgressStatus);
router.get('/getTasksForUser/:userId', getTasksForUser);
router.post('/schedulePreDeliveryNotifications',schedulePreDeliveryNotifications);
// router.get('/order-document/getOrderHistoryDocument/:OrderHistoryID', getOrderHistoryDocument);

// Routes for Payment
router.get('/GetAllPayments', getAllPayments);
router.get('/payment/:OrderID', getPaymentById);
router.get('/paymentsbyID/:PaymentID', getPaymentByPaymentId);
router.post('/payments/createOrUpdatePayment', createOrUpdatePayment);

// Routes for MapStoreUser
router.post('/mapstoreuser', createOrUpdateMapStoreUser);
router.get('/getallmapstoreuser', getAllMapStoreUsers);
router.get('/mapstoreuser/:id', getMapStoreUserById);
router.get('/mapstoreuserbyUserID/:id', getMapStoreUserByUserId);
router.delete('/deleteMapStoreUser/:MapStoreUserID', deleteMapStoreUser);

//Routes for StatesbyCountry and Getcitiesbystate
router.get('/getCitiesByState',CityController.getCitiesByState);
router.get('/getStatesByCountry',StateController.getStatesByCountry);
router.get('/getCountries',StateController.getCountries);

//Rotes for Permissions
router.post('/createPermission',PermissionController.createPermission);
router.get('/getAllPermissions',PermissionController.getAllPermissions);
router.get('/getAllPermissionsByRoleId/:roleId', PermissionController.getAllPermissionsByRoleId);
router.post('/addRolePermissionController',PermissionController.addRolePermissionController);
router.post('/createOrUpdateRolePermissions',PermissionController.createOrUpdateRolePermissions);

//Routes for OrderStatus
router.post('/CreateorupdateStatus',OrderStatusController.CreateorupdateStatus);
router.get('/getAllOrderStatus',OrderStatusController.getAllOrderStatus);
router.get('/getOrderStatusById/:StatusID',OrderStatusController.getOrderStatusById);
router.delete('/deleteOrderStatusById/:StatusID',OrderStatusController.deleteOrderStatusById);

router.post('/getOrderReport',ReportsController.getOrderReport);
router.post('/getPaymentReport',ReportsController.getPaymentReport);
router.post('/getCustomerReport',ReportsController.getCustomerReport);

// router.post('/uploadInventoryFile',InventoryController.uploadInventoryFile);
// router.get('/getInventoryFileById/:FileID',InventoryController.getInventoryFileById);
router.post('/uploadDownloadInventoryFile',InventoryController.uploadDownloadInventoryFile);
router.get('/uploadDownloadInventoryFile/:FileID',InventoryController.uploadDownloadInventoryFile);


//Routes for Roles
router.post('/CreateOrderFeedBack',FeedbackController.CreateOrderFeedBack);
router.get('/GetAllFeedBacks',FeedbackController.GetAllFeedBacks);
router.get('/GetFeedBackbyOrderID/:orderId', FeedbackController.GetFeedBackbyOrderID);
router.put('/UpdateFeedBack/:orderId', FeedbackController.UpdateFeedBack);
router.delete('/DeleteFeedBack/:orderId',FeedbackController.DeleteFeedBack);

router.post('/getOverAllDataForDashboard',DashboardController.getOverAllDataForDashboard);
router.post('/getSalesAndPaymentReportByMonth',DashboardController.getSalesAndPaymentReportByMonth);

//productType
router.get('/listProjectTypes',ProjectTypeController.listProjectTypes);
router.get('/getAllProjectTypes',ProjectTypeController.getAllProjectTypes);
router.post('/addProjectType',ProjectTypeController.addProjectType);
router.put('/updateProjectType/:id',ProjectTypeController.updateProjectType);
router.get('/getProjectTypeById/:id',ProjectTypeController.getProjectTypeById);
router.delete('/deleteProjectType/:ProjectTypeID',ProjectTypeController.deleteProjectType);


// Reference routes
router.post('/createParentOrChindreference', referenceController.createReference);
router.get('/parents', referenceController.getAllParentReferences);
router.get('/children', referenceController.getAllChildReferences);
router.get('/getChildrenByParentId/:parentId', referenceController.getChildrenByParentId);
router.put('/reference/:id', referenceController.updateReference);
router.delete('/reference/:id', referenceController.deleteReference);
router.get('/getAllData', referenceController.getAllData); // Get all data updated one
router.get('/getByIdReferences/:id', referenceController.getById); // Get by ID updated one

//routes for HolidayCalendarModel
router.get('/listHolidays',HolidayCalendarController.listHolidays);




module.exports = router;

