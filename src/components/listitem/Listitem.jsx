import React from "react";
import { useNavigate } from "react-router-dom";

export default function Listitem({
  title,
  description,
  imageUrl,
  contentFormat,
  goto,
  onEdit,
  onDelete,
  onPlay,
  badge,
  duration,
  onUpdateDuration,
  deleteLabel = "Delete",
  order,
  isDraggable = false,
  isDragging = false,
  isDragOver = false,
  isActive = true,
  onToggleActive,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onDragEnd,
  onMoveUp,
  onMoveDown,
  canMoveUp = false,
  canMoveDown = false,
  owner = "me",
  dateModified = "—",
  displayMode = "tableRow", // "tableRow" (Google Drive row) or "card"
}) {
  const navigate = useNavigate();

  const handleCardClick = () => {
    if (goto) navigate(goto);
  };

  const isVideo = ['mp4', 'mov', 'webm', 'm4v', 'avi', 'mkv'].includes((contentFormat || '').toLowerCase()) || (typeof imageUrl === 'string' && !!imageUrl.match(/\.(mp4|mov|webm|m4v|avi|mkv)(\?|$)/i));

  // Render Google Drive styled folder / file icon
  const renderDriveIcon = () => {
    if (imageUrl) {
      return (
        <div className="w-9 h-9 rounded-lg overflow-hidden border border-neutral-200 bg-neutral-100 shrink-0 relative flex items-center justify-center">
          {isVideo ? (
            <div className="w-full h-full bg-black flex items-center justify-center text-white">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          ) : (
            <img
              src={imageUrl}
              alt={title || "Preview"}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          )}
        </div>
      );
    }

    // Default Drive style icons based on badge or content type
    const badgeLower = (badge || '').toLowerCase();
    if (badgeLower === 'location' || badgeLower === 'site') {
      // Folder icon
      return (
        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-600 shrink-0">
          <svg className="w-6 h-6 fill-neutral-600" viewBox="0 0 24 24">
            <path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z" />
          </svg>
        </div>
      );
    }

    if (badgeLower.includes('x') || badgeLower.includes('mirror') || badgeLower === 'screen') {
      // Display Screen icon
      return (
        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-700 shrink-0">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <rect x="2" y="3" width="20" height="14" rx="2" strokeWidth="2" />
            <line x1="8" y1="21" x2="16" y2="21" strokeWidth="2" strokeLinecap="round" />
            <line x1="12" y1="17" x2="12" y2="21" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>
      );
    }

    // Generic file icon
    return (
      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-500 shrink-0">
        <svg className="w-6 h-6 fill-neutral-500" viewBox="0 0 24 24">
          <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" />
        </svg>
      </div>
    );
  };

  // Google Drive table row mode (default)
  return (
    <div
      draggable={isDraggable}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      onClick={handleCardClick}
      className={`group w-full flex items-center justify-between py-2.5 px-3 sm:px-4 border-b border-neutral-100 hover:bg-neutral-50/90 transition-colors select-none ${
        goto ? 'cursor-pointer' : ''
      } ${isDragging ? 'opacity-30 bg-neutral-100' : ''} ${
        isDragOver ? 'bg-neutral-100 border-b-2 border-black' : ''
      }`}
    >
      {/* Column 1: Name, Drag handle, Order, Icon & Subtitle */}
      <div className="flex items-center gap-3 min-w-0 flex-1 pr-4">
        {/* Drag handle */}
        {isDraggable && (
          <div
            className="cursor-grab active:cursor-grabbing p-1 text-neutral-400 hover:text-black hover:bg-neutral-200/60 rounded transition-colors shrink-0"
            title="Drag to reorder"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 6h.01M8 12h.01M8 18h.01M16 6h.01M16 12h.01M16 18h.01" />
            </svg>
          </div>
        )}

        {/* Order badge */}
        {order !== undefined && (
          <div
            className="w-6 h-6 rounded-md bg-neutral-100 text-neutral-800 flex items-center justify-center text-[11px] font-bold shrink-0 border border-neutral-200"
            title={`Position #${order}`}
          >
            {order}
          </div>
        )}

        {/* Drive Icon */}
        {renderDriveIcon()}

        {/* Name and subtitle */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-neutral-900 group-hover:text-black text-sm truncate">
              {title}
            </span>
            {badge && (
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-neutral-100 border border-neutral-200 text-neutral-700 shrink-0">
                {badge}
              </span>
            )}
          </div>
          {description && (
            <p className="text-xs text-neutral-500 truncate max-w-lg mt-0.5">
              {description}
            </p>
          )}
        </div>
      </div>

      {/* Column 2: Owner (Google Drive style circle + 'me') */}
      <div className="hidden md:flex items-center gap-2 w-28 shrink-0 text-xs text-neutral-600">
        <div className="w-5 h-5 rounded-full bg-black text-white flex items-center justify-center text-[9px] font-bold shrink-0 shadow-2xs">
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
          </svg>
        </div>
        <span className="truncate">{owner}</span>
      </div>

      {/* Column 3: Duration / Date Modified (Drive Style) */}
      <div className="hidden sm:flex items-center justify-start w-32 shrink-0 text-xs text-neutral-500">
        {onUpdateDuration ? (
          <div
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-neutral-100 border border-neutral-200 text-neutral-800 text-[11px]"
            onClick={(e) => e.stopPropagation()}
            title="Time to stay on screen"
          >
            <span className="text-neutral-400 font-medium">Time:</span>
            <select
              value={duration || 5}
              onChange={(e) => onUpdateDuration(Number(e.target.value))}
              className="bg-transparent font-bold text-neutral-900 outline-none cursor-pointer pr-0.5"
            >
              <option value={2}>2s</option>
              <option value={3}>3s</option>
              <option value={4}>4s</option>
              <option value={5}>5s</option>
              <option value={7}>7s</option>
              <option value={8}>8s</option>
              <option value={10}>10s</option>
              <option value={15}>15s</option>
              <option value={20}>20s</option>
              <option value={30}>30s</option>
              <option value={45}>45s</option>
              <option value={60}>60s</option>
            </select>
          </div>
        ) : (
          <span className="truncate">{dateModified}</span>
        )}
      </div>

      {/* Column 4: Actions (Reorder buttons, toggle switch, edit, delete) */}
      <div
        className="flex items-center gap-1.5 shrink-0 pl-2"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Step-by-step Move Up / Down Buttons */}
        {(onMoveUp || onMoveDown) && (
          <div className="flex items-center border border-neutral-200 rounded-lg p-0.5 bg-white shadow-2xs mr-1">
            {onMoveUp && (
              <button
                type="button"
                onClick={onMoveUp}
                disabled={!canMoveUp}
                className="w-6 h-6 rounded flex items-center justify-center text-neutral-700 hover:bg-neutral-100 disabled:opacity-20 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-colors"
                title="Move up"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 15l7-7 7 7" />
                </svg>
              </button>
            )}
            {onMoveDown && (
              <button
                type="button"
                onClick={onMoveDown}
                disabled={!canMoveDown}
                className="w-6 h-6 rounded flex items-center justify-center text-neutral-700 hover:bg-neutral-100 disabled:opacity-20 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-colors"
                title="Move down"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            )}
          </div>
        )}

        {/* Active Toggle Switch */}
        {onToggleActive && (
          <button
            type="button"
            role="switch"
            aria-checked={isActive}
            onClick={onToggleActive}
            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none mr-1 ${
              isActive ? 'bg-black' : 'bg-neutral-200'
            }`}
            title={isActive ? 'Active (click to disable)' : 'Disabled (click to enable)'}
          >
            <span
              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition duration-200 ease-in-out ${
                isActive ? 'translate-x-4' : 'translate-x-0'
              }`}
            />
          </button>
        )}

        {/* Edit Button */}
        {onEdit && (
          <button
            type="button"
            onClick={onEdit}
            className="w-7 h-7 rounded-lg text-neutral-500 hover:text-black hover:bg-neutral-100 transition-colors flex items-center justify-center"
            title="Edit"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
        )}

        {/* Delete Button */}
        {onDelete && (
          <button
            type="button"
            onClick={onDelete}
            className="w-7 h-7 rounded-lg text-neutral-400 hover:text-red-600 hover:bg-red-50 transition-colors flex items-center justify-center"
            title={deleteLabel}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

