const { CountryModel, StateModel } = require('../ConnectionDB/Connect'); 
const { Op } = require('sequelize');


//Getall countries list
exports.getCountries = async (req, res) => {
    try {
       
        const countries = await CountryModel.findAll();
        res.json({
            status: "SUCCESS",
            data: countries
        });
    } catch (error) {
        
        console.error('Error fetching countries:', error);
        res.status(500).json({
            status: "FAILURE",
            message: "Error occurred while retrieving data"
        });
    }
};


// Function to generate a filter query based on a filter string
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

exports.getStatesByCountry = async (req, res) => {
    const queryParams = req.query;
    let filterQuery = {};
    let countryFilterQuery = {};
    let stateFilterQuery = {};

    // Generate filter query from request parameters
    if (queryParams.hasOwnProperty('$filter') && queryParams.$filter !== '') {
        try {
            filterQuery = getFilterQuery(queryParams.$filter);
            console.log('Filter Query:', filterQuery); // Debugging line
        } catch (error) {
            console.error('Error parsing filter string:', error);
            return res.status(400).json({ status: 'FAILURE', message: 'Invalid filter format' });
        }
    }

    // Separate country filters from state filters
    const countryFilters = {};
    const stateFilters = {};

    for (const key in filterQuery) {
        if (key.toLowerCase().startsWith('countryname') || key.toLowerCase().startsWith('country')) {
            countryFilters[key] = filterQuery[key];
        } else if (key.toLowerCase().startsWith('statename') || key.toLowerCase().startsWith('state')) {
            stateFilters[key] = filterQuery[key];
        }
    }

    console.log('Country Filters:', countryFilters); // Debugging line
    console.log('State Filters:', stateFilters); // Debugging line

    try {
        let countryIds = [];

        if (Object.keys(countryFilters).length > 0) {
            // Fetch countries based on filters
            const countries = await CountryModel.findAll({
                where: countryFilters
            });

            if (countries.length > 0) {
                countryIds = countries.map(country => country.CountryID);
                console.log('Country IDs:', countryIds); // Debugging line
            } else {
                return res.status(404).json({ status: 'FAILURE', message: 'No countries found matching the criteria' });
            }
        }

        // Apply country filter to state filters if countries were found
        if (countryIds.length > 0) {
            stateFilterQuery.CountryID = { [Op.in]: countryIds };
        }

        stateFilterQuery = { ...stateFilterQuery, ...stateFilters };
        console.log('State Filter Query:', stateFilterQuery); // Debugging line

        // Fetch states based on the combined filter
        const states = await StateModel.findAll({
            where: stateFilterQuery
        });

        res.json({ status: 'SUCCESS', data: states });
    } catch (error) {
        console.error('Error retrieving states:', error);
        res.status(500).json({ status: 'FAILURE', message: 'Error occurred while retrieving data' });
    }
};
