import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { KnowledgeGraphData, GraphNode, GraphLink } from '../types';
import { api } from '../services/api';
import { ConceptSidePanel } from '../components/ConceptSidePanel';
import { useTheme } from '../context/ThemeContext';
import {
  Search,
  Filter,
  Maximize2,
  Minimize2,
  RefreshCw,
  Layers,
  Sparkles,
  AlertTriangle,
  ZoomIn,
  ZoomOut,
  RotateCcw,
} from 'lucide-react';

interface Props {
  selectedConcept: string | null;
  onSelectConcept: (conceptName: string | null) => void;
  onLaunchQuiz: (conceptName: string) => void;
}

export const GraphPage: React.FC<Props> = ({
  selectedConcept,
  onSelectConcept,
  onLaunchQuiz,
}) => {
  const { isDark } = useTheme();
  const [graphData, setGraphData] = useState<KnowledgeGraphData | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDomain, setFilterDomain] = useState('ALL');
  const [filterStrength, setFilterStrength] = useState('ALL');
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const fgRef = useRef<any>(null);

  const loadGraph = async () => {
    try {
      setLoading(true);
      const data = await api.getGraph();
      setGraphData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGraph();
  }, []);

  // Domains list for filter
  const domains = useMemo(() => {
    if (!graphData) return [];
    const set = new Set<string>();
    graphData.nodes.forEach((n) => set.add(n.domain));
    return Array.from(set);
  }, [graphData]);

  // Highlight neighbors set
  const highlightNodes = useMemo(() => {
    const set = new Set<string>();
    if (!hoveredNode && !selectedConcept) return set;
    const targetName = hoveredNode ? hoveredNode.id : selectedConcept;
    if (!targetName || !graphData) return set;

    set.add(targetName);
    graphData.links.forEach((link: any) => {
      const s = typeof link.source === 'object' ? link.source.id : link.source;
      const t = typeof link.target === 'object' ? link.target.id : link.target;
      if (s === targetName) set.add(t);
      if (t === targetName) set.add(s);
    });
    return set;
  }, [hoveredNode, selectedConcept, graphData]);

  // Filtered nodes and links
  const filteredData = useMemo(() => {
    if (!graphData) return { nodes: [], links: [] };

    const nodes = graphData.nodes.filter((node) => {
      // Domain filter
      if (filterDomain !== 'ALL' && node.domain !== filterDomain) return false;
      // Search filter
      if (searchQuery && !node.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      // Strength filter
      if (filterStrength === 'WEAK' && node.confidence >= 0.45) return false;
      if (filterStrength === 'MEDIUM' && (node.confidence < 0.45 || node.confidence >= 0.70)) return false;
      if (filterStrength === 'STRONG' && node.confidence < 0.70) return false;
      if (filterStrength === 'BOTTLENECK' && !node.is_bottleneck) return false;
      return true;
    });

    const nodeIds = new Set(nodes.map((n) => n.id));
    const links = graphData.links.filter((link: any) => {
      const s = typeof link.source === 'object' ? link.source.id : link.source;
      const t = typeof link.target === 'object' ? link.target.id : link.target;
      return nodeIds.has(s) && nodeIds.has(t);
    });

    return { nodes, links };
  }, [graphData, filterDomain, filterStrength, searchQuery]);

  // Custom node canvas renderer adapted for Light / Dark theme
  const paintNode = useCallback(
    (node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
      const isSelected = node.id === selectedConcept;
      const isHovered = hoveredNode && node.id === hoveredNode.id;
      const isNeighbor = highlightNodes.has(node.id);
      const isBottleneck = node.is_bottleneck;

      const size = Math.max(4, (node.degree || 1) * 1.6);

      // Draw Bottleneck glowing aura
      if (isBottleneck) {
        ctx.beginPath();
        ctx.arc(node.x, node.y, size + 5, 0, 2 * Math.PI, false);
        ctx.fillStyle = isDark ? 'rgba(244, 63, 94, 0.25)' : 'rgba(225, 29, 72, 0.2)';
        ctx.fill();
        ctx.strokeStyle = isDark ? '#f43f5e' : '#e11d48';
        ctx.lineWidth = 1.2;
        ctx.stroke();
      }

      // Draw selection / neighbor aura
      if (isSelected || isHovered) {
        ctx.beginPath();
        ctx.arc(node.x, node.y, size + 4, 0, 2 * Math.PI, false);
        ctx.fillStyle = isDark ? 'rgba(168, 85, 247, 0.35)' : 'rgba(126, 34, 206, 0.2)';
        ctx.fill();
        ctx.strokeStyle = isDark ? '#a855f7' : '#7e22ce';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      // Draw main node circle
      ctx.beginPath();
      ctx.arc(node.x, node.y, size, 0, 2 * Math.PI, false);

      // Node color by confidence: green strong, yellow medium, red weak
      let fillColor = isDark ? '#10b981' : '#059669'; // Green
      if (node.confidence < 0.45) {
        fillColor = isDark ? '#ef4444' : '#e11d48'; // Red weak
      } else if (node.confidence < 0.70) {
        fillColor = isDark ? '#f59e0b' : '#d97706'; // Yellow medium
      }
      ctx.fillStyle = fillColor;
      ctx.fill();

      // Border ring
      ctx.strokeStyle = isBottleneck ? (isDark ? '#ffe4e6' : '#fda4af') : (isDark ? '#1e1b4b' : '#cbd5e1');
      ctx.lineWidth = 1;
      ctx.stroke();

      // Label text
      const fontSize = Math.max(3, 11 / globalScale);
      ctx.font = `${isSelected || isHovered ? 'bold ' : ''}${fontSize}px "Plus Jakarta Sans", sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';

      const label = node.name;
      // Text shadow for crisp readability in both light & dark
      ctx.shadowColor = isDark ? 'rgba(0, 0, 0, 0.9)' : 'rgba(255, 255, 255, 0.95)';
      ctx.shadowBlur = 4;
      ctx.fillStyle =
        isSelected || isHovered
          ? isDark
            ? '#ffffff'
            : '#581c87'
          : isNeighbor || highlightNodes.size === 0
          ? isDark
            ? '#e2e8f0'
            : '#0f172a'
          : isDark
          ? '#64748b'
          : '#94a3b8';
      ctx.fillText(label, node.x, node.y + size + 2);
      ctx.shadowBlur = 0; // reset
    },
    [selectedConcept, hoveredNode, highlightNodes, isDark]
  );

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const handleZoomIn = () => {
    if (fgRef.current) fgRef.current.zoom(fgRef.current.zoom() * 1.3, 400);
  };

  const handleZoomOut = () => {
    if (fgRef.current) fgRef.current.zoom(fgRef.current.zoom() / 1.3, 400);
  };

  const handleResetZoom = () => {
    if (fgRef.current) fgRef.current.zoomToFit(400, 40);
  };

  return (
    <div ref={containerRef} className="relative flex-1 flex flex-col h-full bg-bg-primary text-text-primary overflow-hidden select-none">
      {/* Top Filter and Search Bar */}
      <div className="absolute top-4 left-4 right-4 z-20 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
        {/* Search & Domain Filter Box */}
        <div className="flex flex-wrap items-center gap-2 pointer-events-auto bg-bg-surface/90 backdrop-blur-md p-2 rounded-2xl border border-border-subtle shadow-xl">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-text-muted absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Search concepts (e.g. Attention, RAG)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 bg-bg-elevated border border-border-subtle rounded-xl text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-purple w-44 sm:w-60"
            />
          </div>

          {/* Domain Dropdown */}
          <select
            value={filterDomain}
            onChange={(e) => setFilterDomain(e.target.value)}
            className="px-2.5 py-1.5 bg-bg-elevated border border-border-subtle rounded-xl text-xs text-text-primary focus:outline-none focus:border-accent-purple"
          >
            <option value="ALL">All Domains ({domains.length})</option>
            {domains.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>

          {/* Strength Filter */}
          <select
            value={filterStrength}
            onChange={(e) => setFilterStrength(e.target.value)}
            className="px-2.5 py-1.5 bg-bg-elevated border border-border-subtle rounded-xl text-xs text-text-primary focus:outline-none focus:border-accent-purple"
          >
            <option value="ALL">All Masteries</option>
            <option value="BOTTLENECK">Active Bottlenecks</option>
            <option value="WEAK">Weak (&lt;45%)</option>
            <option value="MEDIUM">Developing (45-69%)</option>
            <option value="STRONG">Mastered (&ge;70%)</option>
          </select>
        </div>

        {/* View Controls: Zoom, Reset, Fullscreen */}
        <div className="flex items-center gap-1.5 pointer-events-auto bg-bg-surface/90 backdrop-blur-md p-1.5 rounded-2xl border border-border-subtle shadow-xl">
          <button
            onClick={handleZoomIn}
            className="p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-elevated transition-colors cursor-pointer"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={handleZoomOut}
            className="p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-elevated transition-colors cursor-pointer"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={handleResetZoom}
            className="p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-elevated transition-colors cursor-pointer"
            title="Fit to Screen"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={toggleFullscreen}
            className="p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-elevated transition-colors cursor-pointer"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main Force Graph Canvas Container */}
      <div className="flex-1 w-full h-full relative">
        {loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-bg-primary/80 z-10 text-text-secondary">
            <div className="w-8 h-8 border-2 border-accent-purple border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-3 text-xs font-mono">Rendering semantic knowledge graph...</p>
          </div>
        )}

        {filteredData.nodes.length > 0 && (
          <ForceGraph2D
            ref={fgRef}
            graphData={filteredData}
            backgroundColor={isDark ? '#020617' : '#ffffff'}
            nodeRelSize={4}
            nodeCanvasObject={paintNode}
            nodePointerAreaPaint={(node: any, color, ctx) => {
              const size = Math.max(8, (node.degree || 1) * 2.2);
              ctx.beginPath();
              ctx.arc(node.x, node.y, size, 0, 2 * Math.PI, false);
              ctx.fillStyle = color;
              ctx.fill();
            }}
            linkWidth={(link: any) => {
              const s = typeof link.source === 'object' ? link.source.id : link.source;
              const t = typeof link.target === 'object' ? link.target.id : link.target;
              if (highlightNodes.has(s) && highlightNodes.has(t)) return 2.2;
              return 1.2;
            }}
            linkColor={(link: any) => {
              const s = typeof link.source === 'object' ? link.source.id : link.source;
              const t = typeof link.target === 'object' ? link.target.id : link.target;
              if (highlightNodes.has(s) && highlightNodes.has(t)) {
                return link.type === 'prerequisite_of' ? (isDark ? '#c084fc' : '#7e22ce') : (isDark ? '#38bdf8' : '#0284c7');
              }
              if (highlightNodes.size > 0) return isDark ? 'rgba(51, 65, 85, 0.2)' : 'rgba(203, 213, 225, 0.45)';
              return link.type === 'prerequisite_of'
                ? isDark
                  ? 'rgba(168, 85, 247, 0.55)'
                  : 'rgba(126, 34, 206, 0.65)'
                : link.type === 'part_of'
                ? isDark
                  ? 'rgba(56, 189, 248, 0.55)'
                  : 'rgba(2, 132, 199, 0.65)'
                : isDark
                ? 'rgba(100, 116, 139, 0.35)'
                : 'rgba(148, 163, 184, 0.55)';
            }}
            linkDirectionalArrowLength={4.5}
            linkDirectionalArrowRelPos={0.88}
            onNodeClick={(node: any) => {
              onSelectConcept(node.id);
            }}
            onNodeHover={(node: any) => {
              setHoveredNode(node || null);
            }}
            cooldownTicks={120}
            onEngineStop={() => {
              if (fgRef.current) fgRef.current.zoomToFit(400, 40);
            }}
          />
        )}
      </div>

      {/* Graph Legend & Status Footer Bar */}
      <div className="absolute bottom-4 left-4 z-20 pointer-events-auto bg-bg-surface/90 backdrop-blur-md px-4 py-2 rounded-2xl border border-border-subtle text-xs text-text-secondary shadow-xl flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-1.5 font-mono text-[10px] text-text-muted uppercase tracking-wider">
          Legend:
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
          <span className="text-[11px] text-text-primary">Mastered (&ge;70%)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
          <span className="text-[11px] text-text-primary">Developing (45-69%)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
          <span className="text-[11px] text-text-primary">Weak (&lt;45%)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full ring-2 ring-danger bg-danger-bg"></span>
          <span className="text-[11px] text-danger font-semibold">Active Bottleneck</span>
        </div>
        <div className="hidden sm:flex items-center gap-1.5 border-l border-border-subtle pl-3">
          <span className="w-3 h-0.5 bg-accent-purple"></span>
          <span className="text-[11px] text-accent-purple font-mono">prerequisite_of</span>
        </div>
      </div>

      {/* Concept Deep Dive Slideout Panel */}
      <ConceptSidePanel
        conceptName={selectedConcept}
        onClose={() => onSelectConcept(null)}
        onLaunchQuiz={onLaunchQuiz}
        onRevisionSuccess={loadGraph}
        onSelectConcept={(name) => onSelectConcept(name)}
      />
    </div>
  );
};
