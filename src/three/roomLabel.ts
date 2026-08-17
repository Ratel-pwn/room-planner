import { CanvasTexture, Sprite, SpriteMaterial, SRGBColorSpace } from 'three'

export function createRoomLabel(text: string): Sprite {
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 64
  const context = canvas.getContext('2d')!
  context.fillStyle = 'rgba(20, 19, 17, 0.85)'
  context.beginPath()
  context.roundRect(10, 10, 236, 44, 12)
  context.fill()
  context.strokeStyle = '#e0a92e'
  context.lineWidth = 2.5
  context.stroke()
  context.font = '600 24px system-ui, "PingFang SC", "Microsoft YaHei", sans-serif'
  context.fillStyle = '#f2eee4'
  context.textAlign = 'center'
  context.textBaseline = 'middle'
  context.fillText(text.slice(0, 10), 128, 33)

  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  const label = new Sprite(new SpriteMaterial({ map: texture, transparent: true }))
  label.scale.set(1.7, 0.43, 1)
  label.userData.isLabel = true
  return label
}
