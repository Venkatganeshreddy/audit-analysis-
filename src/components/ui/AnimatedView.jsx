export default function AnimatedView({ children, className = '' }) {
  return (
    <div className={`animate-fade-in ${className}`}>{children}</div>
  );
}
