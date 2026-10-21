// Ícones simples e geométricos desenhados em SVG, nas cores do jogo.
// (Moeda e sol não existem nos pacotes do Kenney que usamos.)

export function CoinIcon({ size = 22 }: { size?: number }) {
  return (
    <svg className="game-icon" width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="10.5" fill="#f2b630" stroke="#8a5a14" strokeWidth="1.5" />
      <circle cx="12" cy="12" r="7" fill="#ffd75e" stroke="#c98a1c" strokeWidth="1.2" />
      <path d="M12 7.5v9M9.6 10.2c0-1.1 1.1-1.7 2.4-1.7s2.4.6 2.4 1.7-1.1 1.5-2.4 1.8c-1.3.3-2.4.7-2.4 1.8s1.1 1.7 2.4 1.7 2.4-.6 2.4-1.7" fill="none" stroke="#8a5a14" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M6.5 7.5a7 7 0 0 1 3-2.2" fill="none" stroke="#fff3d6" strokeWidth="1.4" strokeLinecap="round" opacity=".8" />
    </svg>
  )
}

export function SunIcon({ size = 26 }: { size?: number }) {
  const rays = Array.from({ length: 8 }, (_, i) => i * 45)
  return (
    <svg className="game-icon" width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      {rays.map((deg) => (
        <rect key={deg} x="11" y="0.8" width="2" height="4" rx="1" fill="#f2a22f" transform={`rotate(${deg} 12 12)`} />
      ))}
      <circle cx="12" cy="12" r="6.2" fill="#ffd75e" stroke="#c9801c" strokeWidth="1.3" />
      <path d="M8.6 9.4a4.4 4.4 0 0 1 2.4-1.6" fill="none" stroke="#fff3d6" strokeWidth="1.2" strokeLinecap="round" opacity=".85" />
    </svg>
  )
}
