const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    return sequelize.define('StateProvince', {
        StateID: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        StateName: {
            type: DataTypes.STRING(100),
            allowNull: false,
        },
        StateCode: {
            type: DataTypes.STRING(100),
            allowNull: false,
        },
        CountryID: {
            type: DataTypes.INTEGER,
            references: {
                model: 'Country',
                key: 'CountryID'
            },
            onDelete: 'SET NULL',
        },
    }, {
        tableName: 'State',
        timestamps: false,
    });
};
