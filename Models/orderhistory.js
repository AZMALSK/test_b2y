const { DataTypes } = require('sequelize');
const OrderStatus = require('./OrderStatus');

module.exports = (sequelize) => {
    return sequelize.define('OrderHistory', {
        OrderHistoryID: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        OrderID: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        StatusID: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        EndDate: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        AssignTo: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'UserManagement',
                key: 'UserID'
            }
        },
        Comments: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        DocumentName: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        OriginalFileNames: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        TenantID: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        UserID: {
            type: DataTypes.INTEGER,
            allowNull: true,
        }, 
        StoreID: {
            type: DataTypes.INTEGER,
            allowNull: true,
        }, 
        FinalMeasurementStatus: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        OrderHistoryStatus: {
            type: DataTypes.STRING(50),
            allowNull: true,
        },
        UserRoleID: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'Role', 
                key: 'RoleID' 
            }
        },
        SubStatusId: {
            type: DataTypes.INTEGER,
            allowNull: true, 
        },
        CreatedBy: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        CreatedAt: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
        },
        UpdatedBy: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        UpdatedAt: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
        }
    }, {
        tableName: 'OrderHistory',
        timestamps: false
    });
};

