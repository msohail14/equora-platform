const variantClasses = {
  primary:
    'bg-amber-500 text-white hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-60',
  secondary:
    'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700',
};

const AppButton = ({
  children,
  type = 'button',
  onClick,
  disabled = false,
  variant = 'primary',
  className = '',
}) => (
  <button
    className={`inline-flex items-center  justify-center rounded-lg px-4 py-2 text-sm font-semibold transition ${variantClasses[variant] || variantClasses.primary} ${className}`}
    type={type}
    onClick={onClick}
    disabled={disabled}
  >
    {children}
  </button>
);

export default AppButton;
