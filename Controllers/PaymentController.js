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
    const { page = 1, limit = 10, StoreIDs, StartDate, EndDate, searchText = '' } = req.query;

    try {
        const pageNumber = Math.max(parseInt(page, 10), 1);
        const pageSize = Math.max(parseInt(limit, 10), 1);

        const offset = (pageNumber - 1) * pageSize;

        // Build query conditions
        const queryConditions = {};

        if (searchText) {
            queryConditions[Sequelize.Op.or] = [
                { PaymentMethod: { [Sequelize.Op.iLike]: `%${searchText}%` } },
                { '$Customer.FirstName$': { [Sequelize.Op.iLike]: `%${searchText}%` } },
                { '$Customer.LastName$': { [Sequelize.Op.iLike]: `%${searchText}%` } },
                { '$OrdersTable.OrderNumber$': { [Sequelize.Op.iLike]: `%${searchText}%` } }
            ];
        }

        if (StoreIDs) {
            const storeIdsArray = Array.isArray(StoreIDs) ? StoreIDs : StoreIDs.split(',');
            queryConditions.StoreID = { [Sequelize.Op.in]: storeIdsArray };
        }

        if (StartDate && EndDate) {
            const startDate = new Date(StartDate);
            const endDate = new Date(EndDate);
            endDate.setUTCHours(23, 59, 59, 999);

            queryConditions.CreatedAt = { [Sequelize.Op.between]: [startDate, endDate] };
        }

        const payments = await Payment.findAndCountAll({
            where: queryConditions,
            offset,
            limit: pageSize,
            include: [
                { model: OrderTabelModel, as: 'OrdersTable', attributes: ['OrderNumber'] },
                { model: CustomerModel, attributes: ['FirstName', 'LastName'] },
                { model: StoreModel, as: 'StoreTabel', attributes: ['StoreID', 'StoreName'] }
            ],
            order: [[Sequelize.literal('GREATEST("Payment"."CreatedAt", "Payment"."UpdatedAt")'), 'DESC'], ['PaymentMethod', 'ASC']]
        });

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
            totalPages: Math.ceil(payments.count / pageSize),
            currentPage: pageNumber
        });
    } catch (error) {
        console.error('Error fetching payments:', error);
        res.status(500).json({ error: 'Internal Server Error' });
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
    const { PaymentID, OrderID, TenantID, UserID, CustomerID, PaymentDate, Amount, PaymentComments,StoreID, PaymentMethod, MaskedCardNumber} = req.body;

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
                StoreID,
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
                StoreID,
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
