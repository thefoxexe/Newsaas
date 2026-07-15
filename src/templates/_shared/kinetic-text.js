// Shared kinetic-typography renderer, concatenated into every template
// alongside timeline.css by load-template.ts/render-html.ts. Replaces each
// template's old ~20-line renderSceneText (whole-line fade) with a
// per-unit (letter or word) staggered reveal, reusing the exact same
// indexOf-based highlight-substring split every template already relied on.
//
// Empirically validated this session (3x concurrent-render MD5-identical
// captures, ~15.5s per 450-frame render) at the worst-case scale this
// system can produce: 48 chars (SHARED_TEMPLATE_TEXT_CONSTRAINTS.scene.
// maxChars) x 4 simultaneously-DOM-present scenes = 192 live Animation
// objects driven by the same pause-then-seek(.currentTime=ms) mechanism
// every other animation in these templates uses — safe and fast enough,
// no word-level fallback needed.
//
// opacity + translateY + scale only (the .kt-unit keyframe lives in each
// template's own style.css, not here, so each template can tune the exact
// feel) — same safe-for-determinism family as everything else in this
// renderer.
window.__reeljoltRenderKineticText = function (el, scene, config) {
  var splitUnit = config.splitUnit; // "char" | "word"
  var highlightTag = config.highlightTag; // "span" | "em"
  var highlightClass = config.highlightClass; // usually "hl"

  // A hard ceiling independent of the validated 192-unit scale above — if
  // maxChars is ever raised, unstaggered units beyond this just render at
  // their final (revealed) state rather than silently exceeding whatever
  // scale was last actually measured.
  var SAFE_UNIT_CEILING = 60;
  var BASE_STAGGER_MS = 35;

  function cssMs(varName) {
    var raw = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
    var value = parseFloat(raw);
    return isNaN(value) ? 0 : value;
  }

  var text = scene.text;
  var highlight = scene.highlight;
  var hasHighlight = Boolean(highlight) && text.indexOf(highlight) !== -1;

  var idx = hasHighlight ? text.indexOf(highlight) : -1;
  var before = hasHighlight ? text.slice(0, idx) : text;
  var hl = hasHighlight ? text.slice(idx, idx + highlight.length) : "";
  var after = hasHighlight ? text.slice(idx + highlight.length) : "";

  function tokenize(segment) {
    if (segment.length === 0) return [];
    if (splitUnit === "word") {
      return segment.split(/(\s+)/).filter(function (token) {
        return token.length > 0;
      });
    }
    return segment.split("");
  }

  function isWhitespace(token) {
    return /^\s+$/.test(token);
  }

  var beforeTokens = tokenize(before);
  var hlTokens = tokenize(hl);
  var afterTokens = tokenize(after);

  function countUnits(tokens) {
    var count = 0;
    for (var i = 0; i < tokens.length; i += 1) {
      if (!isWhitespace(tokens[i])) count += 1;
    }
    return count;
  }

  var totalUnits = countUnits(beforeTokens) + countUnits(hlTokens) + countUnits(afterTokens);

  // Timeline anchoring: stagger starts once the scene's own block
  // transition (scene-in, panel wipe, drift-in, whatever this template
  // uses) has settled, and self-scales so the last unit's pop never runs
  // past this scene's own exit — read entirely from the shared CSS vars
  // (see _shared/timeline.css) rather than duplicating the timeline here.
  var role = scene.role;
  var roleStartMs = cssMs("--tl-" + role + "-start");
  var inDurMs = cssMs("--tl-in-dur");
  var outDurMs = cssMs("--tl-out-dur");
  var nextStartVar = { hook: "--tl-proof-start", proof: "--tl-feature-start", feature: "--tl-cta-start" }[role];
  var windowEndMs = nextStartVar ? cssMs(nextStartVar) : cssMs("--tl-total-duration");
  var sceneWindowMs = Math.max(0, windowEndMs - roleStartMs - inDurMs - outDurMs);

  var staggerMs = totalUnits > 0 ? Math.min(BASE_STAGGER_MS, sceneWindowMs / totalUnits) : BASE_STAGGER_MS;
  var baseDelayMs = roleStartMs + inDurMs;

  var unitIndex = 0;

  function appendTokens(target, tokens) {
    for (var i = 0; i < tokens.length; i += 1) {
      var token = tokens[i];
      if (isWhitespace(token)) {
        target.appendChild(document.createTextNode(token));
        continue;
      }
      if (unitIndex >= SAFE_UNIT_CEILING) {
        target.appendChild(document.createTextNode(token));
        unitIndex += 1;
        continue;
      }
      var span = document.createElement("span");
      span.className = "kt-unit";
      span.textContent = token;
      span.style.animationDelay = baseDelayMs + unitIndex * staggerMs + "ms";
      unitIndex += 1;
      target.appendChild(span);
    }
  }

  el.textContent = "";
  appendTokens(el, beforeTokens);

  if (hasHighlight) {
    var wrapper = document.createElement(highlightTag);
    wrapper.className = highlightClass;
    appendTokens(wrapper, hlTokens);
    el.appendChild(wrapper);
    appendTokens(el, afterTokens);
  }
};
