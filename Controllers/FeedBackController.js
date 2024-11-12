const { FeedbackModel,OrderTabelModel , CustomerModel,StoreModel } = require('../ConnectionDB/Connect'); 
const { Sequelize, DataTypes } = require('sequelize');
const { sendTemplateEmail } = require('../middleware/SendEmail'); 
// CREATE Feedback (POST)
// exports.CreateOrderFeedBack = async (req, res) => {
//     try {
//         const { 
//             CustomerName, 
//             OrderID, 
//             ItemName, 
//             DeliveryDate, 
//             ReceivedDocuments, 
//             ReceivedWarrantyCard, 
//             InstallationSuccessful, 
//             OverallRating, 
//             Remarks,
//             StoreID,
//             CreatedBy 
//         } = req.body;

//         // Create a new feedback entry
//         const feedback = await FeedbackModel.create({
//             CustomerName,
//             OrderID,
//             ItemName,
//             DeliveryDate,
//             ReceivedDocuments,
//             ReceivedWarrantyCard,
//             InstallationSuccessful,
//             OverallRating,
//             StoreID,
//             Remarks,
//             CreatedBy
//         });

//         res.status(201).json({ Success: 'Feedback Uploaded Successfully', feedback });
//     } catch (error) {
//         res.status(500).json({ error: 'Internal Server Error', message: error.message });
//     }
// };

exports.CreateOrderFeedBack = async (req, res) => {
    try {
        const { 
            OrderID, 
            ItemName, 
            DeliveryDate, 
            ReceivedDocuments, 
            ReceivedWarrantyCard, 
            InstallationSuccessful, 
            OverallRating, 
            Remarks,
            StoreID,
            CreatedBy 
        } = req.body;

        // Fetch the order details along with the associated customer
        const order = await OrderTabelModel.findOne({
            where: { OrderID },
            include: [
                {
                    model: CustomerModel, // Assuming you have a CustomerModel
                    as: 'Customer', // Use the same alias you used in associations
                    attributes: ['FirstName', 'LastName' ,'Email']
                }
            ]
        });

        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        // Extract the customer details
        // const customerName = order.Customer.CustomerFirstName;
        const customerName = order.Customer.FirstName + ' ' + order.Customer.LastName;

        // Create a new feedback entry using the customer name from the order
        const feedback = await FeedbackModel.create({
            CustomerName: customerName, // Set CustomerName based on the fetched customer details
            OrderID,
            ItemName,
            DeliveryDate,
            ReceivedDocuments,
            ReceivedWarrantyCard,
            InstallationSuccessful,
            OverallRating,
            StoreID,
            Remarks,
            CreatedBy
        });

       
        res.status(201).json({ Success: 'Thank You For Your Feedback ', feedback });
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error', message: error.message });
    }
};


// READ All Feedbacks (GET)
exports.GetAllFeedBacks = async (req, res) => {
    const { pageNumber = 1, pageSize = 10, StoreID, StartDate, EndDate } = req.query;
    const searchText = Object.keys(req.query).find(key => key.toLowerCase() === 'searchtext');
    const searchValue = req.query[searchText]?.toLowerCase() || '';

    try {
        const offset = (pageNumber - 1) * pageSize;

        // Build the filtering conditions
        let whereConditions = {
            [Sequelize.Op.or]: [
                {
                    CustomerName: {
                        [Sequelize.Op.iLike]: `%${searchValue}%`
                    }
                },
                {
                    ItemName: {
                        [Sequelize.Op.iLike]: `%${searchValue}%`
                    }
                },
                {
                    Remarks: {
                        [Sequelize.Op.iLike]: `%${searchValue}%`
                    }
                }
            ]
        };

        // Apply StoreID filtering if provided
        if (StoreID) {
            whereConditions.StoreID = StoreID;
        }

        // Apply date filtering if both StartDate and EndDate are provided
        if (StartDate && EndDate) {
            const startDate = new Date(StartDate);
            const endDate = new Date(EndDate);
            endDate.setUTCHours(23, 59, 59, 999); // Include the full end date

            whereConditions.CreatedAt = {
                [Sequelize.Op.between]: [startDate, endDate]
            };
        }

        let options = {
            where: whereConditions,
            include: [
                {
                    model: OrderTabelModel, // Assuming you have a CustomerModel
                    as: 'OrdersTable', // Use the same alias you used in associations
                    attributes: ['OrderNumber']
                }
            ],
            // order: [
            //     ['CreatedAt', 'DESC'] 
            // ],

            order: [
                [Sequelize.literal('GREATEST("Feedback"."CreatedAt", "Feedback"."UpdatedAt")'), 'DESC'],
              ],
            limit: parseInt(pageSize),
            offset: offset
        };

        const { count, rows } = await FeedbackModel.findAndCountAll(options);

        // Formatting the result
        const formattedFeedbacks = rows.map(feedback => ({
            FeedBackID: feedback.FeedBackID,
            CustomerName: feedback.CustomerName,
            OrderID: feedback.OrderID,
            ItemName: feedback.ItemName,
            DeliveryDate: feedback.DeliveryDate,
            OrderNumber: feedback.OrdersTable?.OrderNumber || null, 
            ReceivedDocuments: feedback.ReceivedDocuments,
            ReceivedWarrantyCard: feedback.ReceivedWarrantyCard,
            InstallationSuccessful: feedback.InstallationSuccessful,
            OverallRating: feedback.OverallRating,
            Remarks: feedback.Remarks,
            StoreID: feedback.StoreID,

            CreatedAt: feedback.CreatedAt
          
        }));

        return res.status(200).json({
            StatusCode: 'SUCCESS',
            page: parseInt(pageNumber),
            pageSize: parseInt(pageSize),
            totalItems: count,
            totalPages: Math.ceil(count / pageSize),
            Feedbacks: formattedFeedbacks
        });
    } catch (error) {
        console.error('Error fetching feedbacks:', error);
        return res.status(500).json({ StatusCode: 'ERROR', message: 'Error fetching feedbacks' });
    }
};


// READ Feedback by OrderId (GET)
exports.GetFeedBackbyOrderID = async (req, res) => {
    try {
        const feedback = await FeedbackModel.findOne({ where: { OrderId: req.params.orderId } }); // Get feedback by OrderId
        if (feedback) {
            res.status(200).json(feedback);
        } else {
            res.status(404).json({ error: 'Feedback not found' });
        }
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// UPDATE Feedback (PATCH) - Partial Update
exports.UpdateFeedBack = async (req, res) => {
    try {
        const feedback = await FeedbackModel.findOne({ where: { OrderId: req.params.orderId } });

        if (!feedback) {
            return res.status(404).json({ error: 'Feedback not found' });
        }

        const { 
            CustomerName, 
            ItemName, 
            DeliveryDate, 
            ReceivedDocuments, 
            ReceivedWarrantyCard, 
            InstallationSuccessful, 
            OverallRating, 
            Remarks, 
            UpdatedBy 
        } = req.body;

        // Update only fields that are provided in req.body
        await feedback.update({
            ...(CustomerName && { CustomerName }),
            ...(ItemName && { ItemName }),
            ...(DeliveryDate && { DeliveryDate }),
            ...(typeof ReceivedDocuments === 'boolean' && { ReceivedDocuments }),
            ...(typeof ReceivedWarrantyCard === 'boolean' && { ReceivedWarrantyCard }),
            ...(typeof InstallationSuccessful === 'boolean' && { InstallationSuccessful }),
            ...(OverallRating && { OverallRating }),
            ...(Remarks && { Remarks }),
            UpdatedBy
        });

        res.status(200).json(feedback);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// DELETE Feedback by OrderId (DELETE)
exports.DeleteFeedBack = async (req, res) => {
    try {
        const feedback = await FeedbackModel.findOne({ where: { OrderId: req.params.orderId } });

        if (!feedback) {
            return res.status(404).json({ error: 'Feedback not found' });
        }

        await feedback.destroy(); // Delete the feedback
        res.status(204).send(); // No content response
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};


