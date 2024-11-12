const { DataTypes } = require('sequelize');
module.exports = (sequelize) => {
    return sequelize.define('MapStoreUser', {
        MapStoreUserID: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        StoreID: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'Store',
                key: 'StoreID'
            }
        },
        UserID: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'UserManagement',
                key: 'UserID'
            }
        },
        CreatedBy: {
            type: DataTypes.STRING(50),
            allowNull: true
        },
        CreatedAt: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        },
        UpdatedBy: {
            type: DataTypes.STRING(50),
            allowNull: true
        },
        UpdatedAt: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        }
    }, {
        tableName: 'MapStoreUser',
        timestamps: false
    });
};
