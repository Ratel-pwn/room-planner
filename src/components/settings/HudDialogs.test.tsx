import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { Dialog } from '@/components/ui/dialog'
import { FurnitureSettingsContent } from './FurnitureSettingsDialog'
import { OperationHelpContent } from './OperationHelpDialog'

describe('independent HUD dialogs', () => {
  it('renders the existing operation help in its own content', () => {
    const html = renderToStaticMarkup(<Dialog><OperationHelpContent /></Dialog>)

    expect(html).toContain('操作说明')
    expect(html).toContain('WASD')
    expect(html).toContain('沉浸体验')
  })

  it('renders furniture-only settings for the current room', () => {
    const html = renderToStaticMarkup(
      <Dialog>
        <FurnitureSettingsContent itemCount={3} clearItems={() => undefined} onPick={() => undefined} />
      </Dialog>,
    )

    expect(html).toContain('家具设置')
    expect(html).toContain('家具列表')
    expect(html).toContain('工位桌')
    expect(html).toContain('书柜')
    expect(html).toContain('title="工位桌 1.2×0.6 · ¥67（按 1）"')
    expect(html).toContain('title="双人位桌 1.2×1.2（按 9）"')
    expect(html).not.toContain('1.2 × 1.2 × 0.74 m')
    expect(html).toContain('清空家具（3 件）')
    expect(html).not.toContain('8 人办公方案')
    expect(html).not.toContain('预算')
  })
})
