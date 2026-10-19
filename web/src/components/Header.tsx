import GeticLogo from "./GeticLogo";

export default function Header({ children }: { children?: React.ReactNode }) {
  return (
    <header className="jqm-header">
      <div style={{ width: 80 }}>
        <GeticLogo width={80} color="#111" />
      </div>
      {children && <div className="jqm-header-right">{children}</div>}
    </header>
  );
}
