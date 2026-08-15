/** 设置抽屉里通用的深色表单控件 */

export function NumField(props: {
  label: string
  value: number
  step?: number
  min?: number
  max?: number
  onChange: (v: number) => void
}) {
  return (
    <label className="flex items-center justify-between gap-2 text-sm text-[#d8d2c2]">
      <span className="whitespace-nowrap">{props.label}</span>
      <input
        type="number"
        className="hud-input"
        value={props.value}
        step={props.step ?? 0.1}
        min={props.min}
        max={props.max}
        onChange={(e) => {
          const v = parseFloat(e.target.value)
          if (!Number.isNaN(v)) props.onChange(v)
        }}
      />
    </label>
  )
}

export function Section(props: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-black/50 px-4 py-3">
      <div className="hud-label mb-2">{props.title}</div>
      <div className="flex flex-col gap-2">{props.children}</div>
    </div>
  )
}
