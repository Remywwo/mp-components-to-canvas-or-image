"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/miniapp-runtime/plugin-entry.ts
var plugin_entry_exports = {};
__export(plugin_entry_exports, {
  compileCanvasCommands: () => compileCanvasCommands,
  compileWxmlToHtml: () => compileWxmlToHtml,
  createShareCardRenderer: () => createShareCardRenderer,
  renderCanvasCommands: () => renderCanvasCommands,
  resolveCanvasResources: () => resolveCanvasResources
});
module.exports = __toCommonJS(plugin_entry_exports);

// src/miniapp-runtime/template.ts
var supportedTags = /* @__PURE__ */ new Set(["view", "text", "image"]);
var selfClosingTags = /* @__PURE__ */ new Set(["image"]);
var supportedAttributes = {
  view: /* @__PURE__ */ new Set(["id", "class", "style"]),
  text: /* @__PURE__ */ new Set(["id", "class", "style", "selectable", "space", "decode"]),
  image: /* @__PURE__ */ new Set(["id", "class", "style", "src", "mode"])
};
var propertyMap = {
  width: "width",
  height: "height",
  "min-width": "minWidth",
  "min-height": "minHeight",
  "max-width": "maxWidth",
  "max-height": "maxHeight",
  padding: "padding",
  "padding-top": "paddingTop",
  "padding-right": "paddingRight",
  "padding-bottom": "paddingBottom",
  "padding-left": "paddingLeft",
  margin: "margin",
  "margin-top": "marginTop",
  "margin-right": "marginRight",
  "margin-bottom": "marginBottom",
  "margin-left": "marginLeft",
  gap: "gap",
  display: "display",
  "flex-direction": "flexDirection",
  "justify-content": "justifyContent",
  "align-items": "alignItems",
  "align-self": "alignSelf",
  "flex-grow": "flexGrow",
  "flex-shrink": "flexShrink",
  "flex-basis": "flexBasis",
  position: "position",
  top: "top",
  right: "right",
  bottom: "bottom",
  left: "left",
  background: "background",
  "background-color": "backgroundColor",
  color: "color",
  opacity: "opacity",
  "border-radius": "borderRadius",
  "border-width": "borderWidth",
  "border-color": "borderColor",
  "border-style": "borderStyle",
  "box-shadow": "boxShadow",
  overflow: "overflow",
  "font-size": "fontSize",
  "font-family": "fontFamily",
  "font-weight": "fontWeight",
  "font-style": "fontStyle",
  "line-height": "lineHeight",
  "text-align": "textAlign",
  "letter-spacing": "letterSpacing",
  "object-fit": "objectFit"
};
var enumValues = {
  display: /* @__PURE__ */ new Set(["flex", "block", "inline-block", "none"]),
  flexDirection: /* @__PURE__ */ new Set(["row", "row-reverse", "column", "column-reverse"]),
  justifyContent: /* @__PURE__ */ new Set(["flex-start", "flex-end", "center", "space-between", "space-around", "space-evenly"]),
  alignItems: /* @__PURE__ */ new Set(["stretch", "flex-start", "flex-end", "center", "baseline"]),
  alignSelf: /* @__PURE__ */ new Set(["auto", "stretch", "flex-start", "flex-end", "center", "baseline"]),
  position: /* @__PURE__ */ new Set(["static", "relative", "absolute", "fixed"]),
  borderStyle: /* @__PURE__ */ new Set(["solid", "dashed", "dotted", "none"]),
  overflow: /* @__PURE__ */ new Set(["hidden", "visible"]),
  fontStyle: /* @__PURE__ */ new Set(["normal", "italic"]),
  textAlign: /* @__PURE__ */ new Set(["left", "center", "right"]),
  objectFit: /* @__PURE__ */ new Set(["cover", "contain", "fill"])
};
function compileTemplate(input) {
  const context = {
    data: input.data ?? {},
    mode: input.mode ?? "strict",
    warnings: []
  };
  return {
    root: parseWxml(input.wxml, context),
    styles: parseWxss(input.wxss, context),
    warnings: context.warnings
  };
}
function parseWxml(wxml, context) {
  const roots = [];
  const stack = [];
  const tokenPattern = /<!--[\s\S]*?-->|<\/?[a-zA-Z][\w:-]*(?:\s+[^<>]*?)?\s*\/?>|[^<]+/g;
  let lastIndex = 0;
  let unsupportedDepth = 0;
  let match;
  while (match = tokenPattern.exec(wxml)) {
    if (match.index !== lastIndex && wxml.slice(lastIndex, match.index).trim()) {
      fail(context, "Malformed WXML near unsupported markup.");
    }
    lastIndex = tokenPattern.lastIndex;
    const token = match[0];
    if (token.startsWith("<!--")) {
      continue;
    }
    if (unsupportedDepth > 0) {
      if (token.startsWith("</")) {
        unsupportedDepth -= 1;
      } else if (token.startsWith("<") && !token.endsWith("/>")) {
        unsupportedDepth += 1;
      }
      continue;
    }
    if (token.startsWith("</")) {
      const tag = token.slice(2, -1).trim();
      closeTag(tag, stack, context);
      continue;
    }
    if (token.startsWith("<")) {
      const isSelfClosing = token.endsWith("/>");
      const tagMatch = token.match(/^<([a-zA-Z][\w:-]*)([\s\S]*?)\/?>$/);
      if (!tagMatch) {
        fail(context, "Malformed WXML tag.");
        continue;
      }
      const [, tagName, rawAttrs] = tagMatch;
      if (!supportedTags.has(tagName) && context.mode === "loose") {
        fail(context, `Unsupported WXML tag <${tagName}>.`);
        if (!isSelfClosing) {
          unsupportedDepth = 1;
        }
        continue;
      }
      const node = createNode(tagName, rawAttrs, context);
      if (!node) {
        continue;
      }
      appendNode(node, stack, roots);
      if (!isSelfClosing && !selfClosingTags.has(node.tag)) {
        stack.push(node);
      }
      continue;
    }
    appendText(token, stack, context);
  }
  if (lastIndex !== wxml.length && wxml.slice(lastIndex).trim()) {
    fail(context, "Malformed WXML near trailing content.");
  }
  if (stack.length > 0) {
    fail(context, `Unclosed WXML tag <${stack[stack.length - 1].tag}>.`);
  }
  if (roots.length !== 1) {
    fail(context, "WXML template must contain exactly one root node.");
  }
  return roots[0];
}
function closeTag(tag, stack, context) {
  const current = stack.pop();
  if (!current || current.tag !== tag) {
    fail(context, `Mismatched closing tag </${tag}>.`);
  }
}
function createNode(tagName, rawAttrs, context) {
  if (!supportedTags.has(tagName)) {
    fail(context, `Unsupported WXML tag <${tagName}>.`);
    return null;
  }
  const tag = tagName;
  const attrs = parseAttributes(rawAttrs, tag, context);
  return {
    tag,
    attrs,
    children: []
  };
}
function parseAttributes(rawAttrs, tag, context) {
  const attrs = {};
  const attrPattern = /([:@\w-]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>/]+)))?/g;
  let match;
  while (match = attrPattern.exec(rawAttrs)) {
    const name = match[1];
    const value = match[2] ?? match[3] ?? match[4] ?? "true";
    if (!supportedAttributes[tag].has(name)) {
      fail(context, `Unsupported WXML attribute "${name}" on <${tag}>.`);
      continue;
    }
    attrs[name] = resolveBindings(value, context.data);
  }
  return attrs;
}
function appendNode(node, stack, roots) {
  const parent = stack[stack.length - 1];
  if (parent) {
    parent.children.push(node);
    return;
  }
  roots.push(node);
}
function appendText(rawText, stack, context) {
  const text = resolveBindings(rawText, context.data).replace(/\s+/g, " ").trim();
  if (!text) {
    return;
  }
  const parent = stack[stack.length - 1];
  if (!parent) {
    fail(context, "Text content must be inside a supported WXML node.");
    return;
  }
  if (parent.tag === "text") {
    parent.text = parent.text ? `${parent.text}${text}` : text;
    return;
  }
  parent.children.push({
    tag: "text",
    attrs: {},
    children: [],
    text
  });
}
function parseWxss(wxss, context) {
  const rules = [];
  const source = wxss.replace(/\/\*[\s\S]*?\*\//g, "");
  const rulePattern = /([^{}]+)\{([^{}]*)\}/g;
  let match;
  while (match = rulePattern.exec(source)) {
    const selector = match[1].trim().replace(/\s+/g, " ");
    if (!selector) {
      continue;
    }
    rules.push({
      selector,
      declarations: parseDeclarations(selector, match[2], context)
    });
  }
  return rules;
}
function parseDeclarations(selector, body, context) {
  const declarations = {};
  for (const declaration of body.split(";")) {
    const [rawProperty, ...rawValueParts] = declaration.split(":");
    const property = rawProperty?.trim();
    const rawValue = rawValueParts.join(":").trim();
    if (!property || !rawValue) {
      continue;
    }
    const normalizedProperty = property.toLowerCase();
    const outputProperty = propertyMap[normalizedProperty];
    if (!outputProperty) {
      fail(context, `Unsupported WXSS property "${normalizedProperty}" in selector "${selector}".`);
      continue;
    }
    const parsedValue = parseStyleValue(outputProperty, rawValue, selector, context);
    if (parsedValue !== void 0) {
      declarations[outputProperty] = parsedValue;
    }
  }
  return declarations;
}
function parseStyleValue(property, rawValue, selector, context) {
  const value = rawValue.trim();
  const allowedEnum = enumValues[property];
  if (allowedEnum) {
    if (!allowedEnum.has(value)) {
      fail(context, `Unsupported WXSS value "${value}" for "${toKebabCase(property)}" in selector "${selector}".`);
      return void 0;
    }
    return value;
  }
  if (property === "fontWeight") {
    const numericWeight = Number(value);
    return Number.isNaN(numericWeight) ? value : numericWeight;
  }
  if (property === "opacity" || property === "flexGrow" || property === "flexShrink" || property === "lineHeight") {
    const numericValue = Number(value);
    if (!Number.isNaN(numericValue)) {
      return numericValue;
    }
  }
  if (property === "padding" || property === "margin") {
    const lengths = value.split(/\s+/).map(parseLength);
    if (lengths.every(Boolean) && lengths.length >= 1 && lengths.length <= 4) {
      return lengths;
    }
  }
  const length = parseLength(value);
  if (length) {
    return length;
  }
  return value;
}
function parseLength(value) {
  const match = value.match(/^(-?\d+(?:\.\d+)?)(px|rpx|%)$/);
  if (!match) {
    return null;
  }
  return {
    value: Number(match[1]),
    unit: match[2]
  };
}
function resolveBindings(value, data) {
  return value.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_, path) => {
    const resolved = path.split(".").reduce((current, key) => {
      if (current && typeof current === "object" && key in current) {
        return current[key];
      }
      return "";
    }, data);
    return resolved == null ? "" : String(resolved);
  });
}
function fail(context, message) {
  if (context.mode === "strict") {
    throw new Error(message);
  }
  context.warnings.push(message);
}
function toKebabCase(value) {
  return value.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
}

// src/miniapp-runtime/dsl.ts
var inheritedProperties = /* @__PURE__ */ new Set([
  "color",
  "fontSize",
  "fontFamily",
  "fontWeight",
  "fontStyle",
  "lineHeight",
  "letterSpacing",
  "textAlign"
]);
function compileDsl(input) {
  const compiled = compileTemplate(input);
  const context = {
    mode: input.mode ?? "strict",
    viewportWidth: input.viewportWidth ?? 375,
    warnings: [...compiled.warnings]
  };
  const selectors = compiled.styles.flatMap((rule, index) => parseSelectorList(rule, index, context)).filter((selector) => selector !== null);
  return {
    tree: buildRenderNode(compiled.root, [], {}, selectors, context),
    warnings: context.warnings
  };
}
function buildRenderNode(node, ancestors, inheritedStyle, selectors, context) {
  const style = computeStyle(node, ancestors, inheritedStyle, selectors, context);
  const childInheritedStyle = pickInheritedStyle(style);
  return {
    tag: node.tag,
    attrs: node.attrs,
    text: node.text,
    style,
    children: node.children.map(
      (child) => buildRenderNode(child, [...ancestors, node], childInheritedStyle, selectors, context)
    )
  };
}
function computeStyle(node, ancestors, inheritedStyle, selectors, context) {
  const winning = /* @__PURE__ */ new Map();
  for (const selector of selectors) {
    if (!matchesSelector(node, ancestors, selector.parts)) {
      continue;
    }
    for (const [property, value] of Object.entries(selector.declarations)) {
      const current = winning.get(property);
      if (!current || compareSpecificity(selector.specificity, current.specificity) >= 0) {
        winning.set(property, {
          value,
          specificity: selector.specificity,
          order: selector.order
        });
      } else if (compareSpecificity(selector.specificity, current.specificity) === 0 && selector.order > current.order) {
        winning.set(property, {
          value,
          specificity: selector.specificity,
          order: selector.order
        });
      }
    }
  }
  const inlineStyle = node.attrs.style ? parseInlineStyle(node.attrs.style, context) : {};
  for (const [property, value] of Object.entries(inlineStyle)) {
    winning.set(property, {
      value,
      specificity: [1, 0, 0],
      order: Number.MAX_SAFE_INTEGER
    });
  }
  const style = { ...inheritedStyle };
  for (const [property, entry] of winning.entries()) {
    style[property] = normalizeStyleValue(entry.value, context);
  }
  return style;
}
function parseSelectorList(rule, order, context) {
  return rule.selector.split(",").map((selector) => selector.trim()).filter(Boolean).map((selector) => parseSelector(selector, rule, order, context));
}
function parseSelector(selector, rule, order, context) {
  if (!selector || /[>+~:[\]*]/.test(selector)) {
    fail2(context, `Unsupported WXSS selector "${selector}".`);
    return null;
  }
  const parts = selector.split(/\s+/).map((part) => parseSelectorPart(part, context));
  if (parts.some((part) => part === null)) {
    return null;
  }
  return {
    raw: selector,
    parts,
    specificity: calculateSpecificity(parts),
    order,
    declarations: rule.declarations
  };
}
function parseSelectorPart(rawPart, context) {
  const tagMatch = rawPart.match(/^[a-zA-Z][\w-]*/);
  const idMatches = [...rawPart.matchAll(/#([\w-]+)/g)].map((match) => match[1]);
  const classMatches = [...rawPart.matchAll(/\.([\w-]+)/g)].map((match) => match[1]);
  const consumed = `${tagMatch?.[0] ?? ""}${idMatches.map((id) => `#${id}`).join("")}${classMatches.map((className) => `.${className}`).join("")}`;
  if (!rawPart || consumed.length !== rawPart.length || idMatches.length > 1) {
    fail2(context, `Unsupported WXSS selector "${rawPart}".`);
    return null;
  }
  return {
    tag: tagMatch?.[0],
    id: idMatches[0],
    classes: classMatches
  };
}
function matchesSelector(node, ancestors, parts) {
  if (!matchesPart(node, parts[parts.length - 1])) {
    return false;
  }
  let ancestorIndex = ancestors.length - 1;
  for (let partIndex = parts.length - 2; partIndex >= 0; partIndex -= 1) {
    let found = false;
    while (ancestorIndex >= 0) {
      if (matchesPart(ancestors[ancestorIndex], parts[partIndex])) {
        found = true;
        ancestorIndex -= 1;
        break;
      }
      ancestorIndex -= 1;
    }
    if (!found) {
      return false;
    }
  }
  return true;
}
function matchesPart(node, part) {
  const nodeClasses = new Set((node.attrs.class ?? "").split(/\s+/).filter(Boolean));
  return (!part.tag || node.tag === part.tag) && (!part.id || node.attrs.id === part.id) && part.classes.every((className) => nodeClasses.has(className));
}
function calculateSpecificity(parts) {
  return parts.reduce(
    (specificity, part) => [
      specificity[0] + (part.id ? 1 : 0),
      specificity[1] + part.classes.length,
      specificity[2] + (part.tag ? 1 : 0)
    ],
    [0, 0, 0]
  );
}
function compareSpecificity(left, right) {
  for (let index = 0; index < left.length; index += 1) {
    if (left[index] !== right[index]) {
      return left[index] - right[index];
    }
  }
  return 0;
}
function parseInlineStyle(style, context) {
  const declarations = {};
  for (const declaration of style.split(";")) {
    const [rawProperty, ...rawValueParts] = declaration.split(":");
    const property = normalizeProperty(rawProperty?.trim());
    const value = rawValueParts.join(":").trim();
    if (!property || !value) {
      continue;
    }
    declarations[property] = parseInlineValue(value);
  }
  return declarations;
}
function normalizeProperty(property) {
  if (!property) {
    return "";
  }
  return property.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
}
function parseInlineValue(value) {
  const length = parseLength2(value);
  if (length) {
    return length;
  }
  const lengths = value.split(/\s+/).map(parseLength2);
  if (lengths.length > 1 && lengths.every(Boolean)) {
    return lengths;
  }
  const numericValue = Number(value);
  return Number.isNaN(numericValue) ? value : numericValue;
}
function normalizeStyleValue(value, context) {
  if (Array.isArray(value)) {
    return value.map((item) => normalizeLength(item, context));
  }
  if (isLength(value)) {
    return normalizeLength(value, context);
  }
  return value;
}
function normalizeLength(length, context) {
  if (length.unit === "rpx") {
    return length.value / 750 * context.viewportWidth;
  }
  if (length.unit === "%") {
    return `${length.value}%`;
  }
  return length.value;
}
function parseLength2(value) {
  const match = value.match(/^(-?\d+(?:\.\d+)?)(px|rpx|%)$/);
  if (!match) {
    return null;
  }
  return {
    value: Number(match[1]),
    unit: match[2]
  };
}
function isLength(value) {
  return typeof value === "object" && value !== null && "value" in value && "unit" in value;
}
function pickInheritedStyle(style) {
  return Object.fromEntries(Object.entries(style).filter(([property]) => inheritedProperties.has(property)));
}
function fail2(context, message) {
  if (context.mode === "strict") {
    throw new Error(message);
  }
  context.warnings.push(message);
}

// src/miniapp-runtime/layout.ts
function compileLayout(input) {
  const dsl = compileDsl(input);
  const context = {
    viewportWidth: input.viewportWidth ?? 375
  };
  return {
    box: layoutNode(dsl.tree, 0, 0, context.viewportWidth, context),
    warnings: dsl.warnings
  };
}
function layoutNode(node, x, y, availableWidth, context) {
  const width = getNumber(node.style.width, availableWidth);
  const padding = getEdges(node.style.padding);
  const contentWidth = Math.max(0, width - padding.left - padding.right);
  const explicitHeight = getOptionalNumber(node.style.height);
  const children = node.children.length === 0 ? [] : layoutChildren(node, x + padding.left, y + padding.top, contentWidth, context);
  const contentHeight = node.tag === "text" ? measureTextHeight(node.text ?? "", contentWidth, node.style) : calculateChildrenHeight(node, children, padding);
  const height = explicitHeight ?? contentHeight + padding.top + padding.bottom;
  return {
    tag: node.tag,
    attrs: node.attrs,
    text: node.text,
    style: node.style,
    x,
    y,
    width,
    height,
    children: alignChildren(node, children, x, y, width, height, padding)
  };
}
function layoutChildren(node, contentX, contentY, contentWidth, context) {
  const direction = node.style.flexDirection === "row" ? "row" : "column";
  const gap = getOptionalNumber(node.style.gap) ?? 0;
  let cursorX = contentX;
  let cursorY = contentY;
  const children = [];
  for (const child of node.children) {
    const childBox = layoutNode(child, cursorX, cursorY, getNumber(child.style.width, contentWidth), context);
    children.push(childBox);
    if (direction === "row") {
      cursorX += childBox.width + gap;
    } else {
      cursorY += childBox.height + gap;
    }
  }
  return children;
}
function alignChildren(node, children, x, y, width, height, padding) {
  if (node.style.flexDirection !== "row" || node.style.alignItems !== "center") {
    return children;
  }
  const contentHeight = Math.max(0, height - padding.top - padding.bottom);
  return children.map((child) => ({
    ...child,
    y: y + padding.top + (contentHeight - child.height) / 2
  }));
}
function calculateChildrenHeight(node, children, padding) {
  if (children.length === 0) {
    return getOptionalNumber(node.style.height) ?? 0;
  }
  if (node.style.flexDirection === "row") {
    return Math.max(...children.map((child) => child.height));
  }
  const first = children[0];
  const last = children[children.length - 1];
  return last.y + last.height - first.y;
}
function measureTextHeight(text, width, style) {
  const fontSize = getOptionalNumber(style.fontSize) ?? 16;
  const lineHeight = resolveLineHeight(style.lineHeight, fontSize);
  const lineCount = measureTextLineCount(text, width, fontSize);
  return round(lineCount * lineHeight);
}
function measureTextLineCount(text, width, fontSize) {
  if (!text) {
    return 1;
  }
  let lineCount = 1;
  let currentWidth = 0;
  for (const char of text) {
    const charWidth = estimateCharWidth(char, fontSize);
    if (currentWidth > 0 && currentWidth + charWidth > width) {
      lineCount += 1;
      currentWidth = charWidth;
      continue;
    }
    currentWidth += charWidth;
  }
  return lineCount;
}
function estimateCharWidth(char, fontSize) {
  return isFullWidthChar(char) ? fontSize : fontSize * 0.56;
}
function isFullWidthChar(char) {
  return /[\u1100-\u115f\u2e80-\u9fff\uf900-\ufaff\uff00-\uffef]/u.test(char);
}
function resolveLineHeight(value, fontSize) {
  if (typeof value === "number") {
    return value <= 4 ? value * fontSize : value;
  }
  return fontSize * 1.2;
}
function getEdges(value) {
  if (!Array.isArray(value)) {
    const edge = getNumber(value, 0);
    return { top: edge, right: edge, bottom: edge, left: edge };
  }
  const [top, right = top, bottom = top, left = right] = value;
  return {
    top: getNumber(top, 0),
    right: getNumber(right, 0),
    bottom: getNumber(bottom, 0),
    left: getNumber(left, 0)
  };
}
function getNumber(value, fallback) {
  if (typeof value === "string" && value.endsWith("%")) {
    return Number(value.slice(0, -1)) / 100 * fallback;
  }
  return typeof value === "number" ? value : fallback;
}
function getOptionalNumber(value) {
  return typeof value === "number" ? value : void 0;
}
function round(value) {
  return Math.round(value * 1e3) / 1e3;
}

// src/miniapp-runtime/canvas.ts
function compileCanvasCommands(input) {
  const layout = compileLayout(input);
  return {
    ...layout,
    commands: collectCommands(layout.box)
  };
}
function collectCommands(box) {
  const commands = [];
  const background = getBackground(box);
  if (background) {
    commands.push({
      type: "rect",
      x: box.x,
      y: box.y,
      width: box.width,
      height: box.height,
      fill: background,
      radius: getNumber2(box.style.borderRadius, 0)
    });
  }
  if (box.tag === "text" && box.text) {
    const fontSize = getNumber2(box.style.fontSize, 16);
    const lineHeight = resolveLineHeight2(box.style.lineHeight, fontSize);
    commands.push({
      type: "text",
      text: box.text,
      lines: wrapText(box.text, box.width, fontSize),
      x: box.x,
      y: box.y,
      width: box.width,
      height: box.height,
      color: getString(box.style.color, "#000000"),
      fontSize,
      fontWeight: getStringOrNumber(box.style.fontWeight, 400),
      lineHeight,
      fontFamily: getString(box.style.fontFamily, "sans-serif"),
      textAlign: getString(box.style.textAlign, "left")
    });
  }
  if (box.tag === "image") {
    commands.push({
      type: "image",
      src: box.attrs.src ?? "",
      x: box.x,
      y: box.y,
      width: box.width,
      height: box.height,
      objectFit: resolveObjectFit(box),
      radius: getNumber2(box.style.borderRadius, 0)
    });
  }
  for (const child of box.children) {
    commands.push(...collectCommands(child));
  }
  return commands.map(roundCommand);
}
function getBackground(box) {
  return getOptionalString(box.style.backgroundColor) ?? getOptionalString(box.style.background);
}
function resolveObjectFit(box) {
  const styleFit = getOptionalString(box.style.objectFit);
  if (styleFit === "cover" || styleFit === "contain" || styleFit === "fill") {
    return styleFit;
  }
  if (box.attrs.mode === "aspectFit") {
    return "contain";
  }
  if (box.attrs.mode === "aspectFill") {
    return "cover";
  }
  return "fill";
}
function resolveLineHeight2(value, fontSize) {
  if (typeof value === "number") {
    return value <= 4 ? value * fontSize : value;
  }
  return fontSize * 1.2;
}
function getNumber2(value, fallback) {
  return typeof value === "number" ? value : fallback;
}
function getString(value, fallback) {
  return typeof value === "string" ? value : fallback;
}
function getOptionalString(value) {
  return typeof value === "string" ? value : void 0;
}
function getStringOrNumber(value, fallback) {
  return typeof value === "string" || typeof value === "number" ? value : fallback;
}
function roundCommand(command) {
  return Object.fromEntries(
    Object.entries(command).map(([key, value]) => [key, typeof value === "number" ? round2(value) : value])
  );
}
function round2(value) {
  return Math.round(value * 1e3) / 1e3;
}
function wrapText(text, width, fontSize) {
  const lines = [];
  let currentLine = "";
  let currentWidth = 0;
  for (const char of text) {
    const charWidth = estimateCharWidth2(char, fontSize);
    if (currentLine && currentWidth + charWidth > width) {
      lines.push(currentLine);
      currentLine = char;
      currentWidth = charWidth;
      continue;
    }
    currentLine += char;
    currentWidth += charWidth;
  }
  if (currentLine) {
    lines.push(currentLine);
  }
  return lines.length > 0 ? lines : [""];
}
function estimateCharWidth2(char, fontSize) {
  return isFullWidthChar2(char) ? fontSize : fontSize * 0.56;
}
function isFullWidthChar2(char) {
  return /[\u1100-\u115f\u2e80-\u9fff\uf900-\ufaff\uff00-\uffef]/u.test(char);
}

// src/miniapp-runtime/renderer.ts
function renderCanvasCommands(context, commands) {
  for (const command of commands) {
    if (command.type === "rect") {
      drawRect(context, command);
    } else if (command.type === "text") {
      drawText(context, command);
    } else {
      drawImage(context, command);
    }
  }
}
function drawRect(context, command) {
  setFillStyle(context, command.fill);
  drawRoundedPath(context, command.x, command.y, command.width, command.height, command.radius);
  context.fill?.();
}
function drawText(context, command) {
  setFillStyle(context, command.color);
  setFont(context, command);
  setTextAlign(context, command.textAlign);
  setTextBaseline(context, "top");
  command.lines.forEach((line, index) => {
    context.fillText?.(line, command.x, command.y + index * command.lineHeight);
  });
}
function drawImage(context, command) {
  context.save?.();
  drawRoundedPath(context, command.x, command.y, command.width, command.height, command.radius);
  context.clip?.();
  const drawArgs = getImageDrawArgs(command);
  context.drawImage?.(command.src, ...drawArgs);
  context.restore?.();
}
function getImageDrawArgs(command) {
  const sourceWidth = command.intrinsicWidth;
  const sourceHeight = command.intrinsicHeight;
  if (!sourceWidth || !sourceHeight || command.objectFit === "fill") {
    return [command.x, command.y, command.width, command.height];
  }
  if (command.objectFit === "contain") {
    const scale2 = Math.min(command.width / sourceWidth, command.height / sourceHeight);
    const drawnWidth = sourceWidth * scale2;
    const drawnHeight = sourceHeight * scale2;
    return [
      command.x + (command.width - drawnWidth) / 2,
      command.y + (command.height - drawnHeight) / 2,
      drawnWidth,
      drawnHeight
    ];
  }
  const scale = Math.max(command.width / sourceWidth, command.height / sourceHeight);
  const cropWidth = command.width / scale;
  const cropHeight = command.height / scale;
  const cropX = (sourceWidth - cropWidth) / 2;
  const cropY = (sourceHeight - cropHeight) / 2;
  return [cropX, cropY, cropWidth, cropHeight, command.x, command.y, command.width, command.height];
}
function drawRoundedPath(context, x, y, width, height, radius) {
  const safeRadius = Math.min(radius, width / 2, height / 2);
  context.beginPath?.();
  context.moveTo?.(x + safeRadius, y);
  context.lineTo?.(x + width - safeRadius, y);
  context.quadraticCurveTo?.(x + width, y, x + width, y + safeRadius);
  context.lineTo?.(x + width, y + height - safeRadius);
  context.quadraticCurveTo?.(x + width, y + height, x + width - safeRadius, y + height);
  context.lineTo?.(x + safeRadius, y + height);
  context.quadraticCurveTo?.(x, y + height, x, y + height - safeRadius);
  context.lineTo?.(x, y + safeRadius);
  context.quadraticCurveTo?.(x, y, x + safeRadius, y);
  context.closePath?.();
}
function setFillStyle(context, fill) {
  if (context.setFillStyle) {
    context.setFillStyle(fill);
  }
  context.fillStyle = fill;
}
function setFont(context, command) {
  context.setFontSize?.(command.fontSize);
  context.font = `${command.fontWeight} ${command.fontSize}px ${command.fontFamily}`;
}
function setTextAlign(context, align) {
  context.setTextAlign?.(align);
  context.textAlign = align;
}
function setTextBaseline(context, baseline) {
  context.setTextBaseline?.(baseline);
  context.textBaseline = baseline;
}

// src/miniapp-runtime/resources.ts
async function resolveCanvasResources(commands, options) {
  const mode = options.mode ?? "strict";
  const warnings = [];
  const cache = /* @__PURE__ */ new Map();
  const resources = [];
  async function getResource(src) {
    const cached = cache.get(src);
    if (cached) {
      return cached;
    }
    try {
      const resolved = await options.resolveImage(src);
      const resource = {
        kind: "image",
        src: resolved.src,
        drawable: resolved.drawable,
        width: resolved.width,
        height: resolved.height
      };
      cache.set(src, resource);
      resources.push(resource);
      return resource;
    } catch (error) {
      const message = `Failed to resolve image "${src}": ${error instanceof Error ? error.message : String(error)}`;
      if (mode === "strict") {
        throw new Error(message);
      }
      warnings.push(message);
      return null;
    }
  }
  const resolvedCommands = [];
  for (const command of commands) {
    if (command.type !== "image") {
      resolvedCommands.push(command);
      continue;
    }
    const resource = await getResource(String(command.src));
    resolvedCommands.push(resource ? applyImageResource(command, resource) : command);
  }
  return {
    commands: resolvedCommands,
    resources,
    warnings
  };
}
function applyImageResource(command, resource) {
  return {
    ...command,
    source: command.source ?? String(command.src),
    src: resource.drawable,
    intrinsicWidth: resource.width,
    intrinsicHeight: resource.height
  };
}

// src/miniapp-runtime/runtime.ts
function createShareCardRenderer(options = {}) {
  return {
    async render(input) {
      const compiled = compileCanvasCommands(input);
      const resolved = options.resolveImage ? await resolveCanvasResources(compiled.commands, {
        mode: input.mode,
        resolveImage: options.resolveImage
      }) : {
        commands: compiled.commands,
        resources: [],
        warnings: []
      };
      if (input.context) {
        renderCanvasCommands(input.context, resolved.commands);
      }
      return {
        box: compiled.box,
        commands: resolved.commands,
        resources: resolved.resources,
        warnings: [...compiled.warnings, ...resolved.warnings]
      };
    }
  };
}

// src/miniapp-runtime/html-dsl.ts
var tagMap = {
  view: "div",
  text: "span",
  image: "img"
};
function compileWxmlToHtml(input) {
  const template = compileTemplate(input);
  const css = renderCss(template.styles);
  const root = toHtmlNode(template.root);
  const html = renderHtml(root);
  return {
    dsl: {
      root,
      css
    },
    html,
    css,
    warnings: template.warnings
  };
}
function toHtmlNode(node) {
  const tag = tagMap[node.tag];
  const attrs = mapAttrs(node);
  return {
    tag,
    attrs,
    text: node.text,
    children: node.children.map(toHtmlNode)
  };
}
function mapAttrs(node) {
  const attrs = {};
  let mode;
  for (const [name, value] of Object.entries(node.attrs)) {
    if (name === "mode") {
      mode = value;
      continue;
    }
    attrs[name] = value;
  }
  if (node.tag === "image") {
    attrs.alt = attrs.alt ?? "";
  }
  attrs["data-wxml-tag"] = node.tag;
  if (mode) {
    attrs["data-wxml-mode"] = mode;
  }
  return attrs;
}
function renderHtml(node) {
  const attrs = renderAttrs(node.attrs);
  if (node.tag === "img") {
    return `<img${attrs} />`;
  }
  const text = node.text ? escapeHtml(node.text) : "";
  const children = node.children.map(renderHtml).join("");
  return `<${node.tag}${attrs}>${text}${children}</${node.tag}>`;
}
function renderAttrs(attrs) {
  const rendered = Object.entries(attrs).filter(([, value]) => value !== void 0).map(([name, value]) => `${name}="${escapeAttr(value)}"`);
  return rendered.length > 0 ? ` ${rendered.join(" ")}` : "";
}
function renderCss(rules) {
  return rules.map((rule) => {
    const declarations = Object.entries(rule.declarations).map(([property, value]) => `  ${toKebabCase2(property)}: ${renderStyleValue(value)};`).join("\n");
    return declarations ? `${rule.selector} {
${declarations}
}` : "";
  }).filter(Boolean).join("\n\n");
}
function renderStyleValue(value) {
  if (Array.isArray(value)) {
    return value.map(renderStyleValue).join(" ");
  }
  if (typeof value === "object" && value !== null && "value" in value && "unit" in value) {
    return `${value.value}${value.unit}`;
  }
  return String(value);
}
function escapeHtml(value) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function escapeAttr(value) {
  return escapeHtml(value).replace(/"/g, "&quot;");
}
function toKebabCase2(value) {
  return value.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
}
