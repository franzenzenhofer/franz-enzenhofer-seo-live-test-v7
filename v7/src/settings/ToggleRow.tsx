export const ToggleRow = ({
  label, description, checked, onChange
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) => (
  <div className="setting-row">
    <div className="setting-label">
      <h3>{label}</h3>
      <p>{description}</p>
    </div>
    <div className="setting-control">
      <label className="toggle-switch">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
        />
      </label>
    </div>
  </div>
)