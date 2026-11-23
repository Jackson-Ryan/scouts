/**
 * Shared custom themed UI controls for Scout Tools.
 *
 * Automatically enhances native browser controls (select dropdowns, date
 * pickers, search clear buttons, number steppers) and provides a custom
 * confirm dialog so every page matches the site theme with zero repetition.
 *
 * Kept free of top-level DOM side effects so Node scripts can safely import
 * modules that depend on it.
 */

const SVG_CHEVRON = `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="m6 9 6 6 6-6"/></svg>`;
const SVG_CHEVRON_LEFT = `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="m15 18-6-6 6-6"/></svg>`;
const SVG_CHEVRON_RIGHT = `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="m9 18 6-6-6-6"/></svg>`;
const SVG_CHECK = `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><polyline points="20 6 9 17 4 12"/></svg>`;
const SVG_X = `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M18 6 6 18M6 6l12 12"/></svg>`;
const SVG_CALENDAR = `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><rect width="18" height="18" x="3" y="4" rx="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>`;
const SVG_MINUS = `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M5 12h14"/></svg>`;
const SVG_PLUS = `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M5 12h14M12 5v14"/></svg>`;

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

let uidCounter = 0;
let activePopover = null;
const boundDocuments = new WeakSet();
const observedBodies = new WeakSet();

function nextUid(prefix) {
  uidCounter += 1;
  return `${prefix}-${uidCounter}`;
}

function escapeAttrValue(value) {
  return String(value ?? "").replace(/["\\]/g, "\\$&");
}

function getMutationObserver(doc) {
  return doc?.defaultView?.MutationObserver || globalThis.MutationObserver || null;
}

function closeActivePopover({ restoreFocus = false } = {}) {
  if (!activePopover) return;
  const current = activePopover;
  activePopover = null;
  if (current.wrapper?.isConnected) {
    current.close({ restoreFocus });
  }
}

function bindGlobalListeners(doc = document) {
  if (!doc || boundDocuments.has(doc)) return;
  boundDocuments.add(doc);

  const win = doc.defaultView || window;

  doc.addEventListener("pointerdown", (event) => {
    if (!activePopover) return;
    if (!activePopover.wrapper.isConnected || !activePopover.wrapper.contains(event.target)) {
      closeActivePopover();
    }
  });

  doc.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && activePopover) {
      event.preventDefault();
      closeActivePopover({ restoreFocus: true });
    }
  });

  win?.addEventListener("resize", () => {
    if (activePopover) closeActivePopover();
  });
}

const propertyListeners = new WeakMap();
const patchedProtos = new WeakMap();

function watchProperty(element, prop, onSet) {
  let byProp = propertyListeners.get(element);
  if (!byProp) {
    byProp = new Map();
    propertyListeners.set(element, byProp);
  }
  let callbacks = byProp.get(prop);
  if (!callbacks) {
    callbacks = new Set();
    byProp.set(prop, callbacks);
  }
  callbacks.add(onSet);

  let proto = Object.getPrototypeOf(element);
  while (proto && !Object.prototype.hasOwnProperty.call(proto, prop)) {
    proto = Object.getPrototypeOf(proto);
  }
  if (!proto) return;

  let patched = patchedProtos.get(proto);
  if (!patched) {
    patched = new Set();
    patchedProtos.set(proto, patched);
  }
  if (patched.has(prop)) return;

  const descriptor = Object.getOwnPropertyDescriptor(proto, prop);
  if (!descriptor || !descriptor.set || !descriptor.get || !descriptor.configurable) return;

  patched.add(prop);
  Object.defineProperty(proto, prop, {
    configurable: true,
    enumerable: descriptor.enumerable,
    get() {
      return descriptor.get.call(this);
    },
    set(value) {
      descriptor.set.call(this, value);
      const listeners = propertyListeners.get(this)?.get(prop);
      if (listeners) listeners.forEach((fn) => fn());
    },
  });
}

function shouldOpenUpward(trigger, menuHeight = 260) {
  const rect = trigger.getBoundingClientRect();
  if (!rect || (rect.top === 0 && rect.bottom === 0)) return false;
  const spaceBelow = window.innerHeight - rect.bottom;
  const spaceAbove = rect.top;
  return spaceBelow < menuHeight && spaceAbove > spaceBelow;
}

/* ==========================================================================
   Custom Select Dropdown
   ========================================================================== */

function enhanceSelect(select) {
  if (!select || select.nodeType !== 1 || select.tagName !== "SELECT") return;
  if (select.dataset.uiEnhanced === "select") return;
  select.dataset.uiEnhanced = "select";

  const doc = select.ownerDocument;
  const win = doc.defaultView || window;
  const wrapper = doc.createElement("div");
  wrapper.className = "ui-select";
  if (select.closest(".sort-control")) wrapper.classList.add("ui-select--compact");
  if (select.closest(".repeat-row")) wrapper.classList.add("ui-select--sm");

  const listId = nextUid("ui-listbox");
  const trigger = doc.createElement("button");
  trigger.type = "button";
  trigger.className = "ui-select__trigger";
  trigger.setAttribute("role", "combobox");
  trigger.setAttribute("aria-haspopup", "listbox");
  trigger.setAttribute("aria-expanded", "false");
  trigger.setAttribute("aria-controls", listId);

  const labelEl = doc.createElement("span");
  labelEl.className = "ui-select__label";
  const chevronEl = doc.createElement("span");
  chevronEl.className = "ui-select__chevron";
  chevronEl.setAttribute("aria-hidden", "true");
  chevronEl.innerHTML = SVG_CHEVRON;
  trigger.append(labelEl, chevronEl);

  const menu = doc.createElement("div");
  menu.className = "ui-select__menu";
  menu.id = listId;
  menu.setAttribute("role", "listbox");
  menu.hidden = true;

  // Associate accessible name from native label or aria-label.
  const ariaLabel = select.getAttribute("aria-label");
  if (ariaLabel) {
    trigger.setAttribute("aria-label", ariaLabel);
  } else if (select.id) {
    const forLabel = doc.querySelector(`label[for="${escapeAttrValue(select.id)}"]`);
    if (forLabel) {
      if (!forLabel.id) forLabel.id = nextUid("ui-label");
      trigger.setAttribute("aria-labelledby", `${forLabel.id} ${listId}-val`);
      labelEl.id = `${listId}-val`;
      forLabel.addEventListener("click", (event) => {
        if (event.target.closest(".ui-select")) return;
        event.preventDefault();
        if (!trigger.disabled) trigger.focus();
      });
    }
  }

  select.parentNode.insertBefore(wrapper, select);
  wrapper.append(select, trigger, menu);
  select.classList.add("ui-native-hidden");
  select.tabIndex = -1;
  select.setAttribute("aria-hidden", "true");

  select.addEventListener("focus", () => {
    if (!trigger.disabled) trigger.focus();
  });

  let highlightedIndex = -1;
  let typeahead = "";
  let typeaheadTimer = 0;

  const getOptionButtons = () => [...menu.querySelectorAll(".ui-select__option")];

  const renderOptions = () => {
    const options = [...select.options];
    menu.innerHTML = "";
    options.forEach((opt, index) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "ui-select__option";
      btn.id = `${listId}-opt-${index}`;
      btn.setAttribute("role", "option");
      btn.dataset.value = opt.value;
      btn.dataset.index = String(index);
      btn.disabled = opt.disabled;
      const selected = index === select.selectedIndex;
      btn.setAttribute("aria-selected", String(selected));
      if (selected) btn.classList.add("is-selected");

      const textSpan = document.createElement("span");
      textSpan.className = "ui-select__option-text";
      textSpan.textContent = opt.textContent;

      const checkSpan = document.createElement("span");
      checkSpan.className = "ui-select__check";
      checkSpan.setAttribute("aria-hidden", "true");
      checkSpan.innerHTML = SVG_CHECK;

      btn.append(textSpan, checkSpan);
      menu.append(btn);
    });
  };

  const syncDisplay = () => {
    const selectedOption = select.options[select.selectedIndex];
    labelEl.textContent = selectedOption ? selectedOption.textContent : "";
    trigger.disabled = select.disabled;
    wrapper.classList.toggle("is-disabled", select.disabled);
    wrapper.classList.toggle("is-invalid", select.classList.contains("is-invalid"));
    if (select.getAttribute("aria-invalid") === "true") {
      trigger.setAttribute("aria-invalid", "true");
    } else {
      trigger.removeAttribute("aria-invalid");
    }

    const buttons = getOptionButtons();
    if (buttons.length !== select.options.length) {
      renderOptions();
    } else {
      buttons.forEach((btn, idx) => {
        const selected = idx === select.selectedIndex;
        btn.setAttribute("aria-selected", String(selected));
        btn.classList.toggle("is-selected", selected);
      });
    }
  };

  const setHighlight = (index) => {
    const buttons = getOptionButtons();
    if (!buttons.length) return;
    const clamped = ((index % buttons.length) + buttons.length) % buttons.length;
    highlightedIndex = clamped;
    buttons.forEach((btn, idx) => {
      btn.classList.toggle("is-highlighted", idx === clamped);
    });
    const active = buttons[clamped];
    if (active) {
      trigger.setAttribute("aria-activedescendant", active.id);
      if (typeof active.scrollIntoView === "function") {
        active.scrollIntoView({ block: "nearest" });
      }
    }
  };

  const close = ({ restoreFocus = false } = {}) => {
    menu.hidden = true;
    wrapper.classList.remove("is-open", "is-up");
    trigger.setAttribute("aria-expanded", "false");
    trigger.removeAttribute("aria-activedescendant");
    highlightedIndex = -1;
    if (restoreFocus) trigger.focus();
  };

  const open = () => {
    if (select.disabled) return;
    if (activePopover && activePopover.wrapper !== wrapper) {
      closeActivePopover();
    }
    renderOptions();
    menu.hidden = false;
    wrapper.classList.add("is-open");
    wrapper.classList.toggle("is-up", shouldOpenUpward(trigger, Math.min(280, select.options.length * 40 + 16)));
    trigger.setAttribute("aria-expanded", "true");
    activePopover = { wrapper, close };
    setHighlight(Math.max(0, select.selectedIndex));
  };

  const commitIndex = (index) => {
    const opt = select.options[index];
    if (!opt || opt.disabled) return;
    const changed = select.selectedIndex !== index;
    select.selectedIndex = index;
    syncDisplay();
    closeActivePopover({ restoreFocus: true });
    if (changed) {
      select.dispatchEvent(new Event("input", { bubbles: true }));
      select.dispatchEvent(new Event("change", { bubbles: true }));
    }
  };

  trigger.addEventListener("click", () => {
    if (wrapper.classList.contains("is-open")) {
      closeActivePopover();
    } else {
      open();
    }
  });

  trigger.addEventListener("keydown", (event) => {
    if (select.disabled) return;
    const isOpen = wrapper.classList.contains("is-open");

    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (!isOpen) open();
      else setHighlight(highlightedIndex + 1);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      if (!isOpen) open();
      else setHighlight(highlightedIndex - 1);
    } else if (event.key === "Home") {
      event.preventDefault();
      if (!isOpen) open();
      setHighlight(0);
    } else if (event.key === "End") {
      event.preventDefault();
      if (!isOpen) open();
      setHighlight(select.options.length - 1);
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      if (!isOpen) {
        open();
      } else if (highlightedIndex >= 0) {
        commitIndex(highlightedIndex);
      } else {
        closeActivePopover();
      }
    } else if (event.key === "Tab" && isOpen) {
      closeActivePopover();
    } else if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
      typeahead += event.key.toLowerCase();
      window.clearTimeout(typeaheadTimer);
      typeaheadTimer = window.setTimeout(() => { typeahead = ""; }, 500);
      const matchIndex = [...select.options].findIndex((opt) =>
        opt.textContent.trim().toLowerCase().startsWith(typeahead),
      );
      if (matchIndex >= 0) {
        if (isOpen) {
          setHighlight(matchIndex);
        } else {
          select.selectedIndex = matchIndex;
          syncDisplay();
          select.dispatchEvent(new Event("change", { bubbles: true }));
        }
      }
    }
  });

  menu.addEventListener("click", (event) => {
    const btn = event.target.closest(".ui-select__option");
    if (!btn) return;
    commitIndex(Number(btn.dataset.index));
  });

  menu.addEventListener("mousemove", (event) => {
    const btn = event.target.closest(".ui-select__option");
    if (!btn) return;
    const idx = Number(btn.dataset.index);
    if (idx !== highlightedIndex) {
      highlightedIndex = idx;
      getOptionButtons().forEach((el, i) => el.classList.toggle("is-highlighted", i === idx));
      trigger.setAttribute("aria-activedescendant", btn.id);
    }
  });

  // Sync whenever native select changes programmatically or via DOM mutations.
  select.addEventListener("change", syncDisplay);
  watchProperty(select, "value", syncDisplay);
  watchProperty(select, "selectedIndex", syncDisplay);
  watchProperty(select, "disabled", syncDisplay);

  const MO = getMutationObserver(doc);
  if (MO) {
    const observer = new MO(() => {
      renderOptions();
      syncDisplay();
    });
    observer.observe(select, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["disabled", "class", "aria-invalid"],
    });
  }

  if (select.form) {
    select.form.addEventListener("reset", () => {
      win.setTimeout(() => {
        renderOptions();
        syncDisplay();
      }, 0);
    });
  }

  renderOptions();
  syncDisplay();
}

/* ==========================================================================
   Custom Date Picker
   ========================================================================== */

function parseISODate(value) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [y, m, d] = value.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  if (date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== d) return null;
  return date;
}

function toISODate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatReadableDate(value) {
  const date = parseISODate(value);
  if (!date) return "";
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(date);
}

function enhanceDate(input) {
  if (!input || input.nodeType !== 1 || input.tagName !== "INPUT" || input.type !== "date") return;
  if (input.dataset.uiEnhanced === "date") return;
  input.dataset.uiEnhanced = "date";

  const doc = input.ownerDocument;
  const win = doc.defaultView || window;
  const wrapper = doc.createElement("div");
  wrapper.className = "ui-date";

  const popoverId = nextUid("ui-calendar");
  const trigger = doc.createElement("button");
  trigger.type = "button";
  trigger.className = "ui-date__trigger";
  trigger.setAttribute("aria-haspopup", "dialog");
  trigger.setAttribute("aria-expanded", "false");
  trigger.setAttribute("aria-controls", popoverId);

  const valueEl = doc.createElement("span");
  valueEl.className = "ui-date__value";
  const iconEl = doc.createElement("span");
  iconEl.className = "ui-date__icon";
  iconEl.setAttribute("aria-hidden", "true");
  iconEl.innerHTML = SVG_CALENDAR;
  trigger.append(valueEl, iconEl);

  const popover = doc.createElement("div");
  popover.className = "ui-date__popover";
  popover.id = popoverId;
  popover.setAttribute("role", "dialog");
  popover.setAttribute("aria-label", "Choose date");
  popover.hidden = true;

  if (input.id) {
    const forLabel = doc.querySelector(`label[for="${escapeAttrValue(input.id)}"]`);
    if (forLabel) {
      if (!forLabel.id) forLabel.id = nextUid("ui-label");
      trigger.setAttribute("aria-labelledby", `${forLabel.id} ${popoverId}-val`);
      valueEl.id = `${popoverId}-val`;
      forLabel.addEventListener("click", (event) => {
        if (event.target.closest(".ui-date")) return;
        event.preventDefault();
        if (!trigger.disabled) trigger.focus();
      });
    }
  }

  input.parentNode.insertBefore(wrapper, input);
  wrapper.append(input, trigger, popover);
  input.classList.add("ui-native-hidden");
  input.tabIndex = -1;
  input.setAttribute("aria-hidden", "true");

  input.addEventListener("focus", () => {
    if (!trigger.disabled) trigger.focus();
  });

  const today = new Date();
  let viewYear = today.getFullYear();
  let viewMonth = today.getMonth();

  const syncDisplay = () => {
    const formatted = formatReadableDate(input.value);
    valueEl.textContent = formatted || "Select date";
    valueEl.classList.toggle("is-placeholder", !formatted);
    trigger.disabled = input.disabled;
    wrapper.classList.toggle("is-disabled", input.disabled);
    wrapper.classList.toggle("is-invalid", input.classList.contains("is-invalid"));
  };

  const close = ({ restoreFocus = false } = {}) => {
    popover.hidden = true;
    wrapper.classList.remove("is-open", "is-up");
    trigger.setAttribute("aria-expanded", "false");
    if (restoreFocus) trigger.focus();
  };

  const setDateValue = (iso) => {
    if (input.value === iso) {
      closeActivePopover({ restoreFocus: true });
      return;
    }
    input.value = iso;
    syncDisplay();
    closeActivePopover({ restoreFocus: true });
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
  };

  const renderCalendar = () => {
    const selectedISO = input.value;
    const todayISO = toISODate(new Date());
    const minISO = input.min || "";
    const maxISO = input.max || "";

    const firstDay = new Date(viewYear, viewMonth, 1);
    const startWeekday = (firstDay.getDay() + 6) % 7; // Mon = 0 .. Sun = 6
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const prevMonthDays = new Date(viewYear, viewMonth, 0).getDate();

    const cells = [];
    for (let i = startWeekday - 1; i >= 0; i -= 1) {
      const d = new Date(viewYear, viewMonth - 1, prevMonthDays - i);
      cells.push({ date: d, outside: true });
    }
    for (let day = 1; day <= daysInMonth; day += 1) {
      cells.push({ date: new Date(viewYear, viewMonth, day), outside: false });
    }
    while (cells.length % 7 !== 0) {
      const nextDay = cells.length - (startWeekday + daysInMonth) + 1;
      cells.push({ date: new Date(viewYear, viewMonth + 1, nextDay), outside: true });
    }

    popover.innerHTML = `
      <div class="ui-date__head">
        <button type="button" class="ui-date__nav" data-cal-nav="-1" aria-label="Previous month">${SVG_CHEVRON_LEFT}</button>
        <span class="ui-date__month">${MONTHS[viewMonth]} ${viewYear}</span>
        <button type="button" class="ui-date__nav" data-cal-nav="1" aria-label="Next month">${SVG_CHEVRON_RIGHT}</button>
      </div>
      <div class="ui-date__weekdays" aria-hidden="true">
        ${WEEKDAYS.map((day) => `<span>${day}</span>`).join("")}
      </div>
      <div class="ui-date__grid" role="grid">
        ${cells
          .map(({ date, outside }) => {
            const iso = toISODate(date);
            const disabled = Boolean((minISO && iso < minISO) || (maxISO && iso > maxISO));
            const classes = ["ui-date__day"];
            if (outside) classes.push("is-outside");
            if (iso === todayISO) classes.push("is-today");
            if (iso === selectedISO) classes.push("is-selected");
            return `<button type="button" class="${classes.join(" ")}" data-cal-date="${iso}" aria-pressed="${iso === selectedISO}"${disabled ? " disabled" : ""}>${date.getDate()}</button>`;
          })
          .join("")}
      </div>
      <div class="ui-date__foot">
        <button type="button" class="ui-date__action" data-cal-clear>Clear</button>
        <button type="button" class="ui-date__action ui-date__action--primary" data-cal-today>Today</button>
      </div>
    `;
  };

  const open = () => {
    if (input.disabled) return;
    if (activePopover && activePopover.wrapper !== wrapper) {
      closeActivePopover();
    }
    const base = parseISODate(input.value) || parseISODate(input.min) || new Date();
    viewYear = base.getFullYear();
    viewMonth = base.getMonth();
    renderCalendar();
    popover.hidden = false;
    wrapper.classList.add("is-open");
    wrapper.classList.toggle("is-up", shouldOpenUpward(trigger, 320));
    trigger.setAttribute("aria-expanded", "true");
    activePopover = { wrapper, close };
  };

  trigger.addEventListener("click", () => {
    if (wrapper.classList.contains("is-open")) closeActivePopover();
    else open();
  });

  popover.addEventListener("click", (event) => {
    const navBtn = event.target.closest("[data-cal-nav]");
    if (navBtn) {
      viewMonth += Number(navBtn.dataset.calNav);
      if (viewMonth < 0) {
        viewMonth = 11;
        viewYear -= 1;
      } else if (viewMonth > 11) {
        viewMonth = 0;
        viewYear += 1;
      }
      renderCalendar();
      return;
    }

    const dayBtn = event.target.closest("[data-cal-date]");
    if (dayBtn && !dayBtn.disabled) {
      setDateValue(dayBtn.dataset.calDate);
      return;
    }

    if (event.target.closest("[data-cal-clear]")) {
      setDateValue("");
      return;
    }

    if (event.target.closest("[data-cal-today]")) {
      const todayISO = toISODate(new Date());
      if ((!input.min || todayISO >= input.min) && (!input.max || todayISO <= input.max)) {
        setDateValue(todayISO);
      } else {
        const now = new Date();
        viewYear = now.getFullYear();
        viewMonth = now.getMonth();
        renderCalendar();
      }
    }
  });

  input.addEventListener("change", syncDisplay);
  watchProperty(input, "value", syncDisplay);
  watchProperty(input, "min", () => {
    if (wrapper.classList.contains("is-open")) renderCalendar();
  });
  watchProperty(input, "max", () => {
    if (wrapper.classList.contains("is-open")) renderCalendar();
  });

  if (input.form) {
    input.form.addEventListener("reset", () => {
      win.setTimeout(syncDisplay, 0);
    });
  }

  syncDisplay();
}

/* ==========================================================================
   Custom Search Clear Button
   ========================================================================== */

function enhanceSearch(input) {
  if (!input || input.nodeType !== 1 || input.tagName !== "INPUT" || input.type !== "search") return;
  if (input.dataset.uiEnhanced === "search") return;
  input.dataset.uiEnhanced = "search";

  const doc = input.ownerDocument;
  const win = doc.defaultView || window;
  const wrap = doc.createElement("div");
  wrap.className = "ui-search";
  input.parentNode.insertBefore(wrap, input);
  wrap.append(input);

  const clearBtn = doc.createElement("button");
  clearBtn.type = "button";
  clearBtn.className = "ui-search__clear";
  clearBtn.setAttribute("aria-label", "Clear search");
  clearBtn.innerHTML = SVG_X;
  clearBtn.hidden = !input.value;
  wrap.append(clearBtn);

  const sync = () => {
    clearBtn.hidden = !input.value;
  };

  clearBtn.addEventListener("click", () => {
    input.value = "";
    sync();
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
    input.focus();
  });

  input.addEventListener("input", sync);
  input.addEventListener("change", sync);
  watchProperty(input, "value", sync);

  if (input.form) {
    input.form.addEventListener("reset", () => {
      win.setTimeout(sync, 0);
    });
  }
}

/* ==========================================================================
   Custom Number Stepper
   ========================================================================== */

function enhanceNumber(input) {
  if (!input || input.nodeType !== 1 || input.tagName !== "INPUT" || input.type !== "number") return;
  if (input.dataset.uiEnhanced === "number") return;
  input.dataset.uiEnhanced = "number";

  const doc = input.ownerDocument;
  const wrap = doc.createElement("div");
  wrap.className = "ui-number";
  input.parentNode.insertBefore(wrap, input);
  wrap.append(input);

  const decBtn = doc.createElement("button");
  decBtn.type = "button";
  decBtn.className = "ui-number__btn ui-number__btn--dec";
  decBtn.setAttribute("aria-label", "Decrease value");
  decBtn.innerHTML = SVG_MINUS;

  const incBtn = doc.createElement("button");
  incBtn.type = "button";
  incBtn.className = "ui-number__btn ui-number__btn--inc";
  incBtn.setAttribute("aria-label", "Increase value");
  incBtn.innerHTML = SVG_PLUS;

  wrap.prepend(decBtn);
  wrap.append(incBtn);

  const stepValue = (delta) => {
    const step = Number(input.step) || 1;
    const min = input.min !== "" ? Number(input.min) : -Infinity;
    const max = input.max !== "" ? Number(input.max) : Infinity;
    const base = min === -Infinity ? 0 : min;
    const current = input.value === "" ? (delta > 0 ? base - step : base) : Number(input.value);
    const next = Math.min(max, Math.max(min, current + delta * step));
    if (String(next) !== input.value) {
      input.value = String(next);
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.dispatchEvent(new Event("change", { bubbles: true }));
    }
  };

  decBtn.addEventListener("click", () => stepValue(-1));
  incBtn.addEventListener("click", () => stepValue(1));
}

/* ==========================================================================
   Custom Confirm Dialog (replaces window.confirm)
   ========================================================================== */

export function confirmDialog({
  title = "Are you sure?",
  message = "",
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  tone = "primary",
} = {}) {
  return new Promise((resolve) => {
    const previouslyFocused = document.activeElement;
    const backdrop = document.createElement("div");
    backdrop.className = "ui-dialog-backdrop";

    const titleId = nextUid("ui-dialog-title");
    const descId = nextUid("ui-dialog-desc");

    backdrop.innerHTML = `
      <div class="ui-dialog" role="alertdialog" aria-modal="true" aria-labelledby="${titleId}"${message ? ` aria-describedby="${descId}"` : ""}>
        <h2 class="ui-dialog__title" id="${titleId}"></h2>
        ${message ? `<p class="ui-dialog__message" id="${descId}"></p>` : ""}
        <div class="ui-dialog__actions">
          <button type="button" class="btn btn--ghost btn--small" data-dialog-cancel></button>
          <button type="button" class="btn btn--${tone === "danger" ? "danger" : "primary"} btn--small" data-dialog-confirm></button>
        </div>
      </div>
    `;

    backdrop.querySelector(".ui-dialog__title").textContent = title;
    if (message) backdrop.querySelector(".ui-dialog__message").textContent = message;
    const cancelBtn = backdrop.querySelector("[data-dialog-cancel]");
    const confirmBtn = backdrop.querySelector("[data-dialog-confirm]");
    cancelBtn.textContent = cancelLabel;
    confirmBtn.textContent = confirmLabel;

    let settled = false;
    const finish = (result) => {
      if (settled) return;
      settled = true;
      document.removeEventListener("keydown", onKeydown);
      backdrop.remove();
      if (previouslyFocused && typeof previouslyFocused.focus === "function") {
        previouslyFocused.focus();
      }
      resolve(result);
    };

    const onKeydown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        finish(false);
      } else if (event.key === "Tab") {
        const focusables = [cancelBtn, confirmBtn];
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };

    backdrop.addEventListener("click", (event) => {
      if (event.target === backdrop) finish(false);
    });
    cancelBtn.addEventListener("click", () => finish(false));
    confirmBtn.addEventListener("click", () => finish(true));
    document.addEventListener("keydown", onKeydown);

    document.body.append(backdrop);
    confirmBtn.focus();
  });
}

/* ==========================================================================
   Public entry point
   ========================================================================== */

export function enhanceControls(root = document) {
  if (!root || typeof document === "undefined") return;
  const doc = root.nodeType === 9 ? root : root.ownerDocument || document;
  bindGlobalListeners(doc);
  root.querySelectorAll("select.select").forEach(enhanceSelect);
  root.querySelectorAll('input.input[type="date"]').forEach(enhanceDate);
  root.querySelectorAll('input.input[type="search"]').forEach(enhanceSearch);
  root.querySelectorAll('input.input[type="number"]').forEach(enhanceNumber);
}

export function observeControls(doc = document) {
  const body = doc?.body;
  const MO = getMutationObserver(doc);
  if (!body || !MO || observedBodies.has(body)) return;
  observedBodies.add(body);

  const observer = new MO((mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (!node || node.nodeType !== 1) continue;
        if (node.matches("select.select")) enhanceSelect(node);
        else if (node.matches('input.input[type="date"]')) enhanceDate(node);
        else if (node.matches('input.input[type="search"]')) enhanceSearch(node);
        else if (node.matches('input.input[type="number"]')) enhanceNumber(node);
        if (node.querySelector) {
          enhanceControls(node);
        }
      }
    }
  });
  observer.observe(body, { childList: true, subtree: true });
}
