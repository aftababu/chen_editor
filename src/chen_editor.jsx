import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";

// --- CHEATSHEET & DEFAULT CODE ---
const DEFAULT_CODE = `// 1. Weak Entities & Identifying Relationships
entity Employee
weak_entity Dependent
ident_rel Employee 1 Has N Dependent PARTIAL TOTAL


`;

const CHEATSHEET = `Syntax Guide:
- Entity: entity [Name]
- Weak Entity: weak_entity [Name]
- Attribute: attr [ParentName] [AttrName] [PK|MV|DER]
  (Parent can be an Entity or another Attribute for Composites)
- Relationship: rel [E1] [Card1] [RelName] [Card2] [E2] [Tot1?] [Tot2?]
  (Cards: 1, M, N. Tot: TOTAL or PARTIAL)
- Identifying Rel: ident_rel [E1] [C1] [Name] [C2] [E2] [T1] [T2]
- Generalization: isa [ParentEntity] [Child1] [Child2] ...`;

// --- PARSER ---
const parseChenCode = (code) => {
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
        const children = parts.slice(2);
        if (!parentRef || children.length === 0)
          throw new Error("Format: isa [Parent] [Child1] [Child2]...");
        const parentNode = findNode(parentRef);
        if (!parentNode)
          throw new Error(`Parent entity '${parentRef}' not found.`);

        const id = `isa_${parentNode.id}`;
        if (!nodeExists(id)) nodes.push({ id, type: "isa", label: "ISA" });
        links.push({ from: parentNode.id, to: id, card: "", total: false });

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

// --- PHYSICS ENGINE ---
const calculateLayout = (nodes, links, width, height) => {
  let simNodes = nodes.map((n) => ({
    ...n,
    x: width / 2 + (Math.random() * 20 - 10),
    y: height / 2 + (Math.random() * 20 - 10),
    vx: 0,
    vy: 0,
  }));
  const K = 120,
    iterations = 300;

  for (let i = 0; i < iterations; i++) {
    for (let a of simNodes) {
      for (let b of simNodes) {
        if (a.id === b.id) continue;
        let dx = a.x - b.x,
          dy = a.y - b.y;
        if (dx === 0 && dy === 0) {
          dx = Math.random() - 0.5;
          dy = Math.random() - 0.5;
        }
        let dist = Math.max(1, Math.sqrt(dx * dx + dy * dy));
        let force = (K * K) / dist;
        a.vx += (dx / dist) * force;
        a.vy += (dy / dist) * force;
      }
    }
    for (let link of links) {
      let a = simNodes.find((n) => n.id === link.from),
        b = simNodes.find((n) => n.id === link.to);
      if (!a || !b) continue;
      let dx = a.x - b.x,
        dy = a.y - b.y;
      if (dx === 0 && dy === 0) {
        dx = Math.random() - 0.5;
        dy = Math.random() - 0.5;
      }
      let dist = Math.max(1, Math.sqrt(dx * dx + dy * dy));
      let force = (dist * dist) / K;
      a.vx -= (dx / dist) * force;
      a.vy -= (dy / dist) * force;
      b.vx += (dx / dist) * force;
      b.vy += (dy / dist) * force;
    }
    for (let n of simNodes) {
      n.vx += (width / 2 - n.x) * 0.05;
      n.vy += (height / 2 - n.y) * 0.05;
      n.vx = Math.max(-100, Math.min(100, n.vx));
      n.vy = Math.max(-100, Math.min(100, n.vy));
      n.x += n.vx * 0.05;
      n.y += n.vy * 0.05;
      n.vx *= 0.5;
      n.vy *= 0.5;
    }
  }
  return simNodes.map((n) => ({
    ...n,
    x: Number.isFinite(n.x) ? n.x : width / 2,
    y: Number.isFinite(n.y) ? n.y : height / 2,
  }));
};

// --- RENDER HELPERS ---
const renderLink = (link, n1, n2, index) => {
  const dx = n2.x - n1.x,
    dy = n2.y - n1.y;
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  const nx = -dy / len,
    ny = dx / len;

  const mx = (n1.x + n2.x) / 2;
  const my = (n1.y + n2.y) / 2;
  const textOffset = 15;

  if (link.total) {
    const offset = 3;
    return (
      <g key={`l-${index}`}>
        <line
          x1={n1.x + nx * offset}
          y1={n1.y + ny * offset}
          x2={n2.x + nx * offset}
          y2={n2.y + ny * offset}
          stroke="#334155"
          strokeWidth="2"
        />
        <line
          x1={n1.x - nx * offset}
          y1={n1.y - ny * offset}
          x2={n2.x - nx * offset}
          y2={n2.y - ny * offset}
          stroke="#334155"
          strokeWidth="2"
        />
        {link.card && (
          <text
            x={mx + nx * textOffset}
            y={my + ny * textOffset}
            fill="#b91c1c"
            fontSize="14"
            fontWeight="bold"
            textAnchor="middle"
            dominantBaseline="middle"
          >
            {link.card}
          </text>
        )}
      </g>
    );
  }

  return (
    <g key={`l-${index}`}>
      <line
        x1={n1.x}
        y1={n1.y}
        x2={n2.x}
        y2={n2.y}
        stroke="#334155"
        strokeWidth="2"
      />
      {link.card && (
        <text
          x={mx + nx * textOffset}
          y={my + ny * textOffset}
          fill="#b91c1c"
          fontSize="14"
          fontWeight="bold"
          textAnchor="middle"
          dominantBaseline="middle"
        >
          {link.card}
        </text>
      )}
    </g>
  );
};

// --- REACT APP ---
export default function ChenEditor() {
  const [code, setCode] = useState(DEFAULT_CODE);
  const [layout, setLayout] = useState({ nodes: [], links: [], errors: [] });
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef(null);

  useEffect(() => {
    const { nodes, links, errors } = parseChenCode(code);
    if (errors.length === 0) {
      const positionedNodes = calculateLayout(nodes, links, 800, 600);
      setLayout({ nodes: positionedNodes, links, errors: [] });
    } else {
      setLayout((prev) => ({ ...prev, errors }));
    }
  }, [code]);

  const handleWheel = (e) =>
    setTransform((p) => ({
      ...p,
      scale: Math.min(Math.max(0.2, p.scale * (e.deltaY > 0 ? 0.9 : 1.1)), 4),
    }));
  const handlePointerDown = (e) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - transform.x, y: e.clientY - transform.y });
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const handlePointerMove = (e) => {
    if (isDragging)
      setTransform((p) => ({
        ...p,
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      }));
  };
  const handlePointerUp = (e) => {
    setIsDragging(false);
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  return (
    <div className="flex flex-col md:flex-row h-screen w-full bg-slate-900 text-slate-100 font-sans overflow-hidden">
      {/* LEFT PANEL */}
      <div className="w-full md:w-1/3 h-1/2 md:h-full border-b md:border-b-0 md:border-r border-slate-700 flex flex-col z-10">
        <div className="p-3 bg-slate-800 border-b border-slate-700 flex justify-between items-center">
          <h1 className="text-lg font-bold text-blue-400">
            Chen Code Pro (Full Spec)
          </h1>
        </div>

        <textarea
          className="flex-1 w-full bg-slate-900 text-green-400 p-4 font-mono text-sm resize-none outline-none focus:ring-inset focus:ring-1 focus:ring-blue-500"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          spellCheck="false"
        />

        <div className="h-10 md:h-10 bg-slate-800 border-t border-slate-700 p-3 overflow-hidden">
          {layout.errors.length > 0 ? (
            <div className="text-red-400 font-mono text-sm">
              <h3 className="font-bold mb-1">Errors:</h3>
              {layout.errors.map((err, i) => (
                <div key={i}>{err}</div>
              ))}
            </div>
          ) : (
            <div className="text-slate-400 font-bold font-mono text-xs whitespace-pre-wrap">
              <Link to="/how-to-use" className="text-blue-400 hover:underline">
                View Documentation & AI Prompt Guide
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div
        className="w-full md:w-2/3 h-1/2 md:h-full bg-slate-50 relative overflow-hidden touch-none cursor-grab active:cursor-grabbing"
        ref={containerRef}
        onWheel={handleWheel}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <div className="absolute top-4 right-4 bg-white/80 p-2 rounded shadow text-slate-800 text-xs font-bold z-10 pointer-events-none">
          Scroll: Zoom | Drag: Pan | Zoom: {Math.round(transform.scale * 100)}%
        </div>

        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(#cbd5e1 1px, transparent 1px)",
            backgroundSize: `${20 * transform.scale}px ${
              20 * transform.scale
            }px`,
            backgroundPosition: `${transform.x}px ${transform.y}px`,
          }}
        ></div>

        <svg viewBox="0 0 800 600" className="w-full h-full absolute inset-0">
          <g
            transform={`translate(${transform.x}, ${transform.y}) scale(${transform.scale})`}
          >
            {/* Links */}
            {layout.links.map((link, i) => {
              const n1 = layout.nodes.find((n) => n.id === link.from);
              const n2 = layout.nodes.find((n) => n.id === link.to);
              if (
                !n1 ||
                !n2 ||
                !Number.isFinite(n1.x) ||
                !Number.isFinite(n1.y) ||
                !Number.isFinite(n2.x) ||
                !Number.isFinite(n2.y)
              )
                return null;
              return renderLink(link, n1, n2, i);
            })}

            {/* Nodes */}
            {layout.nodes.map((node) => {
              if (node.type === "entity") {
                return (
                  <g
                    key={node.id}
                    transform={`translate(${node.x}, ${node.y})`}
                  >
                    <rect
                      x="-60"
                      y="-30"
                      width="120"
                      height="60"
                      fill="#f8fafc"
                      stroke="#0f172a"
                      strokeWidth="2.5"
                    />
                    <text
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill="#0f172a"
                      fontWeight="bold"
                    >
                      {node.label}
                    </text>
                  </g>
                );
              } else if (node.type === "weak_entity") {
                return (
                  <g
                    key={node.id}
                    transform={`translate(${node.x}, ${node.y})`}
                  >
                    <rect
                      x="-60"
                      y="-30"
                      width="120"
                      height="60"
                      fill="#f8fafc"
                      stroke="#0f172a"
                      strokeWidth="2.5"
                    />
                    <rect
                      x="-55"
                      y="-25"
                      width="110"
                      height="50"
                      fill="none"
                      stroke="#0f172a"
                      strokeWidth="1.5"
                    />
                    <text
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill="#0f172a"
                      fontWeight="bold"
                    >
                      {node.label}
                    </text>
                  </g>
                );
              } else if (node.type === "relationship") {
                return (
                  <g
                    key={node.id}
                    transform={`translate(${node.x}, ${node.y})`}
                  >
                    <polygon
                      points="0,-35 60,0 0,35 -60,0"
                      fill="#e2e8f0"
                      stroke="#0f172a"
                      strokeWidth="2.5"
                    />
                    <text
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill="#0f172a"
                      fontSize="14"
                    >
                      {node.label}
                    </text>
                  </g>
                );
              } else if (node.type === "ident_relationship") {
                return (
                  <g
                    key={node.id}
                    transform={`translate(${node.x}, ${node.y})`}
                  >
                    <polygon
                      points="0,-35 60,0 0,35 -60,0"
                      fill="#e2e8f0"
                      stroke="#0f172a"
                      strokeWidth="2.5"
                    />
                    <polygon
                      points="0,-28 50,0 0,28 -50,0"
                      fill="none"
                      stroke="#0f172a"
                      strokeWidth="1.5"
                    />
                    <text
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill="#0f172a"
                      fontSize="14"
                    >
                      {node.label}
                    </text>
                  </g>
                );
              } else if (node.type === "attribute") {
                return (
                  <g
                    key={node.id}
                    transform={`translate(${node.x}, ${node.y})`}
                  >
                    {node.isMV && (
                      <ellipse
                        rx="54"
                        ry="29"
                        fill="none"
                        stroke="#0f172a"
                        strokeWidth="2"
                      />
                    )}
                    <ellipse
                      rx="50"
                      ry="25"
                      fill="#ffffff"
                      stroke="#0f172a"
                      strokeWidth="2"
                      strokeDasharray={node.isDer ? "6,4" : "none"}
                    />
                    <text
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill="#0f172a"
                      fontSize="13"
                      textDecoration={node.isPK ? "underline" : "none"}
                    >
                      {node.label}
                    </text>
                  </g>
                );
              } else if (node.type === "isa") {
                return (
                  <g
                    key={node.id}
                    transform={`translate(${node.x}, ${node.y})`}
                  >
                    <polygon
                      points="0,-20 25,20 -25,20"
                      fill="#f8fafc"
                      stroke="#0f172a"
                      strokeWidth="2"
                    />
                    <text
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill="#0f172a"
                      fontSize="10"
                      fontWeight="bold"
                      y="5"
                    >
                      ISA
                    </text>
                  </g>
                );
              }
              return null;
            })}
          </g>
        </svg>
      </div>
    </div>
  );
}
