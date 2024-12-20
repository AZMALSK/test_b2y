const multer = require('multer');
const { inventorystorage } = require('../middleware/Cloundinary');
// const InventoryFile = require('../Models/InventoryModel');
const { ProjectTypeModel,OrderTabelModel , CustomerModel} = require('../ConnectionDB/Connect');
// const upload = multer({ storage: inventorystorage }).single('inventoryFile');
const path = require('path');
const moment = require('moment');
const { supabase }= require('../middleware/supabase');
const { Op } = require('sequelize'); // Import Op for Sequelize operators
 
const upload = multer({ storage: multer.memoryStorage() }).fields([
    { name: 'UploadDocument', maxCount: 10 }
]);
 
// Function to upload a file to Supabase
const uploadFileToSupabase = async (file) => {
      // Sanitize the file name by removing special characters except allowed ones
      const sanitizedFileName = file.originalname.replace(/[^\w\.-]/g, '_');
 
      // Generate a unique file name with the current date and time
      const timestamp = moment().format('DDMMYYYY_HHmmss'); // Format as DDMMYYYY_HHmmss
      const fileNameWithTimestamp = `${sanitizedFileName}_${timestamp}${path.extname(file.originalname)}`; // Add the original file extension
 
      // Upload the file to Supabase
      const { data, error } = await supabase
          .storage
          .from('uploaddocument')
          .upload(`documents/${fileNameWithTimestamp}`, file.buffer, {
              contentType: file.mimetype // Maintain the file type (e.g., PDF)
          });
 
    if (error) {
        console.error('Supabase Upload Error:', error);
        throw new Error('Error uploading file to Supabase: ' + error.message);
    }
 
    // Construct the public URL manually with download and file name headers
    const supabaseUrl = 'https://wumwtcghvhxdpgctsoyy.supabase.co';
    const publicUrl = `${supabaseUrl}/storage/v1/object/public/uploaddocument/documents/${fileNameWithTimestamp}`;
    const downloadUrl = `${publicUrl}?download=&fileName=${encodeURIComponent(file.originalname)}`;
 
    // Return the public URL, download URL, and the original file name
    return { publicUrl, downloadUrl, originalFileName: file.originalname };
};
 
 
// List all Project Types
exports.listProjectTypes = async (req, res) => {
    try {
        // Extract pagination parameters from the query string
        const page = parseInt(req.query.page, 10) || 1; // Default to page 1
        const limit = parseInt(req.query.limit, 10) || 10; // Default to 10 items per page
 
        const pageNumber = Math.max(page, 1);
        const pageSize = Math.max(limit, 1);
 
        const offset = (pageNumber - 1) * pageSize;
 
        // Fetch paginated data and total count
        const { rows: projectTypes, count: totalItems } = await ProjectTypeModel.findAndCountAll({
            offset,
            limit: pageSize,
            order: [['CreatedAt', 'DESC']] // Optional: Order by a specific column
        });
 
        // Calculate total pages
        const totalPages = Math.ceil(totalItems / pageSize);
 
        // Return paginated response
        res.status(200).json({
            data: projectTypes,
            pagination: {
                totalItems,
                totalPages,
                currentPage: pageNumber,
                pageSize
            }
        });
    } catch (error) {
        console.error('Error listing Project Types with pagination:', error);
        res.status(500).json({ message: 'Error listing Project Types', error });
    }
};
 
exports.getAllProjectTypes = async (req, res) => {
    const { page = 1, limit = 10, searchText, StartDate, EndDate } = req.query;

    try {
        const pageNumber = Math.max(parseInt(page, 10), 1);
        const pageSize = Math.max(parseInt(limit, 10), 1);
        const offset = (pageNumber - 1) * pageSize;

        // Build query conditions
        let whereConditions = {};

        if (searchText) {
            const searchValue = `%${searchText.toLowerCase()}%`;
            whereConditions = {
                [Sequelize.Op.or]: [
                    { TypeName: { [Sequelize.Op.iLike]: searchValue } },
                    { Description: { [Sequelize.Op.iLike]: searchValue } }
                ]
            };
        }

        if (StartDate && EndDate) {
            const startDate = new Date(StartDate);
            const endDate = new Date(EndDate);
            endDate.setUTCHours(23, 59, 59, 999); // Include the full end date

            whereConditions.CreatedAt = {
                [Sequelize.Op.between]: [startDate, endDate]
            };
        }

        // Fetch paginated data and total count
        const { rows: projectTypes, count: totalItems } = await ProjectTypeModel.findAndCountAll({
            where: whereConditions,
            offset,
            limit: pageSize,
            order: [['CreatedAt', 'DESC']] // Order by CreatedAt descending
        });

        // Calculate total pages
        const totalPages = Math.ceil(totalItems / pageSize);

        // Map the response to include all required fields
        const formattedProjectTypes = projectTypes.map(type => ({
            ProjectTypeID: type.ProjectTypeID,
            ProjectTypeName: type.ProjectTypeName,
            FileUrl: type.FileUrl, // Include if file URL exists
            Status: type.Status,   // Include status
            CreatedAt: type.CreatedAt,
            UpdatedAt: type.UpdatedAt
        }));

        // Return paginated response
        res.status(200).json({
            StatusCode: 'SUCCESS',
            message: 'Project Types retrieved successfully',
            data: formattedProjectTypes,
            pagination: {
                totalItems,
                totalPages,
                currentPage: pageNumber,
                pageSize
            }
        });
    } catch (error) {
        console.error('Error listing Project Types with pagination:', error);
        res.status(500).json({
            StatusCode: 'ERROR',
            message: 'Error listing Project Types',
            error: error.message
        });
    }
};
 
 
// Add a new Project Type
// exports.addProjectType = async (req, res) => {
//     upload(req, res, async (err) => {
//         if (err) {
//             return res.status(400).json({ message: 'File upload error', error: err.message });
//         }
 
//         try {
//             const { ProjectTypeName, Status, CreatedBy } = req.body;
//             const file = req.files.UploadDocument ? req.files.UploadDocument[0] : null;
 
//             let fileUrl = null;
//             if (file) {
//                 const uploadResult = await uploadFileToSupabase(file);
//                 fileUrl = uploadResult.publicUrl;
//             }
 
//             const newProjectType = await ProjectTypeModel.create({
//                 ProjectTypeName,
//                 FileUrl: fileUrl,
//                 Status
               
//             });
 
//             res.status(201).json({ message: 'Project Type added successfully', data: newProjectType });
//         } catch (error) {
//             console.error('Error adding Project Type:', error);
//             res.status(500).json({ message: 'Error adding Project Type', error });
//         }
//     });
// };
exports.addProjectType = async (req, res) => {
    upload(req, res, async (err) => {
        if (err) {
            return res.status(400).json({ message: 'File upload error', error: err.message });
        }

        try {
            const { ProjectTypeName, Status, CreatedBy } = req.body;
            const file = req.files.UploadDocument ? req.files.UploadDocument[0] : null;

            let fileUrl = null;
            if (file) {
                const uploadResult = await uploadFileToSupabase(file);
                fileUrl = uploadResult.publicUrl;
            }

            // Check if the project type name already exists
            const existingProjectType = await ProjectTypeModel.findOne({
                where: { ProjectTypeName: ProjectTypeName.trim() },
            });

            if (existingProjectType) {
                return res.status(400).json({ 
                    message: 'A Project Type with this name already exists.' 
                });
            }

            // Create the new Project Type
            const newProjectType = await ProjectTypeModel.create({
                ProjectTypeName: ProjectTypeName.trim(),
                FileUrl: fileUrl,
                Status,
                CreatedBy,
            });

            res.status(201).json({ 
                message: 'Project Type added successfully', 
                data: newProjectType 
            });
        } catch (error) {
            console.error('Error adding Project Type:', error);
            res.status(500).json({ 
                message: 'Error adding Project Type', 
                error: error.message 
            });
        }
    });
};

exports.updateProjectType = async (req, res) => {
    upload(req, res, async (err) => {
        if (err) {
            return res.status(400).json({ message: 'File upload error', error: err.message });
        }

        try {
            const { ProjectTypeName, Status } = req.body;
            const projectTypeId = req.params.id; // ID passed as a route parameter
            const file = req.files?.UploadDocument ? req.files.UploadDocument[0] : null;

            let fileUrl = null;
            if (file) {
                const uploadResult = await uploadFileToSupabase(file);
                fileUrl = uploadResult.publicUrl;
            }

            // Check if the project type exists
            const existingProjectType = await ProjectTypeModel.findOne({
                where: { ProjectTypeID: projectTypeId }, // Use ProjectTypeID
            });

            if (!existingProjectType) {
                return res.status(404).json({
                    message: 'Project Type not found',
                });
            }

            // Check for duplicate project type names (excluding the current record)
            const duplicateProjectType = await ProjectTypeModel.findOne({
                where: {
                    ProjectTypeName: ProjectTypeName.trim(),
                    ProjectTypeID: { [Op.ne]: projectTypeId }, // Exclude the current record
                },
            });

            if (duplicateProjectType) {
                return res.status(400).json({
                    message: 'A Project Type with this name already exists.',
                });
            }

            // Update the project type fields
            const updatedFields = {
                ProjectTypeName: ProjectTypeName.trim(),
                Status,
            };

            if (fileUrl) {
                updatedFields.FileUrl = fileUrl;
            }

            const updatedProjectType = await existingProjectType.update(updatedFields);

            res.status(200).json({
                message: 'Project Type updated successfully',
                data: updatedProjectType,
            });
        } catch (error) {
            console.error('Error updating Project Type:', error);
            res.status(500).json({
                message: 'Error updating Project Type',
                error: error.message,
            });
        }
    });
};

exports.getProjectTypeById = async (req, res) => {
    try {
        const { id } = req.params; // Extract the ProjectTypeID from the request parameters

        // Find the record by ID
        const projectType = await ProjectTypeModel.findByPk(id);

        if (!projectType) {
            return res.status(404).json({ message: 'Project Type not found' });
        }

        return res.status(200).json({
            message: 'Project Type retrieved successfully',
            data: projectType,
        });
    } catch (error) {
        console.error('Error fetching Project Type by ID:', error);
        return res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
};
 
// Delete a Project Type
exports.deleteProjectType = async (req, res) => {
    try {
        const { ProjectTypeID } = req.params;
 
        const deletedCount = await ProjectTypeModel.destroy({
            where: { ProjectTypeID }
        });
 
        if (!deletedCount) {
            return res.status(404).json({ message: 'Project Type not found' });
        }
 
        res.status(200).json({ message: 'Project Type deleted successfully' });
    } catch (error) {
        console.error('Error deleting Project Type:', error);
        res.status(500).json({ message: 'Error deleting Project Type', error });
    }
};
