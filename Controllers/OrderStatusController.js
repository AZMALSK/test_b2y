const { OrderStatusModel } = require('../ConnectionDB/Connect');
const { Op } = require('sequelize'); 
const { Sequelize, DataTypes } = require('sequelize');

exports.CreateorupdateStatus = async (req, res) => {
    const {
        StatusID,
        TenantID,
        OrderStatus,
        StoreID,
        CreatedBy,
        UpdatedBy 
    } = req.body;

    try {
        // Check if the Order Status with the given StatusID exists
        const orderStatus = await OrderStatusModel.findByPk(StatusID);
        if (!orderStatus && StatusID != 0) {
            return res.status(400).json({ error: 'Status ID not found' });
        }

        // If StatusID is 0, create a new OrderStatus
        if (StatusID == 0) {
            const newOrderStatus = await OrderStatusModel.create({
                TenantID,
                OrderStatus,
                StoreID,
                CreatedBy,
                UpdatedAt: new Date(),        
                CreatedAt: new Date(),
                UpdatedBy
            });

            return res.status(201).json({
                StatusCode: 'SUCCESS',
                message: 'Order Status created successfully',
                data: newOrderStatus
            });

        } else {
            // Update the existing Order Status if StatusID is provided
            await orderStatus.update({
                TenantID,
                OrderStatus,
                StoreID,
                CreatedBy,
                UpdatedAt: new Date(),
                UpdatedBy
            });

            return res.status(200).json({
                StatusCode: 'SUCCESS',
                message: 'Order Status updated successfully',
                data: orderStatus,
            });
        }

    } catch (error) {
        console.error('Error creating or updating order status:', error);
        res.status(500).json({ error: 'An error occurred while processing the order status' });
    }
};


exports.getAllOrderStatus = async (req, res) => {
    const { page = 1, limit = 12 } = req.query;
    const searchText = Object.keys(req.query).find(key => key.toLowerCase() === 'searchtext');
    const searchValue = req.query[searchText]?.toLowerCase() || '';
    try {
        const offset = (page - 1) * limit;
  
        const ordersstatus = await OrderStatusModel.findAndCountAll({
            where: {
                [Op.or]: [
                    { OrderStatus: { [Op.iLike]: `%${searchValue}%` } }, 
                
                ]
            },
           
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [
              [Sequelize.literal('GREATEST("OrderStatus"."CreatedAt", "OrderStatus"."UpdatedAt")'), 'DESC'],
            //   ['OrderStatus', 'ASC']
          ],
            // distinct: true 
        });
  
        res.status(200).json({
            StatusCode: 'SUCCESS',
            message: 'OrdersStatus fetched successfully',
            data: ordersstatus.rows, // The fetched orders with related customers and addresses
            totalRecords: ordersstatus.count,
            totalPages: Math.ceil(ordersstatus.count / limit),
            currentPage: parseInt(page),
        });
  
    } catch (error) {
        console.error('Error fetching all orders:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

exports.getOrderStatusById = async (req, res) => {
    const { StatusID } = req.params;

    try {
        const order = await OrderStatusModel.findByPk(StatusID, {
        //   include: [
        //     { 
        //         model: CustomerModel, 
        //         include: [
        //             { model: AddressModel, as: 'Address' }
        //         ],
        //     },
        // ],
        });

        if (!StatusID) {
            return res.status(404).json({ error: 'StatusID not found.' });
        }

        res.status(200).json({
            StatusCode: 'SUCCESS',
            message: 'Status Fetched By ID successfully',
            order
        });

    } catch (error) {
        console.error('Error fetching Status by ID:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};


exports.deleteOrderStatusById = async (req, res) => {
    const { StatusID } = req.params;

    try {
        const Statusdeleted = await OrderStatusModel.destroy({ where: { StatusID } });

        if (Statusdeleted) {
            res.status(200).json({StatusCode: 'SUCCESS', 
                                  message: 'Status deleted successfully.' });
        } else {
            res.status(404).json({ error: 'Status not found.' });
        }

    } catch (error) {
        console.error('Error deleting Status:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
