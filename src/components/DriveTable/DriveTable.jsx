import React from "react";

/**
 * Google Drive style table container and row components.
 */
export function DriveTable({ columns = [], children, emptyMessage = "No items to display." }) {
  return (
    <div className="w-full bg-white rounded-2xl border border-neutral-200/90 shadow-2xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[640px]">
          <thead>
            <tr className="border-b border-neutral-200/90 text-[11px] font-bold text-neutral-500 uppercase tracking-wider bg-neutral-50/60 select-none">
              {columns.map((col, idx) => (
                <th
                  key={idx}
                  className={`py-3 px-4 ${col.className || ""}`}
                  style={col.width ? { width: col.width } : undefined}
                >
                  <div className={`flex items-center gap-1.5 ${col.align === "right" ? "justify-end" : col.align === "center" ? "justify-center" : "justify-start"}`}>
                    <span>{col.label}</span>
                    {col.icon && <span className="opacity-70">{col.icon}</span>}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100 text-sm">
            {children}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function DriveRow({
  icon,
  name,
  subtitle,
  badge,
  owner = "me",
  dateModified,
  actions,
  onClick,
  isDraggable = false,
  isDragging = false,
  isDragOver = false,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onDragEnd,
  orderBadge,
  dragHandle,
  className = "",
  columnsCustom,
}) {
  const rowClass = isDragOver
    ? "bg-neutral-100 border-y-2 border-black"
    : isDragging
    ? "opacity-40 bg-neutral-50"
    : "hover:bg-neutral-50/80 transition-colors";

  return (
    <tr
      draggable={isDraggable}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      onClick={onClick}
      className={`group cursor-pointer select-none ${rowClass} ${className}`}
    >
      {/* Name / Title column */}
      <td className="py-3 px-4">
        <div className="flex items-center gap-3 min-w-0">
          {dragHandle && <div className="shrink-0">{dragHandle}</div>}
          {orderBadge && <div className="shrink-0">{orderBadge}</div>}
          {icon && <div className="shrink-0 flex items-center justify-center">{icon}</div>}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-neutral-900 group-hover:text-black truncate text-sm">
                {name}
              </span>
              {badge && (
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-neutral-100 border border-neutral-200 text-neutral-700 shrink-0">
                  {badge}
                </span>
              )}
            </div>
            {subtitle && (
              <p className="text-xs text-neutral-500 truncate max-w-md mt-0.5">
                {subtitle}
              </p>
            )}
          </div>
        </div>
      </td>

      {/* Optional custom middle columns or default Drive-like columns */}
      {columnsCustom ? (
        columnsCustom
      ) : (
        <>
          {/* Owner column */}
          <td className="py-3 px-4 text-xs text-neutral-600 whitespace-nowrap">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-black text-white flex items-center justify-center text-[10px] font-bold shadow-2xs shrink-0">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                </svg>
              </div>
              <span className="font-medium text-neutral-700">{owner}</span>
            </div>
          </td>

          {/* Date modified / Details column */}
          <td className="py-3 px-4 text-xs text-neutral-500 whitespace-nowrap">
            {dateModified || "—"}
          </td>
        </>
      )}

      {/* Actions column */}
      {actions && (
        <td
          className="py-3 px-4 text-right whitespace-nowrap"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-end gap-1.5 opacity-90 group-hover:opacity-100">
            {actions}
          </div>
        </td>
      )}
    </tr>
  );
}

