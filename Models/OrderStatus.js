const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    return sequelize.define('OrderStatus', {
        StatusID: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        TenantID: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        OrderStatus: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        StoreID:{
            type:DataTypes.INTEGER,
            allowNull: false
        },
        CreatedBy: {
            type: DataTypes.STRING(255),
            allowNull: true
        },
        CreatedAt: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        },
        UpdatedBy: {
            type: DataTypes.STRING(255),
            allowNull: true
        },
        UpdatedAt: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        }
    }, {
        tableName: 'OrderStatus',
        timestamps: false
    });
};
