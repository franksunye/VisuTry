import { compareFrameMarks, parseFrameMark } from '@/lib/frame-size-compare'

describe('frame markings comparison (no physical-fit inference)', () => {
  it.each([
    ['52-18-145', { lensWidth: 52, bridgeWidth: 18, templeLength: 145 }],
    ['52 □ 18 – 145', { lensWidth: 52, bridgeWidth: 18, templeLength: 145 }],
    ['52 18 145', { lensWidth: 52, bridgeWidth: 18, templeLength: 145 }],
    ['52×18×145', { lensWidth: 52, bridgeWidth: 18, templeLength: 145 }],
  ])('parses %s', (raw, expected) => {
    expect(parseFrameMark(raw)).toEqual(expected)
  })

  it.each(['', '52-18', 'XX-18-145', '0-18-145', '52-99-145', '52-18-999'])(
    'rejects an invalid marking %s', (raw) => expect(parseFrameMark(raw)).toBeNull(),
  )

  it('computes signed differences for each printed component only', () => {
    const current = parseFrameMark('52-18-145')!
    const candidate = parseFrameMark('54-17-140')!
    expect(compareFrameMarks(current, candidate)).toEqual({
      lensWidth: 2,
      bridgeWidth: -1,
      templeLength: -5,
    })
  })
  it('returns zeros for identical printed markings', () => {
    const mark = parseFrameMark('52-18-145')!
    expect(compareFrameMarks(mark, mark)).toEqual({
      lensWidth: 0,
      bridgeWidth: 0,
      templeLength: 0,
    })
  })
})
