const { sequelize, CustomerModel, AddressModel,StoreModel,Orders,Payment,
    OrderTabelModel,OrderStatusModel,CityModel,StateModel,CountryModel} = require('../ConnectionDB/Connect');
const { Sequelize, DataTypes } = require('sequelize');
const { Op } = require('sequelize');
const XLSX = require('xlsx');
const fs = require('fs');
const moment = require('moment'); 
const path = require('path');
const ExcelJS = require('exceljs');

exports.getPaymentReport = async (req, res) => {
    const { StartDate, EndDate, StoreID, OrderID } = req.body;
    try {
        let whereClause = {};
        if (StartDate && EndDate) {
            const startDate = new Date(StartDate);
            const endDate = new Date(EndDate);
            endDate.setUTCHours(23, 59, 59, 999);

             whereClause.PaymentDate = {
                [Op.between]: [startDate, endDate],
            };
        }
        if (StoreID) {
            whereClause.StoreID = StoreID;
        }
        if (OrderID) {
            whereClause.OrderID = OrderID;
        }
        const payments = await Payment.findAll({
            where: whereClause,
            include: [
                {
                    model: OrderTabelModel,
                    as: 'OrdersTable',
                    attributes: ['OrderNumber'],
                    include: [
                        {
                            model: CustomerModel,
                            as: 'Customer',
                            attributes: ['FirstName', 'LastName', 'Email', 'PhoneNumber'],
                        },
                    ],
                },
            ],
            attributes: ['PaymentID','OrderID','Amount', 'PaymentDate','CreatedAt'],
            order: [
                [Sequelize.literal('GREATEST("Payment"."CreatedAt", "Payment"."UpdatedAt")'), 'DESC'],
                ['PaymentMethod', 'ASC']
            ],
        });
        if (!payments.length) {
            return res.status(404).json({ error: 'No payments found for the given criteria' });
        }
        const paymentReportData = payments.map(payment => ({
            PaymentNumber: payment.PaymentID,
            OrderNumber: payment.OrdersTable?.OrderNumber || '',
            CustomerName: payment.OrdersTable?.Customer ? `${payment.OrdersTable.Customer.FirstName} ${payment.OrdersTable.Customer.LastName}`.trim() || '' : '',
            Email: payment.OrdersTable?.Customer?.Email || '',
            Contact: payment.OrdersTable?.Customer?.PhoneNumber || '',
            Amount: payment.Amount || 0,
            PaymentType: payment.PaymentMethod || '',
            PaymentDate: payment.PaymentDate ? payment.PaymentDate.toISOString().split('T')[0] : '',
            CreatedAt: payment.CreatedAt 
        }));
        // Create a new workbook and worksheet
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Payment Report');
        // Define header row
        const headers = [
            { header: 'Payment Number', key: 'PaymentNumber', width: 15 },
            { header: 'Order Number', key: 'OrderNumber', width: 15 },
            { header: 'Customer Name', key: 'CustomerName', width: 30 },
            { header: 'Email', key: 'Email', width: 25 },
            { header: 'Contact', key: 'Contact', width: 15 },
            { header: 'Amount', key: 'Amount', width: 10 },
            { header: 'Payment Type', key: 'PaymentType', width: 15 },
            { header: 'Payment Date', key: 'PaymentDate', width: 15 },
            { header: 'CreatedAt', key: 'CreatedAt', width: 15 },
        ];
        // Add headers to the worksheet
        worksheet.columns = headers;
        // Apply styles to the header row
        worksheet.getRow(1).eachCell(cell => {
            cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };  // White text
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FF622F0F' },  // Dark brown background (#622f0f)
            };
            cell.alignment = { vertical: 'middle', horizontal: 'center' };
        });
        // Add payment data to worksheet
        paymentReportData.forEach((data) => {
            worksheet.addRow(data);
        });
        // Apply center alignment to all data rows
        worksheet.eachRow((row, rowNumber) => {
            if (rowNumber !== 1) {  // Skip the header row
                row.eachCell(cell => {
                    cell.alignment = { vertical: 'middle', horizontal: 'center' };
                });
            }
        });
        // Define file path
        const reportsDir = path.join(__dirname, '../reports');
        const fileName = `PaymentReport_${new Date().toISOString().replace(/:/g, '-')}.xlsx`;
        const filePath = path.join(reportsDir, fileName);
        // Ensure the reports directory exists; if not, create it
        if (!fs.existsSync(reportsDir)) {
            fs.mkdirSync(reportsDir, { recursive: true });
        }
        // Write the workbook to the file
        await workbook.xlsx.writeFile(filePath);
        // Set headers for file download
        res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        // Send the file as a download
        res.download(filePath, fileName, (err) => {
            if (err) {
                console.error('Error downloading file:', err);
                res.status(500).send('Error downloading file');
            }
        });
    } catch (error) {
        console.error('Error fetching payment report:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: error.message,
        });
    }
};


exports.getOrderReport = async (req, res) => {
    const { StartDate, EndDate, StoreID, StatusID } = req.body;
    try {
        // Initialize an empty where clause
        let whereClause = {};

        // If both StartDate and EndDate are provided, add date range filter
        if (StartDate && EndDate) {
            const startDate = new Date(StartDate);
            const endDate = new Date(EndDate);
            endDate.setUTCHours(23, 59, 59, 999);

            whereClause.CreatedAt = {
                 [Op.between]: [startDate, endDate],
            };
        }

        // Add StoreID filter if provided and not null
        if (StoreID != null && StoreID !== '') {
            whereClause.StoreID = StoreID;
        }

        // Add StatusID filter if provided and not null
        if (StatusID != null && StatusID !== '') {
            whereClause.StatusID = StatusID;
        }

        // Fetch order data with associated models (Customer, OrderStatus, Payment)
        const orders = await OrderTabelModel.findAll({
            where: whereClause,
            include: [
                {
                    model: CustomerModel,as:'Customer',
                    attributes: ['FirstName', 'LastName', 'PhoneNumber', 'Email'],
                },
                {
                    model: OrderStatusModel,
                    as: 'Order_TabelStatus',
                    attributes: ['OrderStatus'],
                },
                {
                    model: Payment,
                    as: 'Payments',
                    attributes: ['Amount', ],
                },
            ],
            order: [
                [Sequelize.literal('GREATEST("OrdersTable"."CreatedAt", "OrdersTable"."UpdatedAt")'), 'DESC'],
                ['DesginerName', 'ASC']
              ],
            attributes: ['OrderID', 'OrderNumber', 'OrderDate', 'TotalAmount', 'DeliveryDate','CreatedAt'],
        });

        // If no orders found, return 200 with an error message
        if (!orders.length) {
            return res.status(200).json({ error: 'No orders found for the given criteria' });
        }

        // Prepare order data for the Excel report
        const orderReportData = [];
        for (const order of orders) {
            const payments = await Payment.findAll({
                where: { OrderID: order.OrderID },  // Make sure OrderID is passed correctly
                attributes: ['Amount']
            });

            // Sum up advance amounts and calculate balance amounts
            const totalAdvanceAmount = payments.reduce((sum, payment) => sum + parseFloat(payment.Amount || 0), 0);
            const totalBalanceAmount = order.TotalAmount - totalAdvanceAmount;

            orderReportData.push({
                OrderNumber: order.OrderNumber,
                OrderDate: order.OrderDate ? order.OrderDate.toISOString().split('T')[0] : 'N/A',
                OrderStatus: order.Order_TabelStatus?.OrderStatus || 'N/A',
                ExpectedDeliveryDate: order.DeliveryDate ? order.DeliveryDate.toISOString().split('T')[0] : 'N/A',
                CustomerName: order.Customer ? `${order.Customer.FirstName} ${order.Customer.LastName}` : 'N/A',
                CustomerContact: order.Customer?.PhoneNumber || 'N/A',
                CustomerEmail: order.Customer?.Email || 'N/A',
                TotalAmount: order.TotalAmount || 0,
                PaidAmount: totalAdvanceAmount || 0,
                BalanceAmount: totalBalanceAmount || 0,
                CreatedAt: order.CreatedAt ? order.CreatedAt.toISOString().split('T')[0] : 'N/A',
            });
        }

        // Create the Excel report using ExcelJS
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Order Report');

        // Define headers with custom width
        worksheet.columns = [
            { header: 'Order Number', key: 'OrderNumber', width: 20 },
            { header: 'Order Date', key: 'OrderDate', width: 15 },
            { header: 'Order Status', key: 'OrderStatus', width: 15 },
            { header: 'Expected Delivery Date', key: 'ExpectedDeliveryDate', width: 20 },
            { header: 'Customer Name', key: 'CustomerName', width: 25 },
            { header: 'Customer Contact', key: 'CustomerContact', width: 15 },
            { header: 'Customer Email', key: 'CustomerEmail', width: 25 },
            { header: 'Total Amount', key: 'TotalAmount', width: 15 },
            { header: 'Paid Amount', key: 'PaidAmount', width: 15 },
            // { header: 'Balance Amount', key: 'BalanceAmount', width: 15 },
            { header: 'CreatedAt', key: 'CreatedAt', width: 15 },
        ];

        // Style the header row
        worksheet.getRow(1).eachCell(cell => {
            cell.font = { bold: true, color: { argb: 'FFFFFFFF' } }; // White text
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FF622F0F' }, // Dark brown background
            };
            cell.alignment = { vertical: 'middle', horizontal: 'center' };
        });

        // Add data rows
        orderReportData.forEach(data => {
            worksheet.addRow(data);
        });

        // Define file path
        const reportsDir = path.join(__dirname, '../reports');
        const fileName = `OrderReport_${new Date().toISOString().replace(/:/g, '-')}.xlsx`;
        const filePath = path.join(reportsDir, fileName);

        // Ensure the reports directory exists
        if (!fs.existsSync(reportsDir)) {
            fs.mkdirSync(reportsDir, { recursive: true });
        }

        // Write the workbook to a file
        await workbook.xlsx.writeFile(filePath);

        // Send the file as a download
        res.download(filePath, fileName, err => {
            if (err) {
                console.error('Error downloading file:', err);
                res.status(500).send('Error downloading file');
            }
        });

    } catch (error) {
        console.error('Error fetching order report:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: error.message,
        });
    }
};


exports.getCustomerReport = async (req, res) => {
    const { StartDate, EndDate, StoreID, ReferedBy } = req.body;
    try {
        // Initialize an empty where clause
        let whereClause = {};
        // If both StartDate and EndDate are provided, add date range filter
        if (StartDate && EndDate) {
            if (StartDate && EndDate) {
                const startDate = new Date(StartDate);
                const endDate = new Date(EndDate);
                endDate.setUTCHours(23, 59, 59, 999);
    
                whereClause.CreatedAt = {
                     [Op.between]: [startDate, endDate],
                };
            }
        }
        // Add StoreID filter if provided
        if (StoreID) {
            whereClause.StoreID = StoreID;
        }
        // Add ReferedBy filter if provided and not empty
        if (ReferedBy && ReferedBy.trim() !== '') {
            whereClause.ReferedBy = ReferedBy.trim();
        }
        // console.log('Where clause:', JSON.stringify(whereClause, null, 2));
        // Fetch customer data with their associated addresses
        const customers = await CustomerModel.findAll({
            where: whereClause,
            include: [
                {
                    model: AddressModel,
                    as: 'Address',
                    attributes: ['ZipCode'],
                    include: [
                        { model: CityModel, as: 'City', attributes: ['CityName'] },
                        { model: StateModel, as: 'State', attributes: ['StateName'] },
                        { model: CountryModel, as: 'Country', attributes: ['CountryName'] }
                    ]
                },
            ],
           
            attributes: ['FirstName', 'LastName', 'Email', 'PhoneNumber', 'ReferedBy', 'CreatedAt'],
            order: [
                [Sequelize.literal('GREATEST("Customer"."CreatedAt", "Customer"."UpdatedAt")'), 'DESC'],
                ['FirstName', 'ASC']
            ]
        });
        // console.log('Query result:', JSON.stringify(customers, null, 2));
        // If no customers found, return 404
        if (!customers.length) {
            return res.status(404).json({ error: 'No customers found for the given criteria' });
        }
        // Prepare customer data for the Excel report
        const customerReportData = customers.map(customer => ({
            CustomerName: `${customer.FirstName} ${customer.LastName}`,
            Email: customer.Email,
            Phone: customer.PhoneNumber,
            ReferedBy: customer.ReferedBy || 'N/A',
            Address: customer.Address.length>0
                ? customer.Address[0].City.CityName + ","
                 +customer.Address[0].State.StateName +", "
                 +customer.Address[0].Country.CountryName +" ,"
                 +customer.Address[0].ZipCode 
                 : 'No address',
            CreatedAt: customer.CreatedAt.toISOString().split('T')[0], // Format date as YYYY-MM-DD
        }));
        // Create a new workbook and worksheet using the XLSX library
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Customer Report');
        // Define headers
        worksheet.columns = [
            { header: 'Customer Name', key: 'CustomerName', width: 25 },
            { header: 'Email', key: 'Email', width: 25 },
            { header: 'Phone', key: 'Phone', width: 15 },
            { header: 'ReferedBy', key: 'ReferedBy', width: 15 },
            { header: 'Address', key: 'Address', width: 40 },
            { header: 'CreatedAt', key: 'CreatedAt', width: 15 },
        ];
        worksheet.getRow(1).eachCell(cell => {
            cell.font = { bold: true, color: { argb: 'FFFFFFFF' } }; // White text
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FF622F0F' }, // Dark brown background
            };
            cell.alignment = { vertical: 'middle', horizontal: 'center' };
        });
        customerReportData.forEach(data => {
            worksheet.addRow(data);
        });
        // Apply center alignment to all data rows
        worksheet.eachRow((row, rowNumber) => {
            if (rowNumber !== 1) { // Skip the header row
                row.eachCell(cell => {
                    cell.alignment = { vertical: 'middle', horizontal: 'center' };
                });
            }
        });
         // Define file path
         const reportsDir = path.join(__dirname, '../reports');
         const fileName = `CustomerReport_${new Date().toISOString().replace(/:/g, '-')}.xlsx`;
         const filePath = path.join(reportsDir, fileName);
          // Ensure the reports directory exists
        if (!fs.existsSync(reportsDir)) {
            fs.mkdirSync(reportsDir, { recursive: true });
        }
        // Write the workbook to a file
        await workbook.xlsx.writeFile(filePath);
        // Set headers for file download
        res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        // Send the file as a download
        res.download(filePath, fileName, err => {
            if (err) {
                console.error('Error downloading file:', err);
                res.status(500).send('Error downloading file');
            }
        });
    } catch (error) {
        console.error('Error fetching customer report:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: error.message,
        });
    }
};