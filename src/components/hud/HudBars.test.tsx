import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { makeSpace } from '@/state/plannerStorage'
import { FurnitureBar } from './FurnitureBar'
import { TopBar } from './TopBar'

describe('HUD bar controls', () => {
  it('places an operation-help button beside the view switcher', () => {
    const space = makeSpace('Space 1')
    const html = renderToStaticMarkup(
      <TopBar
        space={space}
        spaces={[space]}
        viewKind="plan"
        placedTotal={0}
        onSwitchSpace={() => undefined}
        onAddSpace={() => undefined}
        onViewChange={() => undefined}
        onOpenHelp={() => undefined}
        onOpenSettings={() => undefined}
      />,
    )

    expect(html).toContain('aria-label="操作说明"')
  })

  it('renders furniture settings and collapse controls without the build label', () => {
    const html = renderToStaticMarkup(
      <FurnitureBar
        placingType={null}
        items={[]}
        onPick={() => undefined}
        onOpenSettings={() => undefined}
      />,
    )

    expect(html).toContain('aria-label="打开家具设置"')
    expect(html).toContain('aria-label="收起家具栏"')
    expect(html).toContain('data-furniture-collapse="true"')
    expect(html).toContain('left-1/2')
    expect(html).toContain('rounded-b-none')
    expect(html).toContain('border-b-0')
    expect(html).toContain('h-5')
    expect(html).toContain('w-14')
    expect(html).not.toContain('建造')
  })
})
