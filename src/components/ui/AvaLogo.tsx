import React from 'react';

interface AvaLogoProps {
  className?: string;
  size?: number;
}

export default function AvaLogo({ className = '', size = 24 }: AvaLogoProps) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="ava-tl" x1="15" y1="15" x2="45" y2="45" gradientUnits="userSpaceOnUse">
          <stop stopColor="#9B72FF">
            <animate attributeName="stop-color" values="#9B72FF;#4A90E2;#9B72FF" dur="4s" repeatCount="indefinite" />
          </stop>
          <stop offset="1" stopColor="#E2A9FF">
            <animate attributeName="stop-color" values="#E2A9FF;#7AE1FF;#E2A9FF" dur="4s" repeatCount="indefinite" />
          </stop>
        </linearGradient>
        <linearGradient id="ava-tr" x1="85" y1="15" x2="55" y2="45" gradientUnits="userSpaceOnUse">
          <stop stopColor="#4A90E2">
            <animate attributeName="stop-color" values="#4A90E2;#FF6B9E;#4A90E2" dur="4s" repeatCount="indefinite" />
          </stop>
          <stop offset="1" stopColor="#7AE1FF">
            <animate attributeName="stop-color" values="#7AE1FF;#B366FF;#7AE1FF" dur="4s" repeatCount="indefinite" />
          </stop>
        </linearGradient>
        <linearGradient id="ava-bl" x1="15" y1="85" x2="45" y2="55" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FF6B9E">
            <animate attributeName="stop-color" values="#FF6B9E;#FFA07A;#FF6B9E" dur="4s" repeatCount="indefinite" />
          </stop>
          <stop offset="1" stopColor="#B366FF">
            <animate attributeName="stop-color" values="#B366FF;#FFD3B6;#B366FF" dur="4s" repeatCount="indefinite" />
          </stop>
        </linearGradient>
        <linearGradient id="ava-br" x1="85" y1="85" x2="55" y2="55" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFA07A">
            <animate attributeName="stop-color" values="#FFA07A;#9B72FF;#FFA07A" dur="4s" repeatCount="indefinite" />
          </stop>
          <stop offset="1" stopColor="#FFD3B6">
            <animate attributeName="stop-color" values="#FFD3B6;#E2A9FF;#FFD3B6" dur="4s" repeatCount="indefinite" />
          </stop>
        </linearGradient>
      </defs>

      {/* Top Left Petal */}
      <path d="M47 47C35 44 15 25 15 25C15 25 35 15 48 28C53 33 47 47 47 47Z" fill="url(#ava-tl)" />
      
      {/* Top Right Petal */}
      <path d="M53 47C65 44 85 25 85 25C85 25 65 15 52 28C47 33 53 47 53 47Z" fill="url(#ava-tr)" />
      
      {/* Bottom Left Petal */}
      <path d="M47 53C35 56 15 75 15 75C15 75 35 85 48 72C53 67 47 53 47 53Z" fill="url(#ava-bl)" />
      
      {/* Bottom Right Petal */}
      <path d="M53 53C65 56 85 75 85 75C85 75 65 85 52 72C47 67 53 53 53 53Z" fill="url(#ava-br)" />

      {/* Center Star */}
      <path d="M50 42L51.5 48.5L58 50L51.5 51.5L50 58L48.5 51.5L42 50L48.5 48.5L50 42Z" fill="currentColor" />
    </svg>
  );
}
