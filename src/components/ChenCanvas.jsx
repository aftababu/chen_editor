import React, { useState, useRef } from "react";

// --- RENDER LINK HELPER ---
const renderLink = (link, n1, n2, index) => {
  let pathD = "";
  let cardX = (n1.x + n2.x) / 2;
  let cardY = (n1.y + n2.y) / 2;
  let textOffset = 15;
  let nx = 0,
    ny = 0;

  if (link.points && link.points.length >= 2) {
    // Orthogonal routing via Dagre points (draw as polyline)
    pathD = link.points
      .map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`))
      .join(" ");

    // Position cardinality near the entity (which is usually the start or end of the path)
    // If n1 is an entity and n2 is a relationship, we put it near n1
    const pStart = link.points[0];
    const pNext = link.points[1] || link.points[link.points.length - 1];

    // Calculate normal for text offset
    let dx = pNext.x - pStart.x;
    let dy = pNext.y - pStart.y;
    let len = Math.sqrt(dx * dx + dy * dy) || 1;
    nx = -dy / len;
    ny = dx / len;

    if (n1.type === "entity" || n1.type === "weak_entity") {
      cardX = pStart.x + dx * 0.3;
      cardY = pStart.y + dy * 0.3;
    } else {
      const pEnd = link.points[link.points.length - 1];
      const pPrev = link.points[link.points.length - 2] || pStart;
      let dxE = pEnd.x - pPrev.x;
      let dyE = pEnd.y - pPrev.y;
      let lenE = Math.sqrt(dxE * dxE + dyE * dyE) || 1;
      nx = -dyE / lenE;
      ny = dxE / lenE;
      cardX = pEnd.x - dxE * 0.3;
      cardY = pEnd.y - dyE * 0.3;
    }
  } else {
    // Fallback straight line (for attributes)
    pathD = `M ${n1.x} ${n1.y} L ${n2.x} ${n2.y}`;
    let dx = n2.x - n1.x,
      dy = n2.y - n1.y;
    let len = Math.sqrt(dx * dx + dy * dy) || 1;
    nx = -dy / len;
    ny = dx / len;
  }

  // Draw two lines for total participation, one for partial
  return (
    <g key={`l-${index}`}>
      {link.total ? (
        <>
          <path
            d={pathD}
            fill="none"
            stroke="#334155"
            strokeWidth="1.5"
            vectorEffect="non-scaling-stroke"
            strokeLinecap="round"
            strokeLinejoin="round"
            transform={`translate(${nx * 3}, ${ny * 3})`}
          />
          <path
            d={pathD}
            fill="none"
            stroke="#334155"
            strokeWidth="1.5"
            vectorEffect="non-scaling-stroke"
            strokeLinecap="round"
            strokeLinejoin="round"
            transform={`translate(${-nx * 3}, ${-ny * 3})`}
          />
        </>
      ) : (
        <path
          d={pathD}
          fill="none"
          stroke="#334155"
          strokeWidth="2"
          vectorEffect="non-scaling-stroke"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
      {link.card && (
        <text
          x={cardX + nx * textOffset}
          y={cardY + ny * textOffset}
          fill="#b91c1c"
          fontSize="14"
          fontWeight="bold"
          textAnchor="middle"
          dominantBaseline="middle"
          vectorEffect="non-scaling-stroke"
        >
          {link.card}
        </text>
      )}
    </g>
  );
};

export default function ChenCanvas({ layout }) {
  // Set default zoom to 1 (scale: 1)
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef(null);
  const svgRef = useRef(null);

  const handleWheel = (e) => {
    e.preventDefault();
    setTransform((p) => ({
      ...p,
      scale: Math.min(Math.max(0.2, p.scale * (e.deltaY > 0 ? 0.9 : 1.1)), 4),
    }));
  };

  const handlePointerDown = (e) => {
    if (e.button !== 0) return; // Only process left clicks
    setIsDragging(true);
    setDragStart({ x: e.clientX - transform.x, y: e.clientY - transform.y });
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e) => {
    if (isDragging) {
      if (e.buttons !== 1) {
        // Fallback: If we missed a pointerup event (e.g. from the resize handle absorbing it), stop dragging
        setIsDragging(false);
        return;
      }
      setTransform((prev) => ({
        ...prev,
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      }));
    }
  };

  const handlePointerUp = (e) => {
    setIsDragging(false);
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  const resetView = () => {
    setTransform({ x: 0, y: 0, scale: 1 });
  };

  // Calculates the bounding box containing all diagram nodes
  const getDiagramBoundingBox = () => {
    if (layout.nodes.length === 0) return null;
    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;
    layout.nodes.forEach((n) => {
      let halfW = 60;
      let halfH = 35;
      if (n.type === "attribute") {
        halfW = 54;
        halfH = 29;
      }
      minX = Math.min(minX, n.x - halfW);
      maxX = Math.max(maxX, n.x + halfW);
      minY = Math.min(minY, n.y - halfH);
      maxY = Math.max(maxY, n.y + halfH);
    });
    return { minX, minY, maxX, maxY };
  };

  // Fit to screen on layout change
  React.useEffect(() => {
    if (layout.nodes.length === 0 || !containerRef.current) return;
    const bbox = getDiagramBoundingBox();
    if (bbox) {
      const containerRect = containerRef.current.getBoundingClientRect();
      const padding = 60;
      const diagramWidth = bbox.maxX - bbox.minX;
      const diagramHeight = bbox.maxY - bbox.minY;

      const scaleX = (containerRect.width - padding * 2) / (diagramWidth || 1);
      const scaleY =
        (containerRect.height - padding * 2) / (diagramHeight || 1);
      let newScale = Math.min(scaleX, scaleY, 2); // Cap max zoom at 2x

      // Calculate center offset
      const cx = (bbox.minX + bbox.maxX) / 2;
      const cy = (bbox.minY + bbox.maxY) / 2;
      const tx = containerRect.width / 2 - cx * newScale;
      const ty = containerRect.height / 2 - cy * newScale;

      setTransform({ x: tx, y: ty, scale: newScale });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layout]);

  // Clones the SVG element, centers the viewBox on the diagram nodes, and downloads a PNG
  const handleScreenshot = () => {
    const svgElement = svgRef.current;
    if (!svgElement || layout.nodes.length === 0) return;

    const bbox = getDiagramBoundingBox();
    if (!bbox) return;

    const pad = 30;
    const minX = bbox.minX - pad;
    const minY = bbox.minY - pad;
    const width = bbox.maxX - bbox.minX + pad * 2;
    const height = bbox.maxY - bbox.minY + pad * 2;

    // Clone SVG to modify properties for canvas rendering
    const clonedSvg = svgElement.cloneNode(true);

    // Reset pan/zoom transform inside the cloned SVG to native coordinates
    const gElement = clonedSvg.querySelector("g");
    if (gElement) {
      gElement.setAttribute("transform", "translate(0, 0) scale(1)");
    }

    // Set SVG attributes to match diagram bounds
    clonedSvg.setAttribute("viewBox", `${minX} ${minY} ${width} ${height}`);
    clonedSvg.setAttribute("width", width.toString());
    clonedSvg.setAttribute("height", height.toString());
    clonedSvg.style.backgroundColor = "#ffffff";

    // Serialize SVG element to XML string
    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(clonedSvg);

    // Render SVG XML to Image, draw on Canvas, and download as PNG
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");

    const img = new Image();
    const svgBlob = new Blob([svgString], {
      type: "image/svg+xml;charset=utf-8",
    });
    const url = URL.createObjectURL(svgBlob);

    img.onload = () => {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0);

      const pngUrl = canvas.toDataURL("image/png");
      const downloadLink = document.createElement("a");
      downloadLink.href = pngUrl;
      downloadLink.download = "er-diagram.png";
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);

      URL.revokeObjectURL(url);
    };

    img.src = url;
  };
  const gridOpacity = Math.max(0.09, Math.min(0.22, transform.scale * 0.22));
  const gridGap = Math.max(12, 24 * transform.scale);
  const dotSize = Math.max(0.8, 1.5 * transform.scale);
  return (
    <div
      className="w-full h-full bg-slate-100 dark:bg-slate-950 relative overflow-hidden touch-none cursor-grab active:cursor-grabbing flex-1 select-none transition-colors duration-300"
      ref={containerRef}
      onWheel={handleWheel}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      <div
        className="absolute top-4 right-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-4 py-2 rounded-full shadow-lg border border-slate-200/50 dark:border-slate-800/50 text-slate-700 dark:text-slate-200 text-xs font-bold z-10 flex items-center space-x-3 pointer-events-auto transition-colors duration-300"
        onPointerDown={(e) => e.stopPropagation()}
      >
        <span className="opacity-80 tracking-wide">
          Zoom: {Math.round(transform.scale * 100)}%
        </span>
        <button
          onClick={resetView}
          className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-full transition-colors text-[11px]"
        >
          Reset View
        </button>
        <button
          onClick={handleScreenshot}
          disabled={layout.nodes.length === 0}
          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400 dark:disabled:text-slate-600 text-white rounded-full transition-colors text-[11px] font-semibold shadow-sm shadow-blue-500/20"
        >
          Save PNG
        </button>
      </div>

      <div
        className="absolute inset-0 pointer-events-none"
        // style={{
        //   backgroundImage: "radial-gradient(#cbd5e1 1.5px, transparent 1.5px)",
        //   backgroundSize: `${24 * transform.scale}px ${24 * transform.scale}px`,
        //   backgroundPosition: `${transform.x}px ${transform.y}px`,
        // }}
        style={{
          backgroundImage: `radial-gradient(rgba(148,163,184,${gridOpacity}) ${dotSize}px, transparent ${dotSize}px)`,
          backgroundSize: `${gridGap}px ${gridGap}px`,
          backgroundPosition: `${transform.x}px ${transform.y}px`,
        }}
      ></div>

      <svg
        ref={svgRef}
        className="w-full h-full absolute inset-0 select-none"
        style={{ userSelect: "none", WebkitUserSelect: "none" }}
        shapeRendering="geometricPrecision"
        textRendering="geometricPrecision"
      >
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
            ) {
              return null;
            }
            return renderLink(link, n1, n2, i);
          })}

          {/* Nodes */}
          {layout.nodes.map((node) => {
            if (node.type === "entity") {
              return (
                <g key={node.id} transform={`translate(${node.x}, ${node.y})`}>
                  <rect
                    x="-60"
                    y="-30"
                    width="120"
                    height="60"
                    fill="#f8fafc"
                    stroke="#0f172a"
                    strokeWidth="2.5"
                    vectorEffect="non-scaling-stroke"
                  />
                  <text
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="#0f172a"
                    fontWeight="bold"
                    fontSize="13"
                    vectorEffect="non-scaling-stroke"
                  >
                    {node.label}
                  </text>
                </g>
              );
            } else if (node.type === "weak_entity") {
              return (
                <g key={node.id} transform={`translate(${node.x}, ${node.y})`}>
                  <rect
                    x="-60"
                    y="-30"
                    width="120"
                    height="60"
                    fill="#f8fafc"
                    stroke="#0f172a"
                    strokeWidth="2.5"
                    vectorEffect="non-scaling-stroke"
                  />
                  <rect
                    x="-55"
                    y="-25"
                    width="110"
                    height="50"
                    fill="none"
                    stroke="#0f172a"
                    strokeWidth="1.5"
                    vectorEffect="non-scaling-stroke"
                  />
                  <text
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="#0f172a"
                    fontWeight="bold"
                    fontSize="13"
                    vectorEffect="non-scaling-stroke"
                  >
                    {node.label}
                  </text>
                </g>
              );
            } else if (node.type === "relationship") {
              return (
                <g key={node.id} transform={`translate(${node.x}, ${node.y})`}>
                  <polygon
                    points="0,-35 60,0 0,35 -60,0"
                    fill="#e2e8f0"
                    stroke="#0f172a"
                    strokeWidth="2.5"
                    vectorEffect="non-scaling-stroke"
                  />
                  <text
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="#0f172a"
                    fontSize="13"
                    vectorEffect="non-scaling-stroke"
                  >
                    {node.label}
                  </text>
                </g>
              );
            } else if (node.type === "ident_relationship") {
              return (
                <g key={node.id} transform={`translate(${node.x}, ${node.y})`}>
                  <polygon
                    points="0,-35 60,0 0,35 -60,0"
                    fill="#e2e8f0"
                    stroke="#0f172a"
                    strokeWidth="2.5"
                    vectorEffect="non-scaling-stroke"
                  />
                  <polygon
                    points="0,-28 50,0 0,28 -50,0"
                    fill="none"
                    stroke="#0f172a"
                    strokeWidth="1.5"
                    vectorEffect="non-scaling-stroke"
                  />
                  <text
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="#0f172a"
                    fontSize="13"
                    vectorEffect="non-scaling-stroke"
                  >
                    {node.label}
                  </text>
                </g>
              );
            } else if (node.type === "attribute") {
              return (
                <g key={node.id} transform={`translate(${node.x}, ${node.y})`}>
                  {node.isMV && (
                    <ellipse
                      rx="54"
                      ry="29"
                      fill="none"
                      stroke="#0f172a"
                      strokeWidth="2"
                      vectorEffect="non-scaling-stroke"
                    />
                  )}
                  <ellipse
                    rx="50"
                    ry="25"
                    fill="#ffffff"
                    stroke="#0f172a"
                    strokeWidth="2"
                    strokeDasharray={node.isDer ? "6,4" : "none"}
                    vectorEffect="non-scaling-stroke"
                  />
                  <text
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="#0f172a"
                    fontSize="12"
                    textDecoration={node.isPK ? "underline" : "none"}
                    vectorEffect="non-scaling-stroke"
                  >
                    {node.label}
                  </text>
                  {node.isPPK && (
                    <line
                      x1={-(node.label.length * 3.5)}
                      y1="10"
                      x2={node.label.length * 3.5}
                      y2="10"
                      stroke="#0f172a"
                      strokeWidth="1.5"
                      strokeDasharray="4,2"
                      vectorEffect="non-scaling-stroke"
                    />
                  )}
                </g>
              );
            } else if (node.type === "isa") {
              return (
                <g key={node.id} transform={`translate(${node.x}, ${node.y})`}>
                  <polygon
                    points="0,-20 25,20 -25,20"
                    fill="#f8fafc"
                    stroke="#0f172a"
                    strokeWidth="2"
                    vectorEffect="non-scaling-stroke"
                  />
                  <text
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="#0f172a"
                    fontSize="10"
                    fontWeight="bold"
                    y="4"
                    vectorEffect="non-scaling-stroke"
                  >
                    ISA
                  </text>
                  {node.isaType && (
                    <text
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill="#b91c1c"
                      fontSize="11"
                      fontWeight="bold"
                      x="25"
                      y="15"
                      vectorEffect="non-scaling-stroke"
                    >
                      {node.isaType}
                    </text>
                  )}
                </g>
              );
            }
            return null;
          })}
        </g>
      </svg>
    </div>
  );
}
