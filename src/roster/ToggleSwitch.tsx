export type ToggleSwitchProps = {
  id: string
  checked: boolean
  onChange: (checked: boolean) => void
  label: string
  testId?: string
}

export default function ToggleSwitch({ id, checked, onChange, label, testId }: ToggleSwitchProps) {
  return (
    <label className="toggle-switch" htmlFor={id}>
      <span className="toggle-switch-label">{label}</span>
      <input
        id={id}
        type="checkbox"
        className="toggle-switch-input"
        role="switch"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        data-testid={testId}
      />
      <span className="toggle-switch-track" aria-hidden />
    </label>
  )
}
