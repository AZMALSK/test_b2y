const {HolidayCalendarModel,sequelize} = require('../ConnectionDB/Connect');


exports.listHolidays = async (req, res) => {
    try {
        const holidays = await HolidayCalendarModel.findAll({
            order: [['Date', 'ASC']]
        });

        res.status(200).json({
            StatusCode: 'SUCCESS',
            totalHolidays: holidays.length,
            holidays
        });
    } catch (error) {
        res.status(500).json({
            StatusCode: 'Failure',
            message: 'Error fetching holidays',
            error: error.message
        });
    }
};
// exports.listHolidays = async (req, res) => {
//     try {
//         const page = parseInt(req.query.page) || 1;
//         const limit = parseInt(req.query.limit) || 10;
//         const offset = (page - 1) * limit;

//         const { count, rows: holidays } = await HolidayCalendarModel.findAndCountAll({
//             where: {
//                 IsActive: true
//             },
//             limit,
//             offset,
//             order: [['Date', 'ASC']]
//         });

//         res.status(200).json({
//             totalHolidays: count,
//             totalPages: Math.ceil(count / limit),
//             currentPage: page,
//             holidays
//         });
//     } catch (error) {
//         res.status(500).json({
//             message: 'Error fetching holidays',
//             error: error.message
//         });
//     }
// };
