import React from "react";
import { useNavigate } from "react-router-dom";
import Cookie from 'js-cookie';
import { Navigate_To_Update_Content } from "../../constants";

export default function Listitem({
  title,
  description,
  goto,
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
}) {
  const navigate = useNavigate();

  const handleCardClick = () => {
    if (goto) navigate(goto);
  };

  const borderAndBgClass = isDragOver
    ? 'border-2 border-black bg-neutral-100 shadow-md scale-[1.01]'
    : (!isActive
        ? 'opacity-60 bg-neutral-50/70 border-dashed border-neutral-300 hover:opacity-85'
        : 'border-neutral-200/90 hover:border-black/30 hover:shadow-2xs');

  return (
    <div
      draggable={isDraggable}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      onClick={handleCardClick}
      className={`group bg-white hover:bg-neutral-50/60 border rounded-2xl p-4 my-2.5 shadow-2xs transition-all duration-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
        goto ? 'cursor-pointer' : ''
      } ${
        isDragging ? 'opacity-40 scale-98 border-dashed border-black bg-neutral-100' : ''
      } ${borderAndBgClass}`}
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {/* Drag Handle and Order Badge */}
        {order !== undefined && (
          <div className="flex items-center gap-2 shrink-0">
            {isDraggable && (
              <div
                className="cursor-grab active:cursor-grabbing p-1 text-neutral-400 hover:text-black hover:bg-neutral-100 rounded-lg transition-colors flex items-center justify-center shrink-0"
                title="Click and drag to reorder playlist playback order"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 6h.01M8 12h.01M8 18h.01M16 6h.01M16 12h.01M16 18h.01" />
                </svg>
              </div>
            )}
            <div
              className={`w-7 h-7 rounded-lg border flex items-center justify-center text-xs font-bold shrink-0 shadow-2xs ${
                !isActive
                  ? 'bg-neutral-100 border-neutral-200 text-neutral-400'
                  : 'bg-neutral-100 border-neutral-300 text-black'
              }`}
              title={`Playlist Play Order: #${order}`}
            >
              #{order}
            </div>
          </div>
        )}

        <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform duration-200 ${
          !isActive
            ? 'bg-neutral-100 border-neutral-200 text-neutral-400'
            : 'bg-neutral-100 border-neutral-200 text-black'
        }`}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className={`text-sm font-bold truncate transition-colors ${
              !isActive ? 'text-neutral-400 line-through decoration-neutral-300' : 'text-black group-hover:text-neutral-700'
            }`}>
              {title}
            </h4>

            {/* Active / Disabled Status Tag */}
            {onToggleActive && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleActive();
                }}
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border transition-all cursor-pointer shadow-2xs shrink-0 ${
                  isActive
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 hover:border-emerald-300'
                    : 'bg-neutral-100 text-neutral-500 border-neutral-300 hover:bg-neutral-200 hover:text-black'
                }`}
                title={isActive ? 'Active on mirror — click to temporarily disable' : 'Temporarily disabled — click to re-enable'}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-neutral-400'}`} />
                <span>{isActive ? 'Active' : 'Disabled'}</span>
              </button>
            )}

            {badge && (
              <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full bg-neutral-100 text-black border border-neutral-200">
                {badge}
              </span>
            )}

            {/* Per-Photo Time to Stay Selector */}
            {onUpdateDuration && (
              <div
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-neutral-100 hover:bg-neutral-200/70 border border-neutral-300 text-neutral-800 text-[10px] shadow-2xs shrink-0 transition-colors"
                onClick={(e) => e.stopPropagation()}
                title="Time to stay on screen"
              >
                <svg className="w-2.5 h-2.5 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-[10px] text-neutral-500 font-medium whitespace-nowrap">Time to stay:</span>
                <select
                  value={duration || 5}
                  onChange={(e) => onUpdateDuration(Number(e.target.value))}
                  className="bg-transparent text-neutral-900 font-bold font-mono outline-none cursor-pointer pr-0.5"
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
            )}
          </div>
          <p className="text-xs text-neutral-500 truncate mt-0.5 max-w-xl">
            {!isActive && <span className="font-semibold text-amber-600 mr-1">[Disabled on Mirror]</span>}
            {description}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
        {/* Step-by-step Move Up / Down Buttons */}
        {(onMoveUp || onMoveDown) && (
          <div className="flex items-center border border-neutral-200 rounded-lg p-0.5 bg-neutral-50 mr-1">
            {onMoveUp && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onMoveUp();
                }}
                disabled={!canMoveUp}
                className="w-6 h-6 rounded flex items-center justify-center text-neutral-500 hover:text-black hover:bg-white disabled:opacity-25 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-colors"
                title="Move up in playlist order"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 15l7-7 7 7" />
                </svg>
              </button>
            )}
            {onMoveDown && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onMoveDown();
                }}
                disabled={!canMoveDown}
                className="w-6 h-6 rounded flex items-center justify-center text-neutral-500 hover:text-black hover:bg-white disabled:opacity-25 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-colors"
                title="Move down in playlist order"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            )}
          </div>
        )}

        {/* Enable / Disable Toggle Switch */}
        {onToggleActive && (
          <button
            type="button"
            role="switch"
            aria-checked={isActive}
            onClick={(e) => {
              e.stopPropagation();
              onToggleActive();
            }}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              isActive ? 'bg-black' : 'bg-neutral-300'
            }`}
            title={isActive ? 'Active on mirror (click to disable)' : 'Disabled on mirror (click to enable)'}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                isActive ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        )}

        {/* Preview View Icon */}
        {onPlay && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              Cookie.set('content_id', onPlay, { expires: 30, path: '/' });
              navigate(Navigate_To_Update_Content);
            }}
            className="w-8 h-8 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-800 hover:text-black border border-neutral-300 transition-colors cursor-pointer flex items-center justify-center shrink-0"
            title="Preview / Edit Media"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </button>
        )}

        {/* Delete / Remove Icon */}
        {onDelete && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="w-8 h-8 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 transition-colors cursor-pointer flex items-center justify-center shrink-0"
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
