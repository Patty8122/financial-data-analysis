export function Card({ className = '', children, ...props }) {
  return (
    <div className={`bg-white rounded-lg shadow-md ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardContent({ className = '', children, ...props }) {
  return (
    <div className={`${className}`} {...props}>
      {children}
    </div>
  );
}
  