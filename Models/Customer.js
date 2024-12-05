const {DataTypes} =require('sequelize')
module.exports=(sequelize)=>{
    return sequelize.define('Customer',{
        CustomerID:{
            type:DataTypes.INTEGER,
            autoIncrement:true,
            primaryKey:true
        },
        CustomerNumber:{
            type:DataTypes.STRING(50),
            allowNull:true
        },
        TenantID:{
            type:DataTypes.INTEGER,
            allowNull:false
        },
        FirstName:{
            type:DataTypes.STRING(50),
            allowNull:true
        },
        LastName:{
            type:DataTypes.STRING(50),
            allowNull:true
        },
        Email: {
            type: DataTypes.STRING(255),
            allowNull: false,
            unique: true
        },
        Password: {
            type: DataTypes.STRING(255),
            allowNull: true
        },
        PhoneNumber: {
            type: DataTypes.STRING(20),
            allowNull: true,
            unique: true
        },
        Alternative_PhoneNumber:{
            type:DataTypes.STRING(20),
            allowNull:true
        },
        ReferedBy:{
            type:DataTypes.STRING(50),
            allowNull:true
        },
        SubReference:{
            type:DataTypes.STRING(50),
            allowNull:true
        },
        Comments:{
            type:DataTypes.STRING(255),
            allowNull:true
        },
        Gender: {
            type: DataTypes.CHAR(1),
            allowNull: true,
            validate: {
                isIn: {
                    args: [['M', 'F']],
                    msg: "Gender must be either 'M' or 'F'"
                }
            }
        },
        StoreID:{
            type:DataTypes.INTEGER,
            allowNull: false
        },
        ReferredByID: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'Reference', // Table name
                key: 'id', // Primary key in the Reference table
            },
        },
        SubReferenceID: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'Reference',
                key: 'id'
            }
        },
        isConfirmed: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
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
        tableName: 'Customer',
        timestamps: false  
    });

};
