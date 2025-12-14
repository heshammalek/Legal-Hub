import React from 'react';
import './LoadingSpinner.css';

// تعريف واجهة الخصائص (Props)
interface LoadingSpinnerProps {
  size?: number;
  color?: string;
  text?: string;
  fullScreen?: boolean;
  withBackground?: boolean;
  className?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 50,
  color = '#3498db',
  text = 'جاري التحميل...',
  fullScreen = false,
  withBackground = false,
  className = ''
}) => {
  // أنماط مدمجة (inline styles)
  const spinnerStyle: React.CSSProperties = {
    width: `${size}px`,
    height: `${size}px`,
    border: `4px solid #f3f3f3`,
    borderTop: `4px solid ${color}`,
    borderRadius: '50%',
    animation: 'spin 1s linear infinite'
  };

  const containerStyle: React.CSSProperties = {
    height: fullScreen ? '100vh' : '200px',
    width: fullScreen ? '100vw' : '100%',
    position: fullScreen ? 'fixed' : 'relative',
    background: withBackground ? 'rgba(255, 255, 255, 0.8)' : 'transparent'
  };

  const textStyle: React.CSSProperties = {
    color: color,
    marginTop: '15px',
    fontSize: '16px',
    fontWeight: 500
  };

  return (
    <div 
      className={`spinner-container ${className}`} 
      style={containerStyle}
      role="status"
      aria-live="polite"
      aria-label="جاري التحميل"
    >
      <div className="spinner" style={spinnerStyle}></div>
      {text && <p className="loading-text" style={textStyle}>{text}</p>}
    </div>
  );
};

export default LoadingSpinner;