const multer = require("multer");
const path = require("path");

let storage;

// Try to use Cloudinary storage first, but NEVER crash if it's misconfigured
try {
  const { CloudinaryStorage } = require("multer-storage-cloudinary");
  const cloudinary = require("../config/cloudinary");

  const hasUploadStream =
    cloudinary &&
    cloudinary.uploader &&
    typeof cloudinary.uploader.upload_stream === "function";

  if (hasUploadStream) {
    // Shared Cloudinary storage for all image uploads
    storage = new CloudinaryStorage({
      cloudinary,
      params: async (req, file) => {
        // Determine folder based on field name or route
        let folder = "drivehub_uploads";
        if (file.fieldname === "profileImage") {
          folder = "drivehub_uploads/profile_images";
        } else if (file.fieldname === "documents") {
          folder = "drivehub_uploads/documents";
        } else if (file.fieldname === "images") {
          folder = "drivehub_uploads/vehicles";
        }
        
        // Generate unique filename with timestamp and random string for better organization
        const timestamp = Date.now();
        const randomStr = Math.round(Math.random() * 1e9).toString(36);
        const originalName = file.originalname || "image";
        const ext = path.extname(originalName).toLowerCase() || ".jpg";
        const filename = `profile_${timestamp}_${randomStr}${ext}`;
        
        return {
          folder: folder,
          public_id: filename.replace(ext, ""), // Remove extension as Cloudinary adds it
          allowed_formats: ["jpg", "png", "jpeg", "webp"],
          resource_type: "image",
          overwrite: false, // Don't overwrite existing files
          use_filename: false, // Use our custom public_id
        };
      },
    });
  } else {
    console.warn(
      "[upload] Cloudinary not properly configured, falling back to local disk storage."
    );
  }
} catch (err) {
  console.error(
    "[upload] Failed to initialize Cloudinary storage, falling back to local disk storage.",
    err.message
  );
}

// Fallback: local disk storage in ./uploads if Cloudinary is unavailable
if (!storage) {
  storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, "uploads/");
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      cb(
        null,
        (file.fieldname || "image") +
          "-" +
          uniqueSuffix +
          path.extname(file.originalname || "")
      );
    },
  });
}

// Re‑create the same safeguards you had with disk storage
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    // Validate file type
    if (!file.mimetype || !file.mimetype.startsWith("image/")) {
      return cb(new Error("Only image files are allowed! Supported formats: JPG, PNG, JPEG, WEBP"), false);
    }
    
    // Validate file extension
    const ext = path.extname(file.originalname || "").toLowerCase();
    const allowedExts = [".jpg", ".jpeg", ".png", ".webp"];
    if (!allowedExts.includes(ext)) {
      return cb(new Error(`Invalid file extension. Allowed: ${allowedExts.join(", ")}`), false);
    }
    
    cb(null, true);
  },
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB per file - reasonable for profile images
    files: 5, // Max 5 files in array upload
  },
});

module.exports = upload;
