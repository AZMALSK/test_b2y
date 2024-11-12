// cloudinaryConfig.js
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'b2y_order_uploads',
    format: async (req, file) => 'jpg', // Set the desired image format
    public_id: (req, file) => Date.now() + '-' + file.originalname.split('.')[0],
  },
});

const storage_uploads = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: 'uploads',
      format: async (req, file) => 'jpg', // Set the desired image format
      public_id: (req, file) => Date.now() + '-' + file.originalname.split('.')[0],
    },
  });

 // const inventorystorage = new CloudinaryStorage({
  //   cloudinary: cloudinary,
  //   params: {
  //     folder: 'inventory_uploads',
  //     // Set format to be determined dynamically
  //     format: (req, file) => {
  //       // Extract the extension based on the MIME type
  //       const mimeType = file.mimetype;
  //       if (mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
  //         return 'xlsx'; // Specify the extension for Excel
  //       }
  //       // Default case, you can customize this for other types as needed
  //       return mimeType.split('/')[1]; // Get the extension from MIME type
  //     },
      
  //     public_id: (req, file) => Date.now() + '-' + file.originalname.split('.')[0],
  //   },
  // }); 

  const inventorystorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'inventory_uploads',
        resource_type: 'auto',  // Automatically detect the file type
        format: async (req, file) => {
            const mimeType = file.mimetype;

            // Only specify format for known image or video types; ignore for others like Excel
            if (mimeType === 'image/jpeg' || mimeType === 'image/png') {
                return mimeType.split('/')[1]; // e.g., 'jpeg', 'png'
            }
            if (mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
                return 'xlsx'; // Allow Excel files
            }

            return null; // Return null for non-image/video files so Cloudinary does not attempt to transform
        },
        public_id: (req, file) => {
            return Date.now() + '-' + file.originalname.split('.')[0]; // Create unique file name
        },
    },
});



module.exports = { cloudinary, storage ,storage_uploads,inventorystorage };
