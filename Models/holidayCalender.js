const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    return sequelize.define('HolidayCalendar', {
        HolidayCalendarID: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        Date: {
            type: DataTypes.DATEONLY,
            allowNull: false
        },
        FestivalName: {
            type: DataTypes.STRING(100),
            allowNull: false
        },
        ColourCode: {
            type: DataTypes.STRING(7),
            allowNull: true,
            validate: {
                isHexColor(value) {
                    if (value) {
                        const hexColorRegex = /^#([0-9A-F]{3}){1,2}$/i;
                        if (!hexColorRegex.test(value)) {
                            throw new Error('Color code must be a valid hex color');
                        }
                    }
                }
            }
        }
    }, {
        tableName: 'HolidayCalendar',
        timestamps: false
    });
};
