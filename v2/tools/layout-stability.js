// Layout stability check for the v2 page. Paste into the browser console (or a
// browser tool's JS runner) on a built page at the viewport size under test.
// It records every major block's top, height and left edge, plus the readout's
// type size (a size change reads as a jump even at a fixed height), then switches through every
// color model and brightness mode, sweeps the slider from 100 K to 100,000 K,
// and types 1,000,000 K, reporting anything that moved or overflowed.
// A clean run returns { shifts: "none", readoutOverflow: "none", overflowX: 0 }.
// Compare stays off: turning it on changes the layout on purpose.
(() => {
  const selectors = [".b-top", ".readout-block", ".b-dock", "#slider", "#spectrum", ".legend", ".chart-box", "#colormap", "#cie", ".stats", "#classChip", "#num"];
  const snapshot = () => ({
    ...Object.fromEntries(selectors.map(s => {
      const box = document.querySelector(s).getBoundingClientRect();
      return [s, `top ${Math.round(box.top)} h ${Math.round(box.height)} left ${Math.round(box.left)}`];
    })),
    "readout type size": getComputedStyle(document.getElementById("num")).fontSize,
  });
  const base = snapshot();
  const shifts = {};
  const overflow = [];
  const slider = document.getElementById("slider");
  const num = document.getElementById("num");

  const check = label => {
    const now = snapshot();
    const moved = Object.entries(now)
      .filter(([s, value]) => value !== base[s])
      .map(([s, value]) => `${s}: ${base[s]} -> ${value}`);
    if (moved.length) shifts[label] = moved;
    const readout = document.querySelector(".readout");
    if (readout.scrollWidth > readout.clientWidth + 1) overflow.push(label);
  };

  for (const light of ["eye", "hue", "sun"]) {
    for (const model of ["star", "simple", "cie"]) {
      document.querySelector(`.seg[data-key=light] [data-v=${light}]`).click();
      document.querySelector(`.seg[data-key=model] [data-v=${model}]`).click();
      for (let position = 0; position <= 1000; position += 50) {
        slider.value = position;
        slider.dispatchEvent(new Event("input"));
        check(`${light}/${model} @ slider ${position}`);
      }
      num.value = 1000000;
      num.dispatchEvent(new Event("change"));
      check(`${light}/${model} @ 1,000,000 K`);
    }
  }

  return {
    viewport: `${innerWidth}x${innerHeight}`,
    shifts: Object.keys(shifts).length ? shifts : "none",
    readoutOverflow: overflow.length ? overflow : "none",
    overflowX: document.documentElement.scrollWidth - innerWidth,
  };
})();
