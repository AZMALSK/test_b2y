const { sequelize,ReferenceModel} = require('../ConnectionDB/Connect');
const { Op } = require('sequelize');

//createparentorchind reference
exports.createReference = async (req, res) => {
    try {
        const { name, parentId, isActive } = req.body;

        // Validate duplicate names in the appropriate scope
        const existingReference = await ReferenceModel.findOne({
            where: parentId === 0
                ? { name, parentId: null } // For parent references
                : { name, parentId }, // For child references under the same parent
        });

        if (existingReference) {
            return res.status(400).json({
                success: false,
                message: 'A reference with this name already exists',
            });
        }

        // If parentId is 0, create a parent reference
        if (parentId === 0) {
            const parentReference = await ReferenceModel.create({
                name,
                parentId: null, // Parent references have null parentId
                isActive,
            });

            return res.status(201).json({
                success: true,
                message: 'Parent reference created successfully',
                data: parentReference,
            });
        }

        // For child reference, validate the parentId
        const parentReference = await ReferenceModel.findByPk(parentId);
        if (!parentReference) {
            return res.status(404).json({
                success: false,
                message: 'Parent reference not found',
            });
        }

        const childReference = await ReferenceModel.create({
            name,
            parentId,
            isActive,
        });

        return res.status(201).json({
            success: true,
            message: 'Child reference created successfully',
            data: childReference,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// Update Reference
exports.updateReference = async (req, res) => {
    try {
        const { id } = req.params; // Reference ID from route params
        const { name, isActive, parentId } = req.body;

        const reference = await ReferenceModel.findByPk(id);
        if (!reference) {
            return res.status(404).json({
                success: false,
                message: 'Reference not found',
            });
        }

        // Optional: If parentId is updated, validate the new parent reference
        if (parentId && parentId !== 0) {
            const parentReference = await ReferenceModel.findByPk(parentId);
            if (!parentReference) {
                return res.status(404).json({
                    success: false,
                    message: 'Parent reference not found',
                });
            }
        }

        // Update the reference
        await reference.update({ name, isActive, parentId: parentId === 0 ? null : parentId });

        return res.status(200).json({
            success: true,
            message: 'Reference updated successfully',
            data: reference,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};
// Delete Reference
exports.deleteReference = async (req, res) => {
    try {
        const { id } = req.params;

        const reference = await ReferenceModel.findByPk(id);
        if (!reference) {
            return res.status(404).json({
                success: false,
                message: 'Reference not found',
            });
        }

        // Check if the reference has children
        const childReferences = await ReferenceModel.findAll({
            where: { parentId: id },
        });

        if (childReferences.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete a reference with children. Delete the children first.',
            });
        }

        // Delete the reference
        await reference.destroy();

        return res.status(200).json({
            success: true,
            message: 'Reference deleted successfully',
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};
//getall data with parentname
exports.getAllData = async (req, res) => {
    try {
        const allData = await ReferenceModel.findAll({
            attributes: ['id', 'name', 'parentId', 'isActive'], 
            include: [
                {
                    model: ReferenceModel,
                    as: 'parent', // Match the alias defined in the association
                    attributes: ['name'], // Only fetch the parent's name
                },
            ],
        });

        // Transform the data to include parentName
        const transformedData = allData.map(item => ({
            id: item.id,
            name: item.name,
            parentId: item.parentId,
            isActive: item.isActive,
            parentName: item.parent ? item.parent.name : null, // Add parentName if parent exists
        }));

        return res.status(200).json({
            success: true,
            data: transformedData,
        });
    } catch (error) {
        console.error('Error fetching all data:', error);
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};
// Get chindrenReference by parentID
exports.getChildrenByParentId = async (req, res) => {
    const { parentId } = req.params;

    try {
        // Fetch child records based on parentId
        const childData = await ReferenceModel.findAll({
            where: {
                parentId: parentId,
            },
            attributes: ['id', 'name', 'parentId', 'isActive'],
            include: [
                {
                    model: ReferenceModel,
                    as: 'parent', // Match the alias defined in the association
                    attributes: ['name'], // Fetch only the parent's name
                },
            ],
        });

        // Transform the data to include parentName
        const transformedData = childData.map(item => ({
            id: item.id,
            name: item.name,
            parentId: item.parentId,
            isActive: item.isActive,
            parentName: item.parent ? item.parent.name : null, // Add parentName
        }));

        return res.status(200).json({
            success: true,
            data: transformedData,
        });
    } catch (error) {
        console.error('Error fetching children by parentId:', error);
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

exports.getById = async (req, res) => {
    try {
        const { id } = req.params;

        // Find the reference by ID including the parent record
        const reference = await ReferenceModel.findByPk(id, {
            attributes: ['id', 'name', 'parentId', 'isActive'],
            include: [
                {
                    model: ReferenceModel,
                    as: 'parent', 
                    attributes: ['name'], 
                },
            ],
        });

        if (!reference) {
            return res.status(404).json({
                success: false,
                message: 'Reference not found',
            });
        }

        // to include parentName
        const responseData = {
            id: reference.id,
            name: reference.name,
            parentId: reference.parentId,
            isActive: reference.isActive,
            parentName: reference.parent ? reference.parent.name : null, 
        };

        return res.status(200).json({
            success: true,
            data: responseData,
        });
    } catch (error) {
        console.error('Error fetching data by ID:', error);
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// Get all parentreferences
exports.getAllParentReferences = async (req, res) => {
    try {
        const parentReferences = await ReferenceModel.findAll({
            where: { parentId: null },
            // include: [{ model: ReferenceModel, as: 'children' }], // Optionally include child references
        });

        return res.status(200).json({
            success: true,
            data: parentReferences,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};
// Get all childreferences
exports.getAllChildReferences = async (req, res) => {
    try {
        const childReferences = await ReferenceModel.findAll({
            where: { parentId: { [Op.not]: null } }, // Sequelize operator for "not null"
            // include: [{ model: ReferenceModel, as: 'parent' }], // Optionally include parent reference
        });

        return res.status(200).json({
            success: true,
            data: childReferences,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};
