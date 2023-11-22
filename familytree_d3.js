zoomAndPanSvg = (svg, margin = 0) => {
    const { x, y, width, height } = svg.viewBox.baseVal;
    const mg = Math.min(width, height) * margin;
    const bounds = [
      [x - mg, y - mg],
      [x + width + mg, y + height + mg]
    ];
    const [W, H] = [svg.width.baseVal.value, svg.height.baseVal.value];
    const viewBox = ([[xmin, ymin], [xmax, ymax]]) =>
      `${xmin} ${ymin} ${xmax - xmin} ${ymax - ymin}`;
    const onChange = (bounds) => svg.setAttribute("viewBox", viewBox(bounds));
    return zoomAndPan2D(svg, [W, H], bounds, onChange);
  }

  zoomAndPan2D = (dom, [W, H], viewbox, onChange) => {
    const vb = Viewbox([W, H], viewbox, onChange);
    const { translate, scaleI, coordsI, zoom, setBounds } = vb;
    const onPan = (target, [dX, dY]) => translate(-scaleI(dX), -scaleI(dY));
    const onZoom = ([X, Y], dw) => zoom(coordsI([X, Y]), 1 + dw / 2e3);
    const onReset = () => setBounds(viewbox);
    return zoomAndPan(dom, onPan, onZoom, onReset);
  }

  zoomAndPan = (dom, pan, zoom, reset) => {
    const mc = new Hammer.Manager(dom);
    mc.add(new Hammer.Pan());
    mc.add(new Hammer.Pinch().recognizeWith(mc.get("pan")));
    mc.add(new Hammer.Tap({ taps: 2 }));
  
    let x, y, s;
    const pas = ({ srcEvent: e }) => ([x, y] = [e.layerX, e.layerY]);
    const pam = ({ srcEvent: e }) => {
      const [dX, dY] = [-x + (x = e.layerX), -y + (y = e.layerY)];
      pan && pan(dom, [dX, dY]);
    };
    const pis = (e) => (s = e.scale);
    const pim = (e) =>
      zoom && zoom([e.center.x, e.center.y], 1 /*s / (s = e.scale)*/);
    const wh = (e) => {
      e.preventDefault();
      zoom && zoom([x, y], e.deltaY);
    };
    const mm = (e) => ([x, y] = [e.layerX, e.layerY]);
    const onReset = (e) => reset && reset();
  
    mc.on("panstart", pas);
    mc.on("panmove", pam);
    mc.on("pinchstart", pis);
    mc.on("pinchmove", pim);
    mc.on("tap", onReset);
  
    dom.addEventListener("mousemove", mm);
    dom.addEventListener("wheel", wh);
  
    return dom;
  }

  Viewbox = ([W, H], bounds, onchange) => {
    const [W2, H2] = [W / 2, H / 2];
    let xc, yc, ratio;
    const getBounds = () => {
      const [wr, hr] = [W2 / ratio, H2 / ratio];
      return [
        [xc - wr, yc - hr],
        [xc + wr, yc + hr]
      ];
    };
    const notify = () => onchange && onchange(getBounds());
    const setBounds = ([[xmin, ymin], [xmax, ymax]]) => {
      [xc, yc] = [(xmin + xmax) / 2, (ymin + ymax) / 2];
      const [dx, dy] = [xmax - xmin, ymax - ymin];
      ratio = dx && dy ? Math.min(W / dx, H / dy) : 1;
      notify();
    };
    setBounds(
      bounds || [
        [0, 0],
        [W, H]
      ]
    );
    return {
      getBounds,
      setBounds,
      translate: (dx, dy) => ((xc += dx), (yc += dy), notify()),
      zoom: ([xz, yz], f) => {
        xc = f * (xc - xz) + xz;
        yc = f * (yc - yz) + yz;
        ratio /= f;
        notify();
      },
      coords: ([x, y]) => [W2 + (x - xc) * ratio, H2 + (y - yc) * ratio],
      coordsI: ([x, y]) => [(x - W2) / ratio + xc, (y - H2) / ratio + yc],
      scale: (val) => val * ratio,
      scaleI: (val) => val / ratio
    };
  }