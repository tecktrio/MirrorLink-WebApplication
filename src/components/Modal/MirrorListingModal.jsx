import React from "react";
import "./MirrorListingModal.css"; // Add optional styles for the modal

const MirrorListingModal = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null; // Don't render if the modal is not open

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content h-1/2 p-44" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>
          &times;
        </button>
        {children}
      </div>
    </div>
  );
};

export default MirrorListingModal;
