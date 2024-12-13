const { DataTypes } = require('sequelize');
 
module.exports = (sequelize) => {
    return sequelize.define('Tenant', {
        TenantID: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        CompanyName: {
            type: DataTypes.STRING,
            allowNull: true
        },
        CompanyCode: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        Email: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true
        },
        PhoneNumber: {
            type: DataTypes.STRING,
            unique: true
        },
        Password: {  
            type: DataTypes.STRING,
            allowNull: false
        },
        GSTno: {
            type: DataTypes.STRING,
            allowNull: true
        },
        AddressLine: {
            type: DataTypes.STRING,
            allowNull: true
        },
        CityID: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        StateID: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        CountryID: {
            type: DataTypes.INTEGER,
            allowNull: false
           
        },
        Pincode: {
            type: DataTypes.INTEGER,
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
        tableName: 'Tenant',
        timestamps: false
    });
};
