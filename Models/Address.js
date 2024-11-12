const{DataTypes}= require('sequelize')
module.exports=(sequelize)=>{
    return sequelize.define('Address',{
        AddressID:{
            type:DataTypes.INTEGER,
            autoIncrement:true,
            primaryKey:true

        },
        TenantID:{
            type:DataTypes.INTEGER,
            allowNull:false
        },
        CustomerID:{
            type:DataTypes.INTEGER,
            allowNull:false,
            references: {
                model: 'Customer',
                key: 'CustomerID'
            }
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
        CreatedBy: DataTypes.STRING,
        CreatedAt: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        },
        UpdatedBy: DataTypes.STRING,
        UpdatedAt: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        }
    },{
        tableName: 'Address',
        timestamps: false
    });
}
