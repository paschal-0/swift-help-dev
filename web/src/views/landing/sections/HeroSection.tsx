import Image from "next/image";
import styles from "../landing.module.css";

export function HeroSection() {
  return (
    <section id="home" className={styles.heroSection}>
      <div className={styles.container}>
        <div className={styles.heroGrid}>
          <div className={styles.heroCopy}>
            <h1 className={styles.heroTitle}>
              Smarter Healthcare Access, Workforce, and AI Triage - All in One
              Platform
            </h1>
            <p className={styles.heroText}>
              Swift HELP connects patients, healthcare professionals, and organizations
              through intelligent symptom triage, on-demand care services, and real-time
              workforce management.
            </p>
            <div className={styles.heroActions}>
              <button type="button" className={styles.primaryCta}>
                Get early access
                <Image
                  src="/fluent_arrow-up-12-filled.png"
                  alt=""
                  aria-hidden
                  width={32}
                  height={32}
                  className={styles.ctaArrowIcon}
                />
              </button>
              <button type="button" className={styles.secondaryCta}>
                Book a demo
                <Image
                  src="/fluent_arrow-up-12-filled.png"
                  alt=""
                  aria-hidden
                  width={32}
                  height={32}
                  className={styles.ctaArrowIconDark}
                />
              </button>
            </div>
          </div>

          <div className={styles.heroVisual}>
            <Image
              src="/Group%2014.png"
              alt="Doctor with healthcare workflow highlights"
              width={568}
              height={457}
              className={styles.heroGroupImage}
              priority
            />
          </div>
        </div>

        <div className={styles.trustedBox}>
          <p className={styles.trustedTitle}>Trusted Platform for</p>
          <div className={styles.trustedPills}>
            <span className={styles.trustedPillPrimary}>Patients</span>
            <span className={styles.trustedPillDark}>Healthcare Professionals</span>
            <span className={styles.trustedPillLight}>Organisations</span>
          </div>
        </div>
      </div>
    </section>
  );
}
