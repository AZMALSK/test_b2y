const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    return sequelize.define('inventory_files', {
        FileID: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
          },
          FileName: {
            type: DataTypes.STRING,
            allowNull: false,
          },
          FileUrl: {
            type: DataTypes.STRING,
            allowNull: false,
          },
          FileType: {
            type: DataTypes.INTEGER,
            allowNull: false,
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
        tableName: 'inventory_files',
        timestamps: false,
    });
};
