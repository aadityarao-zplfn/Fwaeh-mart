const LoadingSpinner = ({ size = 'md', message = '' }) => {
  const sizes = {
    sm: 'h-4 w-4 border-2',
    md: 'h-8 w-8 border-4',
    lg: 'h-12 w-12 border-4',
    xl: 'h-16 w-16 border-[6px]',
  };

  return (
    <div className="flex flex-col items-center justify-center p-8">
      <div 
        className={`animate-spin rounded-full ${sizes[size]}`}
        style={{
          borderColor: '#fca5a5',
          borderTopColor: '#ff5757',
        }}
      ></div>
      {message && (
        <p 
          className="mt-4 text-sm font-medium animate-pulse"
          style={{ color: '#b91c1c' }}
        >
          {message}
        </p>
      )}
    </div>
  );
};

export default LoadingSpinner;