const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    return sequelize.define('Feedback', {
        FeedBackID:{
            type:DataTypes.INTEGER,
            autoIncrement:true,
            primaryKey:true
        },
        CustomerName: {
            type: DataTypes.STRING(100),
            allowNull: true
        },
        OrderID: {
            type: DataTypes.INTEGER,
            allowNull: false,
            unique: false
        },
        ItemName: {
            type: DataTypes.STRING(100),
            allowNull: true
        },
        DeliveryDate: {
            type: DataTypes.DATE,
            allowNull: true
        },
        ReceivedDocuments: {
            type: DataTypes.BOOLEAN,
            allowNull: true,
            defaultValue: false
        },
        ReceivedWarrantyCard: {
            type: DataTypes.BOOLEAN,
            allowNull: true,
            defaultValue: false
        },
        InstallationSuccessful: {
            type: DataTypes.BOOLEAN,
            allowNull: true,
            defaultValue: false
        },
        OverallRating: {
            type: DataTypes.INTEGER,
            allowNull: true,
            validate: {
                min: 1,
                max: 5
            }
        },
        Remarks: {
            type: DataTypes.STRING,
            allowNull: true
        },
        StoreID:{
            type:DataTypes.INTEGER,
            allowNull: false
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
        tableName: 'Feedback',
        timestamps: false
    });
};
