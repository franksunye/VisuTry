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
  CheckCircle: createIcon('check-circle'),
  CheckCircle2: createIcon('check-circle-2'),
  Clock: createIcon('clock'),
  ArrowRight: createIcon('arrow-right'),
  ScanFace: createIcon('scan-face'),
  Sparkles: createIcon('sparkles'),
  Camera: createIcon('camera'),
  HelpCircle: createIcon('help-circle'),
  RotateCcw: createIcon('rotate-ccw'),
  AlertTriangle: createIcon('alert-triangle'),
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
}
