import React from 'react';

interface AppIconProps {
  className?: string;
  size?: number;
}

export const AppIcon: React.FC<AppIconProps> = ({ className = '', size = 24 }) => {
  // Generate unique ID for gradients to avoid conflicts
  const gradientId = `iconGradient-${size}`;
  
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#8b5cf6" />
        </linearGradient>
      </defs>
      
      {/* V shape / Down arrow with gradient - more stylized */}
      <path
        d="M12 3L5 12L12 21L19 12L12 3Z"
        fill={`url(#${gradientId})`}
        stroke={`url(#${gradientId})`}
        strokeWidth="1.2"
      />
      
      {/* Yellow lightning bolt inside - centered and better positioned */}
      <path
        d="M12 7L9.5 12.5H13.5L11.5 18L14.5 12.5H10.5L12 7Z"
        fill="#fbbf24"
        stroke="#f59e0b"
        strokeWidth="0.3"
      />
    </svg>
  );
};

