import React from 'react';

export const FormField = ({ 
  label, 
  error, 
  required, 
  children 
}) => {
  return (
    <div className="mb-4">
      <label className="block text-sm font-semibold mb-2" style={{ color: "#b91c1c" }}>
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {children}
      {error && (
        <p className="mt-1 text-sm text-red-600 flex items-center">
          <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
};

export const Input = ({ error, ...props }) => {
  return (
    <input
      {...props}
      className={`
        w-full px-4 py-3 rounded-xl border-2 transition-all outline-none
        focus:border-rose-500 focus:ring-2 focus:ring-rose-200
        ${error ? 'border-red-500 bg-red-50' : 'border-rose-300 bg-rose-50'}
        text-rose-900 placeholder-rose-400
        ${props.className || ''}
      `}
      style={{
        background: "#fff5f5",
        borderColor: error ? "#ef4444" : "#fca5a5",
        color: "#b91c1c"
      }}
      onFocus={(e) => {
        if (!error) e.target.style.borderColor = '#ff5757';
      }}
      onBlur={(e) => {
        if (!error) e.target.style.borderColor = '#fca5a5';
      }}
    />
  );
};

export const Select = ({ error, children, ...props }) => {
  return (
    <select
      {...props}
      className={`
        w-full px-4 py-3 rounded-xl border-2 transition-all outline-none
        focus:border-rose-500 focus:ring-2 focus:ring-rose-200
        ${error ? 'border-red-500 bg-red-50' : 'border-rose-300 bg-rose-50'}
        text-rose-900
        ${props.className || ''}
      `}
      style={{
        background: "#fff5f5",
        borderColor: error ? "#ef4444" : "#fca5a5",
        color: "#b91c1c"
      }}
      onFocus={(e) => {
        if (!error) e.target.style.borderColor = '#ff5757';
      }}
      onBlur={(e) => {
        if (!error) e.target.style.borderColor = '#fca5a5';
      }}
    >
      {children}
    </select>
  );
};