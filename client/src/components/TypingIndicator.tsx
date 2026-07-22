interface Props {
  name: string;
}

export default function TypingIndicator({ name }: Props) {
  return (
    <div
      style={{
        padding: '4px 16px 8px',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        color: 'var(--accent)',
        fontSize: '0.8125rem',
        animation: 'fadeIn 150ms ease-out',
      }}
    >
      <div style={{ display: 'flex', gap: '3px', alignItems: 'center' }}>
        <span style={dotStyle(0)} />
        <span style={dotStyle(0.15)} />
        <span style={dotStyle(0.3)} />
      </div>
      {name} is typing...
    </div>
  );
}

function dotStyle(delay: number): React.CSSProperties {
  return {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    background: 'var(--accent)',
    opacity: 0.6,
    animation: `bounce 1s ease-in-out ${delay}s infinite`,
  };
}
