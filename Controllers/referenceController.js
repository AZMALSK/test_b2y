const { sequelize,ReferenceModel} = require('../ConnectionDB/Connect');


exports.createReference = async (req, res) => {
    try {
        const { name, isActive } = req.body;
        
        const reference = await ReferenceModel.create({
            name,
            isActive,
            parentId: null // Parent references have null parentId
        });

        return res.status(201).json({
            success: true,
            data: reference
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
}

// Create sub-reference
exports.createSubReference = async (req, res) => {
    try {
        const { name, parentId, isActive } = req.body;

        // Check if parent exists
        const parentReference = await ReferenceModel.findByPk(parentId);
        if (!parentReference) {
            return res.status(404).json({
                success: false,
                message: 'Parent reference not found'
            });
        }

        const subReference = await ReferenceModel.create({
            name,
            parentId,
            isActive
        });

        return res.status(201).json({
            success: true,
            data: subReference
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
}

// Get all references with their sub-references
exports.getAllReferences = async (req, res) => {
    try {
        const references = await ReferenceModel.findAll({
            where: { parentId: null },
            include: [{
                model: ReferenceModel,
                as: 'children'
            }]
        });

        return res.status(200).json({
            success: true,
            data: references
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
/*exports.getAllReferences = async (req, res) => {
    try {
        // Log the current database connection and model
        console.log('Sequelize models:', Object.keys(sequelize.models));
        console.log('Reference Model:', ReferenceModel);

        // Check total number of records in the table
        const totalRecords = await ReferenceModel.count();
        console.log('Total Records in References:', totalRecords);

        // Fetch references with detailed logging
        const references = await ReferenceModel.findAll({
            where: { 
                parentId: null 
            },
            attributes: ['id', 'name', 'isActive'],
            
        });

        // Log the raw references
        console.log('Retrieved References:', JSON.stringify(references, null, 2));

        // Check if references are empty
        if (references.length === 0) {
            return res.status(404).json({
                success: true,
                message: 'No references found',
                data: []
            });
        }

        return res.status(200).json({
            success: true,
            total: references.length,
            data: references
        });
    } catch (error) {
        console.error('Detailed Error in getAllReferences:', error);
        return res.status(500).json({
            success: false,
            message: error.message,
            errorStack: error.stack
        });
    }
}; */
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
        const { id } = req.params;
        const { name, isActive } = req.body;

        const reference = await ReferenceModel.findByPk(id);

        if (!reference) {
            return res.status(404).json({
                success: false,
                message: 'Reference not found'
            });
        }

        // Update reference
        await reference.update({
            name,
            isActive
        });

        return res.status(200).json({
            success: true,
            message: 'Reference updated successfully',
            data: reference
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
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
                message: 'Reference not found'
            });
        }

        // Check if reference has children
        const hasChildren = await ReferenceModel.count({
            where: { parentId: id }
        });

        if (hasChildren > 0) {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete reference with existing sub-references. Please delete sub-references first.'
            });
        }

        // Delete reference
        await reference.destroy();

        return res.status(200).json({
            success: true,
            message: 'Reference deleted successfully'
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Bulk Delete References
exports.bulkDeleteReferences = async (req, res) => {
    try {
        const { ids } = req.body;

        if (!Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Please provide an array of reference IDs'
            });
        }

        // Check for children in any of the references
        const hasChildren = await ReferenceModel.count({
            where: { 
                parentId: {
                    [Op.in]: ids
                }
            }
        });

        if (hasChildren > 0) {
            return res.status(400).json({
                success: false,
                message: 'One or more references have sub-references. Please delete sub-references first.'
            });
        }

        // Delete references
        await ReferenceModel.destroy({
            where: {
                id: {
                    [Op.in]: ids
                }
            }
        });

        return res.status(200).json({
            success: true,
            message: 'References deleted successfully'
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Change Reference Status
exports.changeReferenceStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { isActive } = req.body;

        const reference = await ReferenceModel.findByPk(id);

        if (!reference) {
            return res.status(404).json({
                success: false,
                message: 'Reference not found'
            });
        }

        // Update status
        await reference.update({ isActive });

        return res.status(200).json({
            success: true,
            message: 'Reference status updated successfully',
            data: reference
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

