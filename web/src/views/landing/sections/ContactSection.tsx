import Image from "next/image";
import styles from "../landing.module.css";

const contacts = [
  {
    title: "VISIT US",
    text: "Stop by our office to speak with our team in person and learn how our platform supports healthcare providers.",
    value: "22, Riley Road, Texas",
    iconSrc: "/bi_house-fill.png",
  },
  {
    title: "CALL US",
    text: "Prefer to talk? Give us a call and our support team will guide you through any questions.",
    value: "+2348884993662",
    iconSrc: "/Vector%20%281%29.png",
  },
  {
    title: "CONTACT US",
    text: "Send us a message and we will get back to you as soon as possible with the help you need.",
    value: "swifthelp@gmail.com",
    iconSrc: "/Vector%20%282%29.png",
  },
];

export function ContactSection() {
  return (
    <section id="contact" className={styles.contactSection}>
      <div className={styles.container}>
        <div className={styles.ctaBanner}>
          <div className={styles.ctaOverlay} />
          <div className={styles.ctaContent}>
            <h2>Ready to Experience the Future of Healthcare Access?</h2>
            <p>
              Swift HELP connects patients, professionals, and healthcare
              organizations in one intelligent platform.
            </p>
            <div className={styles.heroActions}>
              <button type="button" className={styles.primaryCta}>
                Get early access
                <Image
                  src="/Vector.png"
                  alt=""
                  aria-hidden
                  width={32}
                  height={32}
                  className={styles.ctaArrowIcon}
                />
              </button>
              <button type="button" className={styles.secondaryCtaLight}>
                Book a demo
                <Image
                  src="/Vector.png"
                  alt=""
                  aria-hidden
                  width={32}
                  height={32}
                  className={styles.ctaArrowIcon}
                />
              </button>
            </div>
          </div>
        </div>

        <div className={styles.contactCards}>
          {contacts.map((item) => (
            <article key={item.title} className={styles.contactCard}>
              <div className={styles.contactIcon} aria-hidden>
                <Image
                  src={item.iconSrc}
                  alt=""
                  width={100}
                  height={100}
                  className={styles.contactIconAsset}
                />
              </div>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
              <strong>{item.value}</strong>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
