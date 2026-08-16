import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { InteractionPrompt } from './InteractionPrompt'

describe('InteractionPrompt', () => {
  it('没有交互目标时不渲染提示', () => {
    expect(renderToStaticMarkup(<InteractionPrompt action={null} />)).toBe('')
  })

  it('显示 F 键和当前动作', () => {
    const html = renderToStaticMarkup(<InteractionPrompt action="开门" />)
    expect(html).toContain('F')
    expect(html).toContain('开门')
  })
})
