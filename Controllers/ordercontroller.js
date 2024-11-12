const {   UserManagementModel,OrderTabelModel , CustomerModel, AddressModel, Payment,OrderHistory, OrderStatusModel, sequelize ,StoreModel,CityModel,StateModel,CountryModel } = require('../ConnectionDB/Connect');
const { Sequelize, DataTypes } = require('sequelize');
const multer = require('multer');
const { storage } = require('../middleware/Cloundinary');
const { Op } = require('sequelize'); 
const moment = require('moment'); 
const ExcelJS = require('exceljs');
const { sendTemplateEmail } = require('../middleware/SendEmail'); 
const { sendSMS } = require('../middleware/twilioConfig');

const upload = multer({ storage: storage }).fields([
  { name: 'UploadImages', maxCount: 10 },   
]);


exports.createOrderOrUpdate = async (req, res) => {
  const {
    OrderID,  // New field to check if the order exists for updating
    TenantID,
    CustomerID,
    AddressID, // AddressID is now mandatory for both create and update
    OrderDate,
    TotalQuantity,
    TotalAmount,
    OrderStatus,
    OrderBy,
    DeliveryDate,
    Type,
    Comments,
    UserID,
    AssignTo,
    StatusDeliveryDate,
    ReferedBy,
    ExpectedDurationDays,
    DesginerName,
    StoreCode,  // Ensure this is included for both create and update
    SubStatusId,
    StoreID
  } = req.body;

  const transaction = await sequelize.transaction();

  try {
    const customerIdToUse = parseInt(CustomerID);
    const addressIdToUse = parseInt(AddressID);

    if (!StoreCode) {
      return res.status(400).json({ error: 'StoreCode is required' });
    }

    if (isNaN(customerIdToUse) || isNaN(addressIdToUse)) {
      return res.status(400).json({ error: 'Invalid CustomerID or AddressID' });
    }

    // Validate the customer exists
    const customer = await CustomerModel.findByPk(customerIdToUse);
    if (!customer) {
      return res.status(200).json({ error: 'CustomerID not found.' });
    }
    const Store = await StoreModel.findByPk(StoreID);
    if (!Store) {
      return res.status(200).json({ error: 'StoreID not found.' });
    }

    // Validate the address exists for the customer and include associations
    const existingAddress = await AddressModel.findOne({
      where: {
        AddressID: addressIdToUse,
        CustomerID: customerIdToUse,
      },
      include: [
        { model: CityModel, as: 'City' },
        { model: StateModel, as: 'State' },
        { model: CountryModel, as: 'Country' },
      ],
    });

    if (!existingAddress) {
      return res.status(200).json({ error: 'Address not found for the given CustomerID.' });
    }

    let newOrder;
    let operationMessage;  // Message to differentiate between create and update
    let emailTemplate;     // Variable for email template

    // Add 3 days to current date for StatusDeliveryDate
    const updatedStatusDeliveryDate = new Date();
    updatedStatusDeliveryDate.setDate(updatedStatusDeliveryDate.getDate() + 3);

    if (OrderID) {
      // Scenario 1: Update an existing order if OrderID is provided
      newOrder = await OrderTabelModel.findOne({
        where: {
          OrderID,
          CustomerID: customerIdToUse,
          AddressID: addressIdToUse,  // Ensure the update is based on OrderID, CustomerID, and AddressID
        },
        include: [
          {
            model: StoreModel, 
            as: 'StoreTabel',
            attributes: ['StoreName','StoreID']
          },
        ]  
      });

      if (!newOrder) {
        return res.status(200).json({ error: 'Order not found for the given CustomerID and AddressID.' });
      }

      // Update the existing order
      await newOrder.update({
        TenantID,
        CustomerID: customerIdToUse,
        AddressID: addressIdToUse,
        OrderDate,
        TotalQuantity,
        TotalAmount,
        OrderStatus,
        OrderBy,
        DeliveryDate,
        Type,
        Comments,
        ReferedBy,
        DesginerName,
        StoreID,
        UserID,
        // StatusDeliveryDate: updatedStatusDeliveryDate, // Use updated date
        ExpectedDurationDays,
        StoreCode,
        SubStatusId,
        UpdatedBy: OrderBy,
        UpdatedAt: new Date(),
      }, { transaction });

      const orderNumber = `IM/${StoreCode}/${newOrder.OrderID}`;
      await newOrder.update({ OrderNumber: orderNumber }, { transaction });

      operationMessage = 'Order updated successfully';
      emailTemplate = 'UpdateOrder';  

    } else {
      // Scenario 2: Create a new order if OrderID is not provided
      newOrder = await OrderTabelModel.create({
        TenantID,
        CustomerID: customerIdToUse,
        AddressID: addressIdToUse,  // Create the order for a specific AddressID
        TotalQuantity,
        TotalAmount,
        OrderStatus: 'Quick Quote',
        SubStatusId: 0,
        OrderBy,
        DeliveryDate,
        Type,
        Comments,
        ReferedBy,
        DesginerName,
        StoreID,
        UserID,
        ExpectedDurationDays,
        StoreCode,
        StatusDeliveryDate: updatedStatusDeliveryDate, // Use updated date
        CreatedBy: OrderBy,
        CreatedAt: new Date(),
        UpdatedBy: OrderBy,
        UpdatedAt: new Date(),
      }, { transaction });

      // Create an entry in OrderHistory for the new order
      await OrderHistory.create({
        OrderID: newOrder.OrderID,
        TenantID,
        UserID,
        OrderStatus: newOrder.OrderStatus,
        StatusID: 1,
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
      const orderNumber = `IM/${StoreCode}/${newOrder.OrderID}`;
      await newOrder.update({ OrderNumber: orderNumber }, { transaction });

      operationMessage = 'Order created successfully';
      emailTemplate = 'CreateOrder';  // Use a create-specific email template
    }

    // Use existingAddress as address
    const address = existingAddress;

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
      Type: Type,
      StoreID: newOrder.StoreID,
      StoreName: Store.StoreName,
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
    };

    // Send Email and SMS Notifications
    sendTemplateEmail(emailTemplate, orderDetails);  // Send Email based on the operation
    // sendSMS(orderDetails.customerPhone, message);    // Send SMS

    await transaction.commit();

    res.status(200).json({
      StatusCode: 'SUCCESS',
      message: operationMessage,
      OrderID: newOrder.OrderID,
      OrderNumber: newOrder.OrderNumber || `IM/${StoreCode}/${newOrder.OrderID}`,
    });

  } catch (error) {
    await transaction.rollback();
    console.error('Error creating/updating order:', error);
    res.status(500).json({ error: 'Internal Server Error' });
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
    StoreID, 
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

    // Apply StoreID filter
    if (StoreID && StoreID > 0) {
      queryConditions = { 
        ...queryConditions, 
        StoreID: StoreID 
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

    if (StartDate && EndDate) {
      const startDate = moment(StartDate).startOf('day').toDate();
      const endDate = moment(EndDate).endOf('day').toDate();
    
      queryConditions = {
        ...queryConditions,
        CreatedAt: { [Op.between]: [startDate, endDate] } // Apply the date range only to CreatedAt field
      };
    }
    

    const totalCount = await OrderTabelModel.count({
      where: queryConditions,
      include: [{ model: CustomerModel, as: 'Customer' }] // Include customer for counting total results
    });

    // Initialize options for the query
    let options = {
      where: queryConditions,
      include: [
        {
          model: CustomerModel, as: 'Customer',
          attributes: ['CustomerID', 'FirstName', 'LastName', 'Email', 'PhoneNumber']
        }
      ],
      attributes: ['OrderID', 'OrderNumber', 'OrderStatus', 'StatusID', 'TotalQuantity', 'TotalAmount', 'DeliveryDate', 'Type', 'Comments', 'DesginerName', 'CreatedAt', 'OrderDate', 'StoreID', 'StatusDeliveryDate', 'SubStatusId','UserID' ], 
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
      // Fetch all payments related to this order
      const payments = await Payment.findAll({
        where: { OrderID: order.OrderID }
      });

      // Sum the advance amounts from all the payments
      const totalAdvanceAmount = payments.reduce((sum, payment) => sum + parseFloat(payment.Amount), 0);

      // Calculate the balance amount
      const totalAmount = parseFloat(order.TotalAmount);
      const balanceAmount = totalAmount - totalAdvanceAmount;

      let statusDeliveryDate = moment(order.StatusDeliveryDate);
      let today = moment().startOf('day'); // Get the current date (starting from midnight)

      // Check if the StatusDeliveryDate is before today (delay) or on/after today (on time)
      let isDelayed = statusDeliveryDate.isBefore(today) ? 2 : 1; // 2 = delayed, 1 = on time

      // Filter orders based on OntimeorDelay if provided
      if (OntimeorDelay && parseInt(OntimeorDelay) !== isDelayed) {
        return null; // Skip if doesn't match OntimeorDelay filter
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
        UserID:order.UserID,
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

    const filteredOrders = modifiedOrders.filter(order => order !== null); // Remove null entries (filtered by OntimeorDelay)
    const totalPages = pageNumber && pageSize ? Math.ceil(totalCount / pageSize) : null;

    // Send the response
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
          model: UserManagementModel, as: 'User', attributes: ['UserID', 'FirstName', 'LastName','RoleID'] 
        },
        { 
          model: StoreModel, as: 'StoreTabel', attributes: ['StoreID', 'StoreName', 'StoreCode'] 
        }
      ],
      attributes: [
        'OrderID', 'OrderNumber', 'OrderStatus', 'StatusID', 'TotalQuantity', 'TotalAmount', 'DeliveryDate', 
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
      Comments: order.Comments,
      OrderDate: order.OrderDate,
      DesginerName: order.DesginerName,
      ExpectedDurationDays: order.ExpectedDurationDays,
      ReferedBy: order.ReferedBy,
      CreatedAt: order.CreatedAt,
      SubStatusId:order.SubStatusId,
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
  const { OrderID, SubStatusId } = req.body;

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

    // Check if SubStatusId is 4 to trigger the payment email notification
    if (SubStatusId === 4) {
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
            where: { OrderID, StatusID: 7 }
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

