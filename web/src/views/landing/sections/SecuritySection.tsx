import Image from "next/image";
import styles from "../landing.module.css";

const controls = [
  {
    label: "End-to-end encryption",
    iconSrc: "/Frame%2031.png",
  },
  {
    label: "Role-based access control",
    iconSrc: "/uis_lock-access.png",
  },
  {
    label: "Multi-tenant isolation",
    iconSrc: "/fluent_coin-multiple-32-filled.png",
  },
  {
    label: "Secure infrastructure",
    iconSrc: "/tdesign_secured-filled.png",
  },
];

export function SecuritySection() {
  return (
    <section className={styles.securitySection}>
      <div className={styles.container}>
        <div className={styles.securityGrid}>
          <div className={styles.securityList}>
            {controls.map((control) => (
              <div key={control.label} className={styles.securityItem}>
                <span className={styles.securityIcon} aria-hidden>
                  <Image
                    src={control.iconSrc}
                    alt=""
                    width={48}
                    height={48}
                    className={styles.securityIconAsset}
                  />
                </span>
                <span>{control.label}</span>
              </div>
            ))}
          </div>

          <div className={styles.securityCopy}>
            <h2>Security and Compliance by design</h2>
            <p>
              Built with healthcare-grade safeguards to protect patient data,
              professional records, and organizational operations.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
