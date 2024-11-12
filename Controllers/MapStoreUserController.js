
const { MapStoreUser, UserManagementModel, StoreModel } = require('../ConnectionDB/Connect');
const { Op } = require('sequelize');

exports.createOrUpdateMapStoreUser = async (req, res) => {
    const { MapStoreUserID, StoreID, UserID, CreatedBy } = req.body;

    try {
        // Check if StoreID exists, if not, throw an error
        const store = await StoreModel.findOne({ where: { StoreID } });
        if (!store) {
            return res.status(404).json({ message: 'Store not found' });
        }
        const User = await UserManagementModel.findOne({ where: { UserID } });
        if (!User) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check if the same StoreID and UserID combination already exists
        const existingMapping = await MapStoreUser.findOne({ where: { StoreID, UserID } });
        if (existingMapping) {
            return res.status(200).json({ message: 'User is already mapped to this store' });
        }

        // Check if the UserID is mapped to any other StoreID
        // const existingUserInOtherStore = await MapStoreUser.findOne({ where: { UserID } });
        // if (existingUserInOtherStore && existingUserInOtherStore.StoreID !== StoreID) {
        //     return res.status(200).json({ message: 'User is already mapped to another store' });
        // }

        if (MapStoreUserID === 0) {
            // Create new MapStoreUser record if MapStoreUserID is 0
            await MapStoreUser.create({
                StoreID,
                UserID,
                CreatedAt: new Date(),
                UpdatedAt: new Date(),
                CreatedBy,
            });
            return res.status(201).json({ message: 'MapStoreUser created successfully' });
        } else {
            // Find existing MapStoreUser record by MapStoreUserID
            let mapStoreUser = await MapStoreUser.findOne({ where: { MapStoreUserID } });

            if (mapStoreUser) {
                // Update the specific MapStoreUser record
                await MapStoreUser.update(
                    { UserID, UpdatedAt: new Date(), UpdatedBy: CreatedBy },
                    { where: { MapStoreUserID } }
                );
                return res.status(200).json({ message: 'MapStoreUser updated successfully' });
            } else {
                return res.status(404).json({ message: 'MapStoreUser not found' });
            }
        }
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};


// Delete MapStoreUser by MapStoreUserID
exports.deleteMapStoreUser = async (req, res) => {
    const { MapStoreUserID } = req.params;

    try {
        // Find MapStoreUser by MapStoreUserID
        const mapStoreUser = await MapStoreUser.findOne({ where: { MapStoreUserID } });

        if (!mapStoreUser) {
            return res.status(404).json({ message: 'MapStoreUser not found' });
        }

        // Delete the MapStoreUser record
        await MapStoreUser.destroy({ where: { MapStoreUserID } });
        return res.status(200).json({ message: 'MapStoreUser deleted successfully' });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};

exports. getAllMapStoreUsers = async (req, res) => {
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    const searchText = Object.keys(req.query).find(key => key.toLowerCase() === 'searchtext');
    const searchValue = req.query[searchText]?.toLowerCase() || '';
    try {
        const mapStoreUsers = await MapStoreUser.findAndCountAll({
            include: [
                { model: UserManagementModel, as: 'User', where: { FirstName: { [Op.like]: `%${searchValue}%` } } },
                { model: StoreModel, as: 'Store', where: { StoreName: { [Op.like]: `%${searchValue}%` } } }
            ],
            offset,
            limit
        });

        res.status(200).json({
            totalPages: Math.ceil(mapStoreUsers.count / limit),
            currentPage: page,
            data: mapStoreUsers.rows
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};



exports. getMapStoreUserById = async (req, res) => {
    const { id } = req.params;

    try {
        const mapStoreUser = await MapStoreUser.findAndCountAll({
            where: { StoreID: id },
            include: [
                { model: UserManagementModel, as: 'User' },
                { model: StoreModel, as: 'Store' }
            ]
        });

        if (!mapStoreUser) {
            return res.status(200).json({ message: 'MapStoreUser not found' });
        }

        res.status(200).json(mapStoreUser);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};



exports. getMapStoreUserByUserId = async (req, res) => {
    const { id } = req.params;

    try {
        const mapStoreUser = await MapStoreUser.findOne({
            where: { UserID: id },
            include: [
                { model: UserManagementModel, as: 'User' },
                { model: StoreModel, as: 'Store' }
            ]
        });

        if (!mapStoreUser) {
            return res.status(200).json({ message: 'MapStoreUser not found' });
        }

        res.status(200).json(mapStoreUser);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

