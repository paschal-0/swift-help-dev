import Image from "next/image";
import styles from "../landing.module.css";

const links = [
  { href: "#home", label: "Home", active: true },
  { href: "#how-it-works", label: "How it works" },
  { href: "#features", label: "Features" },
  { href: "#contact", label: "Contact" },
];

export function Navbar() {
  return (
    <nav className={styles.navBar}>
      <a href="#home" className={styles.navBrand}>
        <span className={styles.brandMark}>
          <Image
            src="/jam_medical.png"
            alt="Swifthelp logo icon"
            width={40}
            height={40}
            className={styles.brandIcon}
          />
        </span>
        <span>Swifthelp</span>
      </a>

      <div className={styles.navLinks}>
        {links.map((link) => (
          <a
            key={link.label}
            href={link.href}
            className={link.active ? styles.navLinkActive : styles.navLink}
          >
            {link.label}
          </a>
        ))}
      </div>

      <button type="button" className={styles.loginButton}>
        Log in
      </button>
    </nav>
  );
}
