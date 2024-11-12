const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { UserManagementModel ,MapStoreUser,MapRolePermissionsModel,PermissionsModel} = require('../ConnectionDB/Connect'); 


// exports.loginUser = async (req, res) => {
//     try {
//         const { Email, Password } = req.body;

//         // Check if the user exists
//         const user = await UserManagementModel.findOne({ where: { Email } });
//         if (!user) {
//             return res.status(404).json({ message: 'User not found' });
//         }

//         // Validate password
//         const isValidPassword = (Password === user.Password); 
//         if (!isValidPassword) {
//             return res.status(401).json({ message: 'Invalid credentials' });
//         }

//         // Generate a JWT token with RoleID and UserID
//         const token = jwt.sign(
//             { UserID: user.UserID, RoleID: user.RoleID ,StoreID:user.StoreID}, 
//             process.env.JWT_SECRET, 
//             { expiresIn: '1h' }
//         );

//         res.status(200).json({ message: 'Login successful', token });
//     } catch (err) {
//         console.error('Error during login:', err);
//         res.status(500).json({ message: 'Internal Server Error' });
//     }
// };

// exports.loginUser = async (req, res) => {
//     try {
//         const { Email, Password } = req.body;

//         // Check if the user exists
//         const user = await UserManagementModel.findOne({ where: { Email } });
//         if (!user) {
//             return res.status(404).json({ message: 'User not found' });
//         }

//         // Validate password
//         const isValidPassword = (Password === user.Password); 
//         if (!isValidPassword) {
//             return res.status(401).json({ message: 'Invalid credentials' });
//         }

//         // Retrieve all stores mapped to the user
//         const mappedStores = await MapStoreUser.findAll({
//             where: { UserID: user.UserID },
//             attributes: ['StoreID']  // Get only StoreID
//         });

//         const storeIDs = mappedStores.map(store => store.StoreID);  // Extract the StoreIDs

//         // Generate a JWT token with UserID, RoleID, and mapped StoreIDs
//         const token = jwt.sign(
//             { UserID: user.UserID, RoleID: user.RoleID, StoreIDs: storeIDs }, 
//             process.env.JWT_SECRET, 
//             { expiresIn: '1h' }
//         );

//         console.log('Token generated',token)

//         res.status(200).json({ message: 'Login successful', token });
//     } catch (err) {
//         console.error('Error during login:', err);
//         res.status(500).json({ message: 'Internal Server Error' });
//     }
// };


exports.loginUser = async (req, res) => {
    try {
        const { Email, Password } = req.body;

        // Check if the user exists
        const user = await UserManagementModel.findOne({ where: { Email } });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Validate password
        const isValidPassword = (Password === user.Password);
        if (!isValidPassword) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Retrieve all stores mapped to the user
        const mappedStores = await MapStoreUser.findAll({
            where: { UserID: user.UserID },
            attributes: ['StoreID']  // Get only StoreID
        });

        const storeIDs = mappedStores.map(store => store.StoreID);  // Extract the StoreIDs

        // Fetch permissions based on RoleID
        const rolePermissions = await MapRolePermissionsModel.findAll({
            where: { RoleID: user.RoleID },
            attributes: ['PermissionID']
        });

        const permissionIDs = rolePermissions.map(rp => rp.PermissionID);
        console.log(permissionIDs)
        // Fetch permission names from Permissions table
        const permissions = await PermissionsModel.findAll({
            where: { ID: permissionIDs },
            attributes: ['Name',]
        });
        // console.log(permissions)
        const permissionNames = permissions.map(permission => permission.Name);  // Extract permission names
      
        // Generate a JWT token with UserID, RoleID, mapped StoreIDs, and permissions
        const token = jwt.sign(
            { 
                UserID: user.UserID, 
                RoleID: user.RoleID, 
                StoreIDs: storeIDs,
                PermissionID:permissionIDs,
                Permissions: permissionNames  // Add permission names to the token
            }, 
            process.env.JWT_SECRET, 
            { expiresIn: '1h' }
        );
       
        console.log('Token generated', token);

        res.status(200).json({ message: 'Login successful', token });
    } catch (err) {
        console.error('Error during login:', err);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};
