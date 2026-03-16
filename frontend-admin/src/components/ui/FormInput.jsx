const FormInput = ({
  label,
  name,
  type = 'text',
  placeholder,
  value,
  onChange,
  autoComplete,
  required = false,
  className = '',
  rightElement = null,
}) => (
  <label className="grid gap-1.5" htmlFor={name}>
    <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">{label}</span>
    <div className="relative">
      <input
        id={name}
        className={`w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 placeholder-gray-400 shadow-sm transition focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500 ${rightElement ? 'pr-16' : ''} ${className}`}
        name={name}
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={onChange}
        autoComplete={autoComplete}
        required={required}
      />
      {rightElement ? <div className="absolute inset-y-0 right-0 flex items-center pr-3">{rightElement}</div> : null}
    </div>
  </label>
);

export default FormInput;
