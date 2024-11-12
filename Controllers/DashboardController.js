const {   OrderTabelModel , CustomerModel, Payment } = require('../ConnectionDB/Connect');
const { Sequelize, DataTypes } = require('sequelize');
const moment = require('moment'); 

exports.getOverAllDataForDashboard = async (req, res) => {
    const { StoreId, StartDate, EndDate } = req.body;
    
    try {
        let orders = { where: {} };
        let productions = { where: { StatusID: 7 } };
        let payment = { where: {} };
        let customers = { where: {} };

        // Apply StoreId filter if provided
        if (StoreId) {
            orders.where.StoreID = StoreId;
            productions.where.StoreID = StoreId;
            payment.where.StoreID = StoreId;
            customers.where.StoreID = StoreId;
        }

        // Apply date range filter if provided
        if (StartDate && EndDate) {
            const startDate = moment(StartDate).startOf('day').toDate();
            const endDate = moment(EndDate).endOf('day').toDate();
            orders.where.OrderDate = { [Sequelize.Op.between]: [startDate, endDate] };
            productions.where.OrderDate = { [Sequelize.Op.between]: [startDate, endDate] };
            payment.where.PaymentDate = { [Sequelize.Op.between]: [startDate, endDate] };
            customers.where.CreatedAt = { [Sequelize.Op.between]: [startDate, endDate] };
        }

        // Fetch data
        const totalOrders = await OrderTabelModel.count(orders);
        const productionOrders = await OrderTabelModel.count(productions);
        const totalPayments = await Payment.sum('Amount', payment);
        const totalCustomers = await CustomerModel.count(customers);

        // Fetch count of each OrderStatus along with StatusID
        const orderStatusCounts = await OrderTabelModel.findAll({
            where: orders.where,
            attributes: [
                'StatusID', 
                'OrderStatus', 
                [Sequelize.fn('COUNT', Sequelize.col('OrderID')), 'Count']
            ],
            group: ['StatusID', 'OrderStatus']
        });
    
        // Format the order status data
        const formattedOrderStatusCounts = orderStatusCounts.map(status => ({
            StatusID: status.StatusID,
            OrderStatus: status.OrderStatus,
            Count: status.getDataValue('Count')
        }));

        res.status(200).json({
            StatusCode: 'SUCCESS',
            TotalOrderCount: totalOrders,
            ProductionOrderCount: productionOrders,
            PaymentTotal: totalPayments,
            CustomerCount: totalCustomers,
            OrderStatusCounts: formattedOrderStatusCounts
        });
    } catch (error) {
        console.error('Error fetching dashboard data:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};


exports.getSalesAndPaymentReportByMonth = async (req, res) => {
    const { StoreId } = req.body;

    try {
        let order = { where: {}, attributes: [[Sequelize.fn('DATE_TRUNC', 'month', Sequelize.col('OrderDate')), 'Month'], [Sequelize.fn('COUNT', Sequelize.col('OrderID')), 'OrderCount']] };
        let payment = { where: {}, attributes: [[Sequelize.fn('DATE_TRUNC', 'month', Sequelize.col('PaymentDate')), 'Month'], [Sequelize.fn('SUM', Sequelize.col('Amount')), 'TotalPayments']] };

        // Apply StoreId filter if provided
        if (StoreId) {
            order.where.StoreID = StoreId;
            payment.where.StoreID = StoreId;
        }

        // Fetch orders and payments grouped by month
        const ordersByMonth = await OrderTabelModel.findAll({
            where: order.where,
            attributes: order.attributes,
            group: ['Month']
        });

        const paymentsByMonth = await Payment.findAll({
            where: payment.where,
            attributes: payment.attributes,
            group: ['Month']
        });

        // Create an array for months from January to December with default values
        const months = Array.from({ length: 12 }, (_, i) => ({
            Month: new Date(2024, i).toLocaleString('default', { month: 'short' }),
            OrderCount: 0,
            TotalPayments: 0
        }));

        // Fill the months with order and payment data
        ordersByMonth.forEach(order => {
            const monthIndex = new Date(order.getDataValue('Month')).getMonth();
            months[monthIndex].OrderCount = order.getDataValue('OrderCount');
        });

        paymentsByMonth.forEach(payment => {
            const monthIndex = new Date(payment.getDataValue('Month')).getMonth();
            months[monthIndex].TotalPayments = payment.getDataValue('TotalPayments');
        });

        res.status(200).json({
            StatusCode: 'SUCCESS',
            OrdersAndPayments: months
        });
    } catch (error) {
        console.error('Error fetching sales and payment report by month:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
