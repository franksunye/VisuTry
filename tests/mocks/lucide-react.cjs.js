const React = require('react')

function createIcon(name) {
  return function Icon(props) {
    return React.createElement('div', {
      ...props,
      'data-testid': `${name}-icon`,
    })
  }
}

module.exports = {
  Upload: createIcon('upload'),
  X: createIcon('x'),
  Menu: createIcon('menu'),
  Image: createIcon('image'),
  Loader2: createIcon('loader2'),
  User: createIcon('user'),
  Glasses: createIcon('glasses'),
  Shirt: createIcon('shirt'),
  Footprints: createIcon('footprints'),
  Watch: createIcon('watch'),
  LogOut: createIcon('logout'),
  TestTube: createIcon('testtube'),
  Shield: createIcon('shield'),
  ShieldCheck: createIcon('shield-check'),
  CheckCircle: createIcon('check-circle'),
  CheckCircle2: createIcon('check-circle-2'),
  Check: createIcon('check'),
  Copy: createIcon('copy'),
  Download: createIcon('download'),
  Clock: createIcon('clock'),
  ArrowRight: createIcon('arrow-right'),
  ChevronLeft: createIcon('chevron-left'),
  ChevronRight: createIcon('chevron-right'),
  Grid2X2: createIcon('grid-2x2'),
  ScanFace: createIcon('scan-face'),
  Sparkles: createIcon('sparkles'),
  Camera: createIcon('camera'),
  HelpCircle: createIcon('help-circle'),
  RotateCcw: createIcon('rotate-ccw'),
  RefreshCw: createIcon('refresh-cw'),
  Share2: createIcon('share-2'),
  AlertTriangle: createIcon('alert-triangle'),
  AlertCircle: createIcon('alert-circle'),
  ExternalLink: createIcon('external-link'),
  Info: createIcon('info'),
  Lock: createIcon('lock'),
  Circle: createIcon('circle'),
  Diamond: createIcon('diamond'),
  Heart: createIcon('heart'),
  Hexagon: createIcon('hexagon'),
  RectangleHorizontal: createIcon('rectangle-horizontal'),
  Square: createIcon('square'),
  Triangle: createIcon('triangle'),
  XCircle: createIcon('x-circle'),
}
