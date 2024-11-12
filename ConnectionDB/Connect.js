require('dotenv').config();

const { Sequelize } = require('sequelize');

 
const sequelize = new Sequelize(
   {
  dialect: 'postgres',
    host: process.env.DB_HOST,
    port: process.env.DB_PORT, 
    database: process.env.DB_DATABASE,
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    pool: {
      max: 10,         // Maximum number of connections in the pool
      min: 0,          // Minimum number of connections in the pool
      acquire: 30000,  // Maximum time, in ms, to acquire a connection
      idle: 10000      // Maximum time, in ms, that a connection can be idle
    },
  logging: false, 
  dialectOptions: {
    ssl: {
        require: true,
        rejectUnauthorized: false 
    }
 }


});
 
// Import models
const CustomerModel = require('../Models/Customer')(sequelize);
const AddressModel= require('../Models/Address')(sequelize);
const UserManagementModel= require('../Models/User')(sequelize);
const StoreModel= require('../Models/Store')(sequelize);
const RoleModel=require('../Models/Role')(sequelize);
const OrderHistory= require('../Models/orderhistory')(sequelize);
const Payment= require('../Models/payment')(sequelize);
const UserAddressModel = require('../Models/UserAddress')(sequelize);
const MapStoreUser = require('../Models/MapStoreUser')(sequelize);
const CityModel= require('../Models/City')(sequelize);
const StateModel=require('../Models/States')(sequelize);
const CountryModel=require('../Models/Country')(sequelize,);
const EmailTemplate =require('../Models/EmailTemplate')(sequelize,);
const PermissionsModel= require('../Models/Permissions')(sequelize);
const MapRolePermissionsModel= require('../Models/MapRolePermissions')(sequelize);
const OrderStatusModel= require('../Models/OrderStatus')(sequelize);
const OrderTabelModel = require('../Models/OrderTabel')(sequelize);
const InventoryModel= require('../Models/InventoryModel')(sequelize);
const FeedbackModel= require('../Models/FeedBack')(sequelize);
// const NewCityModel= require('../Models/NewCity')(sequelize);
// const NewStateModel=require('../Models/NewState')(sequelize);

AddressModel.belongsTo(CustomerModel,{foreignKey:'CustomerID',as :'Customers'} );
CustomerModel.hasMany(AddressModel,{foreignKey:'CustomerID',as:'Address'});

Payment.belongsTo(CustomerModel, { foreignKey: 'CustomerID', onDelete: 'CASCADE' });
CustomerModel.hasMany(Payment, { foreignKey: 'CustomerID', as: 'Payments' });

UserManagementModel.belongsTo(UserAddressModel, { foreignKey: 'AddressID',  as: 'Address', allowNull: true });
// In UserManagement model
UserManagementModel.hasMany(MapStoreUser, { foreignKey: 'UserID' });
MapStoreUser.belongsTo(UserManagementModel, { foreignKey: 'UserID', as: 'User' });

// In Store model
StoreModel.hasMany(MapStoreUser, { foreignKey: 'StoreID' });
MapStoreUser.belongsTo(StoreModel, { foreignKey: 'StoreID', as: 'Store' });

//permissions
RoleModel.hasMany(MapRolePermissionsModel, { foreignKey: 'RoleID', as: 'RolePermissions' });
MapRolePermissionsModel.belongsTo(RoleModel, { foreignKey: 'RoleID' });
MapRolePermissionsModel.belongsTo(PermissionsModel, { foreignKey: 'PermissionID' });
PermissionsModel.hasMany(MapRolePermissionsModel, { foreignKey: 'PermissionID', as: 'MappedRoles' });

 // Customer to Store association
StoreModel.hasMany(CustomerModel, {foreignKey: 'StoreID',as: 'Customers'});
CustomerModel.belongsTo(StoreModel, {foreignKey: 'StoreID',as: 'Store'});

// UserManagement to Store association
StoreModel.hasMany(UserManagementModel, {foreignKey: 'StoreID',as: 'User'});
UserManagementModel.belongsTo(StoreModel, {foreignKey: 'StoreID',as: 'Store'});


// Role to Store association
StoreModel.hasMany(RoleModel, {foreignKey: 'StoreID',as: 'Role'});
RoleModel.belongsTo(StoreModel, {foreignKey: 'StoreID',as: 'Store'});

// // // OrderHistory to OrderStatus association
OrderStatusModel.hasMany(OrderHistory, {foreignKey: 'StatusID'});
OrderHistory.belongsTo(OrderStatusModel, {foreignKey: 'StatusID'});


// Address belongs to City
AddressModel.belongsTo(CityModel, { foreignKey: 'CityID', as: 'City' });
CityModel.hasMany(AddressModel, { foreignKey: 'CityID', as: 'Address' });

// Address belongs to State
AddressModel.belongsTo(StateModel, { foreignKey: 'StateID', as: 'State' });
StateModel.hasMany(AddressModel, { foreignKey: 'StateID', as: 'Address' });

// Address belongs to Country
AddressModel.belongsTo(CountryModel, { foreignKey: 'CountryID', as: 'Country' });
CountryModel.hasMany(AddressModel, { foreignKey: 'CountryID', as: 'Address' });


// OrdersTabel to OrderStatus association
OrderTabelModel.belongsTo(OrderStatusModel, { foreignKey: 'StatusID', as: 'Order_TabelStatus' });
OrderStatusModel.hasMany(OrderTabelModel, { foreignKey: 'StatusID', as: 'OrdersTable' });
//Orderstabel to Customer
OrderTabelModel.belongsTo(CustomerModel, { foreignKey: 'CustomerID', as: 'Customer' });
//OrderTabel To Stores
StoreModel.hasMany(OrderTabelModel, {foreignKey: 'StoreID',as: 'OrdersTable'});
OrderTabelModel.belongsTo(StoreModel, {foreignKey: 'StoreID',as: 'StoreTabel'});

//OrderTabel To Payments
Payment.belongsTo(OrderTabelModel, {  foreignKey: 'OrderID',onDelete: 'CASCADE',onUpdate: 'CASCADE',});
OrderTabelModel.hasMany(Payment, {foreignKey: 'OrderID',});


//Address to OrdersTabel Association
OrderTabelModel.belongsTo(AddressModel, { foreignKey: 'AddressID',  as: 'Address', allowNull: true });

OrderHistory.belongsTo(OrderTabelModel, { foreignKey: 'OrderID', onDelete: 'CASCADE' ,as:'OrdersTable'});

// UserAddress belongs to City
UserAddressModel.belongsTo(CityModel, { foreignKey: 'CityID', as: 'City' });
CityModel.hasMany(UserAddressModel, { foreignKey: 'CityID', as: 'UserAddress' });

// UserAddress belongs to State
UserAddressModel.belongsTo(StateModel, { foreignKey: 'StateID', as: 'State' });
StateModel.hasMany(UserAddressModel, { foreignKey: 'StateID', as: 'UserAddress' });

// UserAddress belongs to Country
UserAddressModel.belongsTo(CountryModel, { foreignKey: 'CountryID', as: 'Country' });
CountryModel.hasMany(UserAddressModel, { foreignKey: 'CountryID', as: 'UserAddress' });

// UserAddress belongs to City
StoreModel.belongsTo(CityModel, { foreignKey: 'CityID', as: 'City' });
CityModel.hasMany(StoreModel, { foreignKey: 'CityID', as: 'StoreAddress' });

// UserAddress belongs to State
StoreModel.belongsTo(StateModel, { foreignKey: 'StateID', as: 'State' });
StateModel.hasMany(StoreModel, { foreignKey: 'StateID', as: 'StoreAddress' });

// UserAddress belongs to Country
StoreModel.belongsTo(CountryModel, { foreignKey: 'CountryID', as: 'Country' });
CountryModel.hasMany(StoreModel, { foreignKey: 'CountryID', as: 'StoreAddress' });

// OrderHistory to Roles association
OrderHistory.belongsTo(RoleModel, { foreignKey: 'UserRoleID', as: 'UserRole' });
RoleModel.hasMany(OrderHistory, { foreignKey: 'UserRoleID' });

// OrderHistory to Users
OrderHistory.belongsTo(UserManagementModel, { foreignKey: 'AssignTo', as: 'AssignedUser' });
UserManagementModel.hasMany(OrderHistory, { foreignKey: 'AssignTo' });

//Stores to Payemnts
StoreModel.hasMany(Payment, {foreignKey: 'StoreID',as: 'Payments'});
Payment.belongsTo(StoreModel, {foreignKey: 'StoreID',as: 'StoreTabel'});

//Orders to Users
OrderTabelModel.belongsTo(UserManagementModel, { foreignKey: 'UserID', as: 'User' });
UserManagementModel.hasMany(OrderTabelModel, { foreignKey: 'UserID' });

//Feed BacK to Stores
StoreModel.hasMany(FeedbackModel, {foreignKey: 'StoreID',as: 'Feedback'});
FeedbackModel.belongsTo(StoreModel, {foreignKey: 'StoreID',as: 'Store'});

// //Feed BacK to OrdersTabel
OrderTabelModel.hasMany(FeedbackModel, {foreignKey: 'OrderID',as: 'Feedback'});
FeedbackModel.belongsTo(OrderTabelModel, {foreignKey: 'OrderID',as: 'OrdersTable'});

// UserManaement to Roles association
UserManagementModel.belongsTo(RoleModel, { foreignKey: 'RoleID', as: 'UserRole' });
RoleModel.hasMany(UserManagementModel, { foreignKey: 'RoleID' });
// Test the connection
sequelize.authenticate()
  .then(() => {
    console.log('Database connection has been established successfully.');
  })
  .catch(err => {
    console.error('Unable to connect to the database.:', err);
  });

  // Sync models
sequelize.sync({ alter: true }).then(() => {
    console.log('Database & tables created!');
});

module.exports = { sequelize, CustomerModel,AddressModel,UserManagementModel,StoreModel,RoleModel,OrderTabelModel,
  // NewCityModel,
  // NewStateModel,
  OrderHistory,Payment,UserAddressModel,MapStoreUser,CityModel,StateModel,CountryModel,EmailTemplate,PermissionsModel,MapRolePermissionsModel,OrderStatusModel,InventoryModel,FeedbackModel};

  