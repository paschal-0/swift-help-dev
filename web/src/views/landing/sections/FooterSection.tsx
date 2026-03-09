import Image from "next/image";
import styles from "../landing.module.css";

const socialIcons = [
  { name: "LinkedIn", src: "/mdi_linkedin.png" },
  { name: "Facebook", src: "/ic_baseline-facebook.png" },
  { name: "Instagram", src: "/ri_instagram-fill.png" },
  { name: "Twitter", src: "/prime_twitter.png" },
];

export function FooterSection() {
  return (
    <footer className={styles.footerSection}>
      <div className={styles.container}>
        <div className={styles.footerTop}>
          <div className={styles.footerBrand}>
            <span className={styles.footerBrandMark}>
              <Image
                src="/Vector%20%283%29.png"
                alt="Swifthelp footer logo"
                width={66}
                height={66}
                className={styles.footerBrandIcon}
              />
            </span>
            <span>Swifthelp</span>
          </div>

          <div className={styles.footerLinksGroup}>
            <div className={styles.footerColumn}>
              <a href="#home">Home</a>
              <a href="#how-it-works">How it works</a>
              <a href="#features">Features</a>
            </div>

            <div className={styles.footerColumn}>
              <a href="#faq">FAQ&apos;s</a>
              <a href="#">Privacy Policy</a>
              <a href="#">Terms</a>
            </div>

            <div className={styles.footerColumn}>
              <a href="#contact">Contact us</a>
              <a href="#">Follow us</a>
              <div className={styles.footerSocials}>
                {socialIcons.map((icon) => (
                  <a
                    key={icon.name}
                    href="#"
                    aria-label={icon.name}
                    className={styles.footerSocialLink}
                  >
                    <Image
                      src={icon.src}
                      alt=""
                      aria-hidden
                      width={24}
                      height={24}
                      className={styles.footerSocialIcon}
                    />
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className={styles.footerNewsletter}>
          <div>
            <p>Subscribe to our newsletter</p>
            <div className={styles.newsletterInput} />
          </div>
          <button type="button" className={styles.footerSignupButton}>
            Sign Up
          </button>
        </div>

        <p className={styles.copyright}>@2026. all rights reserved</p>
      </div>
    </footer>
  );
}
