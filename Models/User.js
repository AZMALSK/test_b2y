const { DataTypes } = require('sequelize');
module.exports = (sequelize) => {
    return sequelize.define('UserManagement', {
        UserID: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        TenantID: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        EmployeeID: {
            type: DataTypes.STRING(50),
            unique: true,
            allowNull: false,
            defaultValue: () => `EMP-${Math.floor(Math.random() * 1000000)}` 
        },
        FirstName: {
            type: DataTypes.STRING(50),
            allowNull: true
        },
        LastName: {
            type: DataTypes.STRING(50),
            allowNull: true
        },
        Email: {
            type: DataTypes.STRING(50),
            allowNull: false,
            unique: true
        },
        Password: {
            type: DataTypes.STRING(50),
            allowNull: false
        },
        PhoneNumber: {
            type: DataTypes.STRING(20),
            allowNull: true,
            unique: true
        },
        Gender: {
            type: DataTypes.CHAR(1),
            allowNull: true,
            validate: {
                isIn: [['M', 'F']]
            }
        },
        RoleID: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'Role',
                key: 'RoleID'
            }
        },
        StoreID:{
            type:DataTypes.INTEGER,
            allowNull: false
        },
        AddressID: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        ProfileImage: {
            type: DataTypes.STRING, 
            allowNull: true
        },
        Comments: {
            type: DataTypes.TEXT, 
            allowNull: true
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
        tableName: 'UserManagement',
        timestamps: false  
    });
};
