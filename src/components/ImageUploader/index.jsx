import React from 'react';

function ImageUploader({ setImageSrc }) {
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setImageSrc(url);
    }
  };

  return (
    <div className="uploader">
      <input type="file" accept="image/*" onChange={handleFileChange} />
    </div>
  );
}

export default ImageUploader;