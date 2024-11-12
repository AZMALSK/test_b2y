const { StoreModel,CityModel,StateModel,CountryModel } = require('../ConnectionDB/Connect');  
// const Sequelize = require('sequelize');
const { Sequelize, DataTypes } = require('sequelize');
const { Op } = require('sequelize'); 
// Get all Stores with Pagination
exports.getAllStores = async (req, res) => {
  const { pageNumber, pageSize } = req.query; // Getting pageNumber and pageSize from query
  const searchText = Object.keys(req.query).find(key => key.toLowerCase() === 'searchtext');
  const searchValue = req.query[searchText]?.toLowerCase() || '';

  try {
    // Define the search filter based on searchText
    const searchFilter = {
      [Sequelize.Op.or]: [
        {
          StoreName: {
            [Sequelize.Op.iLike]: `%${searchValue}%`
          }
        },
        {
          Email: {
            [Sequelize.Op.iLike]: `%${searchValue}%`
          }
        },
        {
          Phone: {
            [Sequelize.Op.iLike]: `%${searchValue}%`
          }
        }
      ]
    };

    let options = {
      where: searchFilter,
      include: [
        {
          model: CityModel,
          as: 'City',
          attributes: ['CityName']
        },
        {
          model: StateModel,
          as: 'State',
          attributes: ['StateName']
        },
        {
          model: CountryModel,
          as: 'Country',
          attributes: ['CountryName']
        }
      ],
      attributes: [
        'StoreID', 'StoreName', 'Email', 'Phone', 'AddressLine1',
        'AddressLine2', 'CityID', 'StoreCode', 'StateID', 'CountryID', 'ZipCode'
      ],
      order: [
        [Sequelize.literal('GREATEST("Store"."CreatedAt", "Store"."UpdatedAt")'), 'DESC'],
        ['StoreName', 'ASC']
      ]
    };

    // Apply pagination only if pageNumber and pageSize are provided
    if (pageNumber && pageSize) {
      const offset = (parseInt(pageNumber, 10) - 1) * parseInt(pageSize, 10);
      options = {
        ...options,
        limit: parseInt(pageSize, 10),
        offset: offset
      };
    }

    const { count, rows } = await StoreModel.findAndCountAll(options);

    // Formatting the result
    const formattedStores = rows.map(store => ({
      StoreID: store.StoreID,
      StoreName: store.StoreName,
      Email: store.Email,
      Phone: store.Phone,
      AddressLine1: store.AddressLine1,
      AddressLine2: store.AddressLine2,
      CityName: store.City?.CityName || null,
      StateName: store.State?.StateName || null,
      CountryName: store.Country?.CountryName || null,
      StoreCode: store.StoreCode,
      ZipCode: store.ZipCode,
    }));

    return res.status(200).json({
      StatusCode: 'SUCCESS',
      page: pageNumber ? parseInt(pageNumber, 10) : null, // Only return page info if pagination is applied
      pageSize: pageSize ? parseInt(pageSize, 10) : null,
      totalItems: count,
      totalPages: pageNumber && pageSize ? Math.ceil(count / pageSize) : null,
      Stores: formattedStores
    });
  } catch (error) {
    console.error('Error fetching stores:', error);
    return res.status(500).json({ StatusCode: 'ERROR', message: 'Error fetching stores' });
  }
};


exports.getStoresForUser = async (req, res) => {
  try {
      // Retrieve only the stores that are mapped to the user
      const storeIDs = req.user.StoreIDs;  
      const stores = await StoreModel.findAll({
          where: {
              StoreID: storeIDs 
          }
      });

      res.status(200).json(stores);
  } catch (err) {
      console.error('Error fetching stores:', err);
      res.status(500).json({ message: 'Internal Server Error' });
  }
};


// Get store details by ID
exports.getStoreById = async (req, res) => {
  const { id } = req.params;

  try {
    const store = await StoreModel.findByPk(id,{
      include: [
        {
          model: CityModel, 
          as: 'City',
          attributes: ['CityName']
        },
        {
          model: StateModel, 
          as: 'State',
          attributes: ['StateName']
        },
        {
          model: CountryModel, 
          as: 'Country',
          attributes: ['CountryName']
        }
      ],
      attributes:['StoreID', 'StoreName', 'Email', 'Phone','AddressLine1','AddressLine2','StoreCode','ZipCode'],
    });

    
    if (!store) {
      return res.status(404).json({ error: 'Store not found' });
    }
    const formattedStore = {
      StoreID: store.StoreID,
      StoreName: store.StoreName,
      Email: store.Email,
      Phone: store.Phone,
      AddressLine1: store.AddressLine1,
      AddressLine2: store.AddressLine2,
      CityName: store.City?.CityName || null, 
      StateName: store.State?.StateName || null, 
      CountryName: store.Country?.CountryName || null,
      StoreCode: store.StoreCode,
      StateID: store.StateID,
      CountryID: store.CountryID,
      ZipCode: store.ZipCode,
   
    };
    return res.status(200).json({
      StatusCode: 'SUCCESS',
      store:formattedStore
    });
  } catch (error) {
    console.error('Error fetching store:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

//Create or update store 
// exports.createOrUpdateStore = async (req, res) => {
//   const { StoreId, TenantID, StoreName, Email, Phone, Address,AddressLine1, AddressLine2, StoreCode,CityID, CreatedBy, StateID, CountryID, ZipCode, UpdatedBy } = req.body;

//   try {
//     if (StoreId && StoreId !== 0) {
//       // Update existing store
//       const store = await StoreModel.findByPk(StoreId);

//       if (!store) {
//         return res.status(404).json({
//           StatusCode: 'ERROR',
//           message: 'Store not found'
//         });
//       }

//       // Check if email is unique
//       const existingStore = await StoreModel.findOne({ where: { Email } });
//       if (existingStore && existingStore.StoreID !== StoreId) {
//         return res.status(200).json({
//           StatusCode: 'ERROR',
//           message: 'A store with this email already exists'
//         });
//       }

//       await store.update({ TenantID,
//         StoreName,
//         StoreCode, 
//         Email,
//         Phone,
//         Address,
//         AddressLine1, 
//         AddressLine2, 
//         CityID,
//         StateID,
//         CountryID, 
//         ZipCode,
//         UpdatedAt: new Date(),
//         CreatedBy,
//         UpdatedBy });

//       return res.status(200).json({
//         StatusCode: 'SUCCESS',
//         message: 'Store updated successfully',
//         StoreID: store.StoreID
//       });
//     } else {
//       // Create a new store
//       const newStore = await StoreModel.create({ TenantID, StoreName,StoreCode, Email, Phone, Address, AddressLine2, CityID,StateID, CountryID, ZipCode,CreatedAt: new Date(),UpdatedAt: new Date(),CreatedBy, UpdatedBy });

//       return res.status(201).json({
//         StatusCode: 'SUCCESS',
//         message: 'Store created successfully',
//         StoreID: newStore.StoreID
//       });
//     }
//   } catch (error) {
//     console.error('Error creating or updating store:', error);
//     return res.status(500).json({
//       StatusCode: 'ERROR',
//       message: 'Internal Server Error'
//     });
//   }
// };

// Controller function to create or update store
exports.createOrUpdateStore = async (req, res) => {
  try {
    const data = req.body.data ? JSON.parse(req.body.data) : req.body;

    const {
      StoreID,
      TenantID,
      StoreName,
      Email,
      Phone,
      Address,
      AddressLine1,
      AddressLine2,
      CityID,
      StateID,
      CountryID,
      ZipCode,
      StoreCode,
      CreatedBy,
      UpdatedBy
    } = data;

    // Validate required fields
    if (!Email) {
      return res.status(400).json({
        StatusCode: 'ERROR',
        message: 'Email is required'
      });
    }

    if (StoreID && StoreID !== 0) {
      // Update existing store
      const store = await StoreModel.findByPk(StoreID);

      if (!store) {
        return res.status(404).json({
          StatusCode: 'ERROR',
          message: 'Store not found'
        });
      }

      // Check for duplicate email, excluding current store
      const existingStore = await StoreModel.findOne({
        where: {
          Email,
          StoreID: { [Op.ne]: StoreID } // Ensure it's not the current store
        }
      });

      if (existingStore) {
        return res.status(200).json({
          StatusCode: 'ERROR',
          message: 'A store with this email already exists'
        });
      }

      // Update store details
      await store.update({
        TenantID,
        StoreName,
        Email,
        Phone,
        Address,
        AddressLine1,
        AddressLine2,
        CityID,
        StateID,
        CountryID,
        ZipCode,
        StoreCode,
        UpdatedAt: new Date(),
        UpdatedBy
      });

      return res.status(200).json({
        StatusCode: 'SUCCESS',
        message: 'Store updated successfully',
        StoreID: store.StoreID
      });
    } else {
      // Create a new store
      const existingStore = await StoreModel.findOne({ where: { Email } });

      if (existingStore) {
        return res.status(200).json({
          StatusCode: 'ERROR',
          message: 'A store with this email already exists'
        });
      }

      // Create new store entry
      const newStore = await StoreModel.create({
        TenantID,
        StoreName,
        Email,
        Phone,
        Address,
        AddressLine1,
        AddressLine2,
        CityID,
        StateID,
        CountryID,
        ZipCode,
        StoreCode,
        CreatedBy,
        CreatedAt: new Date(),
        UpdatedBy,
        UpdatedAt: new Date()
      });

      return res.status(201).json({
        StatusCode: 'SUCCESS',
        message: 'Store created successfully',
        StoreID: newStore.StoreID
      });
    }
  } catch (error) {
    console.error('Error creating or updating store:', error);
    return res.status(500).json({
      StatusCode: 'ERROR',
      message: 'Internal Server Error'
    });
  }
};


// Delete a Store
exports.deleteStore= async (req, res) => {
  const { id } = req.params;

  try {
    const store = await StoreModel.findByPk(id);

    if (!store) {
      return res.status(404).json({ error: 'User not found' });
    }

    await store.destroy();

    return res.status(200).json({
      StatusCode: 'SUCCESS',
      message: 'Store deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting store:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
