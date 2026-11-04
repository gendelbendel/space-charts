// Layout stability check for the v2 pages (the main page and /embed/). Paste into the browser console (or a
// browser tool's JS runner) on a built page at the viewport size under test.
// It records every major block's top, height and left edge, plus the readout's
// type size (a size change reads as a jump even at a fixed height), then switches through every
// color model and brightness mode (and the chart's Per Hz view and lines), sweeps the slider from 100 K to 100,000 K,
// and types 1,000,000 K, reporting anything that moved or overflowed.
// It also checks that stacked blocks never overlap (the temperature spilling into
// the verdict line was a real bug that the movement check couldn't see).
// Then it turns compare on and sweeps again against a new baseline (turning it on changes the
// layout on purpose), pins a temperature (nothing may move, and pin and compare exclude each other),
// switches the color-map card to the HR diagram and taps every star, then to Daylight with both
// camera whites (nothing may move), opens the phone's sheet of mode controls (nothing may move), and
// opens each visualization tab in every view: only the Numbers tab may scroll.
// Last, it runs the guided tour to its end on a stand-in clock, checking every frame: nothing may move,
// and each caption must fit the verdict's reserved box.
// It returns a promise (the tour awaits between frames), so await it in the console. A clean run returns
// { shifts: "none", overlaps: "none", readoutOverflow: "none", panelScroll: "none", tour: "none", overflowX: 0 }.
(async () => {
  const selectors = [".b-top", ".readout-block", "#stageNote", ".b-dock", "#slider", "#spectrum", ".legend", ".chart-box", "#colormap", "#colormap > svg", ".stats", "#classChip", "#num", "[data-tour]"];
  const snapshot = () => ({
    ...Object.fromEntries(selectors.map(s => {
      // The first match with a box: the color map's two diagrams take turns. The embed page
      // (check-embed.mjs) has no color map or stats.
      const box = ([...document.querySelectorAll(s)].find(e => e.getClientRects().length) ?? document.querySelector(s))?.getBoundingClientRect();
      return [s, box ? `top ${Math.round(box.top)} h ${Math.round(box.height)} left ${Math.round(box.left)}` : "missing"];
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

  // The chart's Per Hz view and its absorption lines change only what the canvas draws and the
  // legend's switch text, so they're checked against the same baseline.
  document.querySelector(".seg[data-key=axis] [data-v=hz]").click();
  for (const lines of [true, false]) {
    if (document.getElementById("linesToggle").getAttribute("aria-pressed") !== String(lines)) document.getElementById("linesToggle").click();
    for (let position = 0; position <= 1000; position += 100) {
      slider.value = position;
      slider.dispatchEvent(new Event("input"));
      check(`per Hz, lines ${lines ? "on" : "off"} @ slider ${position}`);
    }
  }
  document.querySelector(".seg[data-key=axis] [data-v=nm]").click();

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

  // Pinning adds a second disc inside the same stage and a second curve on the same canvas, so unlike
  // compare it's checked against the page's own baseline, and the discs mustn't move once they're there.
  const pin = document.getElementById("pin"), compare = document.getElementById("compare");
  slider.value = 500;
  slider.dispatchEvent(new Event("input"));
  pin.click();
  check("pinned", base);
  const pinnedBase = compareSnapshot();
  for (const light of ["eye", "hue", "sun"]) {
    document.querySelector(`.seg[data-key=light] [data-v=${light}]`).click();
    for (let position = 0; position <= 1000; position += 50) {
      slider.value = position;
      slider.dispatchEvent(new Event("input"));
      check(`pinned, ${light} @ slider ${position}`, pinnedBase, compareSnapshot);
    }
  }
  compare.click();
  if (pin.getAttribute("aria-pressed") !== "false") overlaps["compare models left the pin on"] = "both on";
  pin.click();
  if (compare.checked) overlaps["pinning left compare models on"] = "both on";
  pin.click();
  check("unpinned", base);

  // The color-map card's switcher: the HR diagram takes the color map's place exactly, at every
  // temperature (its readout changes with the star), and switching back restores everything.
  const [cieView, hrView, dayView] = document.querySelectorAll(".seg[data-key=map] button");
  // The embed page has no color map card.
  if (hrView) {
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
    dayView.click();
    for (const white of ["D65", "Sun"]) {
      for (let position = 0; position <= 1000; position += 50) {
        slider.value = position;
        slider.dispatchEvent(new Event("input"));
        check(`Daylight, ${white} white @ slider ${position}`, mapBase);
      }
      document.querySelector("#day .day-white[data-v=sun]").dispatchEvent(new MouseEvent("click", { bubbles: true }));
    }
    cieView.click();
    check("color map again", mapBase);
    document.querySelector("[data-tabs] [data-view=spectrum]")?.click();
  }

  // Phones: the mode controls open as a sheet over the visuals, so nothing may move, and it must fit on screen.
  const modes = document.getElementById("modes");
  if (modes?.offsetParent) {
    modes.click();
    check("modes sheet open");
    const sheet = document.getElementById("controls").getBoundingClientRect();
    if (!sheet.height) overlaps["modes sheet"] = "didn't open";
    else if (sheet.top < 0) overlaps["modes sheet"] = `starts ${Math.round(-sheet.top)} px above the screen`;
    modes.click();
  }

  // The chart and the color map shrink to fit: a panel that scrolls hides part of them, and in
  // Safari its scroll position jumped whenever the slider moved.
  const panelScroll = [];
  for (const view of hrView ? [hrView, dayView, cieView] : [null]) {
    view?.click();
    for (const tab of document.querySelectorAll("[data-tabs] button")) {
      if (!tab.offsetParent) continue;
      tab.click();
      for (const panel of document.querySelectorAll(".panel:not([data-view-panel=numbers])")) {
        if (panel.offsetHeight && panel.scrollHeight > panel.clientHeight + 1) panelScroll.push(`${tab.dataset.view} tab, ${view.dataset.v} view: ${panel.dataset.viewPanel} scrolls ${panel.scrollHeight - panel.clientHeight} px`);
      }
    }
  }
  document.querySelector("[data-tabs] [data-view=spectrum]")?.click();

  // The tour (the main page only) moves at constant speed for 2.5 s and holds each stop for 4 s. A stand-in
  // clock steps it 100 ms at a time, so the 52 s tour takes a few seconds; a real task between steps lets
  // its awaits go on. The address follows it, so it runs last.
  const tour = [];
  const tourButton = [...document.querySelectorAll("[data-tour]")].find(b => b.offsetParent);
  if (tourButton) {
    const real = { now: performance.now, raf: requestAnimationFrame, setTimeout, clearTimeout };
    let clock = real.now.call(performance), id = 0;
    const timers = new Map(), frames = [];
    performance.now = () => clock;
    window.requestAnimationFrame = fn => frames.push(fn);
    window.setTimeout = (fn, ms = 0) => (timers.set(++id, [clock + ms, fn]), id);
    window.clearTimeout = timer => timers.delete(timer);
    const caption = () => document.querySelector(".tour-caption");
    const captions = new Set();
    try {
      tourButton.click();
      for (let ms = 0; ms < 60000 && tourButton.ariaPressed === "true"; ms += 100) {
        clock += 100;
        for (const fn of frames.splice(0)) fn(clock);
        for (const [timer, [due, fn]] of [...timers].sort((a, b) => a[1][0] - b[1][0])) {
          if (due <= clock && timers.delete(timer)) fn();
        }
        await new Promise(resolve => real.setTimeout.call(window, resolve));
        const text = caption().textContent;
        check(`tour @ ${ms} ms: ${text.slice(0, 3)} ${num.value} K`);
        if (caption().scrollHeight > caption().clientHeight + 1) tour.push(`"${text}" is ${caption().scrollHeight - caption().clientHeight} px taller than the verdict`);
        captions.add(text);
      }
    } finally {
      Object.assign(window, { requestAnimationFrame: real.raf, setTimeout: real.setTimeout, clearTimeout: real.clearTimeout });
      performance.now = real.now;
    }
    if (captions.size !== 8) tour.push(`showed ${captions.size} captions, not 8`);
    if (tourButton.ariaPressed !== "false" || document.querySelector(".verdict.touring")) tour.push("didn't end");
    if (location.pathname !== "/stars/cmb/") tour.push(`ended at ${location.pathname}, not /stars/cmb/`);
  }

  return {
    viewport: `${innerWidth}x${innerHeight}`,
    shifts: Object.keys(shifts).length ? shifts : "none",
    overlaps: Object.keys(overlaps).length ? overlaps : "none",
    readoutOverflow: overflow.length ? overflow : "none",
    panelScroll: panelScroll.length ? panelScroll : "none",
    tour: tour.length ? [...new Set(tour)] : "none",
    overflowX: document.documentElement.scrollWidth - innerWidth,
  };
})();
