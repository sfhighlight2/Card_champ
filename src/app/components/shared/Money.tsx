interface MoneyProps {
  value: number;
  hidden: boolean;
  prefix?: string;
}

// Renders a dollar amount, or a masked placeholder when privacy mode is on.
export function Money({ value, hidden, prefix = "$" }: MoneyProps) {
  if (hidden) return <span aria-label="Hidden value">{prefix}••••</span>;
  return <span>{prefix}{value.toLocaleString()}</span>;
}
