// Layout stability check for the v2 page. Paste into the browser console (or a
// browser tool's JS runner) on a built page at the viewport size under test.
// It records every major block's top, height and left edge, plus the readout's
// type size (a size change reads as a jump even at a fixed height), then switches through every
// color model and brightness mode, sweeps the slider from 100 K to 100,000 K,
// and types 1,000,000 K, reporting anything that moved or overflowed.
// It also checks that stacked blocks never overlap (the temperature spilling into
// the verdict line was a real bug that the movement check couldn't see).
// Then it turns compare on and sweeps again against a new baseline (turning it on changes the
// layout on purpose), switches the color-map card to the HR diagram and taps every star (nothing
// may move), and opens each visualization tab in both views: only the Numbers tab may scroll.
// A clean run returns { shifts: "none", overlaps: "none", readoutOverflow: "none", panelScroll: "none", overflowX: 0 }.
(() => {
  const selectors = [".b-top", ".readout-block", ".b-dock", "#slider", "#spectrum", ".legend", ".chart-box", "#colormap", "#colormap > svg", ".stats", "#classChip", "#num"];
  const snapshot = () => ({
    ...Object.fromEntries(selectors.map(s => {
      // The first match with a box: the color map's two diagrams take turns.
      const box = ([...document.querySelectorAll(s)].find(e => e.getClientRects().length) ?? document.querySelector(s)).getBoundingClientRect();
      return [s, `top ${Math.round(box.top)} h ${Math.round(box.height)} left ${Math.round(box.left)}`];
    })),
    "readout type size": getComputedStyle(document.getElementById("num")).fontSize,
  });
  const base = snapshot();
  const shifts = {};
  const overlaps = {};
  // [upper, lower]: the upper block must end at or above where the lower one starts.
  const stacked = [["#tempBig", ".verdict"], [".verdict", "#stageNote"], [".b-top", ".viz"], [".tabs", ".panel.active"], ["#colormap > .seg", "#cieReadout"]];
  // [child, parent]: the child must stay inside its parent's box. The original bug
  // (the text box 7 px taller than its row) only touched the next line in Chrome
  // but overlapped it in Safari, so containment is the check that catches it.
  const contained = [["#num", "#tempBig"], ["#tempBig", ".readout"], [".readout-block", ".b-top"], [".legend", "#spectrum"], ["#cieReadout", "#colormap"]];
  const overflow = [];
  const slider = document.getElementById("slider");
  const num = document.getElementById("num");

  const check = (label, baseline = base, current = snapshot) => {
    const now = current();
    const moved = Object.entries(now)
      .filter(([s, value]) => value !== baseline[s])
      .map(([s, value]) => `${s}: ${baseline[s]} -> ${value}`);
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

  // With all three shown, the discs mustn't move as the temperature takes the real-star model in and
  // out of its data range: a wider "Real stars · no data" caption once pushed them 14 px sideways.
  document.getElementById("compare").click();
  const compareSnapshot = () => ({
    ...snapshot(),
    ...Object.fromEntries([...document.querySelectorAll("#discs .disc")].map((disc, i) => {
      const box = disc.getBoundingClientRect();
      return [`disc ${i + 1}`, `left ${Math.round(box.left)} w ${Math.round(box.width)} top ${Math.round(box.top)}`];
    })),
  });
  const compareBase = compareSnapshot();
  for (let position = 0; position <= 1000; position += 50) {
    slider.value = position;
    slider.dispatchEvent(new Event("input"));
    check(`compare @ slider ${position}`, compareBase, compareSnapshot);
  }
  document.getElementById("compare").click();

  // The color-map card's switcher: the HR diagram takes the color map's place exactly, at every
  // temperature (its readout changes with the star), and switching back restores everything.
  const [cieView, hrView] = document.querySelectorAll(".seg[data-key=map] button");
  const mapTab = document.querySelector("[data-tabs] [data-view=map]");
  if (mapTab.offsetParent) mapTab.click();
  const mapBase = snapshot();
  hrView.click();
  for (let position = 0; position <= 1000; position += 50) {
    slider.value = position;
    slider.dispatchEvent(new Event("input"));
    check(`HR diagram @ slider ${position}`, mapBase);
  }
  for (const star of document.querySelectorAll("#hr .star")) {
    star.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    check(`HR diagram @ ${star.ariaLabel}`, mapBase);
  }
  cieView.click();
  check("color map again", mapBase);
  document.querySelector("[data-tabs] [data-view=spectrum]").click();

  // The chart and the color map shrink to fit: a panel that scrolls hides part of them, and in
  // Safari its scroll position jumped whenever the slider moved.
  const panelScroll = [];
  for (const view of [hrView, cieView]) {
    view.click();
    for (const tab of document.querySelectorAll("[data-tabs] button")) {
      if (!tab.offsetParent) continue;
      tab.click();
      for (const panel of document.querySelectorAll(".panel:not([data-view-panel=numbers])")) {
        if (panel.offsetHeight && panel.scrollHeight > panel.clientHeight + 1) panelScroll.push(`${tab.dataset.view} tab, ${view.dataset.v} view: ${panel.dataset.viewPanel} scrolls ${panel.scrollHeight - panel.clientHeight} px`);
      }
    }
  }
  document.querySelector("[data-tabs] [data-view=spectrum]").click();

  return {
    viewport: `${innerWidth}x${innerHeight}`,
    shifts: Object.keys(shifts).length ? shifts : "none",
    overlaps: Object.keys(overlaps).length ? overlaps : "none",
    readoutOverflow: overflow.length ? overflow : "none",
    panelScroll: panelScroll.length ? panelScroll : "none",
    overflowX: document.documentElement.scrollWidth - innerWidth,
  };
})();
