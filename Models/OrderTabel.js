
const {DataTypes}= require('sequelize')
module.exports=(sequelize)=>{
    return sequelize.define('OrdersTable',{
        OrderID: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        OrderNumber:DataTypes.STRING,
        TenantID: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        CustomerID: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        AddressID:{
            type:DataTypes.INTEGER,
            allowNull: true

        },
        OrderDate: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        },
        TotalQuantity: DataTypes.INTEGER,
        TotalAmount: DataTypes.DECIMAL(10, 2),
        OrderStatus: DataTypes.STRING,
        OrderBy: DataTypes.STRING,
        DeliveryDate: DataTypes.DATE,
        Type :DataTypes.STRING,
        Comments:DataTypes.STRING,
        ReferedBy:DataTypes.STRING,
        DesginerName:DataTypes.STRING,
        ProjectTypeID: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'ProjectType', // Table name
                key: 'ProjectTypeID', // Primary key in the ProjectType table
            },
        },
        ReferredByID: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'Reference', // Table name
                key: 'id', // Primary key in the Reference table
            },
        },
        SubReference:{
            type:DataTypes.STRING(50),
            allowNull:true
        },
        StatusDeliveryDate:{
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        },
        StoreID:{
            type:DataTypes.INTEGER,
            allowNull: false
        },
        AdvanceAmount:{
            type: DataTypes.DECIMAL(10, 2),
        },
        StatusID: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        UserID: {
            type: DataTypes.INTEGER,
            allowNull: true,
        }, 
        SubStatusId: {
            type: DataTypes.INTEGER,
            allowNull: true, 
          },
          SubStatusUpdatedDate: {
            type: DataTypes.DATE,
            allowNull: true,
            defaultValue: DataTypes.NOW,
          },
        CreatedBy: DataTypes.STRING,
        CreatedAt: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        },
        UpdatedBy: DataTypes.STRING,
         ExpectedDurationDays:{
            type: DataTypes.INTEGER,

        },
        UpdatedAt: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        }
    },  {
        tableName:'OrdersTable',
        timestamps:false
    });
};

    

// StatusDelDate
