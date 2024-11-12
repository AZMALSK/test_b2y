const {DataTypes}= require('sequelize')
module.exports=(sequelize)=>{
    return sequelize.define('Store',{
        StoreID:{
            type:DataTypes.INTEGER,
            autoIncrement:true,
            primaryKey:true
        },
        
        TenantID:{
            type:DataTypes.INTEGER,
            allowNull:false
        },
        
        StoreName:{
            type:DataTypes.STRING(50),
            allowNull:false
            
        },
        Email:{
            type:DataTypes.STRING(50),
            unique:true,
            allowNull:false
        },
        Phone:{
            type:DataTypes.STRING(20),
            unique:true,
            allowNull:false
        },
        AddressLine1:{
            type:DataTypes.STRING(100),
            allowNull:true
        },
        AddressLine2:{
            type:DataTypes.STRING(100),
            allowNull:true
        },
        CityID:{
            type:DataTypes.INTEGER,
            allowNull:false
        },
        StoreCode:{
            type:DataTypes.STRING,
            allowNull:false
        },
        StateID:{
            type:DataTypes.INTEGER,
            allowNull:false
        },
        CountryID:{
            type:DataTypes.INTEGER,
            allowNull:false
        },
        ZipCode:{
            type:DataTypes.INTEGER,
            allowNull:false
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
    },  {
        tableName:'Store',
        timestamps:false
    });
};

    
