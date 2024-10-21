const multer = require('multer');
const path = require('path');
const fs = require('fs');


const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadPath = path.join(__dirname, "/../files_folder/hostel_upload/");
      if (!fs.existsSync(uploadPath)) {
        fs.mkdirSync(uploadPath); 
      }
      cb(null, uploadPath); 
    },
    filename: (req, file, cb) => {
      cb(null, file.originalname); 
    }
  });
  
  const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, 
    fileFilter: (req, file, cb) => {
      if (path.extname(file.originalname) !== '.xlsx') {
        return cb(new Error('Only .xlsx files are allowed!'));
      }
      cb(null, true);
    }
});

module.exports = upload;