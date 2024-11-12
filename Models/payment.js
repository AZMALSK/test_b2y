
const {DataTypes}= require('sequelize')
module.exports=(sequelize)=>{
    return sequelize.define('Payment',{
        PaymentID: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        OrderID: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'OrdersTable',
                key: 'OrderID',
            },
            onDelete: 'CASCADE',
        },
        TenantID: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        CustomerID: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        PaymentDate: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
        },
        Amount:{
            type: DataTypes.DECIMAL(10, 2),
        },
        PaymentComments:{
            type: DataTypes.STRING(100),
        },

        PaymentMethod: {
            type: DataTypes.STRING(50),
        },
        MaskedCardNumber: {
            type: DataTypes.STRING(20),
        },
        StoreID:{
            type:DataTypes.INTEGER,
            allowNull: true
        },
        CreatedAt: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
        },
        UpdatedAt: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
        }
        // ExpectedDurationDays:{
        //     type: DataTypes.INTEGER,

        // }
    },  {
        tableName:'Payment',
        timestamps:false
    });
};

    
