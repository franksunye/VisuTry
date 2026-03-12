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
  Clock: createIcon('clock'),
}
