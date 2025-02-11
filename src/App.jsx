import { useState } from "react";
import ImageUploader from "./components/ImageUploader";
import ImageCropper from "./components/ImageCropper";
import ImageDownloader from "./components/ImageDownloader";
import "./styles/App.css";

function App() {
  const [uploadedImage, setUploadedImage] = useState(null);
  const [croppedImage, setCroppedImage] = useState(null);

  const handleCropComplete = (croppedImg) => {
    setCroppedImage(croppedImg);
  };

  return (
    <div className="app-container">
      <h1>Seam Carving Image Resizer</h1>
      {/* Show uploader if no image uploaded */}
      {!uploadedImage && (
        <ImageUploader setUploadedImage={setUploadedImage} />
      )}

      {/* Show cropper once an image is uploaded */}
      {uploadedImage && !croppedImage && (
        <ImageCropper
          imageSrc={URL.createObjectURL(uploadedImage)}
          onCropComplete={handleCropComplete}
        />
      )}

      {/* Show downloader once the crop is done */}
      {croppedImage && <ImageDownloader croppedImage={croppedImage} />}
    </div>
  );
}

export default App;
