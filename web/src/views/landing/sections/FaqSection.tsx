import Image from "next/image";
import styles from "../landing.module.css";

const questions = [
  "How does AI triage work on Swift HELP?",
  "Is patient data secure and compliant?",
  "Can organizations manage workforce shifts?",
  "How can healthcare professionals join?",
  "Does Swift HELP support teleconsultations?",
];

function FaqHelpIcon() {
  return (
    <span className={styles.faqHelpIcon} aria-hidden>
      <Image
        src="/Figr_Icon_help_outline.png"
        alt=""
        width={24}
        height={24}
        className={styles.faqHelpIconAsset}
      />
    </span>
  );
}

export function FaqSection() {
  return (
    <section id="faq" className={styles.faqSection}>
      <div className={styles.container}>
        <div className={styles.faqGrid}>
          <div className={styles.faqIntro}>
            <h2>Frequently Asked Questions</h2>
            <p>
              Clear answers about AI triage, data security, compliance, and platform
              capabilities.
            </p>
          </div>

          <div className={styles.faqList}>
            {questions.slice(0, 2).map((question) => (
              <article key={question} className={styles.faqItem}>
                <span>{question}</span>
                <FaqHelpIcon />
              </article>
            ))}

            <article className={styles.faqItemOpen}>
              <div>
                <h3>How can I get started with Swift HELP?</h3>
                <p>
                  Request early access or book a demo. Our onboarding team guides
                  patients, professionals, and organizations based on your use case.
                </p>
              </div>
              <FaqHelpIcon />
            </article>

            {questions.slice(2).map((question) => (
              <article key={question} className={styles.faqItem}>
                <span>{question}</span>
                <FaqHelpIcon />
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
