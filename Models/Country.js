const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    return sequelize.define('Country', {
        CountryID: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        CountryName: {
            type: DataTypes.STRING(100),
            allowNull: false,
        },
        CountryCode: {
            type: DataTypes.STRING(100),
            allowNull: false,
        },
    }, {
        tableName: 'Country',
        timestamps: false,
    });
};
