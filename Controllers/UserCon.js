const { UserManagementModel,StoreModel,UserAddressModel,CityModel,StateModel,CountryModel,RoleModel} = require ('../ConnectionDB/Connect');  
const { Sequelize, DataTypes } = require('sequelize');
const { v4: uuidv4 } = require('uuid');
const { Op } = require('sequelize'); 
const multer = require('multer');
const { storage_uploads } = require('../middleware/Cloundinary');

const upload = multer({ storage: storage_uploads }).fields([
  { name: 'ProfileImage', maxCount: 1 }, 
]);

// Controller function to create or update user with profile image upload
exports.createOrUpdateUser = async (req, res) => {
  upload(req, res, async function (err) {
    if (err instanceof multer.MulterError || err) {
      return res.status(500).json({ StatusCode: 'ERROR', err, message: 'Failed to upload profile image.' });
    }

    try {
      const data = req.body.data ? JSON.parse(req.body.data) : req.body;

      const {
        UserID,
        TenantID,
        FirstName,
        LastName,
        Email,
        Password,
        PhoneNumber,
        Gender,
        RoleID,
        Comments,
        AddressLine1,
        AddressLine2,
        CityID,
        StateID,
        CountryID,
        ZipCode,
        StoreID,
        CreatedBy,
        UpdatedBy
      } = data;

      // Validate required fields
      if (!Email) {
        return res.status(404).json({
          StatusCode: 'ERROR',
          message: 'Email is required'
        });
      }

      // Handle profile image upload
      let profileImagePath = req.files['ProfileImage'] ? req.files['ProfileImage'][0].path : null;

      if (UserID && UserID !== 0) {
        // Update User
        const user = await UserManagementModel.findByPk(UserID);

        if (!user) {
          return res.status(404).json({
            StatusCode: 'ERROR',
            message: 'User not found'
          });
        }

        // Check for duplicate email
        const existingUser = await UserManagementModel.findOne({
          where: {
            Email,
            UserID: { [Op.ne]: UserID } // Ensure it's not the current user
          }
        });

        if (existingUser) {
          return res.status(200).json({
            StatusCode: 'ERROR',
            message: 'A user with this email already exists'
          });
        }

        let addressId = user.AddressID;
        if (AddressLine1 || AddressLine2 || CityID || StateID || CountryID || ZipCode) {
          if (addressId) {
            await UserAddressModel.update({
              AddressLine1,
              AddressLine2,
              CityID,
              StateID,
              CountryID,
              ZipCode,
              UpdatedAt: new Date(),
              UpdatedBy
            }, {
              where: { AddressID: addressId }
            });
          } else {
            const address = await UserAddressModel.create({
              TenantID,
              AddressLine1,
              AddressLine2,
              CityID,
              StateID,
              CountryID,
              ZipCode,
              StoreID,
              CreatedAt: new Date(),
              UpdatedAt: new Date(),
              CreatedBy: user.CreatedBy,
              UpdatedBy
            });
            addressId = address.AddressID;
            await user.update({ AddressID: addressId });
          }
        }

        // Update user details, including profile image if it exists
        await user.update({
          TenantID,
          FirstName,
          LastName,
          Email,
          Password,
          PhoneNumber,
          Gender,
          RoleID,
          Comments,
          StoreID,
          UpdatedAt: new Date(),
          ProfileImage: profileImagePath || user.ProfileImage, // If new image uploaded, update path
          UpdatedBy
        });

        return res.status(200).json({
          StatusCode: 'SUCCESS',
          message: 'User updated successfully',
          UserID: user.UserID
        });

      } else {
        // Create User
        // Check for duplicate email before creation
        const existingUser = await UserManagementModel.findOne({
          where: { Email }
        });

        if (existingUser) {
          return res.status(200).json({
            StatusCode: 'ERROR',
            message: 'A user with this email already exists'
          });
        }

        // Generate EmployeeID
        const EmployeeID = `EMP-${Date.now()}`;

        let addressId = null;
        if (AddressLine1 || AddressLine2 || CityID || StateID || CountryID || ZipCode) {
          const address = await UserAddressModel.create({
            TenantID,
            AddressLine1,
            AddressLine2,
            CityID,
            StateID,
            CountryID,
            ZipCode,
            CreatedBy,
            CreatedAt: new Date(),
            UpdatedAt: new Date(),
            UpdatedBy
          });

          addressId = address.AddressID;
        }

        const user = await UserManagementModel.create({
          TenantID,
          EmployeeID,
          FirstName,
          LastName,
          Email,
          Password,
          PhoneNumber,
          Gender,
          RoleID,
          StoreID,
          AddressID: addressId,
          ProfileImage: profileImagePath, // Set uploaded profile image path
          Comments,
          CreatedBy,
          CreatedAt: new Date(),
          UpdatedAt: new Date(),
          UpdatedBy
        });

        return res.status(201).json({
          StatusCode: 'SUCCESS',
          message: 'User created successfully',
          UserID: user.UserID
        });
      }
    } catch (error) {
      console.error('Error creating or updating user:', error);
      return res.status(500).json({
        StatusCode: 'ERROR',
        message: 'Internal Server Error'
      });
    }
  });
};


//Get AllUsers with pagination
exports.getAllUsers = async (req, res) => {
  const { pageNumber = 1, pageSize = 10, StoreID } = req.query;
  const searchText = Object.keys(req.query).find(key => key.toLowerCase() === 'searchtext');
  const searchValue = req.query[searchText]?.toLowerCase() || '';
  const offset = (pageNumber - 1) * pageSize;

  try {
    let whereConditions = {
      [Sequelize.Op.or]: [
        {
          FirstName: {
            [Sequelize.Op.iLike]: `%${searchValue}%`
          }
        },
        {
          LastName: {
            [Sequelize.Op.iLike]: `%${searchValue}%`
          }
        },
        {
          Email: {
            [Sequelize.Op.iLike]: `%${searchValue}%`
          }
        },
        {
          PhoneNumber: {
            [Sequelize.Op.iLike]: `%${searchValue}%`
          }
        }
      ]
    };

    // Add StoreID filter if provided
    if (StoreID) {
      whereConditions.StoreID = StoreID;
    }

    const { count, rows } = await UserManagementModel.findAndCountAll({
      where: whereConditions,
      include: [
        {
          model: UserAddressModel,
          as: 'Address',
          include: [
            { model: CityModel, as: 'City', attributes: ['CityName'] },
            { model: StateModel, as: 'State', attributes: ['StateName'] },
            { model: CountryModel, as: 'Country', attributes: ['CountryName'] }
          ]
        },
        { model: StoreModel, as: 'Store', attributes: ['StoreCode', 'StoreName', 'StoreID'] },
        { model: RoleModel, as: 'UserRole', attributes: ['RoleName'] }
      ],
      attributes: ['UserID', 'TenantID', 'EmployeeID', 'FirstName', 'LastName', 'Email', 'PhoneNumber', 'Gender', 'RoleID', 'StoreID', 'AddressID', 'ProfileImage', 'Comments'],
      limit: pageSize,
      offset: offset,
      order: [
        [Sequelize.literal('GREATEST("UserManagement"."CreatedAt", "UserManagement"."UpdatedAt")'), 'DESC'],
        ['FirstName', 'ASC']
      ],
    });

    const formattedUsers = rows.map(user => ({
      UserID: user.UserID,
      TenantID: user.TenantID,
      EmployeeID: user.EmployeeID,
      FirstName: user.FirstName,
      LastName: user.LastName,
      Email: user.Email,
      PhoneNumber: user.PhoneNumber,
      Gender: user.Gender,
      RoleID: user.RoleID,
      RoleName: user.UserRole?.RoleName || null,
      StoreID: user.StoreID,
      ProfileImage: user.ProfileImage,
      Comments: user.Comments,
      AddressLine1: user.Address?.AddressLine1 || null,
      AddressLine2: user.Address?.AddressLine2 || null,
      CityName: user.Address?.City?.CityName || null,
      StateName: user.Address?.State?.StateName || null,
      CountryName: user.Address?.Country?.CountryName || null,
      StoreID: user.Store?.StoreID || null,
      StoreName: user.Store?.StoreName || null,
      StoreCode: user.Store?.StoreCode || null,
      ZipCode: user.Address?.ZipCode || null,
    }));

    return res.status(200).json({
      StatusCode: 'SUCCESS',
      page: pageNumber,
      pageSize,
      totalItems: count,
      totalPages: Math.ceil(count / pageSize),
      users: formattedUsers
    });
  } catch (error) {
    console.error('Error fetching users with pagination:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};


// Get User by ID
exports.getUserById = async (req, res) => {
  const { id } = req.params;

  try {
    const user = await UserManagementModel.findByPk(id, {
      include: [
        { 
            model: UserAddressModel, 
            as: 'Address',
            include: [
                { model: CityModel, as: 'City', attributes: ['CityName'] },
                { model: StateModel, as: 'State', attributes: ['StateName'] },
                { model: CountryModel, as: 'Country', attributes: ['CountryName'] }
            ]
        },
              { model: StoreModel, as: 'Store', attributes: ['StoreCode','StoreName','StoreID'] }   
    ],
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userJson = user.toJSON();
    delete userJson.AddressID;


    const formattedUser = {
      UserID: user.UserID,
      TenantID: user.TenantID,
      EmployeeID: user.EmployeeID,
      FirstName: user.FirstName,
      LastName: user.LastName,
      Email: user.Email,
      PhoneNumber: user.PhoneNumber,
      Gender: user.Gender,
      RoleID: user.RoleID,
      StoreID: user.StoreID,
      AddressID: user.AddressID,
      ProfileImage: user.ProfileImage,
      Comments: user.Comments,
      AddressLine1: user.AddressLine1,
      AddressLine2: user.AddressLine2,
      CityName: user.Address.City?.CityName || null, 
      StateName: user.Address?.State.StateName || null, 
      CountryName: user.Address?.Country.CountryName || null,
      StoreID:  user.Store.StoreID || null, 
      StoreName:  user.Store.StoreName || null, 
      StoreCode: user.Store.StoreCode,
      ZipCode: user.ZipCode,
    };

    return res.status(200).json({
      StatusCode: 'SUCCESS',
      user: formattedUser
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};


// Update a Customer
exports.updateUser = async (req, res) => {
  upload(req, res, async function (err) {
    if (err instanceof multer.MulterError || err) {
      return res.status(500).json({ error: "Failed to upload profile image." });
    }

    try {
      // Parse JSON from form-data if 'data' field exists, otherwise use raw body
      const data = req.body.data ? JSON.parse(req.body.data) : req.body;

      const {
        TenantID,
        FirstName,
        LastName,
        Email,
        Password,
        PhoneNumber,
        Gender,
        RoleID,
        Comments,
        AddressLine1,
        AddressLine2,
        CityID,
        StateID,
        CountryID,
        ZipCode,
        UpdatedBy
      } = data;

      const { id } = req.params;

      const user = await UserManagementModel.findByPk(id);

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Handle address update or creation
      let addressId = user.AddressID;

      if (AddressLine1 || AddressLine2 || CityID || StateID || CountryID || ZipCode) {
        if (addressId) {
          await UserAddressModel.update({
            AddressLine1,
            AddressLine2,
            CityID,
            StateID,
            CountryID,
            ZipCode,
            UpdatedBy
          }, {
            where: { AddressID: addressId }
          });
        } else {
          const address = await UserAddressModel.create({
            TenantID,
            AddressLine1,
            AddressLine2,
            CityID,
            StateID,
            CountryID,
            ZipCode,
            CreatedBy: user.CreatedBy,  
            UpdatedBy
          });

          addressId = address.AddressID;
          // Update the user's AddressID with the new address
          await user.update({ AddressID: addressId });
        }
      }

      // Handle profile image update if provided
      let profileImageUrl = user.ProfileImage;
      if (req.file) {
        const filename = `${Date.now()}-${req.file.originalname}`;
        profileImageUrl = `/b2y_uploads/${filename}`; 
        
      }

      // Update user details
      await user.update({
        TenantID,
        FirstName,
        LastName,
        Email,
        Password,  
        PhoneNumber,
        Gender,
        RoleID,
        Comments,
        ProfileImage: profileImageUrl,
        UpdatedBy
      });

      return res.status(200).json({
        StatusCode: 'SUCCESS',
        message: 'User updated successfully',
        user
      });
    } catch (error) {
      console.error('Error updating user:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });
};


// Delete a Customer
exports.deleteUser = async (req, res) => {
  const { id } = req.params;

  try {
    const user = await UserManagementModel.findByPk(id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Delete associated address if it exists
    if (user.AddressID) {
      await UserAddressModel.destroy({
        where: { AddressID: user.AddressID }
      });
    }

    // Delete user
    await user.destroy();

    return res.status(200).json({
      StatusCode: 'SUCCESS',
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
