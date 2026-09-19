import type { CldEdge, CldNode } from '@/types/database'

const WIDTH = 720
const HEIGHT = 520
const RADIUS = Math.min(WIDTH, HEIGHT) / 2 - 90
const CENTER = { x: WIDTH / 2, y: HEIGHT / 2 }

function nodePosition(index: number, total: number) {
  const angle = (2 * Math.PI * index) / total - Math.PI / 2
  return {
    x: CENTER.x + RADIUS * Math.cos(angle),
    y: CENTER.y + RADIUS * Math.sin(angle),
  }
}

export function CausalLoopSvg({ nodes, edges }: { nodes: CldNode[]; edges: CldEdge[] }) {
  const positions = new Map(nodes.map((n, i) => [n.id, nodePosition(i, nodes.length)]))

  return (
    <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full" style={{ maxHeight: 560 }}>
      <defs>
        <marker
          id="cld-arrow-pos"
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="7"
          markerHeight="7"
          orient="auto-start-reverse"
        >
          <path d="M0,0 L10,5 L0,10 z" fill="#2f7a52" />
        </marker>
        <marker
          id="cld-arrow-neg"
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="7"
          markerHeight="7"
          orient="auto-start-reverse"
        >
          <path d="M0,0 L10,5 L0,10 z" fill="#b3413c" />
        </marker>
      </defs>

      {edges.map((edge, i) => {
        const from = positions.get(edge.source)
        const to = positions.get(edge.target)
        if (!from || !to) return null
        const color = edge.polarity === '+' ? '#2f7a52' : '#b3413c'
        const marker = edge.polarity === '+' ? 'url(#cld-arrow-pos)' : 'url(#cld-arrow-neg)'
        const midX = (from.x + to.x) / 2
        const midY = (from.y + to.y) / 2
        return (
          <g key={`${edge.source}-${edge.target}-${i}`}>
            <line
              x1={from.x}
              y1={from.y}
              x2={to.x}
              y2={to.y}
              stroke={color}
              strokeWidth={1.5}
              strokeDasharray={edge.delay_exists ? '6 4' : undefined}
              markerEnd={marker}
              opacity={0.8}
            />
            <circle cx={midX} cy={midY} r={9} fill="white" stroke={color} strokeWidth={1} />
            <text x={midX} y={midY + 4} textAnchor="middle" fontSize={11} fontWeight={700} fill={color}>
              {edge.polarity}
            </text>
            {edge.delay_exists && (
              <text
                x={midX}
                y={midY - 12}
                textAnchor="middle"
                fontSize={9}
                fontWeight={600}
                fill="#94a3b8"
              >
                Delay
              </text>
            )}
          </g>
        )
      })}

      {nodes.map((node) => {
        const pos = positions.get(node.id)
        if (!pos) return null
        return (
          <g key={node.id}>
            <rect
              x={pos.x - 60}
              y={pos.y - 18}
              width={120}
              height={36}
              rx={8}
              fill="#0f1f38"
              stroke="#1f3760"
            />
            <text
              x={pos.x}
              y={pos.y + 4}
              textAnchor="middle"
              fontSize={11}
              fontWeight={600}
              fill="white"
            >
              {node.label.length > 14 ? `${node.label.slice(0, 13)}…` : node.label}
            </text>
          </g>
        )
      })}
    </svg>
  )
}
