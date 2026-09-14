import React from "react";

interface LogoSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function LogoSpinner({ size = "md", className = "" }: LogoSpinnerProps) {
  const dimension = size === "sm" ? 32 : size === "lg" ? 64 : 48;

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <svg
        width={dimension}
        height={dimension}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="overflow-visible"
      >
        <defs>
          <linearGradient id="spinner-grad-top" x1="10" y1="20" x2="90" y2="40" gradientUnits="userSpaceOnUse">
            <stop stopColor="#3B82F6" />
            <stop offset="1" stopColor="#4F46E5" />
          </linearGradient>
          <linearGradient id="spinner-grad-mid" x1="25" y1="50" x2="95" y2="70" gradientUnits="userSpaceOnUse">
            <stop stopColor="#06B6D4" />
            <stop offset="1" stopColor="#3B82F6" />
          </linearGradient>
          <linearGradient id="spinner-grad-bot" x1="10" y1="80" x2="80" y2="100" gradientUnits="userSpaceOnUse">
            <stop stopColor="#4F46E5" />
            <stop offset="1" stopColor="#1E1B4B" />
          </linearGradient>
          <style>{`
            @keyframes stack-glide-top {
              0%, 100% { transform: translateX(0px); opacity: 0.9; }
              50% { transform: translateX(5px); opacity: 1; }
            }
            @keyframes stack-glide-mid {
              0%, 100% { transform: scale(1); filter: drop-shadow(0 0 2px rgba(6, 182, 212, 0.4)); }
              50% { transform: scale(1.04); filter: drop-shadow(0 0 8px rgba(6, 182, 212, 0.8)); }
            }
            @keyframes stack-glide-bot {
              0%, 100% { transform: translateX(0px); opacity: 0.9; }
              50% { transform: translateX(-5px); opacity: 1; }
            }
            .animate-stack-top {
              animation: stack-glide-top 1.6s ease-in-out infinite;
              transform-origin: center;
            }
            .animate-stack-mid {
              animation: stack-glide-mid 1.6s ease-in-out infinite;
              transform-origin: center;
            }
            .animate-stack-bot {
              animation: stack-glide-bot 1.6s ease-in-out infinite;
              transform-origin: center;
            }
          `}</style>
        </defs>
        {/* Top Plate */}
        <path
          className="animate-stack-top"
          d="M 18 18 L 88 18 C 91 18 93 20 92 23 L 83 38 C 82 40 80 41 77 41 L 18 41 C 15 41 13 39 13 36 L 13 23 C 13 20 15 18 18 18 Z"
          fill="url(#spinner-grad-top)"
        />
        {/* Middle Portal Plate */}
        <path
          className="animate-stack-mid"
          d="M 32 46 L 86 46 C 89 46 91 48 90 51 L 82 65 C 81 67 79 68 76 68 L 38 68 C 35 68 33 66 34 63 L 38 49 C 39 47 41 46 43 46 Z"
          fill="url(#spinner-grad-mid)"
        />
        {/* Base Plate */}
        <path
          className="animate-stack-bot"
          d="M 18 73 L 72 73 C 75 73 77 75 76 78 L 72 89 C 71 92 69 94 66 94 L 12 94 C 9 94 7 92 8 89 L 14 76 C 15 74 16 73 18 73 Z"
          fill="url(#spinner-grad-bot)"
        />
      </svg>
    </div>
  );
}
