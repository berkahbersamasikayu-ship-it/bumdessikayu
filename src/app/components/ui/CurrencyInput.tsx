'use client';

function formatRibuan(value: string) {
  const angkaSaja = value.replace(/\D/g, '');
  if (!angkaSaja) return '';
  return Number(angkaSaja).toLocaleString('id-ID');
}

function unformatRibuan(value: string) {
  return value.replace(/\D/g, '');
}

export default function CurrencyInput({
  value,
  onChange,
  placeholder,
  className,
}: {
  value: string;
  onChange: (rawValue: string) => void;
  placeholder?: string;
  className?: string;
}) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = unformatRibuan(e.target.value);
    onChange(raw);
  };

  return (
    <input
      type="text"
      inputMode="numeric"
      value={formatRibuan(value)}
      onChange={handleChange}
      placeholder={placeholder}
      className={className}
    />
  );
}