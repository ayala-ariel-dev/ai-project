export default function Button({ onClick, children, disabled }) {
  return (
    <button onClick={onClick} disabled={disabled} className="btn">
      {children}
    </button>
  );
}
