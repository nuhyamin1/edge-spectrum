const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/uploads/assignments/');
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (ext.match(/\.(pdf|doc|docx|ppt|pptx)$/)) {
    cb(null, true);
  } else {
    cb(new Error('Only document files are allowed!'), false);
  }
};

const upload = multer({ storage, fileFilter });

module.exports = upload; 