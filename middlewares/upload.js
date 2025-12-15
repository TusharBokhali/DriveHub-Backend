const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");

// Shared Cloudinary storage for all image uploads
const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    // Allow different folders per feature in future if needed
    // Default folder name
    const defaultFolder = "drivehub_uploads";

    return {
      folder: defaultFolder,
      allowed_formats: ["jpg", "png", "jpeg", "webp"],
      resource_type: "image",
    };
  },
});

// Re‑create the same safeguards you had with disk storage
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype && file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed!"), false);
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB per file
    files: 5, // Max 5 files in array upload
  },
});

module.exports = upload;
