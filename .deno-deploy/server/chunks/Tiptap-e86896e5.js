import { o as onDestroy } from './index-server-db57e4a7.js';
import { a as attr_class, s as stringify, a7 as bind_props, l as derived } from './dev-db1ab9cf.js';
import { c as PluginKey, P as Plugin, l as DecorationSet, m as Decoration, n as escapeForRegEx, E as Extension } from './index-8b3ef059.js';
import { c as contextEngine } from './contextEngine.svelte-fa9b4d62.js';
import { n as notifications } from './notifications-351a1541.js';
import { s as supabase } from './supabaseClient-824b9cb6.js';
import './BlockMetadata-4e11220d.js';
import './index-a7c7ef40.js';

// src/suggestion.ts
function findSuggestionMatch(config) {
  var _a;
  const { char, allowSpaces: allowSpacesOption, allowToIncludeChar, allowedPrefixes, startOfLine, $position } = config;
  const allowSpaces = allowSpacesOption && !allowToIncludeChar;
  const escapedChar = escapeForRegEx(char);
  const suffix = new RegExp(`\\s${escapedChar}$`);
  const prefix = startOfLine ? "^" : "";
  const finalEscapedChar = allowToIncludeChar ? "" : escapedChar;
  const regexp = allowSpaces ? new RegExp(`${prefix}${escapedChar}.*?(?=\\s${finalEscapedChar}|$)`, "gm") : new RegExp(`${prefix}(?:^)?${escapedChar}[^\\s${finalEscapedChar}]*`, "gm");
  const text = ((_a = $position.nodeBefore) == null ? void 0 : _a.isText) && $position.nodeBefore.text;
  if (!text) {
    return null;
  }
  const textFrom = $position.pos - text.length;
  const match = Array.from(text.matchAll(regexp)).pop();
  if (!match || match.input === void 0 || match.index === void 0) {
    return null;
  }
  const matchPrefix = match.input.slice(Math.max(0, match.index - 1), match.index);
  const matchPrefixIsAllowed = new RegExp(`^[${allowedPrefixes == null ? void 0 : allowedPrefixes.join("")}\0]?$`).test(matchPrefix);
  if (allowedPrefixes !== null && !matchPrefixIsAllowed) {
    return null;
  }
  const from = textFrom + match.index;
  let to = from + match[0].length;
  if (allowSpaces && suffix.test(text.slice(to - 1, to + 1))) {
    match[0] += " ";
    to += 1;
  }
  if (from < $position.pos && to >= $position.pos) {
    return {
      range: {
        from,
        to
      },
      query: match[0].slice(char.length),
      text: match[0]
    };
  }
  return null;
}

// src/suggestion.ts
function hasInsertedWhitespace(transaction) {
  if (!transaction.docChanged) {
    return false;
  }
  return transaction.steps.some((step) => {
    const slice = step.slice;
    if (!(slice == null ? void 0 : slice.content)) {
      return false;
    }
    const inserted = slice.content.textBetween(0, slice.content.size, "\n");
    return /\s/.test(inserted);
  });
}
var SuggestionPluginKey = new PluginKey("suggestion");
function Suggestion({
  pluginKey = SuggestionPluginKey,
  editor,
  char = "@",
  allowSpaces = false,
  allowToIncludeChar = false,
  allowedPrefixes = [" "],
  startOfLine = false,
  decorationTag = "span",
  decorationClass = "suggestion",
  decorationContent = "",
  decorationEmptyClass = "is-empty",
  command = () => null,
  items = () => [],
  render = () => ({}),
  allow = () => true,
  findSuggestionMatch: findSuggestionMatch2 = findSuggestionMatch,
  shouldShow,
  shouldResetDismissed
}) {
  let props;
  const renderer = render == null ? void 0 : render();
  const effectiveAllowSpaces = allowSpaces && !allowToIncludeChar;
  const getAnchorClientRect = () => {
    const pos = editor.state.selection.$anchor.pos;
    const coords = editor.view.coordsAtPos(pos);
    const { top, right, bottom, left } = coords;
    try {
      return new DOMRect(left, top, right - left, bottom - top);
    } catch {
      return null;
    }
  };
  const clientRectFor = (view, decorationNode) => {
    if (!decorationNode) {
      return getAnchorClientRect;
    }
    return () => {
      const state = pluginKey.getState(editor.state);
      const decorationId = state == null ? void 0 : state.decorationId;
      const currentDecorationNode = view.dom.querySelector(`[data-decoration-id="${decorationId}"]`);
      return (currentDecorationNode == null ? void 0 : currentDecorationNode.getBoundingClientRect()) || null;
    };
  };
  const shouldKeepDismissed = ({
    match,
    dismissedRange,
    state,
    transaction
  }) => {
    if (shouldResetDismissed == null ? void 0 : shouldResetDismissed({
      editor,
      state,
      range: dismissedRange,
      match,
      transaction,
      allowSpaces: effectiveAllowSpaces
    })) {
      return false;
    }
    if (effectiveAllowSpaces) {
      return match.range.from === dismissedRange.from;
    }
    return match.range.from === dismissedRange.from && !hasInsertedWhitespace(transaction);
  };
  function dispatchExit(view, pluginKeyRef) {
    var _a;
    try {
      const state = pluginKey.getState(view.state);
      const decorationNode = (state == null ? void 0 : state.decorationId) ? view.dom.querySelector(`[data-decoration-id="${state.decorationId}"]`) : null;
      const exitProps = {
        // @ts-ignore editor is available in closure
        editor,
        range: (state == null ? void 0 : state.range) || { from: 0, to: 0 },
        query: (state == null ? void 0 : state.query) || null,
        text: (state == null ? void 0 : state.text) || null,
        items: [],
        command: (commandProps) => {
          return command({ editor, range: (state == null ? void 0 : state.range) || { from: 0, to: 0 }, props: commandProps });
        },
        decorationNode,
        clientRect: clientRectFor(view, decorationNode)
      };
      (_a = renderer == null ? void 0 : renderer.onExit) == null ? void 0 : _a.call(renderer, exitProps);
    } catch {
    }
    const tr = view.state.tr.setMeta(pluginKeyRef, { exit: true });
    view.dispatch(tr);
  }
  const plugin = new Plugin({
    key: pluginKey,
    view() {
      return {
        update: async (view, prevState) => {
          var _a, _b, _c, _d, _e, _f, _g;
          const prev = (_a = this.key) == null ? void 0 : _a.getState(prevState);
          const next = (_b = this.key) == null ? void 0 : _b.getState(view.state);
          const moved = prev.active && next.active && prev.range.from !== next.range.from;
          const started = !prev.active && next.active;
          const stopped = prev.active && !next.active;
          const changed = !started && !stopped && prev.query !== next.query;
          const handleStart = started || moved && changed;
          const handleChange = changed || moved;
          const handleExit = stopped || moved && changed;
          if (!handleStart && !handleChange && !handleExit) {
            return;
          }
          const state = handleExit && !handleStart ? prev : next;
          const decorationNode = view.dom.querySelector(`[data-decoration-id="${state.decorationId}"]`);
          props = {
            editor,
            range: state.range,
            query: state.query,
            text: state.text,
            items: [],
            command: (commandProps) => {
              return command({
                editor,
                range: state.range,
                props: commandProps
              });
            },
            decorationNode,
            clientRect: clientRectFor(view, decorationNode)
          };
          if (handleStart) {
            (_c = renderer == null ? void 0 : renderer.onBeforeStart) == null ? void 0 : _c.call(renderer, props);
          }
          if (handleChange) {
            (_d = renderer == null ? void 0 : renderer.onBeforeUpdate) == null ? void 0 : _d.call(renderer, props);
          }
          if (handleChange || handleStart) {
            props.items = await items({
              editor,
              query: state.query
            });
          }
          if (handleExit) {
            (_e = renderer == null ? void 0 : renderer.onExit) == null ? void 0 : _e.call(renderer, props);
          }
          if (handleChange) {
            (_f = renderer == null ? void 0 : renderer.onUpdate) == null ? void 0 : _f.call(renderer, props);
          }
          if (handleStart) {
            (_g = renderer == null ? void 0 : renderer.onStart) == null ? void 0 : _g.call(renderer, props);
          }
        },
        destroy: () => {
          var _a;
          if (!props) {
            return;
          }
          (_a = renderer == null ? void 0 : renderer.onExit) == null ? void 0 : _a.call(renderer, props);
        }
      };
    },
    state: {
      // Initialize the plugin's internal state.
      init() {
        const state = {
          active: false,
          range: {
            from: 0,
            to: 0
          },
          query: null,
          text: null,
          composing: false,
          dismissedRange: null
        };
        return state;
      },
      // Apply changes to the plugin state from a view transaction.
      apply(transaction, prev, _oldState, state) {
        const { isEditable } = editor;
        const { composing } = editor.view;
        const { selection } = transaction;
        const { empty, from } = selection;
        const next = { ...prev };
        const meta = transaction.getMeta(pluginKey);
        if (meta && meta.exit) {
          next.active = false;
          next.decorationId = null;
          next.range = { from: 0, to: 0 };
          next.query = null;
          next.text = null;
          next.dismissedRange = prev.active ? { ...prev.range } : prev.dismissedRange;
          return next;
        }
        next.composing = composing;
        if (transaction.docChanged && next.dismissedRange !== null) {
          next.dismissedRange = {
            from: transaction.mapping.map(next.dismissedRange.from),
            to: transaction.mapping.map(next.dismissedRange.to)
          };
        }
        if (isEditable && (empty || editor.view.composing)) {
          if ((from < prev.range.from || from > prev.range.to) && !composing && !prev.composing) {
            next.active = false;
          }
          const match = findSuggestionMatch2({
            char,
            allowSpaces,
            allowToIncludeChar,
            allowedPrefixes,
            startOfLine,
            $position: selection.$from
          });
          const decorationId = `id_${Math.floor(Math.random() * 4294967295)}`;
          if (match && allow({
            editor,
            state,
            range: match.range,
            isActive: prev.active
          }) && (!shouldShow || shouldShow({
            editor,
            range: match.range,
            query: match.query,
            text: match.text,
            transaction
          }))) {
            if (next.dismissedRange !== null && !shouldKeepDismissed({
              match,
              dismissedRange: next.dismissedRange,
              state,
              transaction
            })) {
              next.dismissedRange = null;
            }
            if (next.dismissedRange === null) {
              next.active = true;
              next.decorationId = prev.decorationId ? prev.decorationId : decorationId;
              next.range = match.range;
              next.query = match.query;
              next.text = match.text;
            } else {
              next.active = false;
            }
          } else {
            if (!match) {
              next.dismissedRange = null;
            }
            next.active = false;
          }
        } else {
          next.active = false;
        }
        if (!next.active) {
          next.decorationId = null;
          next.range = { from: 0, to: 0 };
          next.query = null;
          next.text = null;
        }
        return next;
      }
    },
    props: {
      // Call the keydown hook if suggestion is active.
      handleKeyDown(view, event) {
        var _a, _b;
        const { active, range } = plugin.getState(view.state);
        if (!active) {
          return false;
        }
        if (event.key === "Escape" || event.key === "Esc") {
          const state = plugin.getState(view.state);
          (_a = renderer == null ? void 0 : renderer.onKeyDown) == null ? void 0 : _a.call(renderer, { view, event, range: state.range });
          dispatchExit(view, pluginKey);
          return true;
        }
        const handled = ((_b = renderer == null ? void 0 : renderer.onKeyDown) == null ? void 0 : _b.call(renderer, { view, event, range })) || false;
        return handled;
      },
      // Setup decorator on the currently active suggestion.
      decorations(state) {
        const { active, range, decorationId, query } = plugin.getState(state);
        if (!active) {
          return null;
        }
        const isEmpty = !(query == null ? void 0 : query.length);
        const classNames = [decorationClass];
        if (isEmpty) {
          classNames.push(decorationEmptyClass);
        }
        return DecorationSet.create(state.doc, [
          Decoration.inline(range.from, range.to, {
            nodeName: decorationTag,
            class: classNames.join(" "),
            "data-decoration-id": decorationId,
            "data-decoration-content": decorationContent
          })
        ]);
      }
    }
  });
  return plugin;
}

// src/index.ts
var index_default = Suggestion;

//#region src/lib/stores/gameSession.svelte.ts
function createGameSession() {
	let rolls = [];
	return {
		get rolls() {
			return rolls;
		},
		addRoll: (formula, result) => {
			rolls = [{
				id: crypto.randomUUID(),
				formula,
				result,
				timestamp: Date.now()
			}, ...rolls].slice(0, 50);
		},
		clearRolls: () => {
			rolls = [];
		}
	};
}
var gameSession = createGameSession();
//#endregion
//#region src/lib/stores/entityHeadIndex.svelte.ts
function computeEntityHeadMap() {
	const headMap = /* @__PURE__ */ new Map();
	const orderedBlockIds = contextEngine.orderedBlockIds;
	const blockIndexLookup = /* @__PURE__ */ new Map();
	for (let i = 0; i < orderedBlockIds.length; i++) blockIndexLookup.set(orderedBlockIds[i], i);
	for (const event of contextEngine.rawEvents) {
		const entityId = event.entity_id;
		if (!event.block_id) {
			if (!headMap.has(entityId)) headMap.set(entityId, {
				blockId: null,
				blockIndex: -1
			});
			continue;
		}
		const blockIndex = blockIndexLookup.get(event.block_id) ?? -1;
		const current = headMap.get(entityId);
		if (!current || blockIndex > current.blockIndex) headMap.set(entityId, {
			blockId: event.block_id,
			blockIndex
		});
	}
	return headMap;
}
/**
* Check if an entity is available for modification at a given cursor block position.
*
* Returns true if:
*   - The entity has no anchored events (head is unanchored → always available)
*   - The entity's head block is at or before the cursor block in document order
*/
function isEntityAvailableAtBlock(entityId, cursorBlockId) {
	const head = computeEntityHeadMap().get(entityId);
	if (!head) return true;
	if (head.blockIndex === -1) return true;
	const cursorIndex = contextEngine.orderedBlockIds.indexOf(cursorBlockId);
	if (cursorIndex === -1) return true;
	return head.blockIndex <= cursorIndex;
}
//#endregion
//#region src/lib/editor/extensions/diceParser.ts
/**
* Parse and evaluate a dice formula string.
*
* @param formula - e.g. "2d6+3", "1d20-1", "2d6+1d8+5"
* @param rng     - optional random number generator for testing (returns 0..1)
*/
function rollDice(formula, rng = Math.random) {
	const cleaned = formula.replace(/\s+/g, "").toLowerCase();
	if (!cleaned) return {
		total: 0,
		groups: [],
		formula
	};
	const tokens = [];
	let current = "";
	for (let i = 0; i < cleaned.length; i++) {
		const char = cleaned[i];
		if ((char === "+" || char === "-") && i > 0) {
			tokens.push(current);
			current = char;
		} else current += char;
	}
	if (current) tokens.push(current);
	const groups = [];
	let total = 0;
	for (const token of tokens) {
		const diceMatch = token.match(/^([+-]?)(\d*)d(\d+)$/);
		if (diceMatch) {
			const sign = diceMatch[1] === "-" ? -1 : 1;
			const count = parseInt(diceMatch[2]) || 1;
			const sides = parseInt(diceMatch[3]);
			if (sides <= 0 || count <= 0) {
				groups.push({ value: 0 });
				continue;
			}
			const rolls = [];
			let subtotal = 0;
			for (let i = 0; i < count; i++) {
				const roll = Math.floor(rng() * sides) + 1;
				rolls.push(roll);
				subtotal += roll;
			}
			subtotal *= sign;
			total += subtotal;
			groups.push({
				count,
				sides,
				rolls,
				subtotal
			});
		} else {
			const value = parseInt(token);
			if (!isNaN(value)) {
				total += value;
				groups.push({ value });
			}
		}
	}
	return {
		total,
		groups,
		formula
	};
}
/**
* Validate a dice formula string without rolling it.
* Returns `{ valid: true }` or `{ valid: false, error: "..." }`.
*/
function validateDiceFormula(formula) {
	const cleaned = formula.replace(/\s+/g, "").toLowerCase();
	if (!cleaned) return {
		valid: false,
		error: "Enter a dice formula (e.g., 2d6+3)"
	};
	const tokens = [];
	let current = "";
	for (let i = 0; i < cleaned.length; i++) {
		const char = cleaned[i];
		if ((char === "+" || char === "-") && i > 0) {
			tokens.push(current);
			current = char;
		} else current += char;
	}
	if (current) tokens.push(current);
	for (const token of tokens) {
		const isDice = /^[+-]?\d*d\d+$/.test(token);
		const isNumber = /^[+-]?\d+$/.test(token);
		if (!isDice && !isNumber) return {
			valid: false,
			error: `Unexpected "${token}" in formula`
		};
		if (isDice) {
			const sides = parseInt(token.replace(/^[+-]?\d*d/, ""));
			if (sides <= 0) return {
				valid: false,
				error: `Invalid die: d${sides} (sides must be > 0)`
			};
		}
	}
	return { valid: true };
}
//#endregion
//#region src/lib/editor/extensions/CommandRegistry.ts
/**
* Get active clocks, optionally filtered by cursor position.
* When cursorBlockId is provided, only clocks whose chronological head
* is at or before the cursor position are included.
*/
var getActiveClocks = (context) => {
	const clocks = [];
	for (const [id, entity] of contextEngine.reducedEntities.entries()) if (entity.category?.toLowerCase() === "clock") {
		if (context?.cursorBlockId && !isEntityAvailableAtBlock(id, context.cursorBlockId)) continue;
		const filled = entity.metadata?.filled || 0;
		const segments = entity.metadata?.segments || 4;
		clocks.push({
			label: `${entity.name} (${filled}/${segments})`,
			value: id
		});
	}
	return clocks;
};
/**
* Get active tracks, optionally filtered by cursor position.
* When cursorBlockId is provided, only tracks whose chronological head
* is at or before the cursor position are included.
*/
var getActiveTracks = (context) => {
	const tracks = [];
	for (const [id, entity] of contextEngine.reducedEntities.entries()) if (entity.category?.toLowerCase() === "track") {
		if (context?.cursorBlockId && !isEntityAvailableAtBlock(id, context.cursorBlockId)) continue;
		const current = entity.metadata?.current || 0;
		const max = entity.metadata?.max || 10;
		tracks.push({
			label: `${entity.name} (${current}/${max})`,
			value: id
		});
	}
	return tracks;
};
var getActiveEntities = (context) => {
	const entities = [];
	for (const [id, entity] of contextEngine.reducedEntities.entries()) {
		if (context?.cursorBlockId && !isEntityAvailableAtBlock(id, context.cursorBlockId)) continue;
		if (entity.isActive === false) continue;
		entities.push({
			label: entity.name,
			value: id
		});
	}
	return entities;
};
var getUpdateTargets = (context) => {
	const entityId = context.resolvedParams.entity;
	if (!entityId) return [];
	const entity = contextEngine.reducedEntities.get(entityId);
	if (!entity) return [];
	const options = [{
		label: "Name",
		value: "update_name"
	}, {
		label: "Description",
		value: "update_description"
	}];
	if (entity.facts) for (const fact of entity.facts) options.push({
		label: `Fact: ${fact.content.substring(0, 30)}${fact.content.length > 30 ? "..." : ""}`,
		value: `fact:${fact.id}`
	});
	return options;
};
var getDeactivateTargets = (context) => {
	const entityId = context.resolvedParams.entity;
	if (!entityId) return [];
	const entity = contextEngine.reducedEntities.get(entityId);
	if (!entity) return [];
	const options = [{
		label: "Entire Entity",
		value: "deactivate_entity"
	}];
	if (entity.facts) for (const fact of entity.facts) options.push({
		label: `Fact: ${fact.content.substring(0, 30)}${fact.content.length > 30 ? "..." : ""}`,
		value: `fact:${fact.id}`
	});
	return options;
};
async function persistClockEvent(editor, entityId, blockId, eventType, reason) {
	const serialId = editor.serialId;
	const sceneId = editor.sceneId;
	if (serialId && sceneId && entityId) {
		const payload = { amount: 1 };
		if (reason) payload.reason = reason;
		await supabase.from("wiki_events").insert({
			entity_id: entityId,
			scene_id: sceneId,
			block_id: blockId,
			event_type: eventType,
			payload
		});
		await contextEngine.refreshEvents(sceneId, editor.getJSON(), serialId);
	}
}
async function persistTrackAdvance(editor, entityId, blockId, amount, reason) {
	const serialId = editor.serialId;
	const sceneId = editor.sceneId;
	const entity = contextEngine.reducedEntities.get(entityId);
	if (!entity || !serialId || !sceneId) return;
	const currentVal = entity.metadata?.current || 0;
	const maxVal = entity.metadata?.max || 10;
	const payload = {
		max: maxVal,
		current: Math.min(maxVal, currentVal + amount)
	};
	if (reason) payload.reason = reason;
	await supabase.from("wiki_events").insert({
		entity_id: entityId,
		scene_id: sceneId,
		block_id: blockId,
		event_type: "set_track",
		payload
	});
	await contextEngine.refreshEvents(sceneId, editor.getJSON(), serialId);
}
var oracleActions = [
	"Seek",
	"Oppose",
	"Communicate",
	"Move",
	"Transform",
	"Deceive",
	"Reveal",
	"Discover",
	"Fight",
	"Aid"
];
var oracleThemes = [
	"Danger",
	"Hope",
	"Power",
	"Wealth",
	"Knowledge",
	"Love",
	"Death",
	"Nature",
	"Magic",
	"Technology"
];
var commandRegistry = [
	{
		name: "oracle",
		title: "Oracle: Fate Check",
		description: "Ask a Yes/No question against the odds",
		icon: "help-circle",
		aliases: ["fate", "odds"],
		params: [{
			name: "odds",
			label: "odds",
			type: "number",
			required: false,
			default: 50,
			placeholder: "50"
		}, {
			name: "question",
			label: "question",
			type: "text",
			required: false,
			default: "",
			placeholder: "Is the door locked?"
		}],
		execute: async (editor, range, params) => {
			const target = parseInt(String(params.odds)) || 50;
			const question = String(params.question || "");
			const roll = Math.floor(Math.random() * 100) + 1;
			const exceptionalYes = Math.floor(target / 5);
			const exceptionalNo = 100 - Math.floor((100 - target) / 5);
			let result = roll <= target ? "Yes" : "No";
			if (roll <= exceptionalYes) result = "Exceptional Yes";
			else if (roll >= exceptionalNo) result = "Exceptional No";
			editor.chain().focus().deleteRange(range).insertContent({
				type: "oracleBlock",
				attrs: {
					type: "fate",
					question,
					result,
					odds: target
				}
			}).run();
			gameSession.addRoll(`Oracle (${target}%)`, roll);
		}
	},
	{
		name: "theme",
		title: "Oracle: Theme",
		description: "Roll for a random theme/action",
		icon: "sparkles",
		aliases: [],
		params: [],
		execute: async (editor, range) => {
			const result = `${oracleActions[Math.floor(Math.random() * oracleActions.length)]} ${oracleThemes[Math.floor(Math.random() * oracleThemes.length)]}`;
			editor.chain().focus().deleteRange(range).insertContent({
				type: "oracleBlock",
				attrs: {
					type: "theme",
					question: "",
					result
				}
			}).run();
			gameSession.addRoll("Theme", 0);
		}
	},
	{
		name: "roll",
		title: "Roll Dice",
		description: "Roll a custom dice formula (e.g. 2d6+3)",
		icon: "dice",
		aliases: [],
		params: [{
			name: "formula",
			label: "formula",
			type: "dice",
			required: false,
			default: "1d100",
			placeholder: "2d6+3"
		}],
		execute: async (editor, range, params) => {
			const formula = String(params.formula || "1d100");
			if (!validateDiceFormula(formula).valid) return;
			const result = rollDice(formula);
			editor.chain().focus().deleteRange(range).insertContent({
				type: "diceRoller",
				attrs: {
					formula,
					result: result.total
				}
			}).run();
			gameSession.addRoll(formula, result.total);
		}
	},
	{
		name: "clock",
		title: "Create Clock",
		description: "Insert a progress clock with custom segments",
		icon: "clock",
		aliases: [],
		params: [{
			name: "segments",
			label: "segments",
			type: "number",
			required: false,
			default: 4,
			placeholder: "4"
		}, {
			name: "name",
			label: "name",
			type: "text",
			required: true,
			placeholder: "Clock name"
		}],
		execute: async (editor, range, params) => {
			const segments = parseInt(String(params.segments)) || 4;
			const name = String(params.name || "New Clock");
			const serialId = editor.serialId;
			const sceneId = editor.sceneId;
			const entityId = crypto.randomUUID();
			const blockId = crypto.randomUUID();
			editor.chain().focus().deleteRange(range).insertContent({
				type: "clockBlock",
				attrs: {
					id: blockId,
					entityId,
					name,
					segments,
					filled: 0,
					action: "create"
				}
			}).run();
			if (serialId && sceneId) {
				await supabase.from("wiki_entities").insert({
					id: entityId,
					serial_id: serialId,
					name,
					category: "Clock",
					metadata: {
						segments,
						filled: 0
					}
				});
				await supabase.from("wiki_events").insert({
					entity_id: entityId,
					scene_id: sceneId,
					block_id: blockId,
					event_type: "create",
					payload: {
						name,
						category: "Clock",
						metadata: {
							segments,
							filled: 0
						}
					}
				});
				await contextEngine.refreshEvents(sceneId, editor.getJSON(), serialId);
			}
		}
	},
	{
		name: "track",
		title: "Create Track",
		description: "Insert a progress track with custom steps",
		icon: "activity",
		aliases: [],
		params: [{
			name: "max",
			label: "max steps",
			type: "number",
			required: false,
			default: 10,
			placeholder: "10"
		}, {
			name: "name",
			label: "name",
			type: "text",
			required: true,
			placeholder: "Track name"
		}],
		execute: async (editor, range, params) => {
			const max = parseInt(String(params.max)) || 10;
			const name = String(params.name || "New Track");
			const serialId = editor.serialId;
			const sceneId = editor.sceneId;
			const entityId = crypto.randomUUID();
			const blockId = crypto.randomUUID();
			editor.chain().focus().deleteRange(range).insertContent({
				type: "trackBlock",
				attrs: {
					id: blockId,
					entityId,
					name,
					max,
					current: 0,
					action: "create"
				}
			}).run();
			if (serialId && sceneId) {
				await supabase.from("wiki_entities").insert({
					id: entityId,
					serial_id: serialId,
					name,
					category: "Track",
					metadata: {
						max,
						current: 0
					}
				});
				await supabase.from("wiki_events").insert({
					entity_id: entityId,
					scene_id: sceneId,
					block_id: blockId,
					event_type: "create",
					payload: {
						name,
						category: "Track",
						metadata: {
							max,
							current: 0
						}
					}
				});
				await contextEngine.refreshEvents(sceneId, editor.getJSON(), serialId);
			}
		}
	},
	{
		name: "increment",
		title: "Increment Clock",
		description: "Advance an existing clock by 1 segment",
		icon: "clock",
		aliases: ["inc"],
		params: [{
			name: "clock",
			label: "clock",
			type: "select",
			required: true,
			options: getActiveClocks,
			placeholder: "Select a clock..."
		}, {
			name: "reason",
			label: "reason",
			type: "text",
			required: false,
			default: "",
			placeholder: "Why? (optional)"
		}],
		execute: async (editor, range, params) => {
			const entityId = String(params.clock);
			const reason = String(params.reason || "").trim() || void 0;
			const entity = contextEngine.reducedEntities.get(entityId);
			if (!entity) return;
			const blockId = crypto.randomUUID();
			editor.chain().focus().deleteRange(range).insertContent({
				type: "clockBlock",
				attrs: {
					id: blockId,
					entityId,
					name: entity.name,
					action: "increment"
				}
			}).run();
			await persistClockEvent(editor, entityId, blockId, "increment_clock", reason);
		}
	},
	{
		name: "decrement",
		title: "Decrement Clock",
		description: "Remove 1 segment from an existing clock",
		icon: "clock",
		aliases: ["dec"],
		params: [{
			name: "clock",
			label: "clock",
			type: "select",
			required: true,
			options: getActiveClocks,
			placeholder: "Select a clock..."
		}, {
			name: "reason",
			label: "reason",
			type: "text",
			required: false,
			default: "",
			placeholder: "Why? (optional)"
		}],
		execute: async (editor, range, params) => {
			const entityId = String(params.clock);
			const reason = String(params.reason || "").trim() || void 0;
			const entity = contextEngine.reducedEntities.get(entityId);
			if (!entity) return;
			const blockId = crypto.randomUUID();
			editor.chain().focus().deleteRange(range).insertContent({
				type: "clockBlock",
				attrs: {
					id: blockId,
					entityId,
					name: entity.name,
					action: "decrement"
				}
			}).run();
			await persistClockEvent(editor, entityId, blockId, "decrement_clock", reason);
		}
	},
	{
		name: "advance",
		title: "Advance Track",
		description: "Advance a progress track",
		icon: "activity",
		aliases: ["adv"],
		params: [
			{
				name: "track",
				label: "track",
				type: "select",
				required: true,
				options: getActiveTracks,
				placeholder: "Select a track..."
			},
			{
				name: "amount",
				label: "amount",
				type: "number",
				required: false,
				default: 1,
				placeholder: "1"
			},
			{
				name: "reason",
				label: "reason",
				type: "text",
				required: false,
				default: "",
				placeholder: "Why? (optional)"
			}
		],
		execute: async (editor, range, params) => {
			const entityId = String(params.track);
			const amount = parseInt(String(params.amount)) || 1;
			const reason = String(params.reason || "").trim() || void 0;
			const entity = contextEngine.reducedEntities.get(entityId);
			if (!entity) return;
			const currentVal = entity.metadata?.current || 0;
			const maxVal = entity.metadata?.max || 10;
			const newVal = Math.min(maxVal, currentVal + amount);
			const blockId = crypto.randomUUID();
			editor.chain().focus().deleteRange(range).insertContent({
				type: "trackBlock",
				attrs: {
					id: blockId,
					entityId,
					name: entity.name,
					max: maxVal,
					current: newVal,
					action: "advance"
				}
			}).run();
			await persistTrackAdvance(editor, entityId, blockId, amount, reason);
		}
	},
	{
		name: "update",
		title: "Update Wiki Entity",
		description: "Update the name, description, or a fact of an entity",
		icon: "pencil",
		aliases: ["up"],
		params: [
			{
				name: "entity",
				label: "entity",
				type: "select",
				required: true,
				options: getActiveEntities,
				placeholder: "Select an entity..."
			},
			{
				name: "target",
				label: "target",
				type: "select",
				required: true,
				options: getUpdateTargets,
				placeholder: "What to update?"
			},
			{
				name: "value",
				label: "new value",
				type: "text",
				required: true,
				placeholder: "New value"
			}
		],
		execute: async (editor, range, params) => {
			const entityId = String(params.entity);
			const target = String(params.target);
			const value = String(params.value).trim();
			const serialId = editor.serialId;
			const sceneId = editor.sceneId;
			const blockId = crypto.randomUUID();
			if (!serialId || !sceneId || !entityId || !value) return;
			editor.chain().focus().deleteRange(range).run();
			if (target === "update_name") await supabase.from("wiki_events").insert({
				entity_id: entityId,
				scene_id: sceneId,
				block_id: blockId,
				event_type: "update_name",
				payload: { name: value }
			});
			else if (target === "update_description") await supabase.from("wiki_events").insert({
				entity_id: entityId,
				scene_id: sceneId,
				block_id: blockId,
				event_type: "update_description",
				payload: { description: value }
			});
			else if (target.startsWith("fact:")) {
				const factId = target.split(":")[1];
				await supabase.from("wiki_events").insert({
					entity_id: entityId,
					scene_id: sceneId,
					block_id: blockId,
					event_type: "remove_fact",
					payload: { id: factId }
				});
				await supabase.from("wiki_events").insert({
					entity_id: entityId,
					scene_id: sceneId,
					block_id: blockId,
					event_type: "add_fact",
					payload: {
						id: crypto.randomUUID(),
						content: value
					}
				});
			}
			await contextEngine.refreshEvents(sceneId, editor.getJSON(), serialId);
		}
	},
	{
		name: "deactivate",
		title: "Deactivate Wiki Entity",
		description: "Deactivate an entity or remove a fact",
		icon: "archive",
		aliases: ["de"],
		params: [{
			name: "entity",
			label: "entity",
			type: "select",
			required: true,
			options: getActiveEntities,
			placeholder: "Select an entity..."
		}, {
			name: "target",
			label: "target",
			type: "select",
			required: true,
			options: getDeactivateTargets,
			placeholder: "What to deactivate?"
		}],
		execute: async (editor, range, params) => {
			const entityId = String(params.entity);
			const target = String(params.target);
			const serialId = editor.serialId;
			const sceneId = editor.sceneId;
			const blockId = crypto.randomUUID();
			if (!serialId || !sceneId || !entityId) return;
			editor.chain().focus().deleteRange(range).run();
			if (target === "deactivate_entity") await supabase.from("wiki_events").insert({
				entity_id: entityId,
				scene_id: sceneId,
				block_id: blockId,
				event_type: "deactivate_entity",
				payload: {}
			});
			else if (target.startsWith("fact:")) {
				const factId = target.split(":")[1];
				await supabase.from("wiki_events").insert({
					entity_id: entityId,
					scene_id: sceneId,
					block_id: blockId,
					event_type: "remove_fact",
					payload: { id: factId }
				});
			}
			await contextEngine.refreshEvents(sceneId, editor.getJSON(), serialId);
		}
	},
	{
		name: "gm",
		title: "GM Note",
		description: "Create a private GM note block",
		icon: "pen",
		aliases: [],
		params: [],
		execute: async (editor, range) => {
			editor.chain().focus().deleteRange(range).toggleNode("gmNote", "paragraph").run();
		}
	},
	{
		name: "journal",
		title: "Journal Entry",
		description: "Mark this block as a private journal entry",
		icon: "book",
		aliases: [],
		params: [],
		execute: async (editor, range) => {
			editor.chain().focus().deleteRange(range).updateAttributes(editor.state.selection.$from.parent.type.name, { visibility: "journal" }).run();
		}
	},
	{
		name: "setup",
		title: "Scene Setup",
		description: "Define scene expectations and goals",
		icon: "pen",
		aliases: [],
		params: [],
		execute: async (editor, range) => {
			editor.chain().focus().deleteRange(range).insertContent("<h2>Scene Setup</h2><p>Expectations: </p>").run();
		}
	}
];
var commandsByName = /* @__PURE__ */ new Map();
var commandsByAlias = /* @__PURE__ */ new Map();
for (const cmd of commandRegistry) {
	commandsByName.set(cmd.name, cmd);
	for (const alias of cmd.aliases) commandsByAlias.set(alias, cmd);
}
Extension.create({
	name: "slashCommands",
	addOptions() {
		return { suggestion: {
			char: "/",
			allowSpaces: true,
			command: ({ editor, range, props }) => {
				props.command({
					editor,
					range
				});
			}
		} };
	},
	addProseMirrorPlugins() {
		return [index_default({
			editor: this.editor,
			...this.options.suggestion
		})];
	}
});
//#endregion
//#region src/lib/analytics/readability.ts
function countSyllables(word) {
	const cleaned = word.toLowerCase().replace(/[^a-z]/g, "");
	if (!cleaned) return 0;
	const matches = cleaned.match(/[aeiouy]+/g);
	let count = matches ? matches.length : 1;
	if (cleaned.endsWith("e") && cleaned.length > 2) count = Math.max(1, count - 1);
	return Math.max(1, count);
}
function computeReadabilityMetrics(plainText) {
	const text = plainText.trim();
	if (!text) return {
		avgSentenceLength: 0,
		avgWordLength: 0,
		fleschReadingEase: 0,
		typeTokenRatio: 0
	};
	const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
	const sentenceCount = Math.max(1, sentences.length);
	const words = text.split(/\s+/).filter((w) => w.replace(/[^a-zA-Z']/g, "").length > 0);
	const wordCount = Math.max(1, words.length);
	const avgSentenceLength = wordCount / sentenceCount;
	const avgWordLength = words.reduce((sum, w) => sum + w.replace(/[^a-zA-Z]/g, "").length, 0) / wordCount;
	const totalSyllables = words.reduce((sum, w) => sum + countSyllables(w), 0);
	const fleschReadingEase = Math.min(121, Math.max(0, 206.835 - 1.015 * avgSentenceLength - 84.6 * (totalSyllables / wordCount)));
	const windowWords = words.slice(0, 500).map((w) => w.toLowerCase().replace(/[^a-z']/g, "")).filter((w) => w.length > 0);
	const typeTokenRatio = new Set(windowWords).size / Math.max(1, windowWords.length);
	return {
		avgSentenceLength: Math.round(avgSentenceLength * 10) / 10,
		avgWordLength: Math.round(avgWordLength * 10) / 10,
		fleschReadingEase: Math.round(fleschReadingEase * 10) / 10,
		typeTokenRatio: Math.round(typeTokenRatio * 1e3) / 1e3
	};
}
//#endregion
//#region src/lib/stores/telemetry.svelte.ts
var EMPTY_STATE = {
	isActive: false,
	isInitialized: false,
	sceneId: "",
	serialId: "",
	sessionType: "play",
	startTime: 0,
	lastActive: 0,
	startingWordCount: 0,
	currentWordCount: 0,
	startingCharCount: 0,
	currentCharCount: 0,
	currentText: "",
	keystrokes: 0,
	durationSeconds: 0
};
function createTelemetryStore() {
	let state = { ...EMPTY_STATE };
	let timerInterval = null;
	let wpm = derived(() => {
		if (!state.isActive || state.durationSeconds <= 0) return 0;
		const minutes = state.durationSeconds / 60;
		const netWords = Math.max(0, state.currentWordCount - state.startingWordCount);
		return Math.round(netWords / minutes);
	});
	function startSession(sceneId, serialId, sessionType, initialWordCount, initialCharCount = 0) {
		if (state.isActive) endSession();
		state = {
			...EMPTY_STATE,
			isInitialized: true,
			sceneId,
			serialId,
			sessionType,
			startingWordCount: initialWordCount,
			currentWordCount: initialWordCount,
			startingCharCount: initialCharCount,
			currentCharCount: initialCharCount
		};
		if (timerInterval) {
			clearInterval(timerInterval);
			timerInterval = null;
		}
	}
	function activateSession() {
		if (!state.isInitialized || state.isActive) return;
		const now = Date.now();
		state.isActive = true;
		state.startTime = now;
		state.lastActive = now;
		if (timerInterval) clearInterval(timerInterval);
		timerInterval = setInterval(() => {
			tick();
		}, 1e3);
	}
	function setInitialCounts(wordCount, charCount, text) {
		if (!state.isActive) {
			state.startingWordCount = wordCount;
			state.currentWordCount = wordCount;
			state.startingCharCount = charCount;
			state.currentCharCount = charCount;
			state.currentText = text;
		}
	}
	function recordActivity(wordCount, charCount, text) {
		if (!state.isInitialized) return;
		if (!state.isActive) activateSession();
		state.currentWordCount = wordCount;
		state.currentCharCount = charCount;
		state.currentText = text;
		state.keystrokes += 1;
		state.lastActive = Date.now();
	}
	function tick() {
		if (!state.isActive) return;
		if (Date.now() - state.lastActive < 900 * 1e3) state.durationSeconds += 1;
		else endSession(true);
	}
	async function endSession(isIdleTimeout = false) {
		if (!state.isActive) return;
		if (timerInterval) {
			clearInterval(timerInterval);
			timerInterval = null;
		}
		const sessionToSave = { ...state };
		state = { ...EMPTY_STATE };
		const endTime = isIdleTimeout ? sessionToSave.lastActive : Date.now();
		const duration = sessionToSave.durationSeconds;
		if (duration <= 0 && sessionToSave.keystrokes === 0) return;
		const prose = sessionToSave.currentText ? computeReadabilityMetrics(sessionToSave.currentText) : null;
		const netChars = sessionToSave.currentCharCount - sessionToSave.startingCharCount;
		try {
			const { data: { user } } = await supabase.auth.getUser();
			if (!user) return;
			const { error } = await supabase.from("writing_sessions").insert({
				author_id: user.id,
				serial_id: sessionToSave.serialId || null,
				scene_id: sessionToSave.sceneId || null,
				session_type: sessionToSave.sessionType,
				start_time: new Date(sessionToSave.startTime).toISOString(),
				end_time: new Date(endTime).toISOString(),
				active_duration_seconds: duration,
				starting_word_count: sessionToSave.startingWordCount,
				ending_word_count: sessionToSave.currentWordCount,
				keystrokes: sessionToSave.keystrokes,
				starting_char_count: sessionToSave.startingCharCount,
				net_characters: netChars,
				avg_sentence_length: prose?.avgSentenceLength ?? null,
				avg_word_length: prose?.avgWordLength ?? null,
				flesch_reading_ease: prose?.fleschReadingEase ?? null,
				type_token_ratio: prose?.typeTokenRatio ?? null
			});
			if (error) console.error("Failed to save writing session:", error);
			else if (isIdleTimeout) notifications.info("Session auto-saved due to inactivity.");
		} catch (err) {
			console.error("Error saving session:", err);
		}
	}
	return {
		get isActive() {
			return state.isActive;
		},
		get sceneId() {
			return state.sceneId;
		},
		get sessionType() {
			return state.sessionType;
		},
		get keystrokes() {
			return state.keystrokes;
		},
		get durationSeconds() {
			return state.durationSeconds;
		},
		get currentWordCount() {
			return state.currentWordCount;
		},
		get startingWordCount() {
			return state.startingWordCount;
		},
		get wpm() {
			return wpm();
		},
		startSession,
		activateSession,
		setInitialCounts,
		recordActivity,
		endSession
	};
}
var telemetryStore = createTelemetryStore();
Extension.create({
	name: "telemetry",
	onTransaction({ transaction }) {
		if (transaction.docChanged) {
			const text = this.editor.state.doc.textContent;
			const words = text.trim() ? text.trim().split(/\s+/).length : 0;
			const chars = text.length;
			if (!telemetryStore.isActive) telemetryStore.setInitialCounts(words, chars, text);
			else telemetryStore.recordActivity(words, chars, text);
		}
	}
});
Extension.create({
	name: "activeBlockHighlight",
	addProseMirrorPlugins() {
		return [new Plugin({
			key: new PluginKey("activeBlockHighlight"),
			props: { decorations(state) {
				const { selection } = state;
				const $pos = selection.$anchor;
				const depth = $pos.depth;
				if (depth === 0) return null;
				const node = $pos.node(depth);
				const pos = $pos.before(depth);
				if (!node || !node.isBlock) return null;
				return DecorationSet.create(state.doc, [Decoration.node(pos, pos + node.nodeSize, { class: "active-editor-block" })]);
			} }
		})];
	}
});
Promise.resolve();
//#endregion
//#region src/lib/editor/Tiptap.svelte
function Tiptap($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { content = "", initialContent = null, sceneId = "", serialId = "", _stage = "Draft", onUpdate = (_html) => {}, placeholder = "Write your story...", activeBlockId = "", cursorState = { clocks: {} }, editable = true, wikiFilterMode = "play", saveStatus = "synced" } = $$props;
		let isSaving = false;
		function handleUnload() {}
		const getIsSaving = () => isSaving;
		async function save() {}
		/**
		* Apply or remove a transient highlight on a block in the editor.
		* Called by the sidebar on hover enter (blockId) and hover leave (null).
		*/
		function highlightBlock(blockId) {
		}
		/**
		* Scroll the editor to a specific block and flash-highlight it.
		* Called by the sidebar on click.
		*/
		function scrollToBlock(blockId) {
			return;
		}
		onDestroy(() => {
			if (typeof window !== "undefined") {
				window.removeEventListener("pagehide", handleUnload);
				window.removeEventListener("beforeunload", handleUnload);
			}
		});
		$$renderer.push(`<div class="relative flex h-full flex-col rounded-2xl border border-white/10 bg-stone-900/50 shadow-xl backdrop-blur-md svelte-1peb3e7"><div class="tiptap-container scroll-container relative flex-1 overflow-y-auto svelte-1peb3e7"></div> <div${attr_class(`absolute z-50 flex items-center gap-1 rounded-xl border border-white/10 bg-stone-900/90 p-1 shadow-2xl backdrop-blur-xl transition-all duration-200 ${stringify("pointer-events-none scale-95 opacity-0")}`, "svelte-1peb3e7")}>`);
		$$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--></div></div>`);
		bind_props($$props, {
			content,
			activeBlockId,
			cursorState,
			saveStatus,
			getIsSaving,
			save,
			highlightBlock,
			scrollToBlock
		});
	});
}

export { Tiptap as T, telemetryStore as t };
//# sourceMappingURL=Tiptap-e86896e5.js.map
