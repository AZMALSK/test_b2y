const { sequelize, CustomerModel, AddressModel, Orders,StoreModel,CityModel,StateModel,CountryModel ,OrderTabelModel} = require('../ConnectionDB/Connect');
 const { Sequelize, DataTypes } = require('sequelize');
 const { sendTemplateEmail } = require('../middleware/SendEmail'); 
const Address = require('../Models/Address');

 // Create a new Customer
// exports.createOrUpdateCustomer = async (req, res) => {
//     const {
//         CustomerID,
//         TenantID, FirstName, LastName, Email, Password, PhoneNumber, Gender,
//         CreatedBy, UpdatedBy
//     } = req.body;
 
//     try {
//         // Ensure TenantID is provided
//         if (!TenantID) {
//             return res.status(400).json({ error: 'TenantID is required' });
//         }
 
//         if (CustomerID) {
//             // Update existing customer
//             const existingCustomer = await CustomerModel.findByPk(CustomerID);
 
//             if (!existingCustomer) {
//                 return res.status(404).json({ error: 'Customer not found' });
//             }
 
//             // Update customer details
//             await existingCustomer.update({
//                 TenantID,
//                 FirstName,
//                 LastName,
//                 Email,
//                 Password,
//                 PhoneNumber,
//                 Gender,
//                 UpdatedBy
//             });
 
//             return res.status(200).json({
//                 StatusCode: 'SUCCESS',
//                 message: 'Customer updated successfully',
//                 CustomerID: existingCustomer.CustomerID
//             });
//         } else {
//             // Creating a new customer
//             // Check if email already exists
//             const emailExists = await CustomerModel.findOne({ where: { Email } });
//             if (emailExists) {
//                 return res.status(400).json({ error: 'Email already exists' });
//             }
 
//             // Start a transaction (if you need it)
//             const transaction = await sequelize.transaction();
 
//             try {
//                 // Create a new customer
//                 const newCustomer = await CustomerModel.create({
//                     TenantID,
//                     FirstName,
//                     LastName,
//                     Email,
//                     Password,
//                     PhoneNumber,
//                     Gender,
//                     CreatedBy,
//                     UpdatedBy
//                 }, { transaction });
 
//                 // Prepare customer details for the email
//                 const customerDetails = {
//                     customerFirstName: FirstName, // Use FirstName from req.body
//                     customerLastName: LastName,  // Use LastName from req.body
//                     customerEmail: Email  
//                 };
 
//                 // Send the email notification
//                 await sendTemplateEmail('CustomerCreated', customerDetails);
 
//                 // Commit the transaction if all succeeds
//                 await transaction.commit();
 
//                 return res.status(201).json({
//                     StatusCode: 'SUCCESS',
//                     message: 'Customer created successfully',
//                     CustomerID: newCustomer.CustomerID
//                 });
//             } catch (emailError) {
//                 // Rollback transaction if something goes wrong
//                 await transaction.rollback();
//                 console.error('Error sending email:', emailError);
//                 return res.status(500).json({ error: 'Error sending email' });
//             }
//         }
//     } catch (error) {
//         console.error('Error creating or updating customer:', error);
//         res.status(500).json({ error: 'Internal Server Error' });
//     }
// };

exports.createOrUpdateCustomer = async (req, res) => {
    const {
        CustomerID,
        TenantID,
        FirstName,
        LastName,
        Email,
        Password,
        PhoneNumber,
        Alternative_PhoneNumber,
        ReferedBy,
        SubReference,
        Comments,
        Gender,
        StoreID,
        CreatedBy,
        UpdatedBy
    } = req.body;
 
    try {
        // Ensure TenantID is provided
        if (!TenantID) {
            return res.status(400).json({ error: 'TenantID is required' });
        }
 
        if (CustomerID) {
           
            const existingCustomer = await CustomerModel.findByPk(CustomerID);
 
            if (!existingCustomer) {
                return res.status(404).json({ error: 'Customer not found' });
            }
 
            await existingCustomer.update({
                TenantID,
                FirstName,
                LastName,
                Email,
                Password,
                PhoneNumber,
                Alternative_PhoneNumber,
                ReferedBy,
                SubReference:SubReference || 'self',
                Comments,
                Gender,
                StoreID,
                UpdatedAt: new Date(), 
                UpdatedBy
            });
 
            const customerDetails = {
                customerFirstName: FirstName,
                customerLastName: LastName,
                customerEmail: Email,
                FirstName,
                LastName,
                Email,
                PhoneNumber,
                Alternative_PhoneNumber,
                ReferedBy,
                SubReference,
                Comments,
                StoreID,
                Gender
            };
 
            try {
                await sendTemplateEmail('Customer Updated', customerDetails);
                return res.status(200).json({
                    StatusCode: 'SUCCESS',
                    message: 'Customer updated successfully and email sent',
                    CustomerID: existingCustomer.CustomerID
                });
            } catch (emailError) {
                console.error('Error sending update email:', emailError);
                return res.status(500).json({ error: 'Customer updated but error sending email' });
            }
        } else {
           
            const emailExists = await CustomerModel.findOne({ where: { Email } });
            if (emailExists) {
                return res.status(400).json({ error: 'Email already exists' });
            }
            const transaction = await sequelize.transaction();
 
            try {
                // Create a new customer
                const newCustomer = await CustomerModel.create({
                    TenantID,
                    FirstName,
                    LastName,
                    Email,
                    Password,
                    PhoneNumber,
                    Alternative_PhoneNumber,
                    ReferedBy,
                    SubReference:SubReference || 'self',
                    Comments,
                    Gender,
                    CreatedBy,
                    StoreID,
                    CreatedAt: new Date(),
                    UpdatedAt: new Date(),
                    UpdatedBy
                }, { transaction });
 
                // Prepare customer details for the email
                const customerDetails = {
                    customerFirstName: FirstName,
                    customerLastName: LastName,
                    customerEmail: Email
                };
 
                // Send the email notification
                await sendTemplateEmail('CustomerCreated', customerDetails);
 
                await transaction.commit();
 
                return res.status(201).json({
                    StatusCode: 'SUCCESS',
                    message: 'Customer created successfully',
                    CustomerID: newCustomer.CustomerID
                });
            } catch (emailError) {
                await transaction.rollback();
                console.error('Error sending email:', emailError);
                return res.status(500).json({ error: 'Error sending email' });
            }
        }
    } catch (error) {
        console.error('Error creating or updating customer:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
 

//  getAllCustomers function
// exports.getAllCustomers = async (req, res) => {
//     const { page = 1, limit = 10, SearchText = '' } = req.query;

//     try {
//         const offset = (page - 1) * limit;
//         const whereCondition = SearchText
//             ? {
//                 [Sequelize.Op.or]: [
//                     { FirstName: { [Sequelize.Op.iLike]: `%${SearchText}%` } },
//                     { LastName: { [Sequelize.Op.iLike]: `%${SearchText}%` } },
//                     { Email: { [Sequelize.Op.iLike]: `%${SearchText}%` } },
//                     { PhoneNumber: { [Sequelize.Op.iLike]: `%${SearchText}%` } }
//                 ]
//             }
//             : {};

//         const { count, rows: customers } = await CustomerModel.findAndCountAll({
//             include: [{ model: AddressModel, as: 'Address' }], 
//             where: whereCondition,
//             limit: parseInt(limit),
//             offset: parseInt(offset)
//         });

//         const formattedCustomers = customers.map(customer => {
//             const formattedAddresses = (customer.Address || []).map(address => ({
//                 AddressLine1: address.AddressLine1,
//                 AddressLine2: address.AddressLine2,
//                 CityID: address.CityID,
//                 StateID: address.StateID,
//                 CountryID: address.CountryID,
//                 ZipCode: address.ZipCode
//             }));

//             return {
//                 ...customer.toJSON(),
//                 Addresses: formattedAddresses, 
//                 Address: undefined 
//             };
//         });

//         const totalPages = Math.ceil(count / limit);

//         res.status(200).json({
//             StatusCode: 'SUCCESS',
//             currentPage: parseInt(page),
//             totalPages,
//             totalItems: count,
//             customers: formattedCustomers
//         });
//     } catch (error) {
//         console.error('Error fetching customers:', error);
//         res.status(500).json({ error: 'Internal Server Error' });
//     }
// };

exports.getAllCustomers = async (req, res) => {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const StoreID = req.query.StoreID;
    const StartDate = req.query.StartDate;
    const EndDate = req.query.EndDate;

    try {
        const offset = (page - 1) * limit;
        const searchText = Object.keys(req.query).find(key => key.toLowerCase() === 'searchtext');
        const searchValue = req.query[searchText]?.toLowerCase() || '';

        const whereCondition = {
            [Sequelize.Op.and]: [
                searchValue ? {
                    [Sequelize.Op.or]: [
                        { FirstName: { [Sequelize.Op.iLike]: `%${searchValue}%` } },
                        { LastName: { [Sequelize.Op.iLike]: `%${searchValue}%` } },
                        { Email: { [Sequelize.Op.iLike]: `%${searchValue}%` } },
                        { PhoneNumber: { [Sequelize.Op.iLike]: `%${searchValue}%` } }
                    ]
                } : {},
                StoreID ? { StoreID } : {},
                StartDate && EndDate ? {
                    CreatedAt: {
                        [Sequelize.Op.between]: [
                            new Date(StartDate),
                            new Date(EndDate).setUTCHours(23, 59, 59, 999)
                        ]
                    }
                } : {}
            ]
        };

        // Get total count of records that match the search
        const totalCount = await CustomerModel.count({ where: whereCondition });

        // Fetch paginated records
        const customers = await CustomerModel.findAll({
            include: [
                { 
                    model: AddressModel, 
                    as: 'Address',
                    required: false,
                    include: [
                        { model: CityModel, as: 'City', attributes: ['CityName'] },
                        { model: StateModel, as: 'State', attributes: ['StateName'] },
                        { model: CountryModel, as: 'Country', attributes: ['CountryName'] }
                    ]
                },
                { model: StoreModel, as: 'Store', attributes: ['StoreCode', 'StoreName', 'StoreID'] }
            ],
            where: whereCondition,
            limit,
            offset,
            order: [
                [Sequelize.literal('GREATEST("Customer"."CreatedAt", "Customer"."UpdatedAt")'), 'DESC'],
                ['FirstName', 'ASC']
            ]
        });

        // Format the customer and address data
        const formattedCustomers = customers.map(customer => {
            const primaryAddress = customer.Address && customer.Address[0]; // Assuming you want the first address
            
            return {
                CustomerFirstName: customer.FirstName,
                CustomerLastName: customer.LastName,
                CustomerID: customer.CustomerID,
                CustomerEmail: customer.Email,
                PhoneNumber: customer.PhoneNumber,
                Alternative_PhoneNumber: customer.Alternative_PhoneNumber,
                Gender: customer.Gender,
                Comments: customer.Comments,
                ReferedBy: customer.ReferedBy,
                SubReference: customer.SubReference,
                StoreID: customer.Store.StoreID,
                StoreCode: customer.Store.StoreCode,
                StoreName: customer.Store.StoreName,
                AddressID: primaryAddress ? primaryAddress.AddressID : null,
                AddressLine1: primaryAddress ? primaryAddress.AddressLine1 : null,
                AddressLine2: primaryAddress ? primaryAddress.AddressLine2 : null,
                City: primaryAddress?.City?.CityName || 'N/A',
                State: primaryAddress?.State?.StateName || 'N/A',
                Country: primaryAddress?.Country?.CountryName || 'N/A',
                ZipCode: primaryAddress ? primaryAddress.ZipCode : null
            };
        });

        // Calculate total pages based on the filtered records
        const totalPages = Math.ceil(totalCount / limit);

        // Return paginated result with filtered customers
        res.status(200).json({
            StatusCode: 'SUCCESS',
            currentPage: page,
            totalPages,
            totalItems: totalCount,
            customers: formattedCustomers
        });
    } catch (error) {
        console.error('Error fetching customers:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};


// getCustomerById function
exports.getCustomerById = async (req, res) => {
    const { id } = req.params;

    try {
        const customer = await CustomerModel.findOne({
            where: { CustomerID: id },
            include: [{ model: AddressModel, as: 'Address' },
                      { model: StoreModel, as: 'Store' }   
            ]  
        });

        if (!customer) {
            return res.status(404).json({
                StatusCode: 'NOT_FOUND',
                message: 'Customer not found'
            });
        }
        const formattedAddresses = (customer.Address || []).map(address => ({
            AddressID: address.AddressID,
            AddressLine1: address.AddressLine1,
            AddressLine2: address.AddressLine2 || null,  
            CityID: address.CityID,
            StateID: address.StateID,
            CountryID: address.CountryID,
            ZipCode: address.ZipCode
        }));

        const storeDetails = customer.Store ? {
            StoreID: customer.Store.StoreID,
            StoreName: customer.Store.StoreName,
            StoreLocation: customer.Store.StoreLocation
        } : null; 

        return res.status(200).json({
            StatusCode: 'SUCCESS',
            customer: {
                CustomerID: customer.CustomerID,
                TenantID: customer.TenantID,
                FirstName: customer.FirstName,
                LastName: customer.LastName,
                Email: customer.Email,
                Password: customer.Password,
                PhoneNumber: customer.PhoneNumber,
                Alternative_PhoneNumber:customer.PhoneNumber,
                ReferedBy:customer.ReferedBy,
                SubReference:customer.SubReference,
                Comments:customer.Comments,
                Gender: customer.Gender,
                CreatedBy: customer.CreatedBy,
                CreatedAt: customer.createdAt,
                UpdatedBy: customer.UpdatedBy,
                UpdatedAt: customer.updatedAt,
                StoreID:customer.Store.StoreID,
                StoreName: customer.Store.StoreName,
                StoreLocation: customer.Store.StoreLocation,
                Addresses: formattedAddresses  
            }
        });
    } catch (error) {
        console.error('Error fetching customer by ID:', error);
        return res.status(500).json({
            StatusCode: 'ERROR',
            message: 'Internal Server Error'
        });
    }
};

exports.getCustomerByIdWithoutAddress = async (req, res) => {
    const { id } = req.params;

    try {
        const customer = await CustomerModel.findOne({
            where: { CustomerID: id },
            // include: [{ model: AddressModel, as: 'Address' }]  
        });

        if (!customer) {
            return res.status(404).json({
                StatusCode: 'NOT_FOUND',
                message: 'Customer not found'
            });
        }
        

        return res.status(200).json({
            StatusCode: 'SUCCESS',
            customer: {
                CustomerID: customer.CustomerID,
                TenantID: customer.TenantID,
                FirstName: customer.FirstName,
                LastName: customer.LastName,
                Email: customer.Email,
                Password: customer.Password,
                PhoneNumber: customer.PhoneNumber,
                Alternative_PhoneNumber:customer.Alternative_PhoneNumber,
                ReferedBy:customer.ReferedBy,
                SubReference:customer.SubReference,
                Comments:customer.Comments,
                Gender: customer.Gender,
                StoreID:customer.StoreID,
                CreatedBy: customer.CreatedBy,
                CreatedAt: customer.createdAt,
                UpdatedBy: customer.UpdatedBy,
                UpdatedAt: customer.updatedAt,
                
            }
        });
    } catch (error) {
        console.error('Error fetching customer by ID:', error);
        return res.status(500).json({
            StatusCode: 'ERROR',
            message: 'Internal Server Error'
        });
    }
};

exports.deleteCustomer = async (req, res) => {
    const { id } = req.params; 
    const transaction = await sequelize.transaction();

    try {
        // Find the customer by ID
        const customer = await CustomerModel.findOne({ where: { CustomerID: id } }, { transaction });

        if (!customer) {
            await transaction.rollback();
            return res.status(404).json({
                StatusCode: 'NOT_FOUND',
                message: 'Customer not found'
            });
        }

        // Delete associated addresses
        await AddressModel.destroy({ where: { CustomerID: id } }, { transaction });

        // Delete the customer
        await CustomerModel.destroy({ where: { CustomerID: id } }, { transaction });

        await transaction.commit();

        res.status(200).json({
            StatusCode: 'SUCCESS',
            message: 'Customer deleted successfully'
        });
    } catch (error) {
        await transaction.rollback();
        console.error('Error deleting customer:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

// exports.getOrderByCustomerId = async (req, res) => {
//     const { id } = req.params;  
  
//     try {
//       // Fetch orders for the given CustomerID
//       const orders = await OrderTabelModel.findAll({
//         where: { CustomerID: id }, 
//         include: [
//           {
//             model: CustomerModel, as:'Customer',
//             include: [
//               { model: AddressModel, as: 'Address' },
//               { model: StoreModel, as: 'Store' }  
//             ],
//           },
//         ],
//       });
  
//       if (!orders || orders.length === 0) {
//         return res.status(200).json({ message: 'No orders available for this customer.' });
//       }
  
//       res.status(200).json({
//         StatusCode: 'SUCCESS',
//         message: 'Orders fetched successfully by Customer ID',
//         orders,
//       });
  
//     } catch (error) {
//       console.error('Error fetching orders by Customer ID:', error);
//       res.status(500).json({ error: 'Internal Server Error' });
//     }
//   };
  


exports.getOrderByCustomerId = async (req, res) => {
    const { id } = req.params;  
  
    try {
      // Fetch orders for the given CustomerID
      const orders = await OrderTabelModel.findAll({
        where: { CustomerID: id }, 
        attributes: ['OrderID', 'OrderNumber', 'OrderDate', 'Type', 'TotalAmount', 'OrderStatus'], // Specify only the required fields from Order
        include: [
          {
            model: StoreModel,
            as: 'StoreTabel',
            attributes: ['StoreName'], // Only include StoreName from StoreModel
          },
        ],
      });
  
      if (!orders || orders.length === 0) {
        return res.status(200).json({ message: 'No orders available for this customer.' });
      }
  
      // Map the results to extract only the required fields
      const formattedOrders = orders.map(order => ({
        OrderID: order.OrderID, 
        OrderNumber: order.OrderNumber, 
        OrderDate: order.OrderDate, 
        Type: order.Type, 
        TotalAmount: order.TotalAmount, 
        OrderStatus: order.OrderStatus, 
        StoreName: order.StoreTabel?.StoreName, // Use optional chaining for StoreName
      }));
  
      res.status(200).json({
        StatusCode: 'SUCCESS',
        message: 'Orders fetched successfully by Customer ID',
        orders: formattedOrders, // Return the formatted orders
      });
  
    } catch (error) {
      console.error('Error fetching orders by Customer ID:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  };
  

