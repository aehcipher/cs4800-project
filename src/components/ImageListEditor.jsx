// src/components/ImageListEditor.jsx
export default function ImageListEditor({ images, onChange }) {
  function updateImage(index, value) {
    const next = [...images];
    next[index] = value;
    onChange(next);
  }

  function addImage() {
    onChange([...images, '']);
  }

  function removeImage(index) {
    const next = images.filter((_, i) => i !== index);
    onChange(next.length ? next : ['']);
  }

  function moveImage(index, direction) {
    const target = index + direction;
    if (target < 0 || target >= images.length) return;
    const next = [...images];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }

  return (
    <div className="page-stack compact-gap">
      {images.map((url, index) => (
        <div key={index} className="image-url-row">
          <input
            type="url"
            value={url}
            onChange={(e) => updateImage(index, e.target.value)}
            placeholder="https://..."
          />
          <button type="button" onClick={() => moveImage(index, -1)}>↑</button>
          <button type="button" onClick={() => moveImage(index, 1)}>↓</button>
          <button type="button" onClick={() => removeImage(index)}>Remove</button>
        </div>
      ))}
      <button type="button" className="ghost-button" onClick={addImage}>Add image</button>
      <div className="thumbnail-grid">
        {images.filter(Boolean).map((url, index) => <img key={index} src={url} alt={`Listing preview ${index + 1}`} />)}
      </div>
    </div>
  );
}
