const { sequelize,ReferenceModel} = require('../ConnectionDB/Connect');
const { Op } = require('sequelize');


exports.createReference = async (req, res) => {
    try {
        const { name, parentId, isActive } = req.body;

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

// Get all references with their sub-references
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

// Get Reference by ID
exports.getReferenceById = async (req, res) => {
    try {
        const { id } = req.params;

        const reference = await ReferenceModel.findOne({
            where: { id },
            include: [{
                model: ReferenceModel,
                as: 'children'
                
            }]
        });

        if (!reference) {
            return res.status(404).json({
                success: false,
                message: 'Reference not found'
            });
        }

        return res.status(200).json({
            success: true,
            data: reference
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
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




