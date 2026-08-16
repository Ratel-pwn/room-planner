interface Props {
  action: string | null
}

export function InteractionPrompt({ action }: Props) {
  if (!action) return null

  return (
    <div className="pointer-events-none absolute left-1/2 top-[62%] z-30 flex -translate-x-1/2 items-center gap-2 rounded-md border-2 border-[#0c0b0a] bg-[#242320]/95 px-3 py-2 text-sm font-bold text-[#f2eee4] shadow-[0_3px_0_rgba(0,0,0,0.5)]">
      <kbd className="flex h-6 min-w-6 items-center justify-center rounded border border-[#e0a92e] bg-[#141311] px-1.5 text-xs text-[#f2c353]">
        F
      </kbd>
      <span>{action}</span>
    </div>
  )
}
