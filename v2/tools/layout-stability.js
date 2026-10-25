// Layout stability check for the v2 page. Paste into the browser console (or a
// browser tool's JS runner) on a built page at the viewport size under test.
// It records every major block's top, height and left edge, plus the readout's
// type size (a size change reads as a jump even at a fixed height), then switches through every
// color model and brightness mode, sweeps the slider from 100 K to 100,000 K,
// and types 1,000,000 K, reporting anything that moved or overflowed.
// It also checks that stacked blocks never overlap (the temperature spilling into
// the verdict line was a real bug that the movement check couldn't see).
// A clean run returns { shifts: "none", overlaps: "none", readoutOverflow: "none", overflowX: 0 }.
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
  const overlaps = {};
  // [upper, lower]: the upper block must end at or above where the lower one starts.
  const stacked = [["#tempBig", ".verdict"], [".verdict", "#stageNote"], [".b-top", ".viz"], [".tabs", ".panel.active"]];
  // [child, parent]: the child must stay inside its parent's box. The original bug
  // (the text box 7 px taller than its row) only touched the next line in Chrome
  // but overlapped it in Safari, so containment is the check that catches it.
  const contained = [["#num", "#tempBig"], ["#tempBig", ".readout"], [".readout-block", ".b-top"]];
  const overflow = [];
  const slider = document.getElementById("slider");
  const num = document.getElementById("num");

  const check = label => {
    const now = snapshot();
    const moved = Object.entries(now)
      .filter(([s, value]) => value !== base[s])
      .map(([s, value]) => `${s}: ${base[s]} -> ${value}`);
    if (moved.length) shifts[label] = moved;
    const box = s => document.querySelector(s)?.getBoundingClientRect();
    for (const [upper, lower] of stacked) {
      const a = box(upper), b = box(lower);
      const sideBySide = a && b && (a.right <= b.left || b.right <= a.left);
      if (a?.height && b?.height && !sideBySide && a.bottom - b.top > 0.5) overlaps[`${label}: ${upper} over ${lower}`] = `${Math.round(a.bottom - b.top)} px`;
    }
    for (const [child, parent] of contained) {
      const c = box(child), p = box(parent);
      const spill = c && p ? Math.max(p.top - c.top, c.bottom - p.bottom) : 0;
      if (c?.height && p?.height && spill > 0.5) overlaps[`${label}: ${child} spills out of ${parent}`] = `${Math.round(spill)} px`;
    }
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
    overlaps: Object.keys(overlaps).length ? overlaps : "none",
    readoutOverflow: overflow.length ? overflow : "none",
    overflowX: document.documentElement.scrollWidth - innerWidth,
  };
})();
