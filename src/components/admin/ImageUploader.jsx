import { useState } from 'react'

export default function ImageUploader({ onImageUpload, currentImage }) {
    const [preview, setPreview] = useState(currentImage || null)
    const [isDragging, setIsDragging] = useState(false)

    const handleFileChange = (e) => {
        
        const file = e.target.files?.[0]
        if (file) {
            processFile(file)
        }
    }

    const processFile = (file) => {
        if (!file.type.startsWith('image/')) {
            alert('Please upload an image file')
            return
        }

        const reader = new FileReader()
        reader.onloadend = () => {
            const base64String = reader.result
            setPreview(base64String)
            onImageUpload(base64String)
        }
        reader.readAsDataURL(file)
    }

    const handleDragOver = (e) => {
        e.preventDefault()
        setIsDragging(true)
    }

    const handleDragLeave = () => {
        setIsDragging(false)
    }

    const handleDrop = (e) => {
        e.preventDefault()
        setIsDragging(false)
        const file = e.dataTransfer.files?.[0]
        if (file) {
            processFile(file)
        }
    }

    const handleRemove = () => {
        setPreview(null)
        onImageUpload(null)
    }

    return (
        <div className="image-uploader">
            {!preview ? (
                <div
                    className={`upload-zone ${isDragging ? 'dragging' : ''}`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                >
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        id="image-upload"
                        style={{ display: 'none' }}
                    />
                    <label htmlFor="image-upload" className="upload-label">
                        <div className="upload-icon">📁</div>
                        <p>Drag & drop an image here or click to browse</p>
                        <span className="upload-hint">Supports: JPG, PNG, GIF</span>
                    </label>
                </div>
            ) : (
                <div className="image-preview">
                    <img src={preview} alt="Preview" />
                    <button onClick={handleRemove} className="remove-btn">
                        ✕ Remove
                    </button>
                </div>
            )}
        </div>
    )
}
