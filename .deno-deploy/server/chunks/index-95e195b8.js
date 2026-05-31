import { g as getSchema, N as Node, b as DOMSerializer } from './index-8b3ef059.js';

// src/generateHTML.ts
function getHTMLFromFragment(doc, schema, options) {
  if (typeof window === "undefined") {
    throw new Error(
      "getHTMLFromFragment can only be used in a browser environment\nIf you want to use this in a Node environment, use the `@tiptap/html/server` import instead."
    );
  }
  if (options == null ? void 0 : options.document) {
    const wrap2 = options.document.createElement("div");
    DOMSerializer.fromSchema(schema).serializeFragment(doc.content, { document: options.document }, wrap2);
    return wrap2.innerHTML;
  }
  const wrap = window.document.createElement("div");
  DOMSerializer.fromSchema(schema).serializeFragment(
    doc.content,
    {
      document: window.document
    },
    wrap
  );
  return wrap.innerHTML;
}

// src/generateHTML.ts
function generateHTML(doc, extensions) {
  if (typeof window === "undefined") {
    throw new Error(
      "generateHTML can only be used in a browser environment\nIf you want to use this in a Node environment, use the `@tiptap/html/server` import instead."
    );
  }
  const schema = getSchema(extensions);
  const contentNode = Node.fromJSON(schema, doc);
  return getHTMLFromFragment(contentNode, schema);
}

export { generateHTML as g };
//# sourceMappingURL=index-95e195b8.js.map
