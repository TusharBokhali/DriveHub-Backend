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
      params: async () => {
        const defaultFolder = "drivehub_uploads";
        return {
          folder: defaultFolder,
          allowed_formats: ["jpg", "png", "jpeg", "webp"],
          resource_type: "image",
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
