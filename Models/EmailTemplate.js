const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('EmailTemplate', {
    TemplateID: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    TemplateName: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true, // Ensure template names are unique
    },
    Subject: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    Body: {
      type: DataTypes.TEXT, 
      allowNull: false,
    },
    Styles: {
      type: DataTypes.TEXT, 
      allowNull: true,
    },
    CreatedBy: {
      type: DataTypes.STRING,
    },
    CreatedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    UpdatedBy: {
      type: DataTypes.STRING,
    },
    UpdatedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    }
  }, {
    tableName: 'EmailTemplate',
    timestamps: false,
  });
};
