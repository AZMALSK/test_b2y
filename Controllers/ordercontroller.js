const {   UserManagementModel,OrderTabelModel , CustomerModel, AddressModel, Payment,OrderHistory, OrderStatusModel, sequelize ,StoreModel,CityModel,StateModel,CountryModel ,ProjectTypeModel,ReferenceModel } = require('../ConnectionDB/Connect');
const { Sequelize, DataTypes } = require('sequelize');
const multer = require('multer');
const { storage } = require('../middleware/Cloundinary');
const { Op } = require('sequelize'); 
const moment = require('moment'); 
const ExcelJS = require('exceljs');
const { sendTemplateEmail , sendTemplateEmailForUser} = require('../middleware/SendEmail'); 
const { sendSMS } = require('../middleware/twilioConfig');
const { assign } = require('nodemailer/lib/shared');
const cron = require('node-cron');

const upload = multer({ storage: storage }).fields([
  { name: 'UploadImages', maxCount: 10 },   
]);


// exports.createOrderOrUpdate = async (req, res) => {
//   const {
//     OrderID,  // New field to check if the order exists for updating
//     TenantID,
//     CustomerID,
//     AddressID, // AddressID is now mandatory for both create and update
//     OrderDate,
//     TotalQuantity,
//     TotalAmount,
//     OrderStatus,
//     OrderBy,
//     DeliveryDate,
//     // Type,
//     Comments,
//     UserID,
//     AssignTo,
//     StatusDeliveryDate,
//     // ReferedBy,
//     ExpectedDurationDays,
//     DesginerName,
//     StoreCode,  // Ensure this is included for both create and update
//     SubStatusId,
//     StoreID,
//     ProjectTypeID,  // New field
//     ReferredByID    // New field
//   } = req.body;

//   const transaction = await sequelize.transaction();

//   try {
//     const customerIdToUse = parseInt(CustomerID);
//     const addressIdToUse = parseInt(AddressID);

//     if (!StoreCode) {
//       return res.status(400).json({ error: 'StoreCode is required' });
//     }

//     if (isNaN(customerIdToUse) || isNaN(addressIdToUse)) {
//       return res.status(400).json({ error: 'Invalid CustomerID or AddressID' });
//     }

//     // Validate the customer exists
//     const customer = await CustomerModel.findByPk(customerIdToUse);
//     if (!customer) {
//       return res.status(200).json({ error: 'CustomerID not found.' });
//     }
//     const Store = await StoreModel.findByPk(StoreID);
//     if (!Store) {
//       return res.status(200).json({ error: 'StoreID not found.' });
//     }

//     // Get assigned user details
//     const assignedUser = await UserManagementModel.findByPk(AssignTo);
//     if (!assignedUser) {
//     return res.status(200).json({ error: 'Assigned user not found.' }); 
//     }

//         // Get ProjectType if ProjectTypeID is provided
//         let projectType = null;
//         if (ProjectTypeID) {
//           projectType = await ProjectTypeModel.findByPk(ProjectTypeID);
//           if (!projectType) {
//             return res.status(200).json({ error: 'ProjectTypeID not found.' });
//           }
//         }
    
//         // Get Reference if ReferredByID is provided
//         let reference = null;
//         if (ReferredByID) {
//           reference = await ReferenceModel.findByPk(ReferredByID);
//           if (!reference) {
//             return res.status(200).json({ error: 'ReferredByID not found.' });
//           }
//         }
    
//     // Validate the address exists for the customer and include associations
//     const existingAddress = await AddressModel.findOne({
//       where: {
//         AddressID: addressIdToUse,
//         CustomerID: customerIdToUse,
//       },
//       include: [
//         { model: CityModel, as: 'City' },
//         { model: StateModel, as: 'State' },
//         { model: CountryModel, as: 'Country' },
//       ],
//     });

//     if (!existingAddress) {
//       return res.status(200).json({ error: 'Address not found for the given CustomerID.' });
//     }

//     let newOrder;
//     let operationMessage;  // Message to differentiate between create and update
//     let emailTemplate;     // Variable for email template
//     let emalilTemplateForUser;

//     // Add 3 days to current date for StatusDeliveryDate
//     const updatedStatusDeliveryDate = new Date();
//     updatedStatusDeliveryDate.setDate(updatedStatusDeliveryDate.getDate() + 3);

//     if (OrderID) {
//       // Scenario 1: Update an existing order if OrderID is provided
//       newOrder = await OrderTabelModel.findOne({
//         where: {
//           OrderID,
//           CustomerID: customerIdToUse,
//           AddressID: addressIdToUse,  // Ensure the update is based on OrderID, CustomerID, and AddressID
//         },
//         include: [
//           {
//             model: StoreModel, 
//             as: 'StoreTabel',
//             attributes: ['StoreName','StoreID']
//           },
//         ]  
//       });

//       if (!newOrder) {
//         return res.status(200).json({ error: 'Order not found for the given CustomerID and AddressID.' });
//       }

//       // Update the existing order
//       await newOrder.update({
//         TenantID,
//         CustomerID: customerIdToUse,
//         AddressID: addressIdToUse,
//         OrderDate,
//         TotalQuantity,
//         TotalAmount,
//         OrderStatus,
//         OrderBy,
//         DeliveryDate,
//         Comments,
//         DesginerName,
//         StoreID,
//         UserID,
//         ExpectedDurationDays,
//         StoreCode,
//         SubStatusId,
//         Type: projectType ? projectType.ProjectTypeName : null,        // Dynamically set Type
//         ReferedBy: reference ? reference.ReferenceName : null,    
//         ProjectTypeID:ProjectTypeID,
//         ReferredByID :ReferredByID,    
//         UpdatedBy: OrderBy,
//         UpdatedAt: new Date(),
//       }, { transaction });

//       const orderNumber = `${StoreCode}/${newOrder.OrderID}`;
//       await newOrder.update({ OrderNumber: orderNumber }, { transaction });

//       operationMessage = 'Order updated successfully';
//       emailTemplate = 'UpdateOrder';  

//     } else {
//       // Scenario 2: Create a new order if OrderID is not provided
//       newOrder = await OrderTabelModel.create({
//         TenantID,
//         CustomerID: customerIdToUse,
//         AddressID: addressIdToUse,  // Create the order for a specific AddressID
//         TotalQuantity,
//         TotalAmount,
//         OrderStatus: 'Quick Quote',
//         SubStatusId: 0,
//         OrderBy,
//         DeliveryDate,
//         Comments,
//         DesginerName,
//         StoreID,
//         UserID,
//         ExpectedDurationDays,
//         StoreCode,
//         StatusDeliveryDate: updatedStatusDeliveryDate, // Use updated date
//         Type: projectType ? projectType.ProjectTypeName : null, 
//         ProjectTypeID:ProjectTypeID,
//         ReferredByID :ReferredByID,    
//         ReferedBy: reference ? reference.name : null,       
//         CreatedBy: OrderBy,
//         CreatedAt: new Date(),
//         UpdatedBy: OrderBy,
//         UpdatedAt: new Date(),
//       }, { transaction });

//       // Create an entry in OrderHistory for the new order
//       await OrderHistory.create({
//         OrderID: newOrder.OrderID,
//         TenantID,
//         UserID,
//         OrderStatus: newOrder.OrderStatus,
//         StatusID: 1,
//         UserRoleID:1,
//         // StartDate: new Date(),
//         EndDate: updatedStatusDeliveryDate, 
//         AssignTo,
//         Comments,
//         DocumentName: null, // Assuming no document at the creation
//         OrderHistoryStatus: newOrder.OrderStatus,
//         // CreatedBy: 'System',
//         CreatedAt: new Date(),
//         UpdatedAt: new Date(),
//       }, { transaction });

//       // Construct and update OrderNumber
//       const orderNumber = `IM/${StoreCode}/${newOrder.OrderID}`;
//       await newOrder.update({ OrderNumber: orderNumber }, { transaction });

//       operationMessage = 'Order created successfully';
//       emailTemplate = 'CreateOrder';  // Use a create-specific email template
//       emalilTemplateForUser = 'OrderAssignment';
//     }

//     // Use existingAddress as address
//     const address = existingAddress;

//     // Function to format dates consistently
//     const formatDate = (date) => {
//       return new Date(date).toLocaleDateString('en-GB', {
//         day: 'numeric',
//         month: 'long',
//         year: 'numeric'
//       }).replace(',', '');
//     };

//     // const store = newOrder.StoreTabel ? newOrder.StoreTabel.StoreName : '';
//     // console.log(store)
//     const orderDetails = {
//       customerFirstName: customer.FirstName,
//       customerEmail: customer.Email,
//       OrderNumber: newOrder.OrderNumber || `IM/${StoreCode}/${newOrder.OrderID}`,
//       Type: newOrder.Type,
//       StoreID: newOrder.StoreID,
//       StoreName: Store.StoreName,
//       OrderDate: formatDate(newOrder.CreatedAt),
//       DeliVeryDate: formatDate(DeliveryDate),
//       TotalAmount: new Intl.NumberFormat('en-IN', {
//         style: 'currency',
//         currency: 'INR',
//         minimumFractionDigits: 2,
//       }).format(TotalAmount).replace('₹', ''),
//       DeliveryAddress: `${address.AddressLine1}${address.AddressLine2 ? '\n' + address.AddressLine2 : ''}
//       ${address.City ? address.City.CityName : ''}, ${address.State ? address.State.StateName : ''} ${address.ZipCode}
//       ${address.Country ? address.Country.CountryName : ''}`,
//       customerPhone: customer.PhoneNumber,
//       AddressLine1: address.AddressLine1,
//       AddressLine2: address.AddressLine2,
//       City: address.City ? address.City.CityName : '',
//       State: address.State ? address.State.StateName : '',
//       ZipCode: address.ZipCode,
//       Country: address.Country ? address.Country.CountryName : '',
//       // 
//       assignedUserName: `${assignedUser.FirstName} ${assignedUser.LastName}`,
//       assignedUserEmail: assignedUser.Email,
//       assignedUserPhone: assignedUser.PhoneNumber
//     };

//     // Send Email and SMS Notifications
//     // sendTemplateEmail(emailTemplate, orderDetails);  // Send Email based on the operation
//     // sendSMS(orderDetails.customerPhone, message);    // Send SMS

   
//     await transaction.commit();
   
//     // Send emails to both customer and assigned user
//     await Promise.all([
//     // Send email to customer
//     sendTemplateEmail(emailTemplate, orderDetails),
//     // Send email to assigned user
//     sendTemplateEmailForUser(emalilTemplateForUser, orderDetails

//   ),
// ]);


//     res.status(200).json({
//       StatusCode: 'SUCCESS',
//       message: operationMessage,
//       OrderID: newOrder.OrderID,
//       OrderNumber: newOrder.OrderNumber || `IM/${StoreCode}/${newOrder.OrderID}`,
//     });

//   } catch (error) {
//     await transaction.rollback();
//     console.error('Error creating/updating order:', error);
//     res.status(500).json({ error: 'Internal Server Error' });
//   }
// };


const sendNotificationEmails = async (emailTemplate, userEmailTemplate, orderDetails) => {
  try {
    // Send emails to both customer and assigned user concurrently
    await Promise.all([
      sendTemplateEmail(emailTemplate, orderDetails),
      sendTemplateEmailForUser(userEmailTemplate, orderDetails),
    ]);
    console.log("Emails sent successfully.");
  } catch (error) {
    console.error("Error sending notification emails:", error);
    throw error;
  }
};

exports.createOrderOrUpdate = async (req, res) => {
  const {
    OrderID,
    TenantID,
    CustomerID,
    AddressID,
    OrderDate,
    TotalQuantity,
    TotalAmount,
    OrderStatus,
    OrderBy,
    DeliveryDate,
    Comments,
    UserID,
    AssignTo,
    ExpectedDurationDays,
    DesginerName,
    StoreCode,
    SubStatusId,
    StoreID,
    ProjectTypeID,
    ReferredByID,
    SubReferenceID: initialSubReferenceID

  } = req.body;

  const transaction = await sequelize.transaction();

  try {
    // Validate and retrieve related entities
    const customer = await CustomerModel.findByPk(parseInt(CustomerID));
    if (!customer) throw new Error("Customer not found.");

    const address = await AddressModel.findOne({
      where: { AddressID: parseInt(AddressID), CustomerID: parseInt(CustomerID) },
      include: [
        { model: CityModel, as: "City" },
        { model: StateModel, as: "State" },
        { model: CountryModel, as: "Country" },
      ],
    });
    if (!address) throw new Error("Address not found.");

    const store = await StoreModel.findByPk(StoreID);
    if (!store) throw new Error("Store not found.");

    const assignedUser = await UserManagementModel.findByPk(AssignTo);
    if (!assignedUser) throw new Error("Assigned user not found.");

    let projectType = null;
    if (ProjectTypeID) {
      projectType = await ProjectTypeModel.findByPk(ProjectTypeID);
      if (!projectType) throw new Error("Project type not found.");
    }
        // Reference lookup
        let referedBy = null;
        let subReference = null;
        let finalSubReferenceID = initialSubReferenceID;
       
         // First, handle the main reference lookup
         if (ReferredByID) {
            const reference = await ReferenceModel.findOne({
                where: { id: ReferredByID },
                attributes: ['id', 'name', 'parentId', 'isActive'],
                include: [{
                    model: ReferenceModel,
                    as: 'parent',
                    attributes: ['id', 'name']
                }]
            });
            if (!reference) {
                return res.status(404).json({ error: 'Invalid ReferredByID' });
            }

            // If the reference has a parent, it's a sub-reference
            if (reference.parentId) {
                referedBy = reference.parent.name;
                subReference = reference.name;
            } else {
                referedBy = reference.name;
                // Only look up sub-reference if initialSubReferenceID is provided
                if (initialSubReferenceID) {
                    const subRef = await ReferenceModel.findOne({
                        where: { 
                            id: initialSubReferenceID,
                            parentId: reference.id  // Ensure it's a child of the main reference
                        },
                        attributes: ['id', 'name']
                    });
                    if (subRef) {
                        subReference = subRef.name;
                        finalSubReferenceID = subRef.id;
                    } else {
                        subReference = 'self';
                        finalSubReferenceID = null;
                    }
                } else {
                    subReference = 'self';
                    finalSubReferenceID = null;
                }
                
            }
        }

          // Logic to check and update customer `isConfirmed` status
          if (!customer.isConfirmed) {
            // Count all customers with `isConfirmed: true`
            const isConfirmedTotalCount = await CustomerModel.count({ where: { isConfirmed: true } });
      
            // Update current customer's `isConfirmed` to true
            const newCustomerNumber = `${customer.CustomerNumber}/${isConfirmedTotalCount + 1}`;
            await customer.update({ isConfirmed: true, CustomerNumber: newCustomerNumber }, { transaction });
          }

    let newOrder, operationMessage, emailTemplate, emalilTemplateForUser;
    const updatedStatusDeliveryDate = new Date();
    updatedStatusDeliveryDate.setDate(updatedStatusDeliveryDate.getDate() + 3);
    
    if (OrderID) {
      // Update existing order
      newOrder = await OrderTabelModel.findOne({ 
        where: { OrderID },
        include: [
          {
            model: ReferenceModel,
            as: 'ReferredBy',
            attributes: ['name']
          }
        ]
      });

      if (!newOrder) throw new Error("Order not found.");

      await newOrder.update({
        TenantID,
        CustomerID,
        AddressID,
        OrderDate,
        TotalQuantity,
        TotalAmount,
        OrderStatus,
        OrderBy,
        DeliveryDate,
        Comments,
        DesginerName,
        StoreID,
        UserID,
        ExpectedDurationDays,
        StoreCode,
        SubStatusId,
        Type: projectType ? projectType.ProjectTypeName : null, 
        ReferedBy: referedBy,
        SubReference: subReference,
        ReferredByID,
        SubReferenceID: finalSubReferenceID,
        ProjectTypeID,
        ReferredByID,
        UpdatedBy: OrderBy,
      }, { transaction });
      
      const orderNumber = `${StoreCode}/${newOrder.OrderID}`;
      await newOrder.update({ OrderNumber: orderNumber }, { transaction });
      
      operationMessage = "Order updated successfully";
      emailTemplate = "UpdateOrder";
      emalilTemplateForUser = 'UpdatedAssignment';
    } else {
      // Create new order
      newOrder = await OrderTabelModel.create({
        TenantID,
        CustomerID,
        AddressID,
        TotalQuantity,
        TotalAmount,
        OrderStatus: "Quick Quote",
        SubStatusId: 0,
        OrderBy,
        DeliveryDate,
        Comments,
        DesginerName,
        StoreID,
        UserID,
        ExpectedDurationDays,
        StoreCode,
        StatusDeliveryDate: new Date(),
        Type: projectType ? projectType.ProjectTypeName : null,
        ReferedBy: referedBy,
        SubReference: subReference,
        ReferredByID,
        SubReferenceID: finalSubReferenceID,
        ProjectTypeID,
        ReferredByID,
        CreatedBy: OrderBy,
        UpdatedBy: OrderBy,
      }, { transaction });

      //       // Create an entry in OrderHistory for the new order
      await OrderHistory.create({
        OrderID: newOrder.OrderID,
        TenantID,
        UserID,
        OrderStatus: newOrder.OrderStatus,
        StatusID: 1,
        UserRoleID:1,
        // StartDate: new Date(),
        EndDate: updatedStatusDeliveryDate, 
        AssignTo,
        Comments,
        DocumentName: null, // Assuming no document at the creation
        OrderHistoryStatus: newOrder.OrderStatus,
        // CreatedBy: 'System',
        CreatedAt: new Date(),
        UpdatedAt: new Date(),
      }, { transaction });

      // Construct and update OrderNumber
      const orderNumber = `${StoreCode}/${newOrder.OrderID}`;
      // CusNumber = `${}/${}`;
      await newOrder.update({ OrderNumber: orderNumber }, { transaction });
      // await NewCustomerNumber.update({CustomerNuber :CusNumber })
      operationMessage = 'Order created successfully';
      emailTemplate = 'CreateOrder';  // Use a create-specific email template
      emalilTemplateForUser = 'OrderAssignment';

    }

    // Prepare order details for email
    // const orderDetails = {
    //   customerFirstName: customer.FirstName,
    //   customerEmail: customer.Email,
    //   OrderNumber: newOrder.OrderNumber || `IM/${StoreCode}/${newOrder.OrderID}`,
    //   StoreName: store.StoreName,
    //   DeliveryAddress: `${address.AddressLine1}, ${address.City.CityName}, ${address.State.StateName}, ${address.Country.CountryName}, ${address.ZipCode}`,
    //   assignedUserName: `${assignedUser.FirstName} ${assignedUser.LastName}`,
    //   assignedUserEmail: assignedUser.Email,
    // };

      // Use existingAddress as address
    // const address = existingAddress;

    // Function to format dates consistently
    const formatDate = (date) => {
      return new Date(date).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      }).replace(',', '');
    };

    // const store = newOrder.StoreTabel ? newOrder.StoreTabel.StoreName : '';
    // console.log(store)
    const orderDetails = {
      customerFirstName: customer.FirstName,
      customerEmail: customer.Email,
      OrderNumber: newOrder.OrderNumber || `IM/${StoreCode}/${newOrder.OrderID}`,
      Type: newOrder.Type,
      StoreID: newOrder.StoreID,
      StoreName: store.StoreName,
      OrderDate: formatDate(newOrder.CreatedAt),
      DeliVeryDate: formatDate(DeliveryDate),
      TotalAmount: new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 2,
      }).format(TotalAmount).replace('₹', ''),
      DeliveryAddress: `${address.AddressLine1}${address.AddressLine2 ? '\n' + address.AddressLine2 : ''}
      ${address.City ? address.City.CityName : ''}, ${address.State ? address.State.StateName : ''} ${address.ZipCode}
      ${address.Country ? address.Country.CountryName : ''}`,
      customerPhone: customer.PhoneNumber,
      AddressLine1: address.AddressLine1,
      AddressLine2: address.AddressLine2,
      City: address.City ? address.City.CityName : '',
      State: address.State ? address.State.StateName : '',
      ZipCode: address.ZipCode,
      Country: address.Country ? address.Country.CountryName : '',
      // 
      assignedUserName: `${assignedUser.FirstName} ${assignedUser.LastName}`,
      assignedUserEmail: assignedUser.Email,
      assignedUserPhone: assignedUser.PhoneNumber
    };

    // Commit transaction
    await transaction.commit();

    // Send notification emails
    await sendNotificationEmails(emailTemplate, emalilTemplateForUser, orderDetails);

    res.status(200).json({ 
      StatusCode: "SUCCESS", 
      message: operationMessage ,
      data: {
      OrderID: newOrder.OrderID,
      OrderNumber: newOrder.OrderNumber
    }
  });
  } catch (error) {
    await transaction.rollback();
    console.error("Error:", error.message);
    res.status(500).json({ error: error.message });
  }
};



exports.updateOrder = async (req, res) => {
  const { OrderID } = req.params; 
  
  upload(req, res, async function (err) {
    if (err instanceof multer.MulterError) {
      return res.status(500).json({ err });
    } else if (err) {
      return res.status(500).json({ error: "Failed to upload files or other errors occurred." });
    }

    const {
      TenantID,
      CustomerID,
      OrderDate,
      TotalQuantity,
      AddressID, // AddressID to update existing address
      AddressLine1,
      AddressLine2,
      CityID,
      StateID,
      CountryID,
      ZipCode,
      TotalAmount,
      OrderStatus,
      OrderBy,
      DeliveryDate,
      customerFirstName,
      customerLastName,
      customerEmail,
      customerPhone,
      PaymentMethod,
      PaymentStatus,
      MaskedCardNumber,
      Type,
      Comments,
      ReferedBy,
      DesginerName,
      choosefiles,
      ExpectedDurationDays,
      AdvanceAmount,
      BalenceAmount,
      PaymentComments,
      assginto,
      StoreCode
    } = req.body;

    const transaction = await sequelize.transaction();

    try {
      // Find the existing order
      const order = await OrderTabelModel.findByPk(OrderID);
      if (!order) {
        return res.status(404).json({ error: 'Order not found.' });
      }

      // Find and update the existing customer
      const customer = await CustomerModel.findByPk(CustomerID);
      if (!customer) {
        return res.status(404).json({ error: 'CustomerID not found.' });
      }

      await customer.update({
        FirstName: customerFirstName,
        LastName: customerLastName,
        Email: customerEmail,
        PhoneNumber: customerPhone,
        UpdatedBy: OrderBy,
      }, { transaction });

      // Update the existing address if AddressID is provided
      if (AddressID) {
        const address = await AddressModel.findByPk(AddressID);
        if (address) {
          await address.update({
            TenantID,
            Street: `${AddressLine1} ${AddressLine2}`,
            AddressLine1,
            AddressLine2,
            CityID,
            StateID,
            CountryID,
            ZipCode,
            UpdatedBy: OrderBy,
          }, { transaction });
        } else {
          return res.status(404).json({ error: 'AddressID not found.' });
        }
      }

      // Handle File Uploads
      let uploadImages = req.files['UploadImages'] ? req.files['UploadImages'].map(file => file.path) : [];
      let chooseFiles = req.files['choosefiles'] ? req.files['choosefiles'].map(file => file.path) : [];

      // Update the order
      await OrderTabelModel.update({
        TenantID,
        CustomerID,
        OrderDate,
        TotalQuantity,
        AddressID: AddressID || order.AddressID, // Use provided AddressID or retain the old one
        TotalAmount,
        OrderStatus,
        OrderBy,
        DeliveryDate,
        Type,
        Comments,
        ReferedBy,
        DesginerName,
        assginto,
        UploadImages: uploadImages.length > 0 ? uploadImages : order.UploadImages, // Retain old images if no new ones
        choosefiles: chooseFiles.length > 0 ? chooseFiles : order.choosefiles,
        ExpectedDurationDays,
        UpdatedBy: OrderBy,
        UpdatedAt: new Date(),
      }, { transaction });

      // Update the payment record
      await Payment.update({
        TenantID,
        CustomerID,
        TotalAmount,
        AdvanceAmount,
        BalenceAmount,
        PaymentComments,
        PaymentMethod,
        PaymentStatus,
        MaskedCardNumber,
        PaymentDate: new Date(),
      }, { where: { OrderID }, transaction });

      // Create an entry in OrderHistory
      await OrderHistory.create({
        OrderID,
        TenantID,
        UserID: CustomerID,
        OrderStatus,
        CreatedBy: OrderBy,
        CreatedAt: new Date(),
        UpdatedBy: OrderBy,
        UpdatedAt: new Date(),
      }, { transaction });

      const updateOrderDetails = {
        customerFirstName, customerEmail, OrderNumber: order.OrderNumber, customerPhone, TotalAmount
      };

      const message = `Hello ${updateOrderDetails.customerFirstName}, your order (${updateOrderDetails.OrderNumber}) has been updated. Total: ${updateOrderDetails.TotalAmount}. Thank you for shopping with us!`;

      sendTemplateEmail('UpdateOrder', updateOrderDetails); 

      sendSMS(updateOrderDetails.customerPhone, message);

      await transaction.commit();

      res.status(200).json({
        StatusCode: 'SUCCESS',
        message: 'Order updated successfully',
        OrderID: order.OrderID,
        OrderNumber: order.OrderNumber,
      });

    } catch (error) {
      await transaction.rollback();
      console.error('Error updating order:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });
};



exports.deleteOrderById = async (req, res) => {
    const { OrderID } = req.params;

    try {
        const deleted = await OrderTabelModel.destroy({ where: { OrderID } });

        if (deleted) {
            res.status(200).json({StatusCode: 'SUCCESS', 
                                  message: 'Order deleted successfully.' });
        } else {
            res.status(404).json({ error: 'Order not found.' });
        }

    } catch (error) {
        console.error('Error deleting order:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};




exports.GetSaleOrderReport = async (req, res) => {
  const { startDate, DeliveryDate, StoreID, StatusID } = req.body;

  try {
      // Fetch orders based on the request filters
      const orders = await OrderTabelModel.findAll({
          where: {
              OrderDate: {
                  [Op.between]: [startDate, DeliveryDate]
              },
              StoreID: StoreID,
          },
          include: [
              { model: CustomerModel, as: 'Customer', attributes: ['FirstName', 'PhoneNumber', 'Email'] },
              { model: Payment, as: 'Payments', attributes: ['AdvanceAmount'] },
              // { model: OrderStatusModel,  as: 'Order_Status', attributes: ['OrderStatus'] }
          ]
      });

      // Create a new Excel Workbook
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Order Report');

      // Add column headers
      worksheet.columns = [
          { header: 'Order Number', key: 'OrderNumber', width: 15 },
          { header: 'Order Date', key: 'OrderDate', width: 15 },
          { header: 'Order Status', key: 'OrderStatus', width: 15 },
          { header: 'Expected Delivery Date', key: 'DeliveryDate', width: 20 },
          { header: 'Customer Name', key: 'CustomerName', width: 25 },
          { header: 'Customer Contact', key: 'CustomerContact', width: 20 },
          { header: 'Customer Email', key: 'CustomerEmail', width: 30 },
          { header: 'Total Amount', key: 'TotalAmount', width: 15 },
          { header: 'Paid Amount', key: 'AdvanceAmount', width: 15 },
          { header: 'Balance Amount', key: 'BalanceAmount', width: 15 }
      ];

      // Add rows to the worksheet from the orders data
      orders.forEach(order => {
          const balanceAmount = order.TotalAmount - order.Payment.AdvanceAmount;

          worksheet.addRow({
              OrderNumber: order.OrderNumber,
              OrderDate: order.OrderDate.toLocaleDateString(),
              OrderStatus: order.OrderStatus,
              DeliveryDate: order.DeliveryDate ? order.DeliveryDate.toLocaleDateString() : '',
              CustomerName: order.Customer.CustomerName,
              CustomerContact: order.Customer.PhoneNumber,
              CustomerEmail: order.Customer.Email,
              TotalAmount: order.TotalAmount,
              PaidAmount: order.Payment.AdvanceAmount,
              BalanceAmount: balanceAmount
          });
      });

      // Set the response headers for downloading the Excel file
      res.setHeader(
          'Content-Type',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
      res.setHeader(
          'Content-Disposition',
          'attachment; filename=Order_Report.xlsx'
      );

      // Send the Excel file as the response
      await workbook.xlsx.write(res);
      res.end();

  } catch (error) {
      console.error('Error generating report:', error);
      res.status(500).json({ error: 'Failed to generate report' });
  }
};



exports.getAllOrders = async (req, res) => {
  const { 
    pageNumber, 
    pageSize, 
    searchText = '', 
    StoreIDs, // Array of Store IDs
    StatusID, 
    SubStatusId,
    StartDate, 
    EndDate, 
    OntimeorDelay 
  } = req.query;

  try {
    // Initialize query object
    let queryConditions = {};

    // Apply search text filter (on OrderNumber, DesignerName, Customer FirstName, or LastName)
    if (searchText) {
      queryConditions = {
        ...queryConditions,
        [Op.or]: [
          { OrderNumber: { [Op.iLike]: `%${searchText}%` } },
          { DesginerName: { [Op.iLike]: `%${searchText}%` } },
          { '$Customer.FirstName$': { [Op.iLike]: `%${searchText}%` } }, 
          { '$Customer.LastName$': { [Op.iLike]: `%${searchText}%` } },  
        ]
      };
    }

    // Apply StoreIDs filter (handle array)
    if (StoreIDs && StoreIDs.length > 0) {
      const storeIdsArray = Array.isArray(StoreIDs) ? StoreIDs : StoreIDs.split(','); // Ensure it's an array
      queryConditions = { 
        ...queryConditions, 
        StoreID: { [Op.in]: storeIdsArray } // Use [Op.in] to filter by array of StoreIDs
      };
    }

    // Apply StatusID filter
    if (StatusID && StatusID > 0) {
      queryConditions = {
        ...queryConditions,
        StatusID: StatusID
      };
    }

    // Apply SubStatusId filter
    if (SubStatusId && SubStatusId > 0) {
      queryConditions = {
        ...queryConditions,
        SubStatusId: SubStatusId
      };
    }

    // Apply date range filter
    if (StartDate && EndDate) {
      const startDate = moment(StartDate).startOf('day').toDate();
      const endDate = moment(EndDate).endOf('day').toDate();
      queryConditions = {
        ...queryConditions,
        CreatedAt: { [Op.between]: [startDate, endDate] }
      };
    }

    // Get total count for pagination
    const totalCount = await OrderTabelModel.count({
      where: queryConditions,
      include: [{ model: CustomerModel, as: 'Customer' }]
    });

    // Initialize options for the query
    let options = {
      where: queryConditions,
      include: [
        {
          model: CustomerModel, as: 'Customer',
          attributes: ['CustomerID', 'FirstName', 'LastName', 'Email', 'PhoneNumber']
        },
        {
          model: ReferenceModel,
          as: 'ReferredBy',
          attributes: ['id', 'name', 'parentId'],
          include: [{
              model: ReferenceModel,
              as: 'parent',
              attributes: ['name']
          }]
      }
      ],
      attributes: ['OrderID', 'OrderNumber', 'OrderStatus', 'StatusID', 'TotalQuantity', 'TotalAmount', 'DeliveryDate', 'Type', 'Comments', 'DesginerName', 'CreatedAt', 'OrderDate', 'StoreID', 'StatusDeliveryDate', 'SubStatusId','UserID','ProjectTypeID', 'ReferredByID',"SubReference" ,"ReferedBy"], 
      order: [
        [Sequelize.literal('GREATEST("OrdersTable"."CreatedAt", "OrdersTable"."UpdatedAt")'), 'DESC'],
        ['DesginerName', 'ASC']
      ],
      distinct: true
    };

    // Apply pagination if pageNumber and pageSize are provided
    if (pageNumber && pageSize) {
      const offset = (parseInt(pageNumber, 10) - 1) * parseInt(pageSize, 10);
      options = {
        ...options,
        limit: parseInt(pageSize, 10),
        offset: offset
      };
    }

    const orders = await OrderTabelModel.findAndCountAll(options);
    
    // Calculate payments and balance for each order
    const modifiedOrders = await Promise.all(orders.rows.map(async (order) => {
      const payments = await Payment.findAll({
        where: { OrderID: order.OrderID }
      });

      const totalAdvanceAmount = payments.reduce((sum, payment) => sum + parseFloat(payment.Amount), 0);
      const totalAmount = parseFloat(order.TotalAmount);
      const balanceAmount = totalAmount - totalAdvanceAmount;

      const statusDeliveryDate = moment(order.StatusDeliveryDate);
      const today = moment().startOf('day');
      const isDelayed = statusDeliveryDate.isBefore(today) ? 2 : 1;

      if (OntimeorDelay && parseInt(OntimeorDelay) !== isDelayed) {
        return null;
      }

      return {
        OrderID: order.OrderID,
        OrderNumber: order.OrderNumber,
        OrderStatus: order.OrderStatus,
        StatusID: order.StatusID,
        TotalQuantity: order.TotalQuantity,
        TotalAmount: totalAmount.toFixed(2),
        AdvanceAmount: totalAdvanceAmount.toFixed(2),
        BalanceAmount: balanceAmount.toFixed(2),
        DeliveryDate: order.DeliveryDate,
        StatusDeliveryDate: order.StatusDeliveryDate,
        SubStatusId: order.SubStatusId,
        // ReferedBy:order.ReferedBy,
        // SubReference:order.SubReference,
        ProjectTypeID:order.ProjectTypeID,
        ReferredByID:order.ReferredByID,
        ReferedBy: order.ReferedBy,
        SubReference: order.SubReference,
        ReferredByID: order.ReferredByID,
        SubReferenceID: order.SubReferenceID,
        ReferenceName: order.ReferredBy?.name || null,
        ParentReferenceName: order.ReferredBy?.parent?.name || null,

        UserID: order.UserID,
        Type: order.Type,
        Comments: order.Comments,
        DesginerName: order.DesginerName,
        OrderDate: order.OrderDate,
        StoreID: order.StoreID,
        CustomerName: `${order.Customer.FirstName} ${order.Customer.LastName}`, 
        Email: order.Customer.Email, 
        Phone: order.Customer.PhoneNumber, 
        CustomerID: order.Customer.CustomerID,
        OntimeorDelay: isDelayed,
      };
    }));

    const filteredOrders = modifiedOrders.filter(order => order !== null);
    const totalPages = pageNumber && pageSize ? Math.ceil(totalCount / pageSize) : null;

    res.status(200).json({
      StatusCode: 'SUCCESS',
      message: 'Orders fetched successfully',
      totalRecords: filteredOrders.length,
      totalPages,
      totalItems: totalCount,
      currentPage: pageNumber ? parseInt(pageNumber, 10) : null,
      data: filteredOrders
    });

  } catch (error) {
    console.error('Error fetching all orders:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};



exports.getOrderById = async (req, res) => {
  const { OrderID } = req.params;

  try {
    // Fetch the order details with related customer and address
    const order = await OrderTabelModel.findByPk(OrderID, {
      include: [
        { 
          model: CustomerModel, attributes: ['CustomerID', 'FirstName', 'LastName', 'Email', 'PhoneNumber', 'Gender'] ,as:'Customer'
        },
        { 
          model: AddressModel, as: 'Address',  include: [
            {
              model: CityModel, 
              as: 'City',
              attributes: ['CityName']
            },
            {
              model: StateModel, 
              as: 'State',
              attributes: ['StateName']
            },
            {
              model: CountryModel, 
              as: 'Country',
              attributes: ['CountryName']
            }
          ],attributes: ['AddressLine1', 'AddressLine2','ZipCode' ] 
        },
        {
          model: ReferenceModel,
          as: 'ReferredBy',
          attributes: ['id', 'name', 'parentId'],
          include: [{
              model: ReferenceModel,
              as: 'parent',
              attributes: ['name']
          }]
      },
        { 
          model: UserManagementModel, as: 'User', attributes: ['UserID', 'FirstName', 'LastName','RoleID'] 
        },
        { 
          model: StoreModel, as: 'StoreTabel', attributes: ['StoreID', 'StoreName', 'StoreCode'] 
        }
      ],
      attributes: [
        'OrderID', 'OrderNumber', 'OrderStatus', 'StatusID', 'TotalQuantity', 'TotalAmount', 'DeliveryDate', 'ProjectTypeID', 'ReferredByID','SubReference' ,'ReferedBy','SubReferenceID',
        'Type', 'Comments', 'DesginerName', 'CreatedAt', 'OrderDate', 'StoreID', 'StatusDeliveryDate','ExpectedDurationDays','ReferedBy','AddressID','SubStatusId'
      ],
    });

    // If the order doesn't exist, return a 404 response
    if (!order) {
      return res.status(404).json({ error: 'Order not found.' });
    }

    // Fetch all payments related to this order
    const payments = await Payment.findAll({
      where: { OrderID }
    });

    // Sum the advance amounts from all the payments
    const totalAdvanceAmount = payments.reduce((sum, payment) => sum + parseFloat(payment.Amount), 0);

    // Calculate the balance amount
    const totalAmount = parseFloat(order.TotalAmount);
    const balanceAmount = totalAmount - totalAdvanceAmount;

    // Structuring the order response
    const formattedOrder = {
      OrderID: order.OrderID,
      OrderNumber: order.OrderNumber,
      OrderStatus: order.OrderStatus,
      StatusID: order.StatusID,
      TotalQuantity: order.TotalQuantity,
      DeliveryDate: order.DeliveryDate,
      Type: order.Type,
      ProjectTypeID:order.ProjectTypeID,
      Comments: order.Comments,
      OrderDate: order.OrderDate,
      DesginerName: order.DesginerName,
      ExpectedDurationDays: order.ExpectedDurationDays,
      CreatedAt: order.CreatedAt,
      SubStatusId: order.SubStatusId,
      // ReferedBy:order.ReferedBy,
      // SubReference:order.SubReference,

      ReferedBy: order.ReferedBy,
      SubReference: order.SubReference,
      ReferredByID: order.ReferredByID,
      SubReferenceID: order.SubReferenceID,
      ReferenceName: order.ReferredBy?.name || null,
      // ParentReferenceName: customer.ReferredBy?.parent?.name || null,

      ProjectTypeID:order.ProjectTypeID,
      StatusDeliveryDate: order.StatusDeliveryDate,
      CustomerID: order.Customer?.CustomerID || null,
      CustomerFirstName: order.Customer?.FirstName|| null,
      CustomerLastName:order.Customer?.LastName|| null,
      CustomerEmail: order.Customer?.Email || null,
      PhoneNumber: order.Customer?.PhoneNumber || null,
      Gender: order.Customer?.Gender || null,
      StoreID: order.StoreTabel?.StoreID || null,
      StoreName: order.StoreTabel?.StoreName || null,
      StoreCode: order.StoreTabel?.StoreCode || null,
      DesginerID:order.User?.UserID || null,
      DesginerFirstName:order.User?.FirstName || null,
      DesginerLastName:order.User?.LastName || null,
      RoleID:order.User?.RoleID || null,
      AddressID: order.AddressID || null,
      AddressLine1: order.Address?.AddressLine1 || null,
      AddressLine2: order.Address?.AddressLine2 || null,
      CityName: order.Address?.City.CityName || null,
      State: order.Address?.State.StateName || null,
      Country: order.Address?.Country.CountryName || null,
      ZipCode: order.Address?.ZipCode || null,
      TotalAmount: totalAmount.toFixed(2),
      AdvanceAmount: totalAdvanceAmount.toFixed(2),
      BalanceAmount: balanceAmount.toFixed(2),
    };

    res.status(200).json({
      StatusCode: 'SUCCESS',
      message: 'Order fetched by ID successfully.',
      order: formattedOrder,
    });

  } catch (error) {
    console.error('Error fetching order by ID:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};


// Function to update sub-order status
exports.updateSubOrderStatus = async (req, res) => {
  let { OrderID, SubStatusId } = req.body;

  SubStatusId = parseInt(SubStatusId,10);

  if (!OrderID || !SubStatusId) {
    return res.status(400).json({ error: 'OrderID and SubStatusId are required.' });
  }

  try {
    // Find the order by OrderID
    const order = await OrderTabelModel.findOne({ where: { OrderID: OrderID } });

    if (!order) {
      return res.status(404).json({ error: 'Order not found.' });
    }

    // Update SubStatusId and SubStatusUpdatedDate
    await order.update({
      SubStatusId: SubStatusId,
      SubStatusUpdatedDate: new Date(), 
    });

    // Check if SubStatusId is 3 to trigger the payment email notification
    if (SubStatusId === 3) {
      await triggerPaymentEmail(OrderID);
    }

    return res.status(200).json({
      StatusCode: 'SUCCESS',
      message: 'Order sub-status updated successfully',
      data: order
    });

  } catch (error) {
    console.error('Error updating sub-status:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// Function to handle the email notification for StatusID 11
async function triggerPaymentEmail(OrderID) {
    try {
        const orderHistory = await OrderHistory.findAll({
            where: { OrderID, StatusID: 8 }
        });
        if (!orderHistory || orderHistory.length === 0) {
            throw new Error('No matching order with StatusID 7 found.');
        }

        const order = await OrderTabelModel.findOne({ where: { OrderID } });
        const customer = await CustomerModel.findOne({ where: { CustomerID: order.CustomerID } });
                       
        const payments = await Payment.findAll({ where: { OrderID } });
        const totalAdvanceAmount = payments.reduce((sum, payment) => sum + parseFloat(payment.Amount), 0);
        const totalAmount = parseFloat(order.TotalAmount);
        const balanceAmount = totalAmount - totalAdvanceAmount;

        // Fetch the store information using StoreID from the order
        const store = await StoreModel.findOne({
            where: { StoreID: order.StoreID },
            attributes: ['StoreID', 'StoreName']
        });

        if (!store) {
            throw new Error('Store not found.');
        }

        const { StoreName } = store.dataValues;

        const emailData = {
            customerFirstName: customer.FirstName,
            customerEmail: customer.Email,
            OrderNumber: order.OrderNumber,
            OrderDate: order.OrderDate,
            Type: order.Type,
            TotalAmount: totalAmount.toFixed(2),
            AdvanceAmount: totalAdvanceAmount.toFixed(2),
            BalanceAmount: balanceAmount.toFixed(2),
            StoreName: StoreName,
        };
        
        await sendTemplateEmail('PaymentReceived', emailData);
    } catch (error) {
        console.error('Error triggering payment email:', error);
    }
}

exports.triggerAdvanceMeasurementPaymentEmail = async (req, res) => {
  try {
      // Get OrderID from request
      const OrderID = req.query.OrderID || req.body.OrderID;

      if (!OrderID || isNaN(OrderID)) {
          return res.status(400).json({ success: false, message: 'Invalid or missing OrderID.' });
      }


      // Fetch the full order details including customer info
      const order = await OrderTabelModel.findOne({
          where: { OrderID: parseInt(OrderID, 10) },
          include: [
              {
                  model: CustomerModel, as: 'Customer',
                  attributes: ['FirstName', 'Email']
              },
              {
                  model: StoreModel, as: 'StoreTabel',
                  attributes: ['StoreName']
              }
          ]
      });

      if (!order) {
          return res.status(404).json({ success: false, message: 'Order not found.' });
      }

      if (!order.Customer || !order.Customer.Email) {
          return res.status(404).json({ success: false, message: 'Customer email not found for this order.' });
      }


      // Calculate 30% of the total amount
      const totalAmount = parseFloat(order.TotalAmount);
      if (isNaN(totalAmount) || totalAmount <= 0) {
          return res.status(400).json({ success: false, message: 'Invalid total amount for the order.' });
      }
      const advanceAmount = totalAmount * 0.30;

      // Prepare email data
      const emailData = {
          customerFirstName: order.Customer.FirstName,
          customerEmail: order.Customer.Email,
          OrderNumber: order.OrderNumber,
          OrderDate: order.OrderDate,
          Type: order.Type,
          TotalAmount: totalAmount.toFixed(2),
          AdvanceAmount: advanceAmount.toFixed(2),
          StoreName: order.StoreTabel?.StoreName || 'Unknown Store',
          PaymentInstructions: 'Please pay 30% advance amount to start production.',
          PaymentDueDate: calculateDueDate()
      };


      // Send email
      try {
          await sendTemplateEmail('AdvancePaymentTemplate', emailData);
      } catch (emailError) {
          return res.status(500).json({ success: false, message: 'Failed to send email.', error: emailError.message });
      }

      // Send response back to the client
      return res.status(200).json({ success: true, message: 'Advance payment email triggered successfully.' });
  } catch (error) {
      console.error('Error triggering advance payment email:', error.message);
      return res.status(500).json({ success: false, message: 'An error occurred.', error: error.message });
  }
};

// Helper function to calculate the due date
function calculateDueDate() {
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 7);
  return dueDate.toISOString().split('T')[0];
}

exports.schedulePreDeliveryNotifications = async (req, res) => {
  console.log('Scheduling pre-delivery notification job');
  
  try {
    //cron.schedule('*/10 * * * * *', async () => {
      //cron.schedule('0 */2 * * *', async () => {
      cron.schedule('0 0 */2 * * *', async () => {
      console.log('CRON JOB TRIGGERED: Running pre-delivery notification job');
      console.log('Current Time:', new Date().toLocaleString());
      
      const targetDeliveryDate = moment().add(7, 'days').startOf('day');
      const nextDay = moment().add(8, 'days').startOf('day');
      
      console.log('Checking orders with delivery date:', targetDeliveryDate.format('YYYY-MM-DD'));
      
      const ordersNearingDelivery = await OrderTabelModel.findAll({
        where: {
          StatusID: 8,
          SubStatusId: 3,
          DeliveryDate: {
            [Op.gte]: targetDeliveryDate.toDate(),
            [Op.lt]: nextDay.toDate()
          }
        },
        include: [{
          model: CustomerModel,
          as: 'Customer',
          attributes: ['CustomerID', 'FirstName', 'Email']
        }]
      });
      
      let successCount = 0;
      let failedCount = 0;
      
      for (const order of ordersNearingDelivery) {
        try {
          await triggerPreDeliveryNotificationEmail(order);
          successCount++;
        } catch (emailError) {
          failedCount++;
          console.error(`Failed to send notification for order ${order.id}:`, emailError);
        }
      }
      
      console.log(`Successfully sent ${successCount} out of ${ordersNearingDelivery.length} pre-delivery notifications`);

      // Send response to postman
      return res.status(200).json({
        status: 'success',
        message: 'Pre-delivery notificationEmail send successfully',
        data: {
          totalOrders: ordersNearingDelivery.length,
          emailsSent: successCount,
          emailsFailed: failedCount,
          processedAt: new Date().toISOString()
        }
      });
    });
    
    console.log('Pre-delivery notification job scheduled successfully');
  } catch (error) {
    console.error('FATAL ERROR in pre-delivery notification job:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to process pre-delivery notifications',
      error: error.message
    });
  }
};

const triggerPreDeliveryNotificationEmail = async (order) => {
  try {
    if (!order || !order.Customer) {
      console.error('Invalid order or customer data');
      return;
    }

    // Prepare email data for template
    const emailData = {
      customerFirstName: order.Customer.FirstName,
      customerEmail: order.Customer.Email,
      OrderNumber: order.OrderNumber,
      OrderDate: moment(order.OrderDate).format('MMMM Do, YYYY'),
      DeliveryDate: moment(order.DeliveryDate).format('MMMM Do, YYYY'),
      TotalAmount: parseFloat(order.TotalAmount).toFixed(2),
      PreDeliveryInstructions: 'Production is completed, and your order will be ready for PDI (Pre-Delivery Inspection) within the next 7 days.'
    };

    try {
      // Send email using template
      await sendTemplateEmail('PreDeliveryNotificationEmail', emailData);

      console.log(`Pre-delivery notification sent to ${order.Customer.Email} for Order #${order.OrderNumber}`);
    } catch (emailError) {
      console.error(`Failed to send pre-delivery notification for Order #${order.OrderNumber}:`, emailError);
    }
  } catch (error) {
    console.error(`Error processing pre-delivery notification for Order #${order.OrderNumber}:`, error);
  }
};

