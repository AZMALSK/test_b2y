const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    return sequelize.define('Permissions', {
        ID: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        Module: {
            type: DataTypes.STRING,
            allowNull: false
        },
        Name: {
            type: DataTypes.STRING,
            allowNull: false
        },
        Code: {
            type: DataTypes.STRING,
            allowNull: false
        },
        CreatedBy: {
            type: DataTypes.STRING,
            allowNull: false
        },
        CreatedDate: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        },
        TenantID: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        RolePermissionId: {
            type: DataTypes.INTEGER,
            allowNull: true  
        },
        IsChecked: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        }
    }, {
        tableName: 'Permissions',
        timestamps: false
    });
};
