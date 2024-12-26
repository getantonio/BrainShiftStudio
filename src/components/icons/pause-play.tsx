export function PauseIcon({ className = "h-6 w-6" }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      className={className}
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor"
    >
      <path 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        strokeWidth={2} 
        d="M6 4h4v16H6zM14 4h4v16h-4z"
      />
    </svg>
  );
}

export function PlayIcon({ className = "h-6 w-6" }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      className={className}
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor"
    >
      <path 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        strokeWidth={2} 
        d="M5 3l14 9-14 9V3z"
      />
    </svg>
  );
} 