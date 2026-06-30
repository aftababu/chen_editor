import dagre from "dagre";

// --- HELPER: CALCULATE RIGID STAR ROTATION OFFSET ---
// Returns the best starting angle offset to maximize distance between attribute ovals and structural lines.
const getBestStarOffset = (linkAngles, count) => {
  if (linkAngles.length === 0 || count === 0) return -Math.PI / 2;

  let bestOffset = 0;
  let maxMinDist = -1;

  // Test 36 rotational offsets within one sector
  const sector = (2 * Math.PI) / count;
  const steps = 36;
  
  for (let s = 0; s < steps; s++) {
    const offset = (s / steps) * sector;
    let minDistForThisOffset = Infinity;

    for (let i = 0; i < count; i++) {
      const starAngle = offset + i * sector;

      linkAngles.forEach((la) => {
        let diff = Math.abs(starAngle - la);
        diff = diff % (2 * Math.PI);
        if (diff > Math.PI) diff = 2 * Math.PI - diff;
        minDistForThisOffset = Math.min(minDistForThisOffset, diff);
      });
    }

    if (minDistForThisOffset > maxMinDist) {
      maxMinDist = minDistForThisOffset;
      bestOffset = offset;
    }
  }

  return bestOffset;
};

// --- DAGRE / SUGIYAMA LAYERED GRAPH LAYOUT SOLVER ---
export const calculateLayout = (nodes, links, width, height) => {
  // 1. Initialize Dagre Graph
  const g = new dagre.graphlib.Graph();
  g.setGraph({
    rankdir: "TB",
    ranksep: 180,
    nodesep: 160,
    edgesep: 60,
    marginx: 60,
    marginy: 60,
  });
  g.setDefaultEdgeLabel(() => ({}));

  // Separate attributes from structural nodes (entities, relationships, ISA)
  const structuralNodes = nodes.filter((n) => n.type !== "attribute");

  // 2. Add structural nodes to the Dagre solver graph
  structuralNodes.forEach((node) => {
    // Dynamic collision prevention based on label length
    let baseW = node.label ? Math.max(120, node.label.length * 10) : 120;
    let w = baseW;
    let h = 60;
    if (node.type === "relationship" || node.type === "ident_relationship") {
      w = baseW;
      h = 70;
    } else if (node.type === "isa") {
      w = 50;
      h = 40;
    }
    g.setNode(node.id, { width: w, height: h });
  });

  // 3. Add edges between structural nodes (skip attributes)
  links.forEach((link) => {
    const fromNode = nodes.find((n) => n.id === link.from);
    const toNode = nodes.find((n) => n.id === link.to);
    if (
      fromNode &&
      toNode &&
      fromNode.type !== "attribute" &&
      toNode.type !== "attribute"
    ) {
      g.setEdge(link.from, link.to);
    }
  });

  // 4. Run Dagre Layout (Calculates optimized, non-overlapping coordinates for all structural nodes)
  dagre.layout(g);

  // 5. Build positioned nodes list from Dagre coordinates
  const positionedNodes = [];

  structuralNodes.forEach((node) => {
    const dagreNode = g.node(node.id);
    if (dagreNode) {
      positionedNodes.push({
        ...node,
        x: Number.isFinite(dagreNode.x) ? dagreNode.x : width / 2,
        y: Number.isFinite(dagreNode.y) ? dagreNode.y : height / 2,
      });
    } else {
      positionedNodes.push({
        ...node,
        x: width / 2,
        y: height / 2,
      });
    }
  });

  // Helper: Find direct attributes of any node
  const getDirectAttributes = (nodeId) => {
    const attrs = [];
    links.forEach((link) => {
      if (link.from === nodeId) {
        const childNode = nodes.find((n) => n.id === link.to);
        if (childNode && childNode.type === "attribute") {
          attrs.push(childNode);
        }
      }
    });
    return attrs;
  };

  // Helper: Get structural link angles for a parent node to prevent attribute placement collisions
  const getStructuralLinkAngles = (nodeId) => {
    const angles = [];
    links.forEach((link) => {
      let otherId = null;
      if (link.from === nodeId) {
        otherId = link.to;
      } else if (link.to === nodeId) {
        otherId = link.from;
      }

      if (otherId) {
        const otherNode = nodes.find((n) => n.id === otherId);
        if (otherNode && otherNode.type !== "attribute") {
          const posOther = positionedNodes.find((pn) => pn.id === otherId);
          const posSelf = positionedNodes.find((pn) => pn.id === nodeId);
          if (posOther && posSelf) {
            const angle = Math.atan2(posOther.y - posSelf.y, posOther.x - posSelf.x);
            angles.push(angle);
          }
        }
      }
    });
    return angles;
  };

  // 6. Radial Attribute Placement (Recursive Rigid Star Fanning)
  const placeAttributesRecursive = (parentNodeId, parentX, parentY, baseAngle, depth) => {
    const childAttrs = getDirectAttributes(parentNodeId);
    const count = childAttrs.length;
    if (count === 0) return;

    // Dynamically scale radius based on the number of attributes to guarantee no overlapping
    // Using an elliptical radius ensures that attributes placed horizontally (left/right) 
    // clear the wide rectangular entity borders comfortably.
    const scaleFactor = Math.max(1, count / 5);
    const radiusX = depth === 0 ? 140 * scaleFactor : 90 * scaleFactor;
    const radiusY = depth === 0 ? 110 * scaleFactor : 80 * scaleFactor;

    if (depth === 0) {
      // Direct attributes: Rotate a perfectly spaced star shape to avoid structural lines
      const linkAngles = getStructuralLinkAngles(parentNodeId);
      const bestOffset = getBestStarOffset(linkAngles, count);

      childAttrs.forEach((child, index) => {
        const angle = bestOffset + (2 * Math.PI * index) / count;
        const attrNode = {
          ...child,
          x: parentX + radiusX * Math.cos(angle),
          y: parentY + radiusY * Math.sin(angle),
        };
        positionedNodes.push(attrNode);
        
        // Recurse for composite sub-attributes
        placeAttributesRecursive(child.id, attrNode.x, attrNode.y, angle, depth + 1);
      });
    } else {
      // Composite attributes: Fan out in an arc facing directly away from parent entity
      const arc = (120 * Math.PI) / 180;
      const startAngle = baseAngle - arc / 2;
      const step = count > 1 ? arc / (count - 1) : 0;
      
      childAttrs.forEach((child, index) => {
        const angle = count > 1 ? startAngle + index * step : baseAngle;
        const attrNode = {
          ...child,
          x: parentX + radiusX * Math.cos(angle),
          y: parentY + radiusY * Math.sin(angle),
        };
        positionedNodes.push(attrNode);
        
        placeAttributesRecursive(child.id, attrNode.x, attrNode.y, angle, depth + 1);
      });
    }
  };

  // Run recursive attributes fanning starting from ALL structural nodes (Entities + Relationships)
  structuralNodes.forEach((parent) => {
    const posParent = positionedNodes.find((pn) => pn.id === parent.id);
    if (posParent) {
      placeAttributesRecursive(parent.id, posParent.x, posParent.y, 0, 0);
    }
  });

    // 7. Mathematically Center the Complete Layout within the 800x600 Viewport
    let shiftX = 0, shiftY = 0;
    if (positionedNodes.length > 0) {
      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
      positionedNodes.forEach((n) => {
        minX = Math.min(minX, n.x);
        maxX = Math.max(maxX, n.x);
        minY = Math.min(minY, n.y);
        maxY = Math.max(maxY, n.y);
      });

      const centerX = (minX + maxX) / 2;
      const centerY = (minY + maxY) / 2;
      shiftX = width / 2 - centerX;
      shiftY = height / 2 - centerY;

      positionedNodes.forEach((n) => {
        n.x += shiftX;
        n.y += shiftY;
      });
    }

    // 8. Extract Edge Points for Orthogonal Routing and shift them too
    const positionedLinks = links.map((link) => {
      const fromNode = nodes.find((n) => n.id === link.from);
      const toNode = nodes.find((n) => n.id === link.to);
      
      let points = null;
      if (fromNode && toNode && fromNode.type !== "attribute" && toNode.type !== "attribute") {
        const edge = g.edge(link.from, link.to);
        if (edge && edge.points) {
          points = edge.points.map(p => ({
            x: p.x + shiftX,
            y: p.y + shiftY
          }));
        }
      }
      return { ...link, points };
    });

    return { positionedNodes, positionedLinks };
};
