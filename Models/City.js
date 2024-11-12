const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    return sequelize.define('City', {
        CityID: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        CityName: {
            type: DataTypes.STRING(100),
            allowNull: false,
        },
        CityCode: {
            type: DataTypes.STRING(100),
            allowNull: false,
        },
        StateID: {
            type: DataTypes.INTEGER,
            references: {
                model: 'State',
                key: 'StateID'
            },
            onDelete: 'SET NULL',
        }
    }, {
        tableName: 'City',
        timestamps: false,
    });
};
