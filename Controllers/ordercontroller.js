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
    let projectTypeImage = null;

    if (ProjectTypeID) {
      projectType = await ProjectTypeModel.findByPk(ProjectTypeID);
      if (!projectType) throw new Error("Project type not found.");
      // Fetch the image URL
      projectTypeImage = projectType.FileUrl;
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

     // Logic to check and update customer `isConfirmed` status and `CustomerNumber` prefix
    if (!customer.isConfirmed) {
       // Count all customers with `isConfirmed: true`
       const isConfirmedTotalCount = await CustomerModel.count({
      where: { isConfirmed: true },
    });

     // Update current customer's `isConfirmed` to true
       const newCustomerNumber = `${customer.CustomerNumber}/${isConfirmedTotalCount + 1}`;
       await customer.update(
       { isConfirmed: true, CustomerNumber: newCustomerNumber },
       { transaction }
      );
    }

    // Ensure prefix of `CustomerNumber` is updated from `IS` to `IM`
    const updatedCustomerNumber = customer.CustomerNumber.replace(/^IS/, "IM");
    await customer.update({ CustomerNumber: updatedCustomerNumber }, { transaction });


    // const updatedCustomerNumber = customer.CustomerNumber.replace(/^IS/, "IM");
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
      ProjectTypeImageUrl: projectTypeImage, 
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



// exports.getAllOrders = async (req, res) => {
//   const { 
//     pageNumber, 
//     pageSize, 
//     searchText = '', 
//     StoreIDs, // Array of Store IDs
//     StatusID, 
//     SubStatusId,
//     StartDate, 
//     EndDate, 
//     OntimeorDelay 
//   } = req.query;

//   try {
//     // Initialize query object
//     let queryConditions = {};

//     // Apply search text filter (on OrderNumber, DesignerName, Customer FirstName, or LastName)
//     if (searchText) {
//       queryConditions = {
//         ...queryConditions,
//         [Op.or]: [
//           { OrderNumber: { [Op.iLike]: `%${searchText}%` } },
//           { DesginerName: { [Op.iLike]: `%${searchText}%` } },
//           { '$Customer.FirstName$': { [Op.iLike]: `%${searchText}%` } }, 
//           { '$Customer.LastName$': { [Op.iLike]: `%${searchText}%` } },  
//         ]
//       };
//     }

//     // Apply StoreIDs filter (handle array)
//     if (StoreIDs && StoreIDs.length > 0) {
//       const storeIdsArray = Array.isArray(StoreIDs) ? StoreIDs : StoreIDs.split(','); // Ensure it's an array
//       queryConditions = { 
//         ...queryConditions, 
//         StoreID: { [Op.in]: storeIdsArray } // Use [Op.in] to filter by array of StoreIDs
//       };
//     }

//     // Apply StatusID filter
//     if (StatusID && StatusID > 0) {
//       queryConditions = {
//         ...queryConditions,
//         StatusID: StatusID
//       };
//     }

//     // Apply SubStatusId filter
//     if (SubStatusId && SubStatusId > 0) {
//       queryConditions = {
//         ...queryConditions,
//         SubStatusId: SubStatusId
//       };
//     }

//     // Apply date range filter
//     if (StartDate && EndDate) {
//       const startDate = moment(StartDate).startOf('day').toDate();
//       const endDate = moment(EndDate).endOf('day').toDate();
//       queryConditions = {
//         ...queryConditions,
//         CreatedAt: { [Op.between]: [startDate, endDate] }
//       };
//     }

//     // Get total count for pagination
//     const totalCount = await OrderTabelModel.count({
//       where: queryConditions,
//       include: [{ model: CustomerModel, as: 'Customer' }]
//     });

//     // Initialize options for the query
//     let options = {
//       where: queryConditions,
//       include: [
//         {
//           model: CustomerModel, as: 'Customer',
//           attributes: ['CustomerID', 'FirstName', 'LastName', 'Email', 'PhoneNumber']
//         },
//         {
//           model: ReferenceModel,
//           as: 'ReferredBy',
//           attributes: ['id', 'name', 'parentId'],
//           include: [{
//               model: ReferenceModel,
//               as: 'parent',
//               attributes: ['name']
//           }]
//       }
//       ],
//       attributes: ['OrderID', 'OrderNumber', 'OrderStatus', 'StatusID', 'TotalQuantity', 'TotalAmount', 'DeliveryDate', 'Type', 'Comments', 'DesginerName', 'CreatedAt', 'OrderDate', 'StoreID', 'StatusDeliveryDate', 'SubStatusId','UserID','ProjectTypeID', 'ReferredByID',"SubReference" ,"ReferedBy"], 
//       order: [
//         [Sequelize.literal('GREATEST("OrdersTable"."CreatedAt", "OrdersTable"."UpdatedAt")'), 'DESC'],
//         ['DesginerName', 'ASC']
//       ],
//       distinct: true
//     };

//     // Apply pagination if pageNumber and pageSize are provided
//     if (pageNumber && pageSize) {
//       const offset = (parseInt(pageNumber, 10) - 1) * parseInt(pageSize, 10);
//       options = {
//         ...options,
//         limit: parseInt(pageSize, 10),
//         offset: offset
//       };
//     }

//     const orders = await OrderTabelModel.findAndCountAll(options);
    
//     // Calculate payments and balance for each order
//     const modifiedOrders = await Promise.all(orders.rows.map(async (order) => {
//       const payments = await Payment.findAll({
//         where: { OrderID: order.OrderID }
//       });

//       const totalAdvanceAmount = payments.reduce((sum, payment) => sum + parseFloat(payment.Amount), 0);
//       const totalAmount = parseFloat(order.TotalAmount);
//       const balanceAmount = totalAmount - totalAdvanceAmount;

//       const statusDeliveryDate = moment(order.StatusDeliveryDate);
//       const today = moment().startOf('day');
//       const isDelayed = statusDeliveryDate.isBefore(today) ? 2 : 1;

//       if (OntimeorDelay && parseInt(OntimeorDelay) !== isDelayed) {
//         return null;
//       }

//       return {
//         OrderID: order.OrderID,
//         OrderNumber: order.OrderNumber,
//         OrderStatus: order.OrderStatus,
//         StatusID: order.StatusID,
//         TotalQuantity: order.TotalQuantity,
//         TotalAmount: totalAmount.toFixed(2),
//         AdvanceAmount: totalAdvanceAmount.toFixed(2),
//         BalanceAmount: balanceAmount.toFixed(2),
//         DeliveryDate: order.DeliveryDate,
//         StatusDeliveryDate: order.StatusDeliveryDate,
//         SubStatusId: order.SubStatusId,
//         // ReferedBy:order.ReferedBy,
//         // SubReference:order.SubReference,
//         ProjectTypeID:order.ProjectTypeID,
//         ReferredByID:order.ReferredByID,
//         ReferedBy: order.ReferedBy,
//         SubReference: order.SubReference,
//         ReferredByID: order.ReferredByID,
//         SubReferenceID: order.SubReferenceID,
//         ReferenceName: order.ReferredBy?.name || null,
//         ParentReferenceName: order.ReferredBy?.parent?.name || null,

//         UserID: order.UserID,
//         Type: order.Type,
//         Comments: order.Comments,
//         DesginerName: order.DesginerName,
//         OrderDate: order.OrderDate,
//         StoreID: order.StoreID,
//         CustomerName: `${order.Customer.FirstName} ${order.Customer.LastName}`, 
//         Email: order.Customer.Email, 
//         Phone: order.Customer.PhoneNumber, 
//         CustomerID: order.Customer.CustomerID,
//         OntimeorDelay: isDelayed,
//       };
//     }));

//     const filteredOrders = modifiedOrders.filter(order => order !== null);
//     const totalPages = pageNumber && pageSize ? Math.ceil(totalCount / pageSize) : null;

//     res.status(200).json({
//       StatusCode: 'SUCCESS',
//       message: 'Orders fetched successfully',
//       totalRecords: filteredOrders.length,
//       totalPages,
//       totalItems: totalCount,
//       currentPage: pageNumber ? parseInt(pageNumber, 10) : null,
//       data: filteredOrders
//     });

//   } catch (error) {
//     console.error('Error fetching all orders:', error);
//     res.status(500).json({ error: 'Internal Server Error' });
//   }
// };

exports.getAllOrders = async (req, res) => {
  const { 
    pageNumber, 
    pageSize, 
    searchText = '', 
    StoreIDs,
    StatusID, 
    SubStatusId,
    StartDate, 
    EndDate, 
    OntimeorDelay 
  } = req.query;

  try {
    // Previous query conditions remain the same...
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

    // ... (keep all the existing query condition logic)

    // Get total count for pagination
    const totalCount = await OrderTabelModel.count({
      where: queryConditions,
      include: [{ model: CustomerModel, as: 'Customer' }]
    });

    // Modify the include array to include UserManagement model
    let options = {
      where: queryConditions,
      include: [
        {
          model: CustomerModel, 
          as: 'Customer',
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
      attributes: [
        'OrderID', 'OrderNumber', 'OrderStatus', 'StatusID', 'TotalQuantity', 
        'TotalAmount', 'DeliveryDate', 'Type', 'Comments', 'DesginerName', 
        'CreatedAt', 'OrderDate', 'StoreID', 'StatusDeliveryDate', 'SubStatusId',
        'UserID', 'ProjectTypeID', 'ReferredByID', "SubReference", "ReferedBy"
      ],
      order: [
        [Sequelize.literal('GREATEST("OrdersTable"."CreatedAt", "OrdersTable"."UpdatedAt")'), 'DESC'],
        ['DesginerName', 'ASC']
      ],
      distinct: true
    };

    // Apply pagination if provided
    if (pageNumber && pageSize) {
      const offset = (parseInt(pageNumber, 10) - 1) * parseInt(pageSize, 10);
      options = {
        ...options,
        limit: parseInt(pageSize, 10),
        offset: offset
      };
    }

    const orders = await OrderTabelModel.findAndCountAll(options);

    // Get all relevant OrderHistory entries with StatusID = 8
    const orderHistoryEntries = await OrderHistory.findAll({
      where: {
        OrderID: orders.rows.map(order => order.OrderID),
        StatusID: 8
      },
      include: [{
        model: UserManagementModel,
        as: 'SubUser',
        attributes: ['UserID', 'FirstName', 'LastName'],
        required: false
      }]
    });

    // Create a map for quick lookup
    const orderHistoryMap = orderHistoryEntries.reduce((acc, history) => {
      acc[history.OrderID] = {
        SubUserID: history.SubUserID,
        SubUserName: history.SubUser ? `${history.SubUser.FirstName} ${history.SubUser.LastName}` : null
      };
      return acc;
    }, {});
    
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

      // Get SubUser information from the map
      const historyInfo = orderHistoryMap[order.OrderID] || {};

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
        ProjectTypeID: order.ProjectTypeID,
        ReferredByID: order.ReferredByID,
        ReferedBy: order.ReferedBy,
        SubReference: order.SubReference,
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
        // Add SubUser information
        SubUserID: historyInfo.SubUserID || null,
        SubUserName: historyInfo.SubUserName || null
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
// exports.updateSubOrderStatus = async (req, res) => {
//   let { OrderID, SubStatusId } = req.body;

//   SubStatusId = parseInt(SubStatusId,10);

//   if (!OrderID || !SubStatusId) {
//     return res.status(400).json({ error: 'OrderID and SubStatusId are required.' });
//   }

//   try {
//     // Find the order by OrderID
//     const order = await OrderTabelModel.findOne({ where: { OrderID: OrderID } });

//     if (!order) {
//       return res.status(404).json({ error: 'Order not found.' });
//     }

//     // Update SubStatusId and SubStatusUpdatedDate
//     await order.update({
//       SubStatusId: SubStatusId,
//       SubStatusUpdatedDate: new Date(), 
//     });

//     // Check if SubStatusId is 3 to trigger the payment email notification
//     if (SubStatusId === 3) {
//       await triggerPaymentEmail(OrderID);
//     }

//     return res.status(200).json({
//       StatusCode: 'SUCCESS',
//       message: 'Order sub-status updated successfully',
//       data: order
//     });

//   } catch (error) {
//     console.error('Error updating sub-status:', error);
//     res.status(500).json({ error: 'Internal Server Error' });
//   }
// };


exports.updateSubOrderStatus = async (req, res) => {
  let { OrderID, SubStatusId, SubUserID } = req.body;
  
  SubStatusId = parseInt(SubStatusId, 10);
  
  if (!OrderID || !SubStatusId) {
    return res.status(400).json({ error: 'OrderID and SubStatusId are required.' });
  }

  try {
    // Start a transaction
    const result = await sequelize.transaction(async (t) => {
      // Find the order by OrderID
      const order = await OrderTabelModel.findOne({ 
        where: { OrderID: OrderID },
        transaction: t
      });

      if (!order) {
        throw new Error('Order not found.');
      }

      // Update order's SubStatusId and SubStatusUpdatedDate
      await order.update({
        SubStatusId: SubStatusId,
        SubStatusUpdatedDate: new Date(),
      }, { transaction: t });

      // Find the specific OrderHistory entry with StatusID 8
      const orderHistory = await OrderHistory.findOne({
        where: {
          OrderID: OrderID,
          StatusID: 8
        },
        include: [{
          model: UserManagementModel,
          as: 'SubUser',
          attributes: ['UserID', 'FirstName', 'LastName']
        }],
        transaction: t
      });

      if (orderHistory) {
        // Update the found OrderHistory record
        await orderHistory.update({
          SubUserID: SubUserID,
          UpdatedAt: new Date(),
          UpdatedBy: req.user?.UserID || 'SYSTEM'
        }, { transaction: t });
      } else {
        console.log(`No OrderHistory record found with StatusID 8 for OrderID: ${OrderID}`);
      }

      return order;
    });

    // If SubStatusId is 3, trigger the payment email notification
    if (SubStatusId === 3) {
      await triggerPaymentEmail(OrderID);
    }

    return res.status(200).json({
      StatusCode: 'SUCCESS',
      message: 'Order sub-status and history updated successfully',
      data: result
    });

  } catch (error) {
    console.error('Error updating sub-status:', error);
    if (error.message === 'Order not found.') {
      return res.status(404).json({ error: error.message });
    }
    return res.status(500).json({ error: 'Internal Server Error' });
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

        const order = await OrderTabelModel.findOne({
           where: { OrderID },
           include: [
            {
                model: ProjectTypeModel,
                as: 'ProjectType', 
                attributes: ['FileUrl']
            }
        ] 
          });
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
         // Get project type image URL
         let ProjectTypeImage = null;
         if (order.ProjectType) {
             ProjectTypeImage = order.ProjectType.FileUrl;
         }

        const emailData = {
            customerFirstName: customer.FirstName,
            customerEmail: customer.Email,
            OrderNumber: order.OrderNumber,
            OrderDate: order.OrderDate,
            Type: order.Type,
            ProjectTypeImageUrl: ProjectTypeImage,
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
              },
              {
                model: ProjectTypeModel,
                as: 'ProjectType',
                attributes: ['FileUrl'] 
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

      // Fetch ProjectTypeImage if available
      const ProjectTypeImage = order.ProjectType?.FileUrl || null;

      // Prepare email data
      const emailData = {
          customerFirstName: order.Customer.FirstName,
          customerEmail: order.Customer.Email,
          OrderNumber: order.OrderNumber,
          OrderDate: order.OrderDate,
          Type: order.Type,
          ProjectTypeImageUrl: ProjectTypeImage,
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


