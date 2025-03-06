const uploadFile = async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
  
      return res.status(200).json({
        message: "File uploaded successfully",
        fileUrl: req.file.location,
        mimetype: req.file.mimetype,
        size:  req.file.size,
      });
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  };
  
module.exports = { uploadFile };
  