const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    return sequelize.define('Reference', {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        parentId: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'Reference', // Note the plural form
                key: 'id',
            },
        },
        isActive: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true,
        }
    }, {
        tableName: 'Reference',
        timestamps: true,
    });

    

    
};

