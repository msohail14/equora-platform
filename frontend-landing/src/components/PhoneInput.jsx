import { useState } from 'react';

const COUNTRY_CODES = [
  { code: '+966', country: 'SA', label: 'Saudi Arabia', maxDigits: 9 },
  { code: '+971', country: 'AE', label: 'UAE', maxDigits: 9 },
  { code: '+973', country: 'BH', label: 'Bahrain', maxDigits: 8 },
  { code: '+974', country: 'QA', label: 'Qatar', maxDigits: 8 },
  { code: '+968', country: 'OM', label: 'Oman', maxDigits: 8 },
  { code: '+965', country: 'KW', label: 'Kuwait', maxDigits: 8 },
  { code: '+20', country: 'EG', label: 'Egypt', maxDigits: 10 },
  { code: '+962', country: 'JO', label: 'Jordan', maxDigits: 9 },
  { code: '+44', country: 'GB', label: 'United Kingdom', maxDigits: 10 },
  { code: '+1', country: 'US', label: 'United States', maxDigits: 10 },
  { code: '+91', country: 'IN', label: 'India', maxDigits: 10 },
];

const PhoneInput = ({ value, onChange, disabled = false }) => {
  const [selectedCode, setSelectedCode] = useState(COUNTRY_CODES[0]);
  const [localNumber, setLocalNumber] = useState('');

  const handleCodeChange = (e) => {
    const found = COUNTRY_CODES.find(c => c.code === e.target.value);
    if (found) {
      setSelectedCode(found);
      onChange(found.code + localNumber);
    }
  };

  const handleNumberChange = (e) => {
    const digits = e.target.value.replace(/\D/g, '').slice(0, selectedCode.maxDigits);
    setLocalNumber(digits);
    onChange(selectedCode.code + digits);
  };

  return (
    <div className="flex gap-2">
      <select
        value={selectedCode.code}
        onChange={handleCodeChange}
        disabled={disabled}
        className="w-28 rounded-lg border border-gray-200 px-2 py-3 text-sm bg-white focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
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
        placeholder={`${'0'.repeat(selectedCode.maxDigits)}`}
        value={localNumber}
        onChange={handleNumberChange}
        disabled={disabled}
        maxLength={selectedCode.maxDigits}
        className="flex-1 rounded-lg border border-gray-200 px-4 py-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
      />
    </div>
  );
};

export default PhoneInput;
