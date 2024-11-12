const {  Payment, Orders ,OrderTabelModel,StoreModel,CustomerModel,} = require('../ConnectionDB/Connect');
const { Op } = require('sequelize');
const { Sequelize, DataTypes } = require('sequelize');

exports.getPaymentById = async (req, res) => {
    const { OrderID } = req.params;

    try {
        const payment = await Payment.findAll({ where: { OrderID } });

        // if (!payment) {
        //     return res.status(404).json({ error: 'Order not found.' });
        // }

        if (!payment || payment.length === 0) {
            return res.status(200).json({ 
                StatusCode: 'SUCCESS',
                error: 'Order not found.',
                totalRecords: 0
            });
        }

        res.status(200).json({
            StatusCode: 'SUCCESS',
            totalRecords: payment.length,
            data: payment,
        });
    } catch (error) {
        console.error('Error fetching payment by ID:', error);
        res.status(500).json({ error: 'An error occurred while fetching payment.' });
    }
};
    

exports.getAllPayments = async (req, res) => {
    const { page = 1, limit = 10, StoreID, StartDate, EndDate } = req.query;
    const searchText = req.query.searchText || ''; // Extract the search text from the query

    try {
        const offset = (page - 1) * limit;

        // Build the filtering conditions
        let whereConditions = {};

        // Apply search text filter on multiple fields
        if (searchText) {
            whereConditions = {
                ...whereConditions,
                [Op.or]: [
                    { PaymentMethod: { [Op.iLike]: `%${searchText}%` } },
                    { '$Customer.FirstName$': { [Op.iLike]: `%${searchText}%` } },
                    { '$Customer.LastName$': { [Op.iLike]: `%${searchText}%` } },
                    { '$OrdersTable.OrderNumber$': { [Op.iLike]: `%${searchText}%` } }
                ]
            };
        }

        // Apply StoreID filter if provided
        if (StoreID) {
            whereConditions.StoreID = StoreID;
        }

        // Apply StartDate and EndDate filter if provided
        if (StartDate && EndDate) {
            const startDate = new Date(StartDate);
            const endDate = new Date(EndDate);
            endDate.setUTCHours(23, 59, 59, 999); // Include the full end day

            whereConditions.CreatedAt = {
                [Op.between]: [startDate, endDate],
            };
        }

        // Perform the query
        const payments = await Payment.findAndCountAll({
            where: whereConditions,
            offset,
            limit: parseInt(limit),
            include: [
                {
                    model: OrderTabelModel, as: 'OrdersTable',
                    attributes: ['OrderNumber']
                },
                {
                    model: CustomerModel,
                    attributes: ['FirstName', 'LastName']
                },
                {
                    model: StoreModel, 
                    as: 'StoreTabel',
                    attributes: ['StoreID', 'StoreName']
                },
            ],
            order: [
                [Sequelize.literal('GREATEST("Payment"."CreatedAt", "Payment"."UpdatedAt")'), 'DESC'],
                ['PaymentMethod', 'ASC']
            ],
        });

        // Transform the response
        const transformedData = payments.rows.map(payment => ({
            PaymentID: payment.PaymentID,
            OrderID: payment.OrderID,
            CustomerID: payment.CustomerID,
            PaymentDate: payment.PaymentDate,
            Amount: payment.Amount,
            PaymentComments: payment.PaymentComments,
            PaymentMethod: payment.PaymentMethod,
            MaskedCardNumber: payment.MaskedCardNumber,
            OrderNumber: payment.OrdersTable?.OrderNumber || null, 
            StoreID: payment.StoreTabel?.StoreID || null,  
            StoreName: payment.StoreTabel?.StoreName || 'N/A',  
            CustomerName: `${payment.Customer.FirstName} ${payment.Customer.LastName}`
        }));

        res.status(200).json({
            StatusCode: 'SUCCESS',
            data: transformedData,
            totalRecords: payments.count,
            totalPages: Math.ceil(payments.count / limit),
            currentPage: parseInt(page),
        });
    } catch (error) {
        console.error('Error fetching payments:', error);
        res.status(500).json({ error: 'An error occurred while fetching payments.' });
    }
};



exports.getPaymentByPaymentId = async (req, res) => {
    const { PaymentID } = req.params;
    try {
        // Fetch the payment using PaymentID
        const payment = await Payment.findOne({ where: { PaymentID } });
        // If no payment found, return 404
        if (!payment) {
            return res.status(404).json({ error: 'Payment ID not found.' });
        }
        // Send success response with payment data
        res.status(200).json({
            StatusCode: 'SUCCESS',
            data: payment,
        });
    } catch (error) {
        console.error('Error fetching payment by ID:', error);
        res.status(500).json({ error: 'An error occurred while fetching the payment.' });
    }
};



exports.createOrUpdatePayment = async (req, res) => {
    const { PaymentID, OrderID, TenantID, UserID, CustomerID, PaymentDate, Amount, PaymentComments, PaymentMethod, MaskedCardNumber} = req.body;

    try {
        // Check if Order exists in Orders table
        const orderExists = await OrderTabelModel.findByPk(OrderID);
        if (!orderExists) {
            return res.status(400).json({ error: 'Order does not exist.' });
        }

        // If PaymentID is 0, create a new OrderHistory
        if (!PaymentID || PaymentID == 0) {
            const newPayment = await Payment.create({
                OrderID,
                TenantID,
                UserID,
                CustomerID,
                PaymentDate,
                Amount,
                PaymentComments,
                PaymentMethod,
                MaskedCardNumber,
                CreatedAt: new Date(),
                UpdatedAt: new Date(),
            });
            return res.status(201).json({
                StatusCode: 'SUCCESS',
                message: 'Order Payemnt created successfully .',
                // data: newPayment,
            });
        } else {
            // Check if the OrderHistory exists
            const existingPayment = await Payment.findByPk(PaymentID);
            if (!existingPayment) {
                return res.status(404).json({ error: 'Order history not found.' });
            }

            // If it exists, update the OrderHistory
            await existingPayment.update({
                OrderID,
                TenantID,
                UserID,
                CustomerID,
                PaymentDate,
                Amount,
                PaymentComments,
                PaymentMethod,
                UpdatedAt: new Date(),
                MaskedCardNumber,
            });

            return res.status(200).json({
                StatusCode: 'SUCCESS',
                message: 'Payemnt updated successfully .',
                // data: existingPayment,
            });
        }
    } catch (error) {
        console.error('Error creating or updating order Payment:', error);
        res.status(500).json({ error: 'Failed' });
    }
};
