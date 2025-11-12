export const LoadingSpinner = ({ size = 'md', fullScreen = false }) => {
  const sizes = {
    sm: 'h-4 w-4 border-2',
    md: 'h-8 w-8 border-3',
    lg: 'h-12 w-12 border-4',
  };
  
  const spinner = (
    <div className={`${sizes[size]} border-rose-400 border-t-rose-600 rounded-full animate-spin`} />
  );
  
  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-pink-100 bg-opacity-40 flex items-center justify-center z-50">
        <div className="bg-white p-8 rounded-2xl shadow-xl">
          {spinner}
        </div>
      </div>
    );
  }
  
  return spinner;
};

export const LoadingButton = ({ loading, children, ...props }) => {
  return (
    <button 
      {...props} 
      disabled={loading || props.disabled}
      className={`${props.className || ''} disabled:opacity-60 disabled:cursor-not-allowed`}
    >
      {loading ? (
        <span className="flex items-center justify-center">
          <LoadingSpinner size="sm" />
          <span className="ml-2">Loading...</span>
        </span>
      ) : (
        children
      )}
    </button>
  );
};