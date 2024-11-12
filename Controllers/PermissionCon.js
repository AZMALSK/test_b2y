const { PermissionsModel,MapRolePermissionsModel,RoleModel} = require('../ConnectionDB/Connect');

exports.createPermission = async (req, res) => {
  const { Module, Name, Code, CreatedBy, TenantID,RolePermissionId,IsChecked } = req.body;

  if (!Module || !Name || !Code || !CreatedBy || !TenantID) {
    return res.status(400).json({
      StatusCode: 'ERROR',
      message: 'Module, Name, Code, CreatedBy, and TenantID are required fields.',
    });
  }

  try {
    const newPermission = await PermissionsModel.create({
      Module,
      Name,
      Code,
      CreatedBy,
      CreatedAt: new Date(),
      UpdatedAt: new Date(),
      TenantID,RolePermissionId,IsChecked
    });

    return res.status(201).json({
      StatusCode: 'SUCCESS',
      message: 'Permission created successfully',
      PermissionID: newPermission.ID,
    });
  } catch (error) {
    console.error('Error creating permission:', error);
    return res.status(500).json({
      StatusCode: 'ERROR',
      message: 'Internal Server Error',
    });
  }
};

exports.getAllPermissions = async (req, res) => {
    try {
      const permissions = await PermissionsModel.findAll();
      const formattedPermissions = permissions.map(permission => ({
        ID: permission.ID,
        Module: permission.Module,
        Name: permission.Name,
        Code: permission.Code,
        RolePermissionId: permission.RolePermissionId,
        IsChecked: permission.IsChecked
      }));
  
      return res.status(200).json({
        StatusCode: 'SUCCESS',
        Permissions: formattedPermissions
      });
    } catch (error) {
      console.error('Error fetching permissions:', error);
      return res.status(500).json({ StatusCode: 'ERROR', message: 'Error fetching permissions' });
    }
  };

  exports.getAllPermissionsByRoleId = async (req, res) => {
    const roleId = parseInt(req.params.roleId, 10);
  
    try {
       
        const allPermissions = await PermissionsModel.findAll({
            attributes: ['ID','Module','Name', 'Code']
        });
  
        console.log('All Permissions:', allPermissions);
  
        
        if (roleId === 0) {
            const result = allPermissions.map(permission => ({
                RolePermissionId: 0,
                PermissionId: permission.ID,
                PermissionModule:permission.Module,
                PermissionName: permission.Name,
                PermissionCode: permission.Code,
                IsChecked: false
            }));
            return res.status(200).json(result);
        }
  
        
        const rolePermissions = await MapRolePermissionsModel.findAll({
            where: { RoleID: roleId },
            attributes: ['PermissionID', 'ID']
        });
  
        console.log('Role Permissions for RoleID', roleId, ':', rolePermissions);
  
        
        const result = allPermissions.map(permission => {
            const mappedRolePermission = rolePermissions.find(rp => rp.PermissionID === permission.ID);
            return {
                RolePermissionId: mappedRolePermission ? mappedRolePermission.ID : 0,
                PermissionId: permission.ID,
                PermissionModule:permission.Module,
                PermissionName: permission.Name,
                PermissionCode: permission.Code,
                IsChecked: !!mappedRolePermission
            };
        });
  
        console.log('Final Result:', result);
        res.status(200).json(result);
    } catch (error) {
        console.error('Error fetching permissions:', error);
        res.status(500).json({ message: 'An error occurred while fetching permissions.', error });
    }
  };
  
  
  
  // Function to add role-permission mapping
  async function addRolePermission(roleId, permissionId, storeId) {
    try {
      await MapRolePermissionsModel.create({
        RoleID: roleId,
        PermissionID: permissionId,
        StoreID: storeId
      });
      console.log('Role permission added successfully');
      return { success: true };
    } catch (error) {
      console.error('Error adding role permission:', error);
      return { success: false, error: error.message };
    }
  }
  
  
  // Controller function to handle HTTP requests
  exports.addRolePermissionController = async (req, res) => {
    const { RoleID, PermissionID, StoreID } = req.body; 
  
    if (!RoleID || !PermissionID || !StoreID) {
      return res.status(400).json({ message: 'RoleID, PermissionID, and StoreID are required.' });
    }
  
    const result = await addRolePermission(RoleID, PermissionID, StoreID);
  
    if (result.success) {
      return res.status(201).json({ message: 'Role permission added successfully.' });
    } else {
      return res.status(500).json({ message: 'An error occurred while adding role permission.', error: result.error });
    }
  };
  
  // exports.createOrUpdateRolePermissions = async (req, res) => {
  //   const { roleId, roleName, permissions , storeId,} = req.body; 
  
  //   try {
  //     let role;
  
  //     // 1. Handle role creation or fetch existing role
  //     if (roleId === 0) {
  //       // Role doesn't exist, create new one
  //       role = await RoleModel.create({ RoleName: roleName, Status: 'Active' , StoreID: storeId,});
  //     } else {
  //       // Fetch existing role by ID
  //       role = await RoleModel.findByPk(roleId);
  
  //       if (!role) {
  //         return res.status(200).json({ message: "Role not found" });
  //       }
  //     }
  
  //     const createdRoleId = role.RoleID;
  
  //     // 2. Loop through permissions to handle mapping (create/update)
  //     for (const permission of permissions) {
  //       const { permissionId, isChecked } = permission;
  
  //       if (isChecked) {
  //         // If permission is checked, either create or update the map
  //         const existingMapping = await MapRolePermissionsModel.findOne({
  //           where: {
  //             RoleID: createdRoleId,
  //             PermissionID: permissionId
  //           }
  //         });
  
  //         if (!existingMapping) {
  //           // If no existing mapping, create new
  //           await MapRolePermissionsModel.create({
  //             RoleID: createdRoleId,
  //             PermissionID: permissionId,
  //             StoreID: req.body.storeId // Assuming storeId is part of the request
  //           });
  //         } 
  //       } else {
  //         // If permission is not checked and a mapping exists, delete it
  //         await MapRolePermissionsModel.destroy({
  //           where: {
  //             RoleID: createdRoleId,
  //             PermissionID: permissionId
  //           }
  //         });
  //       }
  //     }
  
  //     return res.status(200).json({ message: 'Role permissions updated successfully' });
  //   } catch (error) {
  //     console.error("Error creating or updating role permissions:", error);
  //     return res.status(500).json({ message: 'An error occurred', error });
  //   }
  // };
  
  exports.createOrUpdateRolePermissions = async (req, res) => {
    const { roleId, roleName, permissions, storeId } = req.body; 
    
    try {
      let role;
    
      // 1. Handle role creation or fetch existing role
      if (roleId === 0) {
        // Role doesn't exist, create new one
        role = await RoleModel.create({ RoleName: roleName, Status: 'Active', StoreID: storeId });
      } else {
        // Fetch existing role by ID
        role = await RoleModel.findByPk(roleId);
    
        if (!role) {
          return res.status(200).json({ message: "Role not found" });
        }
        
        // Update roleName and storeId if role exists
        role.RoleName = roleName;
        role.StoreID = storeId;
        await role.save(); // Save the updated role details
      }
    
      const createdRoleId = role.RoleID;
    
      // 2. Loop through permissions to handle mapping (create/update)
      for (const permission of permissions) {
        const { permissionId, isChecked } = permission;
    
        if (isChecked) {
          // If permission is checked, either create or update the map
          const existingMapping = await MapRolePermissionsModel.findOne({
            where: {
              RoleID: createdRoleId,
              PermissionID: permissionId
            }
          });
    
          if (!existingMapping) {
            // If no existing mapping, create new
            await MapRolePermissionsModel.create({
              RoleID: createdRoleId,
              PermissionID: permissionId,
              StoreID: storeId // Use the updated storeId from the request
            });
          } 
        } else {
          // If permission is not checked and a mapping exists, delete it
          await MapRolePermissionsModel.destroy({
            where: {
              RoleID: createdRoleId,
              PermissionID: permissionId
            }
          });
        }
      }
    
      return res.status(200).json({ message: 'Role and permissions updated successfully' });
    } catch (error) {
      console.error("Error creating or updating role permissions:", error);
      return res.status(500).json({ message: 'An error occurred', error });
    }
  };
  