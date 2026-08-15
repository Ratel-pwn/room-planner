/**
 * 全站禁用文本 / 图片复制：
 * - 拦截 copy / cut / selectstart / contextmenu / dragstart
 * - 表单控件（input / textarea / contentEditable）内部不受影响，保证设置项可正常编辑
 */

function isEditableTarget(e: Event): boolean {
  const el = e.target as HTMLElement | null
  if (!el) return false
  return !!el.closest('input, textarea, select, [contenteditable="true"]')
}

export function installNoCopyGuard() {
  const block = (e: Event) => {
    if (isEditableTarget(e)) return
    e.preventDefault()
  }
  document.addEventListener('copy', block)
  document.addEventListener('cut', block)
  document.addEventListener('selectstart', block)
  document.addEventListener('contextmenu', block)
  document.addEventListener('dragstart', block)
}
