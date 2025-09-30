export const ToggleRow = ({
  label, description, checked, onChange
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) => (
  <div className="flex items-center justify-between py-2">
    <div className="flex-1">
      <h3 className="text-sm font-medium text-gray-900">{label}</h3>
      <p className="text-xs text-gray-600">{description}</p>
    </div>
    <div className="ml-4">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="w-4 h-4 text-blue-600 rounded cursor-pointer"
      />
    </div>
  </div>
)