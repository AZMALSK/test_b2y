const {OrderHistory ,OrderTabelModel,OrderStatusModel,CustomerModel,UserManagementModel, Payment, RoleModel,StoreModel} = require('../ConnectionDB/Connect');
const { Op } = require('sequelize');
const { Sequelize, DataTypes } = require('sequelize');
// const { upload } = require('../middleware/Cloundinary');
const { storage } = require('../middleware/Cloundinary');
const supabase = require('../middleware/supabase');
const { sendTemplateEmail } = require('../middleware/SendEmail'); // Your existing email service
const multer = require('multer');
const moment = require('moment');
const path = require('path');

// const upload = multer({ storage: storage }).fields([
//     { name: 'UploadDocument', maxCount: 10 }   
//   ]);


// exports.createOrUpdateOrderHistory = async (req, res) => {
//     upload(req, res, async function (err) {
//         if (err instanceof multer.MulterError) {
//             return res.status(500).json({ error: err });
//         } else if (err) {
//             return res.status(500).json({ error: "Failed to upload files or other errors occurred." });
//         }

           

//         let { 
//             OrderHistoryID, 
//             OrderID, 
//             StatusID, 
//             StartDate, 
//             EndDate, 
//             AssignTo, 
//             Comments, 
//             TenantID, 
//             UserID,  
//             UserRoleID,
//             CreatedBy 
//         } = req.body;

//            // Ensure numeric fields are treated as integers
//            OrderHistoryID = parseInt(OrderHistoryID, 10);
//            OrderID = parseInt(OrderID, 10);
//            StatusID = parseInt(StatusID, 10);

//         try {
//             const orderExists = await OrderTabelModel.findByPk(OrderID);
//             if (!orderExists) {
//                 return res.status(400).json({ error: 'Order does not exist.' });
//             }

//             const orderStatus = await OrderStatusModel.findByPk(StatusID);
//             if (!orderStatus) {
//                 return res.status(400).json({ error: 'Invalid StatusId.' });
//             }
            
//             const { OrderStatus } = orderStatus;

//             let DocumentName = req.files && req.files['UploadDocument'] ? 
//                 req.files['UploadDocument'].map(file => file.path) : [];

//             let subStatusId = 0;
//             if (StatusID === 4) {
//                 if (orderExists.SubStatusId === 0) {
//                     subStatusId = 1;
//                 } else if (orderExists.SubStatusId < 4) {
//                     subStatusId = orderExists.SubStatusId + 1;
//                 } else {
//                     return res.status(200).json({ error: 'You have already crossed 4 revisions. Admin approval needed.' });
//                 }
//             }

//             let newOrUpdatedOrderHistory;
//             if (!OrderHistoryID || OrderHistoryID == 0) {
//                 newOrUpdatedOrderHistory = await OrderHistory.create({
//                     OrderID,
//                     StatusID,
//                     StartDate,
//                     EndDate,
//                     AssignTo,
//                     Comments,
//                     DocumentName: DocumentName.length ? DocumentName.join(', ') : null,
//                     TenantID,
//                     UserID,
//                     UserRoleID,
//                     OrderHistoryStatus: OrderStatus,
//                     SubStatusId: subStatusId,
//                     CreatedBy: CreatedBy || 'System',
//                     CreatedAt: new Date(),
//                     UpdatedAt: new Date(),
//                 });
//             } else {
//                 newOrUpdatedOrderHistory = await OrderHistory.findOne({
//                     where: { OrderID, OrderHistoryID }
//                 });

//                 if (!newOrUpdatedOrderHistory) {
//                     return res.status(404).json({ error: 'Order history not found for the provided OrderID and OrderHistoryID.' });
//                 }

//                 await newOrUpdatedOrderHistory.update({
//                     OrderID,
//                     StatusID,
//                     StartDate,
//                     EndDate,
//                     AssignTo,
//                     Comments,
//                     UserRoleID,
//                     DocumentName: DocumentName.length ? DocumentName.join(', ') : newOrUpdatedOrderHistory.DocumentName,
//                     TenantID,
//                     OrderHistoryStatus: OrderStatus,
//                     // SubStatusId: subStatusId,
//                     UserID,
//                     UpdatedAt: new Date(),
//                 });
//             }

//             await OrderTabelModel.update({ 
//                 OrderStatus, 
//                 StatusID: StatusID, 
//                 StatusDeliveryDate: EndDate, 
//                 SubStatusId: subStatusId
//             }, { where: { OrderID } });

//             // Consolidated email trigger logic
//             if (StatusID === 5 || StatusID === 11) {
//                 console.log(`Triggering email for StatusID ${StatusID}`); 
//                 if (StatusID === 5) {
//                     await triggerStatusEmail(OrderID);
//                 } else if (StatusID === 11) {
//                     await triggerPaymentEmail(OrderID);
//                 }
//             }

//             return res.status(OrderHistoryID ? 200 : 201).json({
//                 StatusCode: 'SUCCESS',
//                 message: `Order history ${OrderHistoryID ? 'updated' : 'created'} successfully with new order status and sub-status.`,
//                 data: newOrUpdatedOrderHistory,
//             });
//         } catch (error) {
//             console.error('Error creating or updating order history:', error);
//             res.status(500).json({ error: 'An error occurred while processing the order history.' });
//         }
//     });
// };


const upload = multer({ storage: multer.memoryStorage() }).fields([
    { name: 'UploadDocument', maxCount: 10 }
]);

// Function to upload a file to Supabase
const uploadFileToSupabase = async (file) => {
      // Sanitize the file name by removing special characters except allowed ones
      const sanitizedFileName = file.originalname.replace(/[^\w\.-]/g, '_');

      // Generate a unique file name with the current date and time
      const timestamp = moment().format('DDMMYYYY_HHmmss'); // Format as DDMMYYYY_HHmmss
      const fileNameWithTimestamp = `${sanitizedFileName}_${timestamp}${path.extname(file.originalname)}`; // Add the original file extension
  
      // Upload the file to Supabase
      const { data, error } = await supabase
          .storage
          .from('uploaddocument')
          .upload(`documents/${fileNameWithTimestamp}`, file.buffer, {
              contentType: file.mimetype // Maintain the file type (e.g., PDF)
          });

    if (error) {
        console.error('Supabase Upload Error:', error);
        throw new Error('Error uploading file to Supabase: ' + error.message);
    }

    // Construct the public URL manually with download and file name headers
    const supabaseUrl = 'https://gqgwpwknmueehztfkgsf.supabase.co';
    const publicUrl = `${supabaseUrl}/storage/v1/object/public/uploaddocument/documents/${fileNameWithTimestamp}`;
    const downloadUrl = `${publicUrl}?download=&fileName=${encodeURIComponent(file.originalname)}`;

    // Return the public URL, download URL, and the original file name
    return { publicUrl, downloadUrl, originalFileName: file.originalname };
};

exports.createOrUpdateOrderHistory = async (req, res) => {
    upload(req, res, async function (err) {
        if (err instanceof multer.MulterError) {
            return res.status(500).json({ error: err });
        } else if (err) {
            return res.status(500).json({ error: 'Failed to upload files or other errors occurred.' });
        }

        let { 
            OrderHistoryID, 
            OrderID, 
            StatusID, 
            StartDate, 
            EndDate, 
            AssignTo, 
            Comments, 
            TenantID, 
            UserID,  
            UserRoleID,
            CreatedBy 
        } = req.body;

        // Ensure numeric fields are treated as integers
        OrderHistoryID = parseInt(OrderHistoryID, 10);
        OrderID = parseInt(OrderID, 10);
        StatusID = parseInt(StatusID, 10);

        if (AssignTo === '') {
            AssignTo = null;
        } else {
            AssignTo = parseInt(AssignTo, 10);  // Convert to integer if it's not empty
        }
        
        try {
            // Check if order exists
            const orderExists = await OrderTabelModel.findByPk(OrderID);
            if (!orderExists) {
                return res.status(400).json({ error: 'Order does not exist.' });
            }

            // Check if status is valid
            const orderStatus = await OrderStatusModel.findByPk(StatusID);
            if (!orderStatus) {
                return res.status(400).json({ error: 'Invalid StatusId.' });
            }

            const { OrderStatus } = orderStatus;

            let DocumentName = [];
            let OriginalFileNames = [];
            
            if (req.files && req.files['UploadDocument']) {
                for (let file of req.files['UploadDocument']) {
                    const { publicUrl, downloadUrl, originalFileName } = await uploadFileToSupabase(file);
                    DocumentName.push(publicUrl); // Add public URL
                    OriginalFileNames.push(originalFileName); // Store the original file name
                }
            }
            
            // Save both Document URLs and original file names in the database
            const DocumentNameString = DocumentName.length ? DocumentName.join(', ') : null;
            const OriginalFileNamesString = OriginalFileNames.length ? OriginalFileNames.join(', ') : null;
            
// Handle subStatusId logic only for creation, not update
let subStatusId = orderExists.SubStatusId || 0;
if (!OrderHistoryID || OrderHistoryID == 0) {
    if (StatusID === 4) {
        // Increment subStatusId for StatusID 4
        if (orderExists.SubStatusId === 0) {
            subStatusId = 1;
        } else if (orderExists.SubStatusId < 4) {
            subStatusId = orderExists.SubStatusId + 1;
        } else {
            return res.status(200).json({ error: 'You have already crossed 4 revisions. Admin approval needed.' });
        }
    }

    // Set SubStatusId to 1 if StatusID is 7
    if (StatusID === 7) {
        subStatusId = 1;
    }

    // Handle subStatus assignment for StatusID 5, using SubStatusId of last StatusID 4 record
    if (StatusID === 5) {
        const lastStatus4Record = await OrderHistory.findOne({
            where: { OrderID, StatusID: 4 },
            order: [['CreatedAt', 'DESC']],
        });
        if (lastStatus4Record) {
            subStatusId = lastStatus4Record.SubStatusId;
        }
    }
}


            let newOrUpdatedOrderHistory;
            if (!OrderHistoryID || OrderHistoryID == 0) {
                // Create new order history
                newOrUpdatedOrderHistory = await OrderHistory.create({
                    OrderID,
                    StatusID,
                    StartDate,
                    EndDate,
                    AssignTo,
                    Comments,
                    DocumentName: DocumentNameString,  // Save the document URLs
                    OriginalFileNames:OriginalFileNamesString,
                    TenantID,
                    UserID,
                    UserRoleID,
                    OrderHistoryStatus: OrderStatus,
                    SubStatusId: subStatusId,
                    CreatedBy: CreatedBy || 'System',
                    CreatedAt: new Date(),
                    UpdatedAt: new Date(),
                });
            } else {
                // Update existing order history (don't increment SubStatusId)
                newOrUpdatedOrderHistory = await OrderHistory.findOne({
                    where: { OrderID, OrderHistoryID }
                });

                if (!newOrUpdatedOrderHistory) {
                    return res.status(404).json({ error: 'Order history not found for the provided OrderID and OrderHistoryID.' });
                }

                await newOrUpdatedOrderHistory.update({
                    OrderID,
                    StatusID,
                    StartDate,
                    EndDate,
                    AssignTo,
                    Comments,
                    UserRoleID,
                    DocumentName: DocumentNameString || newOrUpdatedOrderHistory.DocumentName,  // Save updated URLs or retain previous ones
                    OriginalFileNames:OriginalFileNamesString || newOrUpdatedOrderHistory.OriginalFileName,
                    TenantID,
                    OrderHistoryStatus: OrderStatus,
                    UserID,
                    UpdatedAt: new Date(),
                });
            }

            // Update order table with new status and sub-status
            await OrderTabelModel.update({ 
                OrderStatus, 
                StatusID, 
                StatusDeliveryDate: EndDate, 
                SubStatusId: subStatusId 
            }, { where: { OrderID } });

            // Trigger email logic for certain statuses
            if (StatusID === 5 || StatusID === 11) {
                console.log(`Triggering email for StatusID ${StatusID}`); 
                if (StatusID === 5) {
                    await triggerStatusEmail(OrderID);
                // } else if (StatusID === 7) {
                //     await triggerPaymentEmail(OrderID);
                } else if (StatusID === 11) {
                    await triggerFeedbackEmail(OrderID);  
                }
            }

            return res.status(OrderHistoryID ? 200 : 201).json({
                StatusCode: 'SUCCESS',
                // message: `Order history ${OrderHistoryID ? 'updated' : 'created'} successfully with new order status and sub-status.`,
                message:`Order Status ${OrderHistoryID ? 'updated' : 'created'} successfully.`,
                data: newOrUpdatedOrderHistory,
            });
        } catch (error) {
            console.error('Error creating or updating order history:', error);
            res.status(500).json({ error: 'An error occurred while processing the order history.' });
        }
    });
};



async function triggerStatusEmail(OrderID) {
    try {
        const orderHistory = await OrderHistory.findOne({
            where: { OrderID, StatusID: 5 }
        });

        if (!orderHistory) {
            throw new Error('No matching order with StatusID 5 found.');
        }

        const order = await OrderTabelModel.findOne({ where: { OrderID } });
        const customer = await CustomerModel.findOne({ where: { CustomerID: order.CustomerID } });

        const documentUrls = orderHistory.DocumentName ? orderHistory.DocumentName.split(', ') : [];
        const downloadUrls = documentUrls.map(url => url.replace('/upload/', '/upload/fl_attachment/'));

        const emailData = {
            customerFirstName: customer.FirstName,
            customerEmail: customer.Email,
            OrderNumber: order.OrderNumber,
            OrderID:OrderID,
            Type: order.Type,
            OrderDate: order.OrderDate,
            TotalAmount: order.TotalAmount,
            DocumentName: documentUrls.length > 0 ? documentUrls.join(', ') : 'No Document',
            DocumentUrl: documentUrls.length > 0 ? documentUrls[0] : '', 
            DownloadDocuments: downloadUrls.length > 0 ? downloadUrls.join(', ') : '', 
        };
        await sendTemplateEmail('Final Measurement Approved', emailData);
    } catch (error) {
        console.error('Error triggering status email:', error);
    }
}

// // Function to handle the email notification for StatusID 11
// async function triggerPaymentEmail(OrderID) {
//     try {
//         const orderHistory = await OrderHistory.findAll({
//             where: { OrderID, StatusID: 7 }
//         });
//         if (!orderHistory) {
//             throw new Error('No matching order with StatusID 7 found.');
//         }

//         const order = await OrderTabelModel.findOne({ where: { OrderID } });
//         const customer = await CustomerModel.findOne({ where: { CustomerID: order.CustomerID } });

//         const payments = await Payment.findAll({ where: { OrderID } });
//         const totalAdvanceAmount = payments.reduce((sum, payment) => sum + parseFloat(payment.AdvanceAmount), 0);
//         const totalAmount = parseFloat(order.TotalAmount);
//         const balanceAmount = totalAmount - totalAdvanceAmount;

//         // Fetch the store information using StoreID from the order
//         const store = await StoreModel.findOne({
//             where: { StoreID: order.StoreID },
//             attributes: ['StoreID', 'StoreName']
//         });

//         if (!store) {
//             throw new Error('Store not found.');
//         }

//         const emailData = {
//             customerFirstName: customer.FirstName,
//             customerEmail: customer.Email,
//             OrderNumber: order.OrderNumber,
//             OrderDate: order.OrderDate,
//             Type:order.Type,
//             TotalAmount: totalAmount.toFixed(2),
//             AdvanceAmount: totalAdvanceAmount.toFixed(2),
//             BalanceAmount: balanceAmount.toFixed(2),
//             StoreName: store.StoreName,
//         };
        
//         await sendTemplateEmail('PaymentReceived', emailData);
//     } catch (error) {
//         console.error('Error triggering payment email:', error);
//     }
// }

async function triggerFeedbackEmail(OrderID) {
    try {
        const orderHistory = await OrderHistory.findAll({
            where: { OrderID, StatusID: 11 }
        });
        if (!orderHistory) {
            throw new Error('No matching order with StatusID 11 found.');
        }

        const order = await OrderTabelModel.findOne({ where: { OrderID } });
        const customer = await CustomerModel.findOne({ where: { CustomerID: order.CustomerID } });

        const emailData = {
            customerFirstName: customer.FirstName,
            customerEmail: customer.Email,
            OrderNumber: order.OrderNumber,
            OrderID:order.OrderID,
            // OrderDate: order.OrderDate,
            // Type:order.Type,
            // TotalAmount: totalAmount.toFixed(2),
            // AdvanceAmount: totalAdvanceAmount.toFixed(2),
            // BalanceAmount: balanceAmount.toFixed(2),
            // StoreName: store.StoreName,
        };
        await sendTemplateEmail('FeedBackMail', emailData);
    } catch (error) {
        console.error('Error triggering FeedBack email:', error);
    }
}


exports.getAllOrderHistories = async (req, res) => {
    const { page = 1, limit = 10 } = req.query;

    const searchText = Object.keys(req.query).find(key => key.toLowerCase() === 'searchtext');
    const searchValue = req.query[searchText]?.toLowerCase() || '';

    try {
        const offset = (page - 1) * limit;

        const orderHistories = await OrderHistory.findAndCountAll({
            where: {
                [Op.or]: [
                    { CreatedBy: { [Op.iLike]: `%${searchValue}%` } }
                ]
            },
            offset,
            limit: parseInt(limit),
            order: [
                [Sequelize.literal('GREATEST("OrderHistory"."CreatedAt", "OrderHistory"."UpdatedAt")'), 'DESC'],
                ['CreatedBy', 'ASC']
            ]
        });

        // Format the order histories similarly to the getOrderHistoryById function
        const formattedOrderHistories = orderHistories.rows.map(orderHistory => {
            // Split DocumentName (Cloudinary URLs) into arrays for view and download
            const documentUrls = orderHistory.DocumentName ? orderHistory.DocumentName.split(', ') : [];
            const downloadUrls = documentUrls.map(url => url.replace('/upload/', '/upload/fl_attachment/'));

            return {
                StatusCode: 'SUCCESS',
                OrderID: orderHistory.OrderID,
                OrderHistoryID: orderHistory.OrderHistoryID,
                StatusId: orderHistory.StatusId,
                AssignTo: orderHistory.AssignTo,
                TenantID: orderHistory.TenantID,
                UserID: orderHistory.UserID,
                OrderStatus: orderHistory.OrderHistoryStatus,
                viewdocuments: documentUrls,
                Comment: orderHistory.Comments,
                StartDate: orderHistory.StartDate,
                SubStatusId:orderHistory.SubStatusId,
                EndDate: orderHistory.EndDate,
                CreatedBy:orderHistory.CreatedBy,
                DownloadDocuments: downloadUrls
            };
        });

        res.status(200).json({
            StatusCode: 'SUCCESS',
            data: formattedOrderHistories,
            totalRecords: orderHistories.count,
            totalPages: Math.ceil(orderHistories.count / limit),
            currentPage: parseInt(page)
        });
    } catch (error) {
        console.error('Error fetching order histories:', error);
        res.status(500).json({ error: 'An error occurred while fetching order histories.' });
    }
};



// Get OrderHistory by OrderID
exports.getOrderHistoryById = async (req, res) => {
    const { OrderID } = req.params;

    try {
        // Fetch the order history with user and role details
        const orderHistories = await OrderHistory.findAll({
            where: { OrderID },
            include: [
                {
                    model: UserManagementModel,
                    as: 'AssignedUser', 
                    attributes: ['UserID', 'FirstName', 'LastName'] 
                },
                {
                    model: RoleModel,
                    as: 'UserRole', 
                    attributes: ['RoleID', 'RoleName'] 
                }
            ],
            order: [
                [Sequelize.literal('GREATEST("OrderHistory"."CreatedAt", "OrderHistory"."UpdatedAt")'), 'DESC'],
                ['CreatedBy', 'ASC'] 
            ]
        });

        // Check if no records were found
        if (!orderHistories || orderHistories.length === 0) {
            return res.status(200).json({ error: 'Order history not found.' });
        }

        // Process each order history
        const formattedOrderHistories = orderHistories.map(orderHistory => {
            const documentUrls = orderHistory.DocumentName ? orderHistory.DocumentName.split(', ') : [];
            const originalFileNames = orderHistory.OriginalFileNames ? orderHistory.OriginalFileNames.split(', ') : [];
            
            const downloadUrls = documentUrls.map((url, index) => {
                // Add the original file name to the download URL
                const originalFileName = originalFileNames[index] || 'document';
                if (url.includes('supabase.co')) {
                    return `${url}?download=&fileName=${encodeURIComponent(originalFileName)}`;
                }
                return url.replace('/upload/', `/upload/fl_attachment/${encodeURIComponent(originalFileName)}/`);
            });
            
            return {
                StatusCode: 'SUCCESS',
                OrderID: orderHistory.OrderID,
                OrderHistoryID: orderHistory.OrderHistoryID,
                StatusID: orderHistory.StatusID,
                AssignTo: orderHistory.AssignTo,
                TenantID: orderHistory.TenantID,
                UserID: orderHistory.UserID,
                FirstName: orderHistory.AssignedUser ? orderHistory.AssignedUser.FirstName : null, 
                LastName: orderHistory.AssignedUser ? orderHistory.AssignedUser.LastName : null, 
                RoleID: orderHistory.UserRole ? orderHistory.UserRole.RoleID : null,
                RoleName: orderHistory.UserRole ? orderHistory.UserRole.RoleName : null, 
                OrderStatus: orderHistory.OrderHistoryStatus,
                SubStatusId:orderHistory.SubStatusId,
                viewdocuments: documentUrls,
                Comment: orderHistory.Comments,
                StartDate: orderHistory.CreatedAt,
                EndDate: orderHistory.EndDate,
                DownloadDocuments: downloadUrls
            };
        });
        
        // Return the formatted result
        res.status(200).json(formattedOrderHistories);
    } catch (error) {
        console.error('Error fetching order history by ID:', error);
        res.status(500).json({ error: 'An error occurred while fetching order history.' });
    }
};


// Get OrderHistory by OrderID
exports.getOrderHistoryByOrderHistoryId = async (req, res) => {
    const { OrderHistoryID } = req.params;

    try {
        const orderHistory = await OrderHistory.findOne({ where: { OrderHistoryID } });

        if (!orderHistory) {
            return res.status(404).json({ error: 'Order history not found.' });
        }
        // Retrieve the DocumentName (which contains Cloudinary URLs) and split them into an array
        const documentUrls = orderHistory.DocumentName ? orderHistory.DocumentName.split(', ') : [];

        const documentdownloadUrls = orderHistory.DocumentName ? orderHistory.DocumentName.split(', ') : [];

        const downloadUrls = documentdownloadUrls.map(url => { 
        return url.replace('/upload/', '/upload/fl_attachment/');
        });
        // Order Status,  Comments,Delivery Date
        res.status(200).json({
            StatusCode: 'SUCCESS',
            OrderID: orderHistory.OrderID,
            StatusId:orderHistory.StatusId,
            AssignTo:orderHistory.AssignTo,
            TenantID:orderHistory.TenantID,
            UserID:orderHistory.UserID,
            OrderStatus:orderHistory.OrderStatus,
            viewdocuments: documentUrls ,
            OrderStatus:orderHistory.OrderHistoryStatus,
            SubStatusId:orderHistory.SubStatusId,
            Comment:orderHistory.Comments,
            StartDate:orderHistory.CreatedAt,
            EndDate:orderHistory.EndDate,
            DownloadDocuments: downloadUrls 
        });
    } catch (error) {
        console.error('Error fetching order history by ID:', error);
        res.status(500).json({ error: 'Failed.' });
    }
};


// exports.getusertasks = async (req, res) => {
//     const { UserID ,StoreID} = req.query;


//     // Validate UserId
//     if (!UserID) {
//         return res.status(400).json({ error: 'UserId is required' });
//     }

//     try {

//         let whereClause = { AssignTo: UserID };

//         if (StoreID) {
//                whereClause.StoreID = StoreID;
//         }
//         const tasks = await OrderHistory.findAll({
//             where: whereClause,
//             include: [
//                 {
//                     model: OrderTabelModel,
//                     attributes: ['OrderNumber', 'StoreID'],
//                     where: StoreID ? { StoreID: StoreID } : {} 
//                 },
                
//             ],
            
//             attributes: [
//                 'OrderHistory.OrderID',
//                 [Sequelize.fn('MIN', Sequelize.col('OrderHistory.CreatedAt')), 'StartDate'],
//                 [Sequelize.fn('MAX', Sequelize.col('OrderHistory.EndDate')), 'EndDate'], 
//                 'OrderHistoryStatus',
//                 'Comments'
//             ],
//             group: [
//                                 'OrderHistory.OrderID', 
//                                 'OrderHistoryStatus', 
//                                 'OrderHistory.Comments', 
//                                 'OrderTabelModel.OrderNumber', 
//                                 'OrderTabelModel.StoreID', 
//                                 'OrderTabelModel.AssignTo.FirstName', 
//                                 'OrderTabelModel.AssignTo.LastName'
//                             ],
//             raw: true
//         });
         
//         // Check if tasks were found
//           if (tasks.length === 0) {
//             return res.status(200).json({ message: 'No tasks found for the provided UserId.' });
//         }

//         res.json(tasks);
//     } catch (error) {
//         console.error('Error fetching user tasks:', error);
//         res.status(500).json({ error: 'Internal server error' });
//     }
// };

// exports.getusertasks = async (req, res) => {
//     const { UserID, StoreID, searchText } = req.query;

//     // Validate UserID
//     if (!UserID) {
//         return res.status(400).json({ error: 'UserID is required' });
//     }

//     try {
//         // Initialize the where clause with AssignTo condition
//         let whereClause = { AssignTo: UserID };

//         // Add StoreID condition if provided
//         if (StoreID) {
//             whereClause.StoreID = StoreID;
//         }

//         // If searchText is provided, apply the search logic to OrderNumber and AssignTo's FirstName and LastName
//         if (searchText) {
//             whereClause = {
//                 ...whereClause,
//                 [Op.or]: [
//                     { '$OrderTabelModel.OrderNumber$': { [Op.iLike]: `%${searchText}%` } },
//                     { '$OrderTabelModel.AssignTo.FirstName$': { [Op.iLike]: `%${searchText}%` } }, 
//                     { '$OrderTabelModel.AssignTo.LastName$': { [Op.iLike]: `%${searchText}%` } }
//                 ]
//             };
//         }

//         // Fetch tasks with the required associations and search criteria
//         const tasks = await OrderHistory.findAll({
//             where: whereClause,
//             include: [
//                 {
//                     model: OrderTabelModel, // Include the Order Table to access OrderNumber and StoreID
//                     as:'',
//                     attributes: ['OrderNumber', 'StoreID'],
//                     include: [{
//                         model: UserManagementModel, // Include the User model within the OrderTabelModel to fetch AssignTo details
//                         as: 'User', // Ensure the alias matches the foreign key relationship
//                         attributes: ['FirstName', 'LastName'] // Fetch FirstName and LastName from UserModel
//                     }],
//                     where: StoreID ? { StoreID: StoreID } : {} // Add StoreID filter if provided
//                 }
//             ],
//             attributes: [
//                 'OrderHistory.OrderID',
//                 [Sequelize.fn('MIN', Sequelize.col('OrderHistory.CreatedAt')), 'StartDate'],
//                 [Sequelize.fn('MAX', Sequelize.col('OrderHistory.EndDate')), 'EndDate'],
//                 'OrderHistoryStatus',
//                 'Comments'
//             ],
//             group: [
//                 'OrderHistory.OrderID', 
//                 'OrderHistoryStatus', 
//                 'OrderHistory.Comments', 
//                 'OrderTabelModel.OrderNumber', 
//                 'OrderTabelModel.StoreID', 
//                 'OrderTabelModel.AssignTo.FirstName', 
//                 'OrderTabelModel.AssignTo.LastName'
//             ],
//             raw: true
//         });

//         // Check if tasks were found
//         if (tasks.length === 0) {
//             return res.status(200).json({ 
//                 message: StoreID 
//                     ? 'No tasks found for the provided UserID and StoreID.' 
//                     : 'No tasks found for the provided UserID.'
//             });
//         }

//         // Return tasks
//         res.json({
//             StatusCode: 'SUCCESS',
//             totalRecords: tasks.length,
//             tasks: tasks
//         });
//     } catch (error) {
//         console.error('Error fetching user tasks:', error);
//         res.status(500).json({ 
//             StatusCode: 'ERROR',
//             error: 'Internal server error' 
//         });
//     }
// };

exports.getusertasks = async (req, res) => {
    const { UserID,StoreID,searchText } = req.query;

    // Validate UserID
    if (!UserID) {
        return res.status(400).json({ error: 'UserId is required' });
    }

    try {
        // Initialize the where clause with AssignTo condition
        let whereClause = { AssignTo: UserID };

        //   Add StoreID condition if provided
        if (StoreID) {
            whereClause.StoreID = StoreID;
        }
        // If searchText is provided, apply the search to OrderNumber and StoreID
        if (searchText) {
            whereClause = {
                ...whereClause,
                [Op.or]: [
                    { '$OrdersTable.OrderNumber$': { [Op.iLike]: `%${searchText}%` } }, // Search in OrderNumber (case-insensitive)
                    // { StoreID: { [Op.iLike]: `%${searchText}%` } }  // Search in StoreID (case-insensitive)
                ]
            };
        }

        // Fetch tasks with the required associations and search criteria
        const tasks = await OrderHistory.findAll({
            where: whereClause,
            include: [
                {
                    model: OrderTabelModel, as:'OrdersTable',
                    attributes: ['OrderNumber'],
                },
            ],
            attributes: [
                'OrderHistory.OrderID',
                [Sequelize.fn('MIN', Sequelize.col('OrderHistory.CreatedAt')), 'StartDate'],
                [Sequelize.fn('MAX', Sequelize.col('OrderHistory.EndDate')), 'EndDate'], 
                'OrderHistoryStatus',
                'StoreID',
                'Comments'
            ],
            group: ['OrderHistory.OrderID', 'OrderHistoryStatus', 'OrderHistory.Comments', 'OrdersTable.OrderNumber','OrderHistory.StoreID'],
            raw: true
        });

        // Check if tasks were found
        if (tasks.length === 0) {
            return res.status(200).json({ message: 'No tasks found for the provided UserId.' });
        }

        // Return the found tasks
        res.json(tasks);

    } catch (error) {
        console.error('Error fetching user tasks:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};


// exports.getusertasks = async (req, res) => {
//     const { UserID, StoreID, searchText } = req.query;

//     // Validate UserID
//     if (!UserID) {
//         return res.status(400).json({ error: 'UserID is required' });
//     }

//     try {
//         // Initialize the where clause with AssignTo condition
//         let whereClause = { AssignTo: UserID };

//         // Add StoreID condition if provided
//         if (StoreID) {
//             whereClause.StoreID = StoreID;
//         }

//         // If searchText is provided, apply the search logic to OrderNumber and AssignTo's FirstName and LastName
//         if (searchText) {
//             whereClause = {
//                 ...whereClause,
//                 [Op.or]: [
//                     { '$OrderTabelModel.OrderNumber$': { [Op.iLike]: `%${searchText}%` } },
//                     { '$OrderTabelModel.AssignTo.FirstName$': { [Op.iLike]: `%${searchText}%` } }, 
//                     { '$OrderTabelModel.AssignTo.LastName$': { [Op.iLike]: `%${searchText}%` } }
//                 ]
//             };
//         }

//         // Fetch tasks with the required associations and search criteria
//         const tasks = await OrderHistory.findAll({
//             where: whereClause,
//             include: [
//                 {
//                     model: OrderTabelModel, // Include the Order Table to access OrderNumber and StoreID
//                     attributes: ['OrderNumber', 'StoreID'],
//                     include: [{
//                         model: UserManagementModel, // Include the User model within the OrderTabelModel to fetch AssignTo details
//                         as: 'User', // Ensure the alias matches the foreign key relationship
//                         attributes: ['FirstName', 'LastName'] // Fetch FirstName and LastName from UserModel
//                     }],
//                     where: StoreID ? { StoreID: StoreID } : {} // Add StoreID filter if provided
//                 }
//             ],
//             attributes: [
//                 'OrderHistory.OrderID',
//                 [Sequelize.fn('MIN', Sequelize.col('OrderHistory.CreatedAt')), 'StartDate'],
//                 [Sequelize.fn('MAX', Sequelize.col('OrderHistory.EndDate')), 'EndDate'],
//                 'OrderHistoryStatus',
//                 'Comments'
//             ],
//             group: [
//                 'OrderHistory.OrderID', 
//                 'OrderHistoryStatus', 
//                 'OrderHistory.Comments', 
//                 'OrderTabelModel.OrderNumber', 
//                 'OrderTabelModel.StoreID', 
//                 'OrderTabelModel.AssignTo.FirstName', 
//                 'OrderTabelModel.AssignTo.LastName'
//             ],
//             raw: true
//         });

//         // Check if tasks were found
//         if (tasks.length === 0) {
//             return res.status(200).json({ 
//                 message: StoreID 
//                     ? 'No tasks found for the provided UserID and StoreID.' 
//                     : 'No tasks found for the provided UserID.'
//             });
//         }

//         // Return tasks
//         res.json({
//             StatusCode: 'SUCCESS',
//             totalRecords: tasks.length,
//             tasks: tasks
//         });
//     } catch (error) {
//         console.error('Error fetching user tasks:', error);
//         res.status(500).json({ 
//             StatusCode: 'ERROR',
//             error: 'Internal server error' 
//         });
//     }
// };


exports.checkStatusAndSendEmail = async (req, res) => {
    const { OrderID } = req.body; // Extract OrderID from request body

    try {
        // Fetch order history based on the OrderID and StatusID
        const orderHistory = await OrderHistory.findOne({
            where: { OrderID, StatusID: 5 }
        });

        if (!orderHistory) {
            return res.status(400).json({ message: 'No matching order with StatusID 5 found.' });
        }

        // Fetch related order and customer details
        const order = await OrderTabelModel.findOne({ where: { OrderID } });
        const customer = await CustomerModel.findOne({ where: { CustomerID: order.CustomerID } });

        // Process the DocumentName (Cloudinary URLs) into view and download links
        const documentUrls = orderHistory.DocumentName ? orderHistory.DocumentName.split(', ') : [];
        const downloadUrls = documentUrls.map(url => url.replace('/upload/', '/upload/fl_attachment/'));

        // Prepare email details
        const emailData = {
            customerFirstName: customer.FirstName,
            customerEmail: customer.Email,
            OrderNumber: order.OrderNumber,
            OrderDate: order.OrderDate,
            TotalAmount: order.TotalAmount,
            DocumentName: documentUrls.length > 0 ? documentUrls.join(', ') : 'No Document',
            DocumentUrl: documentUrls.length > 0 ? documentUrls[0] : '', // First document URL for view
            DownloadDocuments: downloadUrls.length > 0 ? downloadUrls.join(', ') : '', // Download URL
        };

        // Send the email using the email service
        await sendTemplateEmail('OrderStatusEmail', emailData);

        return res.status(200).json({ message: 'Email sent successfully', data: emailData });

    } catch (error) {
        console.error('Error sending email:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

exports.updateFinalMeasurementStatus = async (req, res) => {
    const { OrderID, FinalMeasurementStatus } = req.body;

    try {
        // Fetch all OrderHistory records for the given OrderID
        const orderHistories = await OrderHistory.findAll({ 
            where: { OrderID } 
        });

        if (!orderHistories || orderHistories.length === 0) {
            return res.status(200).json({ message: 'Order history not found for the given Order ID.' });
        }

        // Find the record with StatusID = 5 (FinalMeasurement record)
        const finalMeasurementRecord = orderHistories.find(order => order.StatusID === 5);

        if (!finalMeasurementRecord) {
            return res.status(200).json({ message: 'No record with FinalMeasurement status (StatusID = 5) found for the given Order ID.' });
        }

        // Check if FinalMeasurementStatus has already been updated
        if (finalMeasurementRecord.FinalMeasurementStatus !== null) {
            return res.status(400).json({ message: 'Final Measurement Status has already been updated and cannot be changed again.' });
        }

        let newStatusID, message, endDate = null, comment;
        const currentDate = moment().format('YYYY-MM-DD HH:mm:ss');

        if (FinalMeasurementStatus === 1) { // Approved
            newStatusID = 6; // StatusID for approved
            message = "Thanks for your Approval, will start the production based on this signup document";
            comment = "Approved by Customer";
            endDate = currentDate;

        } else if (FinalMeasurementStatus === 2) { // Declined
            newStatusID = 4; // StatusID for declined
            message = "Thanks for your response. We will check with our technical team and get back to you for more revisions.";
            comment = "Declined by Customer";
            endDate = currentDate;

        } else {
            return res.status(400).json({ message: 'Invalid FinalMeasurementStatus value. It should be either 1 or 2.' });
        }

        // Fetch the corresponding status name from OrderStatus table based on the new StatusID
        const orderStatus = await OrderStatusModel.findOne({ where: { StatusID: newStatusID } });
        if (!orderStatus) {
            return res.status(400).json({ message: 'Order status not found for the given StatusID.' });
        }

        // Retrieve the last SubStatusId from the latest OrderHistory record
        const existingOrderDetails = await OrderHistory.findOne({ 
            where: { OrderID }, 
            order: [['CreatedAt', 'DESC']] 
        });

        const preservedSubStatusId = existingOrderDetails ? existingOrderDetails.SubStatusId : 0;

        // Create a new OrderHistory record with the preserved SubStatusId and updated status
        await OrderHistory.create({
            OrderID: finalMeasurementRecord.OrderID,
            FinalMeasurementStatus: FinalMeasurementStatus,
            StatusID: newStatusID,
            SubStatusId: preservedSubStatusId,
            OrderHistoryStatus: orderStatus.OrderStatus,
            TenantID: existingOrderDetails.TenantID,
            UserID: existingOrderDetails.UserID,
            StoreID: existingOrderDetails.StoreID,
            UserRoleID: existingOrderDetails.UserRoleID,
            AssignTo: existingOrderDetails.AssignTo,
            DocumentName: existingOrderDetails.DocumentName,
            OriginalFileNames: existingOrderDetails.OriginalFileNames,
            EndDate: endDate,
            Comments: comment // Adding the comment based on FinalMeasurementStatus
        });

        // Update the Order table's status and status ID
        await OrderTabelModel.update({
            StatusID: newStatusID,
            OrderStatus: orderStatus.OrderStatus,
            SubStatusId: preservedSubStatusId,
            EndDate: endDate
        }, {
            where: { OrderID }
        });

        return res.status(200).json({ 
            message: `Order Status Updated Successfully: ${message}`
        });

    } catch (error) {
        console.error('Error updating order history:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
// exports.updateFinalMeasurementStatus = async (req, res) => {
//     const { OrderID, FinalMeasurementStatus } = req.body;

//     try {
//         // Fetch all records from OrderHistory for the given OrderID
//         const orderHistories = await OrderHistory.findAll({ 
//             where: { OrderID } 
//         });

//         if (!orderHistories || orderHistories.length === 0) {
//             return res.status(200).json({ message: 'Order history not found for the given Order ID.' });
//         }

//         // Find the record with StatusID = 5 (FinalMeasurement record)
//         const finalMeasurementRecord = orderHistories.find(order => order.StatusID === 5);

//         if (!finalMeasurementRecord) {
//             return res.status(200).json({ message: 'No record with FinalMeasurement status (StatusID = 5) found for the given Order ID.' });
//         }

//         // Check if FinalMeasurementStatus has already been updated
//         if (finalMeasurementRecord.FinalMeasurementStatus !== null) {
//             return res.status(400).json({ message: 'Final Measurement Status has already been updated and cannot be changed again.' });
//         }

//         let newStatusID;
//         if (FinalMeasurementStatus === 1) {
//             newStatusID = 6; // StatusID = 6 for FinalMeasurementStatus 1
//         } else if (FinalMeasurementStatus === 2) {
//             newStatusID = 4; // StatusID = 4 for FinalMeasurementStatus 2
//         } else {
//             return res.status(400).json({ message: 'Invalid FinalMeasurementStatus value. It should be either 1 or 2.' });
//         }

//         // Fetch the corresponding status name from the OrderStatus table based on the new StatusID
//         const orderStatus = await OrderStatusModel.findOne({ where: { StatusID: newStatusID } });
//         if (!orderStatus) {
//             return res.status(400).json({ message: 'Order status not found for the given StatusID.' });
//         }
        

//         // Update the FinalMeasurementStatus, StatusID, and OrderHistoryStatus
//         await finalMeasurementRecord.update({
//             FinalMeasurementStatus: FinalMeasurementStatus,
//             StatusID: newStatusID,
//             OrderHistoryStatus: orderStatus.OrderStatus // Update with the corresponding status name
//         });

//              // Update the Order table's status and status ID
//         await OrderTabelModel.update({
//             StatusID: newStatusID,
//             OrderStatus: orderStatus.OrderStatus
//             }, {
//                 where: { OrderID }
//             });
    

//         return res.status(200).json({ 
//             message: `Order history updated successfully for Order ID: ${OrderID} with FinalMeasurementStatus: ${FinalMeasurementStatus}, StatusID: ${newStatusID}, and OrderHistoryStatus: ${orderStatus.OrderStatus}` ,
//             message_Frontend:`Order Status Updated Successfully with FinalMeasurementStatus: ${FinalMeasurementStatus}`
//         });

//     } catch (error) {
//         console.error('Error updating order history:', error);
//         return res.status(500).json({ message: 'Internal server error' });
//     }
// };

exports.checkPaymentStatusAndSendEmail = async (req, res) => {
    const { OrderID } = req.body; // Extract OrderID from request body

    try {
        // Fetch order history based on the OrderID and StatusID
        const orderHistory = await OrderHistory.findAll({
            where: { OrderID, StatusID: 8 }
        });

        if (!orderHistory) {
            return res.status(400).json({ message: 'No matching order with StatusID 11 found.' });
        }

        // Fetch related order and customer details
        const order = await OrderTabelModel.findOne({ where: { OrderID } });
        const customer = await CustomerModel.findOne({ where: { CustomerID: order.CustomerID } });
        
        // Fetch all payments related to this order
        const payments = await Payment.findAll({
            where: { OrderID }
        });

        // Sum the advance amounts from all the payments
        const totalAdvanceAmount = payments.reduce((sum, payment) => sum + parseFloat(payment.AdvanceAmount), 0);

        // Calculate the total amount and balance amount
        const totalAmount = parseFloat(order.TotalAmount);
        const balanceAmount = totalAmount - totalAdvanceAmount;

         // Fetch store details based on StoreID from the payments
         const storeIds = payments.map(payment => payment.StoreID);
         const stores = await StoreModel.findAll({
             where: { StoreID: storeIds },
             attributes: ['StoreID', 'StoreName']
         });
 
         // Create a map of StoreID to StoreName
         const storeMap = {};
         stores.forEach(store => {
             storeMap[store.StoreID] = store.StoreName;
         });

        // Prepare email details
        const emailData = {
            customerFirstName: customer.FirstName,
            customerEmail: customer.Email,
            OrderNumber: order.OrderNumber,
            OrderDate: order.OrderDate,
            TotalAmount: totalAmount.toFixed(2),
            AdvanceAmount: totalAdvanceAmount.toFixed(2),
            BalanceAmount: balanceAmount.toFixed(2),
            StoreName: storeMap[payments[0]?.StoreID] || 'Unknown Store', 
        };

        // Send the email using the email service
        await sendTemplateEmail('PaymentReceived', emailData);

        return res.status(200).json({ message: 'Email sent successfully', data: emailData });

    } catch (error) {
        console.error('Error sending email:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
