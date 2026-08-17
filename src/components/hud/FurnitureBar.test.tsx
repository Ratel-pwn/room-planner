import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { FurnitureBar } from './FurnitureBar'

describe('furniture bar catalog', () => {
  it('shows both workstation sizes', () => {
    const html = renderToStaticMarkup(
      <FurnitureBar
        placingType={null}
        items={[]}
        onPick={() => undefined}
        onOpenSettings={() => undefined}
      />,
    )

    expect(html).toContain('双人位桌')
    expect(html).toContain('四人位桌')
  })
})
