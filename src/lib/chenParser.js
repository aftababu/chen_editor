// --- CHEATSHEET & DEFAULT CODE ---
export const DEFAULT_CODE = `// 1. Weak Entities & Identifying Relationships
entity Employee
weak_entity Dependent
ident_rel Employee 1 Has N Dependent PARTIAL TOTAL
`;

export const CHEATSHEET = `Syntax Guide:
- Entity: entity [Name]
- Weak Entity: weak_entity [Name]
- Attribute: attr [ParentName] [AttrName] [PK|PPK|MV|DER]
  (Parent can be an Entity, Rel, or another Attribute for Composites)
- Relationship: rel [E1] [Card1] [RelName] [Card2] [E2] [Tot1?] [Tot2?]
  (Cards: 1, M, N. Tot: TOTAL or PARTIAL)
- Identifying Rel: ident_rel [E1] [C1] [Name] [C2] [E2] [T1] [T2]
- Generalization: isa [ParentEntity] [Type: d/o/t/p] [Child1] [Child2] ...`;

// --- PARSER ---
export const parseChenCode = (code) => {
  const nodes = [];
  const links = [];
  const lines = code.split("\n");
  const errors = [];

  const nodeExists = (id) => nodes.some((n) => n.id === id);
  const findNode = (ref) => nodes.find((n) => n.id === ref || n.label === ref);

  lines.forEach((line, index) => {
    const text = line.trim();
    if (!text || text.startsWith("//")) return;

    const parts = text.split(/\s+/);
    const cmd = parts[0].toLowerCase();

    try {
      if (cmd === "entity" || cmd === "weak_entity") {
        const name = parts[1];
        if (!name) throw new Error("Entity name missing.");
        if (!nodeExists(name)) nodes.push({ id: name, type: cmd, label: name });
      } else if (cmd === "attr") {
        const parentRef = parts[1],
          name = parts[2];
        if (!parentRef || !name)
          throw new Error("Attribute requires Parent and Name.");
        const parentNode = findNode(parentRef);
        if (!parentNode) throw new Error(`Parent '${parentRef}' not found.`);

        const flags = parts.slice(3).map((f) => f.toUpperCase());
        const id = `${parentNode.id}_attr_${name}`;
        if (!nodeExists(id)) {
          nodes.push({
            id,
            type: "attribute",
            label: name,
            isPK: flags.includes("PK"),
            isPPK: flags.includes("PPK"),
            isMV: flags.includes("MV"),
            isDer: flags.includes("DER"),
          });
        }
        if (!links.some((l) => l.from === parentNode.id && l.to === id)) {
          links.push({ from: parentNode.id, to: id, card: "", total: false });
        }
      } else if (cmd === "rel" || cmd === "ident_rel") {
        const e1Ref = parts[1],
          c1 = parts[2],
          name = parts[3],
          c2 = parts[4],
          e2Ref = parts[5];
        if (!e1Ref || !c1 || !name || !c2 || !e2Ref)
          throw new Error("Format: rel [E1] [C1] [Name] [C2] [E2]");
        const e1Node = findNode(e1Ref);
        const e2Node = findNode(e2Ref);
        if (!e1Node) throw new Error(`Entity '${e1Ref}' not found.`);
        if (!e2Node) throw new Error(`Entity '${e2Ref}' not found.`);

        const tot1 = parts[6]?.toUpperCase() === "TOTAL";
        const tot2 = parts[7]?.toUpperCase() === "TOTAL";

        const id = `rel_${e1Node.id}_${name}_${e2Node.id}`;
        if (!nodeExists(id)) {
          nodes.push({
            id,
            type: cmd === "ident_rel" ? "ident_relationship" : "relationship",
            label: name,
          });
        }
        links.push({
          from: e1Node.id,
          to: id,
          card: c1 === "_" ? "" : c1,
          total: tot1,
        });
        links.push({
          from: id,
          to: e2Node.id,
          card: c2 === "_" ? "" : c2,
          total: tot2,
        });
      } else if (cmd === "isa") {
        const parentRef = parts[1];
        const labelStr = parts[2]; // usually d, o, t, p
        const children = parts.slice(3);
        if (!parentRef || !labelStr || children.length === 0)
          throw new Error("Format: isa [Parent] [Type] [Child1] [Child2]...");
        const parentNode = findNode(parentRef);
        if (!parentNode)
          throw new Error(`Parent entity '${parentRef}' not found.`);

        const id = `isa_${parentNode.id}`;
        const isTotalSpec = labelStr.toLowerCase().includes("t");
        if (!nodeExists(id)) nodes.push({ id, type: "isa", label: "ISA", isaType: labelStr });
        links.push({ from: parentNode.id, to: id, card: "", total: isTotalSpec });

        children.forEach((childRef) => {
          const childNode = findNode(childRef);
          if (!childNode)
            throw new Error(`Child entity '${childRef}' not found.`);
          links.push({ from: id, to: childNode.id, card: "", total: false });
        });
      } else {
        throw new Error(`Unknown command '${cmd}'.`);
      }
    } catch (err) {
      errors.push(`Line ${index + 1}: ${err.message}`);
    }
  });

  return { nodes, links, errors };
};

// --- RESPONSE SANITIZATION ---
export const sanitizeChenCodeResponse = (text) => {
  if (!text) return "";
  let cleaned = text.trim();
  // Remove markdown code blocks starting with ```chen or similar
  cleaned = cleaned.replace(/^```[a-zA-Z]*\s*\n?/i, "");
  // Remove closing markdown code fences
  cleaned = cleaned.replace(/\n?\s*```$/, "");
  // Remove leading labels like "Chen Code:" or "Code:"
  cleaned = cleaned.replace(/^(Chen Code|Code):\s*\n?/i, "");
  return cleaned.trim();
};
