type IconBtnProps = {
  onClick?: () => void;
  disabled?: boolean;
  title?: string;
  children: React.ReactNode;
  classes?: String;
};

export function IconButton({
  onClick,
  disabled,
  title,
  children,
  classes,
}: IconBtnProps) {
  return (
    <div className="relative group">
      <button
        onClick={onClick}
        disabled={disabled}
        aria-label={title}
        className={`${classes}
          flex items-center justify-center
          rounded-xl py-1 px-4
          border border-gray-200
          bg-white
          text-gray-700
          hover:bg-blue-50 hover:text-blue-600
          active:scale-95
          disabled:opacity-40 disabled:cursor-not-allowed
          transition`}
      >
        {children} <span className="pl-1 text-sm">{title}</span>
      </button>

      {/* Tooltip */}
      <div
        className="
          pointer-events-none
          absolute -top-6 left-1/2 -translate-x-1/2
          whitespace-nowrap
          rounded-md
          bg-gray-900
          px-2 py-1
          text-xs text-white
          opacity-0
          group-hover:opacity-100
          transition-opacity
        "
      >
        {title}
      </div>
    </div>
  );
}
