const {AddressModel,CityModel,StateModel,CountryModel}=require('../ConnectionDB/Connect')
const {Sequelize}=require('sequelize')

// exports.getAllAddresses = async (req, res) => {

//   const { page = 1, limit = 10 } = req.query;
  
//   const pageNumber = parseInt(page, 10);
//   const pageSize = parseInt(limit, 10);

//   try {
//     const { count, rows } = await AddressModel.findAndCountAll({
//       limit: pageSize,
//       order: [
//         [Sequelize.literal('GREATEST("Address"."CreatedAt", "Address"."UpdatedAt")'), 'DESC'],
       
//     ],
//       offset: (pageNumber - 1) * pageSize
//     });

    
//     const addresses = rows.map(address => ({
//       AddressID: address.AddressID,
//       TenantID: address.TenantID,
//       CustomerID: address.CustomerID,
//       Address: [
//         `AddressLine1: ${address.AddressLine1}`,
//         address.AddressLine2 ? `AddressLine2: ${address.AddressLine2}` : null,  
//         `CityID: ${address.CityID}`,
//         `StateID: ${address.StateID}`,
//         `CountryID: ${address.CountryID}`,
//         `ZipCode: ${address.ZipCode}`
//       ].filter(Boolean)  
//     }));

//     return res.status(200).json({
//       StatusCode: 'SUCCESS',
//       page: pageNumber,
//       pageSize,
//       totalItems: count,
//       totalPages: Math.ceil(count / pageSize),
//       addresses
//     });
//   } catch (error) {
//     console.error('Error fetching addresses with pagination:', error);
//     res.status(500).json({ error: 'Internal Server Error' });
//   }
// };

  // Get a Customer by ID
  
  exports.getAllAddresses = async (req, res) => {
    const { page = 1, limit = 10 } = req.query;
    
    const pageNumber = parseInt(page, 10);
    const pageSize = parseInt(limit, 10);
  
    try {
      const { count, rows } = await AddressModel.findAndCountAll({
        limit: pageSize,
        offset: (pageNumber - 1) * pageSize,
        order: [
          [Sequelize.literal('GREATEST("Address"."CreatedAt", "Address"."UpdatedAt")'), 'DESC'],
        ],
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
        ]
      });
  
      const addresses = rows.map(address => ({
        AddressID: address.AddressID,
        TenantID: address.TenantID,
        CustomerID: address.CustomerID,
        Address: [
          `AddressLine1: ${address.AddressLine1}`,
          address.AddressLine2 ? `AddressLine2: ${address.AddressLine2}` : null,  
          `City: ${address.City ? address.City.CityName : 'N/A'}`, 
          `State: ${address.State ? address.State.StateName : 'N/A'}`, 
          `Country: ${address.Country ? address.Country.CountryName : 'N/A'}`, 
          `ZipCode: ${address.ZipCode}`
        ].filter(Boolean)  
      }));
  
      return res.status(200).json({
        StatusCode: 'SUCCESS',
        page: pageNumber,
        pageSize,
        totalItems: count,
        totalPages: Math.ceil(count / pageSize),
        addresses
      });
    } catch (error) {
      console.error('Error fetching addresses with pagination:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  };
  
  
  exports.getAddressById = async (req, res) => {
    const { id } = req.params;
  
    try {
      const address = await AddressModel.findByPk(id);
  
      if (!address) {
        return res.status(404).json({
          StatusCode: 'ERROR',
          message: 'Address not found',
        });
      }
      const addressDetails = {
        AddressLine1: address.AddressLine1,
        AddressLine2: address.AddressLine2 || null, 
        CityID: address.CityID,
        StateID: address.StateID,
        CountryID: address.CountryID,
        ZipCode: address.ZipCode,
      };
  
      return res.status(200).json({
        StatusCode: 'SUCCESS',
        AddressID: address.AddressID,
        TenantID: address.TenantID,
        CustomerID: address.CustomerID,
        AddressDetails: [addressDetails], 
      });
    } catch (error) {
      console.error('Error fetching address:', error);
      res.status(500).json({
        StatusCode: 'ERROR',
        message: 'Internal Server Error',
      });
    }
  };
  
  // Delete a address
  exports.deleteAddress = async (req, res) => {
    const { id } = req.params;
  
    try {
      const address = await AddressModel.findByPk(id);
  
      if (!address) {
        return res.status(404).json({
          StatusCode: 'ERROR',
          message: 'Address not found'
        });
      }
  
      await address.destroy();
  
      return res.status(200).json({
        StatusCode: 'SUCCESS',
        message: 'Address deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting address:', error);
      res.status(500).json({
        StatusCode: 'ERROR',
        message: 'Internal Server Error'
      });
    }
};



exports.createOrUpdateAddress = async (req, res) => {
  const { AddressID, CustomerID, TenantID, AddressLine1, AddressLine2, CityID, StateID, CountryID, ZipCode, CreatedBy, UpdatedBy } = req.body;

  // Check if CustomerID is provided
  if (!CustomerID || CustomerID === 0) {
      return res.status(400).json({
          StatusCode: 'ERROR',
          message: 'CustomerID is required'
      });
  }

  try {
      let address;

      if (AddressID && AddressID !== 0) {
         
          address = await AddressModel.findByPk(AddressID);

          if (address) {
             
              await address.update({
                  CustomerID, TenantID, AddressLine1, AddressLine2, CityID, StateID, CountryID, ZipCode, UpdatedBy
              });

              return res.status(200).json({
                  StatusCode: 'SUCCESS',
                  message: 'Address updated successfully',
                  AddressID: address.AddressID 
              });
          } else {
              return res.status(404).json({
                  StatusCode: 'ERROR',
                  message: 'Address not found'
              });
          }
      } else {
          // Create a new address
          address = await AddressModel.create({
              CustomerID, TenantID, AddressLine1, AddressLine2, CityID, StateID, CountryID, ZipCode, CreatedBy, UpdatedBy
          });

          return res.status(201).json({
              StatusCode: 'SUCCESS',
              message: 'Address created successfully',
              AddressID: address.AddressID 
          });
      }
  } catch (error) {
      console.error('Error in createOrUpdateAddress:', error);
      res.status(500).json({ error: 'Internal Server Error' });
  }
};


exports.getAddressDetailsById = async (req, res) => {
  const { id } = req.params;

  try {
    const address = await AddressModel.findByPk(id);

    if (!address) {
      return res.status(404).json({
        StatusCode: 'ERROR',
        message: 'Address not found'
      });
    }
    const detailedAddress = {
      AddressID: address.AddressID,
      TenantID: address.TenantID,
      CustomerID: address.CustomerID,
      AddressLine1: address.AddressLine1,
      AddressLine2: address.AddressLine2 || 'N/A',  
      CityID: address.CityID,
      StateID: address.StateID,
      CountryID: address.CountryID,
      ZipCode: address.ZipCode,
      CreatedBy: address.CreatedBy || 'N/A',       
      UpdatedBy: address.UpdatedBy || 'N/A',       
      CreatedAt: address.createdAt,                 
      UpdatedAt: address.updatedAt
    };

    return res.status(200).json({
      StatusCode: 'SUCCESS',
      Address: detailedAddress
    });
  } catch (error) {
    console.error('Error fetching address details:', error);
    res.status(500).json({
      StatusCode: 'ERROR',
      message: 'Internal Server Error'
    });
  }
};

exports.getAddressesByCustomerId = async (req, res) => {
  const { customerId } = req.params;
  try {
    // Fetch all addresses related to the given CustomerID
    const addresses = await AddressModel.findAll({
      where: { CustomerID: customerId }
    });

    // Check if addresses exist
    if (!addresses || addresses.length === 0) {
      return res.status(200).json({
        StatusCode: 'ERROR',
        message: 'No addresses found for the given CustomerID'
      });
    }

    // Map over the addresses and format the response
    const detailedAddresses = addresses.map(address => ({
      AddressID: address.AddressID,
      TenantID: address.TenantID,
      CustomerID: address.CustomerID,
      AddressLine1: address.AddressLine1,
      AddressLine2: address.AddressLine2 || 'N/A',
      CityID: address.CityID,
      StateID: address.StateID,
      CountryID: address.CountryID,
      ZipCode: address.ZipCode,
      CreatedBy: address.CreatedBy || 'N/A',
      UpdatedBy: address.UpdatedBy || 'N/A',
      CreatedAt: address.createdAt,
      UpdatedAt: address.updatedAt
    }));

    return res.status(200).json({
      StatusCode: 'SUCCESS',
      Addresses: detailedAddresses
    });
  } catch (error) {
    console.error('Error fetching addresses by CustomerID:', error);
    return res.status(500).json({
      StatusCode: 'ERROR',
      message: 'Internal Server Error'
    });
  }
};
