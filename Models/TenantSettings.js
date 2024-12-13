const { DataTypes } = require('sequelize');
 
module.exports = (sequelize) => {
    return sequelize.define('TenantSettings', {
        TenantID: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        CompanyName: {
            type: DataTypes.STRING,
            allowNull: true
        },
        CompanyImage: {
            type: DataTypes.STRING, 
            allowNull: true
        },
        CompanyLogo: {
            type: DataTypes.STRING, 
            allowNull: true
        },
        CreatedBy: {
            type: DataTypes.STRING,
            allowNull: true
        },
        CreatedAt: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        },
        UpdatedBy: {
            type: DataTypes.STRING,
            allowNull: true
        },
        UpdatedAt: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        }
    }, {
        tableName: 'TenantSettings',
        timestamps: false
    });
};
