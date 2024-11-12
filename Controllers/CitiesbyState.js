const { CityModel, StateModel } = require('../ConnectionDB/Connect');
const { Op } = require('sequelize');

const getFilterQuery = (filterString) => {
    const filterQuery = {};
    const filters = filterString.split(' and ');

    filters.forEach(filter => {
        const parts = filter.split(' ');
        const key = parts[0];
        const operator = parts[1];
        const value = parts.slice(2).join(' ').replace(/'/g, ''); 
        
        if (key && operator && value) {
            switch (operator) {
                case 'eq':
                    filterQuery[key] = value;
                    break;
                case 'ne':
                    filterQuery[key] = { [Op.ne]: value };
                    break;
                case 'gt':
                    filterQuery[key] = { [Op.gt]: value };
                    break;
                case 'lt':
                    filterQuery[key] = { [Op.lt]: value };
                    break;
                case 'like':
                    filterQuery[key] = { [Op.like]: `%${value}%` };
                    break;
                default:
                    console.warn(`Unsupported operator ${operator}`);
                    break;
            }
        }
    });

    return filterQuery;
};

// Get all cities by state filters
exports.getCitiesByState = async (req, res) => {
    const queryParams = req.query;
    let filterQuery = {};
    let stateFilterQuery = {};
    let cityFilterQuery = {};

    
    if (queryParams.hasOwnProperty('$filter') && queryParams.$filter !== '') {
        try {
            filterQuery = getFilterQuery(queryParams.$filter);
            console.log('Filter Query:', filterQuery); 
        } catch (error) {
            console.error('Error parsing filter string:', error);
            return res.status(400).json({ status: 'FAILURE', message: 'Invalid filter format' });
        }
    }
    const stateFilters = {};
    const cityFilters = {};

    for (const key in filterQuery) {
        if (key.toLowerCase().startsWith('statename') || key.toLowerCase().startsWith('state')) {
            stateFilters[key] = filterQuery[key];
        } else if (key.toLowerCase().startsWith('cityname') || key.toLowerCase().startsWith('city')) {
            cityFilters[key] = filterQuery[key];
        }
    }

    // console.log('State Filters:', stateFilters); // Debugging line
    // console.log('City Filters:', cityFilters); // Debugging line

    try {
        let stateIds = [];

        if (Object.keys(stateFilters).length > 0) {
            const states = await StateModel.findAll({
                where: stateFilters
            });

            if (states.length > 0) {
                stateIds = states.map(state => state.StateID);
                console.log('State IDs:', stateIds); 
            } else {
                return res.status(404).json({ status: 'FAILURE', message: 'No states found matching the criteria' });
            }
        }

        if (stateIds.length > 0) {
            cityFilterQuery.StateID = { [Op.in]: stateIds };
        }

        cityFilterQuery = { ...cityFilterQuery, ...cityFilters };
        console.log('City Filter Query:', cityFilterQuery); 
        const cities = await CityModel.findAll({
            where: cityFilterQuery
        });

        if (cities.length > 0) {
            res.json({ status: 'SUCCESS', data: cities });
        } else {
            res.status(404).json({ status: 'FAILURE', message: 'No cities found matching the criteria' });
        }
    } catch (error) {
        console.error('Error retrieving cities:', error);
        res.status(500).json({ status: 'FAILURE', message: 'Error occurred while retrieving data' });
    }
};
