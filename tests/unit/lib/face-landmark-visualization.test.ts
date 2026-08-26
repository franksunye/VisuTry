import {
  FACE_ANALYSIS_HIGHLIGHT_POINT_INDICES,
  createCoverMapper,
  selectFaceLandmarkOverlayConnections,
} from '@/lib/face-landmark-visualization'

describe('face landmark visualization source of truth', () => {
  it('uses detector contours for the lightweight presentation without Store topology', () => {
    const contours = [{ start: 10, end: 338 }, { start: 338, end: 297 }]
    const connections = {
      tesselation: [{ start: 1, end: 2 }],
      contours,
      irises: [{ start: 3, end: 4 }],
    }

    expect(selectFaceLandmarkOverlayConnections(connections, 'lightweight')).toEqual({
      tesselation: [],
      contours,
      irises: [],
    })
    expect(FACE_ANALYSIS_HIGHLIGHT_POINT_INDICES).toEqual([10, 152, 234, 454, 33, 263, 61, 291, 1, 199])
  })

  it('projects normalized points with the same object-cover math as the photo', () => {
    const mapPoint = createCoverMapper(1200, 800, 260, 325)

    expect(mapPoint({ x: 0, y: 0 })).toEqual({ x: -113.75, y: 0 })
    expect(mapPoint({ x: 1, y: 1 })).toEqual({ x: 373.75, y: 325 })
  })
})
