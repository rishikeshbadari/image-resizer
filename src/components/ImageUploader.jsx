import { useState } from "react";
import "./../styles/ImageUploader.css";

function ImageUploader({ setUploadedImage }) {
  const [preview, setPreview] = useState(null);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setPreview(imageUrl);
      setUploadedImage(file);
    }
  };

  return (
    <div className="uploader-container">
      <h2>Upload an Image</h2>
      <input type="file" accept="image/*" onChange={handleFileChange} />
      {preview && <img src={preview} alt="Preview" className="image-preview" />}
    </div>
  );
}

export default ImageUploader;
