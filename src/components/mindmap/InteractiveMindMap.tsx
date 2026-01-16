import { useState, useRef, useCallback, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  Move,
  ChevronDown,
  ChevronRight
} from 'lucide-react';

interface MindMapNode {
  id: string;
  label: string;
  children: MindMapNode[];
}

interface InteractiveMindMapProps {
  nodes: MindMapNode[];
  title: string;
}

const COLORS = [
  { bg: 'bg-blue-500', text: 'text-blue-500', light: 'bg-blue-100 dark:bg-blue-900/30' },
  { bg: 'bg-green-500', text: 'text-green-500', light: 'bg-green-100 dark:bg-green-900/30' },
  { bg: 'bg-purple-500', text: 'text-purple-500', light: 'bg-purple-100 dark:bg-purple-900/30' },
  { bg: 'bg-orange-500', text: 'text-orange-500', light: 'bg-orange-100 dark:bg-orange-900/30' },
  { bg: 'bg-pink-500', text: 'text-pink-500', light: 'bg-pink-100 dark:bg-pink-900/30' },
  { bg: 'bg-cyan-500', text: 'text-cyan-500', light: 'bg-cyan-100 dark:bg-cyan-900/30' },
];

interface NodeProps {
  node: MindMapNode;
  colorIndex: number;
  level: number;
  onNodeClick: (nodeId: string) => void;
  expandedNodes: Set<string>;
}

const NodeComponent = ({ node, colorIndex, level, onNodeClick, expandedNodes }: NodeProps) => {
  const color = COLORS[colorIndex % COLORS.length];
  const isExpanded = expandedNodes.has(node.id);
  const hasChildren = node.children && node.children.length > 0;

  const getLevelStyles = () => {
    switch (level) {
      case 0:
        return `${color.bg} text-white px-4 py-2 rounded-lg font-medium shadow-md`;
      case 1:
        return `${color.light} ${color.text} px-3 py-1.5 rounded-md text-sm border border-current/20`;
      default:
        return 'bg-background border border-border px-2 py-1 rounded text-xs';
    }
  };

  return (
    <div className="flex flex-col items-center">
      {/* Connection line from parent */}
      {level > 0 && <div className="w-0.5 h-4 bg-border" />}
      
      {/* Node */}
      <div 
        className={`${getLevelStyles()} cursor-pointer transition-all hover:scale-105 hover:shadow-lg flex items-center gap-1`}
        onClick={() => hasChildren && onNodeClick(node.id)}
      >
        {hasChildren && (
          <span className="opacity-60">
            {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
          </span>
        )}
        <span>{node.label}</span>
        {hasChildren && (
          <Badge variant="secondary" className="ml-1 text-[10px] px-1 py-0">
            {node.children.length}
          </Badge>
        )}
      </div>

      {/* Children */}
      {hasChildren && isExpanded && (
        <div className="flex flex-col items-center mt-2">
          <div className="w-0.5 h-4 bg-border" />
          <div className="flex flex-wrap justify-center gap-3 max-w-md">
            {node.children.map((child, idx) => (
              <NodeComponent
                key={child.id}
                node={child}
                colorIndex={level === 0 ? colorIndex : idx}
                level={level + 1}
                onNodeClick={onNodeClick}
                expandedNodes={expandedNodes}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export const InteractiveMindMap = ({ nodes, title }: InteractiveMindMapProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  // Initially expand first level nodes
  useEffect(() => {
    const initialExpanded = new Set<string>();
    nodes.forEach(node => initialExpanded.add(node.id));
    setExpandedNodes(initialExpanded);
  }, [nodes]);

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.2, 2));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.2, 0.5));
  const handleReset = () => {
    setZoom(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 0) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    }
  }, [position]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  }, [isDragging, dragStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleNodeClick = (nodeId: string) => {
    setExpandedNodes(prev => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  };

  const expandAll = () => {
    const allIds = new Set<string>();
    const traverse = (nodes: MindMapNode[]) => {
      nodes.forEach(node => {
        allIds.add(node.id);
        if (node.children) traverse(node.children);
      });
    };
    traverse(nodes);
    setExpandedNodes(allIds);
  };

  const collapseAll = () => {
    setExpandedNodes(new Set());
  };

  return (
    <Card className="relative overflow-hidden">
      {/* Controls */}
      <div className="absolute top-4 right-4 z-10 flex gap-2">
        <Button variant="outline" size="icon" onClick={handleZoomOut}>
          <ZoomOut className="w-4 h-4" />
        </Button>
        <Button variant="outline" size="icon" onClick={handleZoomIn}>
          <ZoomIn className="w-4 h-4" />
        </Button>
        <Button variant="outline" size="icon" onClick={handleReset}>
          <Maximize2 className="w-4 h-4" />
        </Button>
      </div>

      {/* Expand/Collapse controls */}
      <div className="absolute top-4 left-4 z-10 flex gap-2">
        <Button variant="outline" size="sm" onClick={expandAll}>
          Tout déplier
        </Button>
        <Button variant="outline" size="sm" onClick={collapseAll}>
          Tout replier
        </Button>
      </div>

      {/* Dragging indicator */}
      {isDragging && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 bg-muted px-3 py-1 rounded-full text-sm">
          <Move className="w-4 h-4" />
          Déplacement...
        </div>
      )}

      {/* Mind map container */}
      <div 
        ref={containerRef}
        className="min-h-[500px] cursor-grab active:cursor-grabbing select-none"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div 
          className="flex flex-col items-center p-8 transition-transform"
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${zoom})`,
            transformOrigin: 'center center'
          }}
        >
          {/* Central node (title) */}
          <div className="bg-primary text-primary-foreground px-6 py-3 rounded-full font-bold text-lg shadow-lg mb-8 cursor-default">
            {title}
          </div>

          {/* Connection line */}
          <div className="w-0.5 h-8 bg-border" />

          {/* Main branches */}
          <div className="flex flex-wrap justify-center gap-8">
            {nodes.map((node, index) => (
              <NodeComponent
                key={node.id}
                node={node}
                colorIndex={index}
                level={0}
                onNodeClick={handleNodeClick}
                expandedNodes={expandedNodes}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Zoom indicator */}
      <div className="absolute bottom-4 right-4 text-sm text-muted-foreground bg-background/80 px-2 py-1 rounded">
        {Math.round(zoom * 100)}%
      </div>
    </Card>
  );
};
