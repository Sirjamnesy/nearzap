import { Icon, Logo } from "@/components/Icon";
import Avatar from "@/components/Avatar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="top">
        <a href="/" className="brand"><Logo /> NearZap</a>
        <nav>
          <a className="navlink" href="/invoices"><Icon name="invoice" /><span>Invoices</span></a>
          <a className="navlink" href="/new"><Icon name="plus" /><span>New</span></a>
          <Avatar />
        </nav>
      </header>
      <main>{children}</main>
    </>
  );
}
