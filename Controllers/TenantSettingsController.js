const { TenantSettingsModel } = require('../ConnectionDB/Connect'); // Adjust the path as needed
const multer = require('multer');
const moment = require('moment');
const path = require('path');
const { supabaseTenant } = require('../middleware/supabase');

// Configure multer for multiple file uploads
const upload = multer({ storage: multer.memoryStorage() }).fields([
    { name: 'CompanyLogo', maxCount: 1 },
    { name: 'CompanyImage', maxCount: 1 }
]);

// Function to upload a file to Supabase
const uploadFileToSupabase = async (file, folder) => {
    // Sanitize the file name
    const sanitizedFileName = file.originalname.replace(/[^\w\.-]/g, '_');
    
    // Generate timestamp
    const timestamp = moment().format('DDMMYYYY_HHmmss');
    const fileNameWithTimestamp = `${sanitizedFileName}_${timestamp}${path.extname(file.originalname)}`;
    
    // Upload to Supabase
    const { data, error } = await supabaseTenant
        .storage
        .from('uploaddocument')
        .upload(`documents/${fileNameWithTimestamp}`, file.buffer, {
            contentType: file.mimetype
        });

    if (error) {
        console.error('Supabase Upload Error:', error);
        throw new Error('Error uploading file to Supabase: ' + error.message);
    }

    // Construct the public URL
    const supabaseUrl = 'https://wumwtcghvhxdpgctsoyy.supabase.co';
    const publicUrl = `${supabaseUrl}/storage/v1/object/public/uploaddocument/documents/${folder}/${fileNameWithTimestamp}`;
    
    return { publicUrl, originalFileName: file.originalname };
};

exports.createTenantSettings = async (req, res) => {
    upload(req, res, async function (err) {
        if (err instanceof multer.MulterError) {
            return res.status(500).json({ error: err });
        } else if (err) {
            return res.status(500).json({ error: 'Failed to upload files.' });
        }

        try {
            let { TenantID ,CompanyName, CreatedBy } = req.body;

            // Upload CompanyLogo if provided
            let logoUrl = null;
            if (req.files && req.files['CompanyLogo']) {
                const logoFile = req.files['CompanyLogo'][0];
                const logoUpload = await uploadFileToSupabase(logoFile, 'logos');
                logoUrl = logoUpload.publicUrl;
            }

            // Upload CompanyImage if provided
            let imageUrl = null;
            if (req.files && req.files['CompanyImage']) {
                const imageFile = req.files['CompanyImage'][0];
                const imageUpload = await uploadFileToSupabase(imageFile, 'images');
                imageUrl = imageUpload.publicUrl;
            }

            // Create tenant settings record
            const newTenantSettings = await TenantSettingsModel.create({
                TenantID,
                CompanyName,
                CompanyLogo: logoUrl,
                CompanyImage: imageUrl,
                CreatedBy: CreatedBy || 'System',
                CreatedAt: new Date(),
                UpdatedAt: new Date()
            });

            return res.status(201).json({
                StatusCode: 'SUCCESS',
                message: 'Tenant settings created successfully.',
                data: newTenantSettings
            });

        } catch (error) {
            console.error('Error creating tenant settings:', error);
            return res.status(500).json({ 
                error: 'An error occurred while creating tenant settings.' 
            });
        }
    });
};

exports.updateTenantSettings = async (req, res) => {
    upload(req, res, async function (err) {
        if (err instanceof multer.MulterError) {
            return res.status(500).json({ error: err });
        } else if (err) {
            return res.status(500).json({ error: 'Failed to upload files.' });
        }

        try {
            const { TenantID } = req.params;
            let { CompanyName, UpdatedBy } = req.body;

            // Find existing tenant settings
            const existingSettings = await TenantSettingsModel.findByPk(TenantID);
            if (!existingSettings) {
                return res.status(404).json({ 
                    error: 'Tenant settings not found.' 
                });
            }

            // Upload new CompanyLogo if provided
            let logoUrl = existingSettings.CompanyLogo;
            if (req.files && req.files['CompanyLogo']) {
                const logoFile = req.files['CompanyLogo'][0];
                const logoUpload = await uploadFileToSupabase(logoFile, 'logos');
                logoUrl = logoUpload.publicUrl;
            }

            // Upload new CompanyImage if provided
            let imageUrl = existingSettings.CompanyImage;
            if (req.files && req.files['CompanyImage']) {
                const imageFile = req.files['CompanyImage'][0];
                const imageUpload = await uploadFileToSupabase(imageFile, 'images');
                imageUrl = imageUpload.publicUrl;
            }

            // Update tenant settings
            await existingSettings.update({
                CompanyName: CompanyName || existingSettings.CompanyName,
                CompanyLogo: logoUrl,
                CompanyImage: imageUrl,
                UpdatedBy: UpdatedBy || 'System',
                UpdatedAt: new Date()
            });

            return res.status(200).json({
                StatusCode: 'SUCCESS',
                message: 'Tenant settings updated successfully.',
                data: existingSettings
            });

        } catch (error) {
            console.error('Error updating tenant settings:', error);
            return res.status(500).json({ 
                error: 'An error occurred while updating tenant settings.' 
            });
        }
    });
};



    // Get tenant settings by TenantID
    exports.getTenantSettings= async (req, res) => {
        try {
            const { TenantID } = req.params;

            if (!TenantID) {
                return res.status(400).json({ message: 'TenantID is required' });
            }

            const tenantSettings = await TenantSettingsModel.findByPk(TenantID);

            if (!tenantSettings) {
                return res.status(404).json({ message: 'Tenant not found' });
            }

            res.status(200).json({ tenantSettings });
        } catch (error) {
            console.error('Error in getTenantSettings:', error);
            res.status(500).json({ message: 'Internal server error', error: error.message });
        }
    };