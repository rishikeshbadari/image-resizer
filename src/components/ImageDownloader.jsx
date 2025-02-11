import "./../styles/ImageDownloader.css";

function ImageDownloader({ resizedImage }) {
  return (
    <div className="downloader-container">
      <h3>Processed Image:</h3>
      <img src={resizedImage} alt="Processed" className="image-preview" />
      <a href={resizedImage} download="resized-image.jpg">
        <button>Download Image</button>
      </a>
    </div>
  );
}

export default ImageDownloader;
