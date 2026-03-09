import Image from "next/image";
import styles from "../landing.module.css";

const cards = [
  {
    title: "Check Symptoms or Request Care",
    text: "Patients can use the AI symptom checker to understand possible conditions and receive guidance on the next step for care.",
    action: "Analyze symptoms",
    showActionIcon: true,
  },
  {
    title: "Connect With the Right Professional",
    text: "Search, match, and book qualified healthcare professionals for virtual consultations or in-person services.",
    action: "Book professional",
    showActionIcon: true,
  },
  {
    title: "Deliver Care or Fill Workforce Needs",
    text: "Healthcare professionals provide consultations, while organizations can post and fill staffing shifts in real time.",
    action: "Start consultation",
    showActionIcon: false,
  },
];

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className={styles.howSection}>
      <div className={styles.container}>
        <div className={styles.sectionHeadingCenter}>
          <h2>How It Works</h2>
          <p>
            From symptom assessment to professional consultation, our system
            simplifies care delivery in three secure steps.
          </p>
        </div>

        <div className={styles.stepsRow}>
          <div className={styles.stepBubble}>Step 01</div>
          <div className={styles.stepConnector} />
          <div className={styles.stepBubble}>Step 02</div>
          <div className={styles.stepConnector} />
          <div className={styles.stepBubble}>Step 03</div>
        </div>

        <div className={styles.howCards}>
          {cards.map((card, index) => (
            <article key={card.title} className={styles.howCard}>
              <h3>{card.title}</h3>
              <p>{card.text}</p>
              {index === 1 ? (
                <div className={styles.howDemoFrame51}>
                  <Image
                    src="/Frame%2051.png"
                    alt="Doctor booking interface"
                    width={286}
                    height={217}
                    className={styles.howDemoFrameImage}
                  />
                </div>
              ) : index === 2 ? (
                <div className={styles.howDemoStepThree}>
                  <Image
                    src="/Frame%2068.png"
                    alt="Consultation details card"
                    width={320}
                    height={117}
                    className={styles.howDemoFrame68}
                  />
                  <Image
                    src="/Frame%2067.png"
                    alt="Consultation action controls"
                    width={320}
                    height={56}
                    className={styles.howDemoFrame67}
                  />
                </div>
              ) : (
                <div className={styles.howDemo}>
                  <div className={styles.howDemoInput}>Describe your symptoms</div>
                  <button type="button" className={styles.howDemoButton}>
                    {card.showActionIcon && (
                      <Image
                        src="/Group.png"
                        alt=""
                        aria-hidden
                        width={24}
                        height={24}
                        className={styles.howDemoButtonIcon}
                      />
                    )}
                    {card.action}
                  </button>
                  {index > 0 && <div className={styles.howDemoSecondary} />}
                </div>
              )}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
