import { useState, useCallback } from 'react';

const COUNTRY_CODES = [
  { code: '+966', country: 'SA', label: 'Saudi Arabia', maxDigits: 9 },
  { code: '+971', country: 'AE', label: 'UAE', maxDigits: 9 },
  { code: '+973', country: 'BH', label: 'Bahrain', maxDigits: 8 },
  { code: '+974', country: 'QA', label: 'Qatar', maxDigits: 8 },
  { code: '+968', country: 'OM', label: 'Oman', maxDigits: 8 },
  { code: '+965', country: 'KW', label: 'Kuwait', maxDigits: 8 },
  { code: '+20',  country: 'EG', label: 'Egypt', maxDigits: 10 },
  { code: '+962', country: 'JO', label: 'Jordan', maxDigits: 9 },
  { code: '+44',  country: 'GB', label: 'United Kingdom', maxDigits: 10 },
  { code: '+1',   country: 'US', label: 'United States', maxDigits: 10 },
  { code: '+91',  country: 'IN', label: 'India', maxDigits: 10 },
];

const PhoneInput = ({ value, onChange, label, name, disabled = false }) => {
  const [codeIdx, setCodeIdx] = useState(() => {
    if (!value) return 0;
    const str = String(value).replace(/\s/g, '');
    const idx = COUNTRY_CODES.findIndex(c => str.startsWith(c.code));
    return idx >= 0 ? idx : 0;
  });

  const selectedCode = COUNTRY_CODES[codeIdx];

  const getLocalNumber = useCallback(() => {
    if (!value) return '';
    const str = String(value).replace(/\s/g, '');
    if (str.startsWith(selectedCode.code)) {
      return str.slice(selectedCode.code.length);
    }
    return str.replace(/^\+?\d{1,3}/, '');
  }, [value, selectedCode]);

  const handleCodeChange = (e) => {
    const idx = COUNTRY_CODES.findIndex(c => c.code === e.target.value);
    if (idx >= 0) {
      setCodeIdx(idx);
      const local = getLocalNumber().slice(0, COUNTRY_CODES[idx].maxDigits);
      onChange(COUNTRY_CODES[idx].code + local);
    }
  };

  const handleNumberChange = (e) => {
    const digits = e.target.value.replace(/\D/g, '').slice(0, selectedCode.maxDigits);
    onChange(selectedCode.code + digits);
  };

  const inputCls = 'w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm transition focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100';

  return (
    <div>
      {label && <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>}
      <div className="flex gap-2">
        <select
          value={selectedCode.code}
          onChange={handleCodeChange}
          disabled={disabled}
          name={name ? `${name}_code` : undefined}
          className={`w-[110px] flex-shrink-0 ${inputCls} cursor-pointer`}
        >
          {COUNTRY_CODES.map(c => (
            <option key={c.code} value={c.code}>
              {c.country} {c.code}
            </option>
          ))}
        </select>
        <input
          type="tel"
          inputMode="numeric"
          placeholder={'0'.repeat(selectedCode.maxDigits)}
          value={getLocalNumber()}
          onChange={handleNumberChange}
          disabled={disabled}
          maxLength={selectedCode.maxDigits}
          name={name}
          className={`flex-1 ${inputCls}`}
        />
      </div>
    </div>
  );
};

export default PhoneInput;
