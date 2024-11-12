const { RoleModel  ,StoreModel} = require('../ConnectionDB/Connect'); 
const {Sequelize}=require('sequelize')
// Create a new Role
exports.createOrUpdateRole = async (req, res) => {
    const { RoleID, TenantID,StoreID, RoleName, Status, CreatedBy, UpdatedBy } = req.body; 

    try {
        
        if (RoleID && RoleID != 0) {
          
            const role = await RoleModel.findByPk(RoleID); 

            if (!role) {
                return res.status(200).json({
                    StatusCode: 'NOT_FOUND',
                    message: 'Role not found'
                });
            }

            // Update the role with the new values
            await role.update({
                TenantID,
                RoleName,
                Status,
                StoreID,
                UpdatedBy,
                UpdatedAt: new Date()
            });

            
            return res.status(200).json({
                StatusCode: 'SUCCESS',
                message: 'Role updated successfully',
                RoleID:role.RoleID
            });
        } else {
            // If RoleID is not provided or is 0, create a new role
            const newRole = await RoleModel.create({
                TenantID,
                RoleName,
                Status,
                StoreID,
                CreatedBy,
                UpdatedBy,
                CreatedAt: new Date(),
                UpdatedAt: new Date()
            });

            // Return success response for create
            return res.status(201).json({
                StatusCode: 'SUCCESS',
                message: 'Role created successfully',
                RoleID: newRole.RoleID // Return the new RoleID in the response
            });
        }
    } catch (error) {
        // Handle any errors that occur
        console.error('Error creating or updating role:', error);
        res.status(500).json({
            StatusCode: 'ERROR',
            message: 'Internal Server Error'
        });
    }
};

// Get all Roles with Pagination
// exports.getAllRoles = async (req, res) => {
//     const { page = 1, limit = 10, SearchText = '' } = req.query;
//     const pageNumber = Math.max(parseInt(page, 10), 1);
//     const pageSize = Math.max(parseInt(limit, 10), 1);

//     try {
//         // Define the search filter based on the SearchText parameter
//         const searchFilter = SearchText
//             ? {
//                 [Sequelize.Op.or]: [
//                     {
//                         RoleName: {
//                             [Sequelize.Op.iLike]: `%${SearchText}%`
//                         }
//                     },
//                     Sequelize.literal(`"Status"::text ILIKE '%${SearchText}%'`)
//                 ]
//             }
//             : {};

//         // Fetch roles with pagination and search filter
//         const { count, rows } = await RoleModel.findAndCountAll({
//             where: searchFilter,
//             limit: pageSize,
//             order: [
//                 [Sequelize.literal('GREATEST("Role"."CreatedAt", "Role"."UpdatedAt")'), 'DESC'],
//                 ['RoleName', 'ASC']
//             ],
//             offset: (pageNumber - 1) * pageSize
//         });

//         return res.status(200).json({
//             StatusCode: 'SUCCESS',
//             page: pageNumber,
//             pageSize,
//             totalItems: count,
//             totalPages: Math.ceil(count / pageSize),
//             roles: rows
//         });
//     } catch (error) {
//         console.error('Error fetching roles with pagination and search:', error);
//         return res.status(500).json({
//             StatusCode: 'ERROR',
//             message: 'Internal Server Error'
//         });
//     }
// };


// Get Role details by ID
exports.getRoleById = async (req, res) => {
    const { id } = req.params;

    try {
        const role = await RoleModel.findByPk(id ,{
                include: [
                  { 
                    model: StoreModel, as: 'Store', attributes: ['StoreID', 'StoreName', 'StoreCode'] 
                  }
                ],
                attributes: ['RoleID', 'RoleName', 'Status'],
              });

        if (!role) {
            return res.status(404).json({ error: 'Role not found' });
        }

        const formattedOrder = {
            RoleID: role.RoleID,
            RoleName: role.RoleName,
            Status:role.Status,
            StoreID: role.Store?.StoreID || null,
            StoreName: role.Store?.StoreName || null,
            StoreCode: role.Store?.StoreCode || null,
         
          };
      

        return res.status(200).json({
            StatusCode: 'SUCCESS',
            role:formattedOrder
        });
    } catch (error) {
        console.error('Error fetching role:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

// exports.getAllRoles = async (req, res) => {
//     const { page = 1, limit = 10 } = req.query;
//     const searchText = Object.keys(req.query).find(key => key.toLowerCase() === 'searchtext');
//     const searchValue = req.query[searchText]?.toLowerCase() || '';
//     const pageNumber = Math.max(parseInt(page, 10), 1);
//     const pageSize = Math.max(parseInt(limit, 10), 1);

//     try {
//         // Define the search filter based on the searchText parameter
//         const searchFilter = searchValue
//             ? {
//                 [Sequelize.Op.or]: [
//                     {
//                         RoleName: {
//                             [Sequelize.Op.iLike]: `%${searchValue}%`
//                         }
//                     },
//                     Sequelize.literal(`"Status"::text ILIKE '%${searchValue}%'`),
//                 ]
//             }
//             : {};

//         // Count the total number of records that match the search filter
//         const totalItems = await RoleModel.count({
//             where: searchFilter,
//             include: [
//                 {
//                     model: StoreModel,
//                     as: 'Store',
//                     attributes: ['StoreID', 'StoreName', 'StoreCode']
//                 }
//             ]
//         });

//         // Fetch the records with pagination after applying the search filter
//         const roles = await RoleModel.findAll({
//             where: searchFilter,
//             include: [
//                 {
//                     model: StoreModel,
//                     as: 'Store',
//                     attributes: ['StoreID', 'StoreName', 'StoreCode']
//                 }
//             ],
//             limit: pageSize,
//             attributes: ['RoleID', 'RoleName', 'Status'],
//             order: [
//                 [Sequelize.literal('GREATEST("Role"."CreatedAt", "Role"."UpdatedAt")'), 'DESC'],
//                 ['RoleName', 'ASC']
//             ],
//             offset: (pageNumber - 1) * pageSize
//         });

//         const formattedRoles = roles.map(role => ({
//             RoleID: role.RoleID,
//             RoleName: role.RoleName,
//             Status: role.Status,
//             StoreID: role.Store?.StoreID || null,
//             StoreName: role.Store?.StoreName || null,
//             StoreCode: role.Store?.StoreCode || null
//         }));

//         return res.status(200).json({
//             StatusCode: 'SUCCESS',
//             page: pageNumber,
//             pageSize,
//             totalItems,
//             totalPages: Math.ceil(totalItems / pageSize),
//             roles: formattedRoles // Returning formatted roles with store details
//         });
//     } catch (error) {
//         console.error('Error fetching roles with pagination and search:', error);
//         return res.status(500).json({
//             StatusCode: 'ERROR',
//             message: 'Internal Server Error'
//         });
//     }
// };


//Delete roles by Id

exports.getAllRoles = async (req, res) => {
    const { page = 1, limit = 10, StoreID } = req.query;
    const searchText = req.query.SearchText || ''; // Using SearchText from the query string
    const pageNumber = Math.max(parseInt(page, 10), 1);
    const pageSize = Math.max(parseInt(limit, 10), 1);

    try {
        // Dynamically build the search filter
        const searchFilter = {
            [Sequelize.Op.and]: []
        };

        // Add StoreID to the search filter if provided
        if (StoreID) {
            searchFilter[Sequelize.Op.and].push({
                StoreID: StoreID // Assumes StoreID is an exact match
            });
        }

        // Add SearchText to the search filter if provided
        if (searchText) {
            searchFilter[Sequelize.Op.and].push({
                [Sequelize.Op.or]: [
                    { RoleName: { [Sequelize.Op.iLike]: `%${searchText}%` } },
                    Sequelize.literal(`"Status"::text ILIKE '%${searchText}%'`),
                    Sequelize.literal(`"Store"."StoreName" ILIKE '%${searchText}%'`)
                ]
            });
        }

        // Count the total number of records that match the search filter
        const totalItems = await RoleModel.count({
            where: searchFilter,
            include: [
                {
                    model: StoreModel,
                    as: 'Store',
                    attributes: ['StoreID', 'StoreName', 'StoreCode']
                }
            ]
        });

        // Fetch the records with pagination after applying the search filter
        const roles = await RoleModel.findAll({
            where: searchFilter,
            include: [
                {
                    model: StoreModel,
                    as: 'Store',
                    attributes: ['StoreID', 'StoreName', 'StoreCode']
                }
            ],
            limit: pageSize,
            attributes: ['RoleID', 'RoleName', 'Status'],
            order: [
                [Sequelize.literal('GREATEST("Role"."CreatedAt", "Role"."UpdatedAt")'), 'DESC'],
                ['RoleName', 'ASC']
            ],
            offset: (pageNumber - 1) * pageSize
        });

        const formattedRoles = roles.map(role => ({
            RoleID: role.RoleID,
            RoleName: role.RoleName,
            Status: role.Status,
            StoreID: role.Store?.StoreID || null,
            StoreName: role.Store?.StoreName || null,
            StoreCode: role.Store?.StoreCode || null
        }));

        return res.status(200).json({
            StatusCode: 'SUCCESS',
            page: pageNumber,
            pageSize,
            totalItems,
            totalPages: Math.ceil(totalItems / pageSize),
            roles: formattedRoles // Returning formatted roles with store details
        });
    } catch (error) {
        console.error('Error fetching roles with pagination and search:', error);
        return res.status(500).json({
            StatusCode: 'ERROR',
            message: 'Internal Server Error'
        });
    }
};


exports.deleteRole = async (req, res) => {
    const { id } = req.params;
  
    try {
      const role = await RoleModel.findByPk(id);
  
      if (!role) {
        return res.status(404).json({ error: 'Role not found' });
      }
  
      await role.destroy();
  
      return res.status(200).json({
        StatusCode: 'SUCCESS',
        message: 'Role deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting role:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  };
  
