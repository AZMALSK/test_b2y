const multer = require('multer');
const { inventorystorage } = require('../middleware/Cloundinary'); 
// const InventoryFile = require('../Models/InventoryModel'); 
const {InventoryModel} = require('../ConnectionDB/Connect');
// const upload = multer({ storage: inventorystorage }).single('inventoryFile');
const path = require('path'); 
const moment = require('moment');
const { supabase } = require('../middleware/supabase');



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



exports.uploadDownloadInventoryFile = async (req, res) => {
    try {
        // Handle file download
        if (req.method === 'GET') {
            const { FileID } = req.params; 
            console.log(FileID)

            if (!FileID) {
                return res.status(400).json({ error: 'FileID is required for fetching the document.' });
            }

            try {
                // Fetch the document by its ID from the database
                const document = await InventoryModel.findOne({ where: { FileID } });
        
                if (!document) {
                    return res.status(404).json({ error: 'Document not found.' });
                }
        
                // Supabase URL for public access and download
                const publicUrl = document.FileUrl;
                const downloadUrl = `${publicUrl}?download=&fileName=${encodeURIComponent(document.FileName)}`;
        
                // Return the document metadata, view URL, and download URL
                return res.status(200).json({
                    StatusCode: 'SUCCESS',
                    FileID: document.FileID,
                    FileName: document.FileName,
                    FileType: document.FileType,
                    viewUrl: publicUrl,
                    downloadUrl: downloadUrl,
                });
            } catch (error) {
                console.error('Error fetching document by ID:', error);
                return res.status(500).json({ error: 'Failed to fetch document.' });
            }
        }
        
        // Handle file upload or replacement (POST request)
        if (req.method === 'POST') {
            upload(req, res, async (err) => {
                if (err instanceof multer.MulterError || err) {
                    return res.status(500).json({ error: 'Failed to upload file.', details: err });
                }

                try {
                    if (!req.files || !req.files['UploadDocument']) {
                        return res.status(400).json({ error: 'No file uploaded' });
                    }

                    const uploadedFiles = req.files['UploadDocument'];
                    const uploadResults = await Promise.all(uploadedFiles.map(file => uploadFileToSupabase(file)));

                    // Check if there is already an existing file
                    let existingFile = await InventoryModel.findOne();

                    if (existingFile) {
                        // Update existing file details
                        existingFile.FileName = uploadedFiles.map(f => f.originalname).join(', ');
                        existingFile.FileUrl = uploadResults.map(result => result.publicUrl).join(', ');
                        existingFile.FileType = uploadedFiles[0].mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ? 1 : 2;

                        await existingFile.save();
                        return res.status(200).json({
                            StatusCode: 'SUCCESS',
                            message: 'Inventory files updated successfully',
                            FileID: existingFile.FileID,
                            FileUrl: existingFile.FileUrl,
                        });
                    } else {
                        // Create a new record if none exists
                        const newFile = await InventoryModel.create({
                            FileName: uploadedFiles.map(f => f.originalname).join(', '),
                            FileUrl: uploadResults.map(result => result.publicUrl).join(', '),
                            FileType: uploadedFiles[0].mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ? 1 : 2,
                        });

                        return res.status(201).json({
                            StatusCode: 'SUCCESS',
                            message: 'Inventory file uploaded successfully',
                            FileID: newFile.FileID,
                            FileUrl: newFile.FileUrl,
                        });
                    }
                } catch (uploadError) {
                    console.error('Error handling inventory file upload:', uploadError);
                    return res.status(500).json({
                        StatusCode: 'ERROR',
                        message: 'Internal Server Error',
                    });
                }
            });
        }
    } catch (error) {
        console.error('Error handling inventory file:', error);
        return res.status(500).json({
            StatusCode: 'ERROR',
            message: 'Internal Server Error',
        });
    }
};




