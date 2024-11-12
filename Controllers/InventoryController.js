const multer = require('multer');
const { inventorystorage } = require('../middleware/Cloundinary'); 
// const InventoryFile = require('../Models/InventoryModel'); 
const {InventoryModel} = require('../ConnectionDB/Connect');
// const upload = multer({ storage: inventorystorage }).single('inventoryFile');
const path = require('path'); 
const moment = require('moment');
const supabase = require('../middleware/supabase');

// exports.uploadInventoryFile = async (req, res) => {
//   upload(req, res, async (err) => {
//     if (err instanceof multer.MulterError || err) {
//       return res.status(500).json({ error: 'Failed to upload file.', details: err });
//     }

//     try {
//       // Get the file details
//       const { originalname, path, mimetype } = req.file;

//       // Determine file type (you can adjust this as needed)
//       const fileType = mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ? 1 : 2; // 1 for Excel, 2 for other types

//       // Store file metadata in the database
//       const inventoryFile = await InventoryFile.create({
//         FileName: originalname,
//         FileUrl: path,
//         FileType: fileType,
//       });

//       return res.status(201).json({
//         StatusCode: 'SUCCESS',
//         message: 'Inventory file uploaded successfully',
//         FileID: inventoryFile.FileID,
//         FileUrl: inventoryFile.FileUrl,
//       });
//     } catch (error) {
//       console.error('Error uploading inventory file:', error);
//       return res.status(500).json({
//         StatusCode: 'ERROR',
//         message: 'Internal Server Error',
//       });
//     }
//   });
// };


// exports.uploadInventoryFile = async (req, res) => {
//     upload(req, res, async (err) => {
//         if (err instanceof multer.MulterError || err) {
//             return res.status(500).json({ error: 'Failed to upload file.', details: err });
//         }

//         try {
//             // Ensure a file was uploaded
//             if (!req.file) {
//                 return res.status(400).json({ error: 'No file uploaded' });
//             }

//             // Get file details from Cloudinary response
//             const { originalname, path, mimetype } = req.file;

//             // Determine file type
//             let fileType = 2; // Default for non-Excel files
//             if (mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
//                 fileType = 1; // Excel file type
//             }

//             // Store file metadata in the database
//             const inventoryFile = await InventoryModel.create({
//                 FileName: originalname,
//                 FileUrl: path,
//                 FileType: fileType,
//             });

//             return res.status(201).json({
//                 StatusCode: 'SUCCESS',
//                 message: 'Inventory file uploaded successfully',
//                 FileID: inventoryFile.FileID,
//                 FileUrl: inventoryFile.FileUrl,
//             });
//         } catch (error) {
//             console.error('Error uploading inventory file:', error);
//             return res.status(500).json({
//                 StatusCode: 'ERROR',
//                 message: 'Internal Server Error',
//             });
//         }
//     });
// };


// // // Get Inventory File by FileID
// exports.getInventoryFileById = async (req, res) => {
//     const { FileID } = req.params;

//     try {
//         // Fetch the inventory file by its ID from the database
//         const inventoryFile = await InventoryModel.findOne({ where: { FileID } });

//         if (!inventoryFile) {
//             return res.status(200).json({ error: 'Inventory file not found.' });
//         }

//         // Cloudinary URL stored in the `FileUrl` field
//         const viewUrl = inventoryFile.FileUrl;

//         // Generate download URL by modifying the Cloudinary URL for file download
//         const downloadUrl = viewUrl.replace('/upload/', '/upload/fl_attachment/');

//         // Return the view and download URLs along with file metadata
//         res.status(200).json({
//             StatusCode: 'SUCCESS',
//             FileID: inventoryFile.FileID,
//             FileName: inventoryFile.FileName,
//             FileType: inventoryFile.FileType,
//             viewUrl: viewUrl,          
//             downloadUrl: downloadUrl,   
//         });
//     } catch (error) {
//         console.error('Error fetching inventory file by ID:', error);
//         res.status(500).json({ error: 'Failed to fetch inventory file.' });
//     }
// };





// Upload and Download API (Single Endpoint)
// exports.uploadDownloadInventoryFile = async (req, res) => {
//     try {
//         // For downloading the file
//         if (req.method === 'GET') {
//             const existingFile = await InventoryModel.findOne(); // Always fetch the single existing record

//             if (!existingFile) {
//                 return res.status(404).json({ error: 'No file found in the database.' });
//             }

//             // Cloudinary URL stored in the `FileUrl` field
//             const viewUrl = existingFile.FileUrl;

//             // Generate download URL for Cloudinary or modify for direct local download
//             const downloadUrl = viewUrl.replace('/upload/', '/upload/fl_attachment/');

//             // Force file download by redirecting to the modified Cloudinary download URL
//             return res.redirect(downloadUrl); // Automatically downloads the file
//         }

//         // For uploading or replacing the file
//         if (req.method === 'POST') {
//             upload(req, res, async (err) => {
//                 if (err instanceof multer.MulterError || err) {
//                     return res.status(500).json({ error: 'Failed to upload file.', details: err });
//                 }

//                 try {
//                     if (!req.file) {
//                         return res.status(400).json({ error: 'No file uploaded' });
//                     }

//                     const { originalname, path, mimetype } = req.file;
//                     let fileType = mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ? 1 : 2;

//                     // Check if the single record exists in the database
//                     let existingFile = await InventoryModel.findOne();

//                     if (existingFile) {
//                         // Replace existing file with new file details (only update the same record)
//                         existingFile.FileName = originalname;
//                         existingFile.FileUrl = path; // Update the file path with the new upload
//                         existingFile.FileType = fileType;

//                         await existingFile.save();

//                         return res.status(200).json({
//                             StatusCode: 'SUCCESS',
//                             message: 'Inventory file updated successfully',
//                             FileID: existingFile.FileID,  // Always keep the same FileID
//                             FileUrl: existingFile.FileUrl,
//                         });
//                     } else {
//                         // No record exists, create a new one (this should happen only once)
//                         const newFile = await InventoryModel.create({
//                             FileName: originalname,
//                             FileUrl: path,
//                             FileType: fileType,
//                         });

//                         return res.status(201).json({
//                             StatusCode: 'SUCCESS',
//                             message: 'Inventory file uploaded successfully',
//                             FileID: newFile.FileID,  // First and only FileID created
//                             FileUrl: newFile.FileUrl,
//                         });
//                     }
//                 } catch (uploadError) {
//                     console.error('Error handling inventory file upload:', uploadError);
//                     return res.status(500).json({
//                         StatusCode: 'ERROR',
//                         message: 'Internal Server Error',
//                     });
//                 }
//             });
//         }
//     } catch (error) {
//         console.error('Error handling inventory file:', error);
//         return res.status(500).json({
//             StatusCode: 'ERROR',
//             message: 'Internal Server Error',
//         });
//     }
// };


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
    const supabaseUrl = 'https://gqgwpwknmueehztfkgsf.supabase.co';
    const publicUrl = `${supabaseUrl}/storage/v1/object/public/uploaddocument/documents/${fileNameWithTimestamp}`;
    const downloadUrl = `${publicUrl}?download=&fileName=${encodeURIComponent(file.originalname)}`;

    // Return the public URL, download URL, and the original file name
    return { publicUrl, downloadUrl, originalFileName: file.originalname };
};

// exports.uploadDownloadInventoryFile = async (req, res) => {
//     try {

//          // Handle file download
//          if (req.method === 'GET') {
//             // Fetch the file with FileID = 1
//             try {
//                 // Fetch the document by its ID from the database
//                 const document = await InventoryModel.findOne({ where: { FileID } });
        
//                 if (!document) {
//                     return res.status(404).json({ error: 'Document not found.' });
//                 }
        
//                 // Supabase URL for public access and download
//                 const publicUrl = document.FileUrl;
//                 const downloadUrl = `${publicUrl}?download=&fileName=${encodeURIComponent(document.FileName)}`;
        
//                 // Return the document metadata, view URL, and download URL
//                 res.status(200).json({
//                     StatusCode: 'SUCCESS',
//                     FileID: document.FileID,
//                     FileName: document.FileName,
//                     FileType: document.FileType,
//                     viewUrl: publicUrl,
//                     downloadUrl: downloadUrl,
//                 });
//             } catch (error) {
//                 console.error('Error fetching document by ID:', error);
//                 res.status(500).json({ error: 'Failed to fetch document.' });
//             }
//         }

//         // Handle file upload or replacement
//         if (req.method === 'POST') {
//             upload(req, res, async (err) => {
//                 if (err instanceof multer.MulterError || err) {
//                     return res.status(500).json({ error: 'Failed to upload file.', details: err });
//                 }

//                 try {
//                     if (!req.files || !req.files['UploadDocument']) {
//                         return res.status(400).json({ error: 'No file uploaded' });
//                     }

//                     const uploadedFiles = req.files['UploadDocument'];
//                     let existingFile = await InventoryModel.findOne();

//                     const uploadResults = await Promise.all(uploadedFiles.map(file => uploadFileToSupabase(file)));

//                     if (existingFile) {
//                         // Update existing file details
//                         existingFile.FileName = uploadedFiles.map(f => f.originalname).join(', ');
//                         existingFile.FileUrl = uploadResults.map(result => result.publicUrl).join(', ');
//                         existingFile.FileType = uploadedFiles[0].mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ? 1 : 2;

//                         await existingFile.save();
//                         return res.status(200).json({
//                             StatusCode: 'SUCCESS',
//                             message: 'Inventory files updated successfully',
//                             FileID: existingFile.FileID,
//                             FileUrl: existingFile.FileUrl,
//                         });
//                     } else {
//                         // Create a new record if none exists
//                         const newFile = await InventoryModel.create({
//                             FileName: uploadedFiles.map(f => f.originalname).join(', '),
//                             FileUrl: uploadResults.map(result => result.publicUrl).join(', '),
//                             FileType: uploadedFiles[0].mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ? 1 : 2,
//                         });

//                         return res.status(201).json({
//                             StatusCode: 'SUCCESS',
//                             message: 'Inventory file uploaded successfully',
//                             FileID: newFile.FileID,
//                             FileUrl: newFile.FileUrl,
//                         });
//                     }
//                 } catch (uploadError) {
//                     console.error('Error handling inventory file upload:', uploadError);
//                     return res.status(500).json({
//                         StatusCode: 'ERROR',
//                         message: 'Internal Server Error',
//                     });
//                 }
//             });
//         }
//     } catch (error) {
//         console.error('Error handling inventory file:', error);
//         return res.status(500).json({
//             StatusCode: 'ERROR',
//             message: 'Internal Server Error',
//         });
//     }
// };

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




