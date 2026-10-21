/* Knitted elements, drawn stitch by stitch as SVG.
   KNIT.text('#7')            -> knit-stitch lettering
   KNIT.band()                -> fair-isle strip (trees, snowflakes, reindeer)
   KNIT.stockings()           -> a row of knitted stockings on a string */
var KNIT = (function () {
  var F = {
    A: ['.###.', '#...#', '#...#', '#####', '#...#', '#...#', '#...#'],
    B: ['####.', '#...#', '#...#', '####.', '#...#', '#...#', '####.'],
    C: ['.###.', '#...#', '#....', '#....', '#....', '#...#', '.###.'],
    D: ['####.', '#...#', '#...#', '#...#', '#...#', '#...#', '####.'],
    E: ['#####', '#....', '#....', '####.', '#....', '#....', '#####'],
    F: ['#####', '#....', '#....', '####.', '#....', '#....', '#....'],
    G: ['.###.', '#...#', '#....', '#.###', '#...#', '#...#', '.####'],
    H: ['#...#', '#...#', '#...#', '#####', '#...#', '#...#', '#...#'],
    I: ['###', '.#.', '.#.', '.#.', '.#.', '.#.', '###'],
    J: ['..###', '...#.', '...#.', '...#.', '...#.', '#..#.', '.##..'],
    K: ['#...#', '#..#.', '#.#..', '##...', '#.#..', '#..#.', '#...#'],
    L: ['#....', '#....', '#....', '#....', '#....', '#....', '#####'],
    M: ['#...#', '##.##', '#.#.#', '#.#.#', '#...#', '#...#', '#...#'],
    N: ['#...#', '##..#', '#.#.#', '#..##', '#...#', '#...#', '#...#'],
    O: ['.###.', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.'],
    P: ['####.', '#...#', '#...#', '####.', '#....', '#....', '#....'],
    Q: ['.###.', '#...#', '#...#', '#...#', '#.#.#', '#..#.', '.##.#'],
    R: ['####.', '#...#', '#...#', '####.', '#.#..', '#..#.', '#...#'],
    S: ['.####', '#....', '#....', '.###.', '....#', '....#', '####.'],
    T: ['#####', '..#..', '..#..', '..#..', '..#..', '..#..', '..#..'],
    U: ['#...#', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.'],
    V: ['#...#', '#...#', '#...#', '#...#', '#...#', '.#.#.', '..#..'],
    W: ['#...#', '#...#', '#...#', '#.#.#', '#.#.#', '##.##', '#...#'],
    X: ['#...#', '#...#', '.#.#.', '..#..', '.#.#.', '#...#', '#...#'],
    Y: ['#...#', '#...#', '.#.#.', '..#..', '..#..', '..#..', '..#..'],
    Z: ['#####', '....#', '...#.', '..#..', '.#...', '#....', '#####'],
    0: ['.###.', '#...#', '#..##', '#.#.#', '##..#', '#...#', '.###.'],
    1: ['.#.', '##.', '.#.', '.#.', '.#.', '.#.', '###'],
    2: ['.###.', '#...#', '....#', '...#.', '..#..', '.#...', '#####'],
    3: ['####.', '....#', '....#', '.###.', '....#', '....#', '####.'],
    4: ['...#.', '..##.', '.#.#.', '#..#.', '#####', '...#.', '...#.'],
    5: ['#####', '#....', '####.', '....#', '....#', '#...#', '.###.'],
    6: ['.###.', '#....', '#....', '####.', '#...#', '#...#', '.###.'],
    7: ['#####', '....#', '...#.', '..#..', '.#...', '.#...', '.#...'],
    8: ['.###.', '#...#', '#...#', '.###.', '#...#', '#...#', '.###.'],
    9: ['.###.', '#...#', '#...#', '.####', '....#', '....#', '.###.'],
    '#': ['.#.#.', '.#.#.', '#####', '.#.#.', '#####', '.#.#.', '.#.#.'],
    '-': ['...', '...', '...', '###', '...', '...', '...'],
    '.': ['.', '.', '.', '.', '.', '.', '#'],
    ',': ['..', '..', '..', '..', '..', '.#', '#.'],
    "'": ['#', '#', '.', '.', '.', '.', '.'],
    '!': ['#', '#', '#', '#', '#', '.', '#'],
    '?': ['.###.', '#...#', '....#', '...#.', '..#..', '.....', '..#..'],
    ' ': ['...', '...', '...', '...', '...', '...', '...']
  };

  // One V-shaped stitch in a 10x10 cell.
  var DEFS = '<symbol id="kst" viewBox="0 0 10 10"><g>' +
    '<ellipse cx="3.1" cy="5" rx="2.5" ry="4.7" transform="rotate(-28 3.1 5)"/>' +
    '<ellipse cx="6.9" cy="5" rx="2.5" ry="4.7" transform="rotate(28 6.9 5)"/>' +
    '<ellipse cx="3.1" cy="3.6" rx="1" ry="2.4" transform="rotate(-28 3.1 3.6)" fill="#fff" opacity=".22"/>' +
    '<ellipse cx="6.9" cy="3.6" rx="1" ry="2.4" transform="rotate(28 6.9 3.6)" fill="#fff" opacity=".14"/>' +
    '</g></symbol>';
  (function inject() {
    if (typeof document === 'undefined') return;
    var holder = document.createElement('div');
    holder.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden';
    holder.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><defs>' + DEFS + '</defs></svg>';
    (document.body || document.documentElement).appendChild(holder);
  })();

  function stitches(grid, colors, ox, oy) {
    var out = '';
    for (var y = 0; y < grid.length; y++) {
      for (var x = 0; x < grid[y].length; x++) {
        var c = colors[grid[y][x]];
        if (c) out += '<use href="#kst" x="' + ((ox + x) * 10) + '" y="' + ((oy + y) * 10) + '" width="10" height="10" fill="' + c + '"/>';
      }
    }
    return out;
  }

  function text(str, opts) {
    opts = opts || {};
    var color = opts.color || 'currentColor';
    var chars = String(str).toUpperCase().split('').map(function (ch) { return F[ch] || F['?']; });
    var cols = 0, body = '';
    chars.forEach(function (g, i) {
      if (i) cols += 1;
      body += stitches(g, { '#': color }, cols, 0);
      cols += g[0].length;
    });
    var label = String(str).replace(/"/g, '&quot;');
    return '<svg class="knit-text ' + (opts.cls || '') + '" viewBox="-2 -2 ' + (cols * 10 + 4) + ' 74" role="img" aria-label="' + label + '">' + body + '</svg>';
  }

  var TREE = ['...#...', '..###..', '.#####.', '..###..', '.#####.', '#######', '...#...', '...#...'];
  var FLAKE = ['....#....', '.#..#..#.', '..#.#.#..', '...###...', '#########', '...###...', '..#.#.#..', '.#..#..#.', '....#....'];
  var DEER = ['#.#.........', '.##.........', '..##........', '..###.......', '...#########', '...#########', '....########', '....#......#', '....#......#', '....#......#'];
  var HEART = ['.##.##.', '#######', '#######', '.#####.', '..###..', '...#...'];

  // Fair-isle strip: dotted rows, then a motif row, as a repeating pattern.
  function band(opts) {
    opts = opts || {};
    var fg = opts.fg || '#f2e8d4', bg = opts.bg || 'none', alt = opts.alt || fg;
    var motifs = [DEER, FLAKE, TREE, HEART, TREE, FLAKE];
    var H = 16, x = 0, body = '';
    motifs.forEach(function (m, i) {
      var w = m[0].length, y = 3 + Math.floor((10 - m.length) / 2) + 1;
      body += stitches(m, { '#': i % 2 ? alt : fg }, x + 2, y);
      x += w + 4;
    });
    var W = x;
    var dots = '';
    for (var i = 0; i < W; i += 2) dots += stitches(['#'], { '#': fg }, i, 0) + stitches(['#'], { '#': fg }, i + 1, H - 1);
    var id = 'fi' + Math.random().toString(36).slice(2, 7);
    return '<svg class="knit-band" width="100%" height="' + (opts.height || 48) + '" aria-hidden="true" preserveAspectRatio="xMidYMid slice" viewBox="0 0 ' + (W * 10 * 3) + ' ' + (H * 10) + '">' +
      '<defs><pattern id="' + id + '" width="' + (W * 10) + '" height="' + (H * 10) + '" patternUnits="userSpaceOnUse">' +
      (bg !== 'none' ? '<rect width="100%" height="100%" fill="' + bg + '"/>' : '') + dots + body + '</pattern></defs>' +
      '<rect width="100%" height="100%" fill="url(#' + id + ')"/></svg>';
  }

  var STOCKING = ['cccccc..', 'cccccc..', '.bbbb...', '.bwbb...', '.bbbb...', '.bbwb...', '.bbbbb..', '.bwbbbbb', '.bbbbbwb', '..bbbbbb', '...bbb..'];
  function stockings(n) {
    n = n || 5;
    var palette = [['#b3342a', '#f2e8d4'], ['#f2e8d4', '#b3342a'], ['#eca7c6', '#2d4833'], ['#b3342a', '#eca7c6'], ['#f2e8d4', '#2d4833']];
    var body = '', gap = 13, W = n * gap + 2;
    for (var i = 0; i < n; i++) {
      var p = palette[i % palette.length];
      var dy = 2 + (i % 2);
      body += '<line x1="' + ((i * gap + 4) * 10 + 15) + '" y1="' + (12 + i % 2 * 4) + '" x2="' + ((i * gap + 4) * 10 + 15) + '" y2="' + (dy * 10) + '" stroke="#c9a86b" stroke-width="3"/>';
      body += stitches(STOCKING, { c: '#f2e8d4', b: p[0], w: p[1] }, i * gap + 2, dy);
    }
    return '<svg class="knit-stockings" viewBox="0 0 ' + (W * 10) + ' 150" aria-hidden="true">' +
      '<path d="M0 10 Q' + (W * 5) + ' 26 ' + (W * 10) + ' 10" stroke="#c9a86b" stroke-width="4" fill="none"/>' + body + '</svg>';
  }

  return { text: text, band: band, stockings: stockings };
})();
