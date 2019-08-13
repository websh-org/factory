export function copy(oldObj, ctx) {
  if (!oldObj) return oldObj;
  if (typeof oldObj === "object") {
    const newObj = Array.isArray(oldObj) ? [] : {};
    for (var i in oldObj) {
      newObj[i] = copy(oldObj[i], ctx);
    }
    return newObj;
  } else if (typeof oldObj === "function") {
    return ctx ? oldObj.bind(ctx) : oldObj;
  } else {
    return oldObj;
  }
}

export function uuid() {
  return Math.random()
    .toString(36)
    .substr(2);
}

export function assert(condition, message, data, log = false) {
  if (!condition) {
    if (log) console.error(message, data);
    throw new Error(message);
  }
}

export function flatsplit(str, sep = " ") {
  return [str]
    .flat()
    .join(sep)
    .split(sep)
    .filter(Boolean);
}

export function patch(original, changes, ctx, loose = false) {
  assert(typeof original === "object" && typeof changes === "object", "bad-args", { original, changes });
  for (const i in changes) {
    const match = i.match(/(?<head>^[^.]+)(?:(?<dot>[.])(?<tail>.*))?$/);
    const { head, tail, dot } = match.groups;
    if (tail) {
      if (loose && typeof original[head] !== 'object') {
        original[head] = {}
      }
      assert(head in original, "bad-key");
      patch(original[head], { [tail]: changes[i] }, ctx, loose);
    } else if (dot) {
      if (loose && typeof original[head] !== 'object') {
        original[head] = {}
      }
      patch(original[head], changes[i], ctx, loose);
    } else if (i === head) {
      original[i] = copy(changes[i], ctx);
    } else {
      assert(false, "cosmic-ray", { head, tail, dot });
    }
  }
  return original;
}

export function undot(changes, ctx) {
  return patch({}, changes, ctx, true);
}

const testing = {
  totalRun: 0,
  totalPassed: 0,
  groupRun: 0,
  groupPassed: 0,
  colors: {
    default: 0,
    red: 91,
    green: 92
  },
  log: typeof window === "undefined"  
    ? function (text, { color = "default", underline = false, overline = false } = {}) {
      if (overline) console.log("-".repeat(text.length))
      console.log(`\x1b[${this.colors[color]}m${text}\x1b[0m`);
      if (underline) console.log("-".repeat(text.length))
    } : function(text,{ color="black",underline=false, overline=false}={}){
      if (overline) document.body.appendChild(document.createElement("hr"))
      const el = document.createElement("div");
      el.style.color = color;
      if (text.trim()) el.innerText = text;
      else el.innerHTML = "&nbsp";
      document.body.appendChild(el);
      if (underline) document.body.appendChild(document.createElement("hr"))
    },
  testPass(text) {
    this.totalRun++;
    this.totalPassed++;
    this.groupRun++;
    this.groupPassed++;
    this.log(" ✔  " + text, { color: "green" });
  },
  testFail(text) {
    this.totalRun++;
    this.groupRun++;
    this.log(" ✘  " + text, { color: "red" });
  },
  startGroup(group) {
    if (this.currentGroup) this.endGroup();
    this.log(" ⛶  " + group, { underline: true });
    this.currentGroup = group;
    this.groupRun = 0;
    this.groupPassed = 0;
  },
  endGroup() {
    if (this.groupRun === this.groupPassed) {
      this.log(` ✔  ${this.currentGroup}: ${this.groupPassed}/${this.groupRun}`, { color: "green", overline: true })
    } else {
      this.log(` ✘  ${this.currentGroup}: ${this.groupPassed}/${this.groupRun}`, { color: "red", overline: true })
    }
    this.log(" ");
  },
  reportTotal() {
    if (this.currentGroup) this.endGroup();
    if (this.totalRun === this.totalPassed) {
      this.log(` PASS ${this.totalPassed}/${this.totalRun} tests passed.`, { color: "green", overline: true, underline: true })
    } else {
      this.log(` FAIL ${this.totalPassed}/${this.totalRun} tests passed.`, { color: "red", overline: true, underline: true })
    }
  },
  test(label, condition, value) {
    if (typeof condition === "function") {
      try {
        condition = condition();
      } catch (error) {
        return testFail(`${label}: ${String(error.message || error)}`);
      }
    }
    let conditionText = JSON.stringify(condition);

    if (typeof value === "function") {
      if (condition instanceof Error) {
        try {
          value = value();
          return this.testFail(`${label}: Not error "${String(condition.message || condition)}"`);
        } catch (error) {
          if ( condition.message === error.message) {
            return this.testPass(`${label}: Error "${error.message}"`);
          }
          return this.testFail(`${label}: Error: "${condition.message}" (${String(error.message || error)})`);
        }
      } else {
        try {
          value = value();
        } catch (error) {
          return this.testFail(`${label}: ${conditionText} (Uncaught error: ${String(error.message || error)})`);
        }
      }
    }
    let valueText = JSON.stringify(value);

    switch (arguments.length) {
      case 0:
        return this.reportTotal();
      case 1:
        return this.startGroup(label);
      case 2:
        if (condition) return this.testPass(label);
        return this.testFail(label);
      case 3:
        if (JSON.stringify(value) === JSON.stringify(condition)) {
          return this.testPass(`${label}: ${conditionText}`);
        }
        return this.testFail(`${label}: ${conditionText} (${valueText})`);
    }
  }
}


export const test = testing.test.bind(testing);

export function compose(outer,inner,ctx=this) {
  if (!inner) return outer;
  return (...args) => outer.call(ctx,inner.call(ctx,...args));
}

