import React, { useState } from "react";
import axiosInstance from "../utils/AxiosInstance";
// import "../../css/ChangeAvatar.css";

interface ChangeAvatarProps {
  avatarUrl: string;
  userId: number;
  onClose: () => void;
  onAvatarUpdated: (newAvatarUrl: string) => void;
}

const ChangeAvatar: React.FC<ChangeAvatarProps> = ({
  avatarUrl,
  userId,
  onClose,
  onAvatarUpdated,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
      setUploadError(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setUploadError("Please select a file first.");
      return;
    }

    const formData = new FormData();
    formData.append("avatar", selectedFile);

    setIsLoading(true);

    try {
      const response = await axiosInstance.patch(
        `/users/${userId}/`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (response.status === 200 && response.data?.avatar_url) {
        onAvatarUpdated(response.data.avatar_url);
        onClose();
      }
    } catch (error) {
      console.error("Error uploading avatar:", error);
      setUploadError("Failed to upload avatar. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemove = async () => {
    setIsLoading(true);

    try {
      const response = await axiosInstance.patch(
        `/users/${userId}/`,
        { avatar: "default_avatar.png" },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response.status === 200 && response.data?.avatar_url) {
        onAvatarUpdated(response.data.avatar_url);
        onClose();
      }
    } catch (error) {
      console.error("Error removing avatar:", error);
      setUploadError("Failed to remove avatar. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="change-avatar-modal">
      <div className="modal-content">
        <h2 className="profile-title">Change Avatar</h2>
        <div className="current-avatar mt-2">
          <img
            src={avatarUrl}
            alt="Current Avatar"
            className="rounded-circle"
            style={{ width: "100px", height: "100px", objectFit: "cover" }}
          />
        </div>
        <div className="form-group mt-5">
          <label htmlFor="avatarUpload">Upload New Avatar</label>
          <input
            type="file"
            id="avatarUpload"
            className="form-control"
            onChange={handleFileChange}
          />
        </div>
        {uploadError && <p className="text-danger mt-2">{uploadError}</p>}
        <div className="modal-actions d-flex justify-content-between mt-5">
          <button
            className="btn btn-secondary"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </button>
          <div>
            <button
              className="btn btn-danger me-2"
              onClick={handleRemove}
              disabled={isLoading}
            >
              Remove Avatar
            </button>
            <button
              className="btn btn-primary"
              onClick={handleUpload}
              disabled={isLoading || !selectedFile}
            >
              {isLoading ? "Uploading..." : "Upload"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChangeAvatar;
