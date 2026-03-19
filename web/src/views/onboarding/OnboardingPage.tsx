import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

type OptionCardProps = {
  background: string;
  title: string;
  description: string;
  buttonLabel: string;
  icon: ReactNode;
  href?: string;
};

function OptionCard({
  background,
  title,
  description,
  buttonLabel,
  icon,
  href,
}: OptionCardProps) {
  return (
    <article
      className="relative h-[309px] w-[373px] rounded-[24px] shadow-[0_0_50px_rgba(0,0,0,0.05)]"
      style={{ background }}
    >
      <div className="absolute left-4 top-[33px] flex w-[332px] flex-col items-start gap-4">
        <span className="inline-flex h-16 w-16 items-center justify-center">{icon}</span>
        <div className="flex w-[332px] flex-col items-start gap-2">
          <h2 className="m-0 w-full text-[24px] font-medium leading-[30px] tracking-[-0.05em] text-[#334155]">
            {title}
          </h2>
          <p className="m-0 w-full text-[18px] font-normal leading-5 tracking-[-0.05em] text-[#334155]">
            {description}
          </p>
        </div>
      </div>

      {href ? (
        <Link
          href={href}
          className="absolute bottom-[15px] left-4 flex h-[50px] w-[342px] items-center justify-center rounded-2xl bg-[#1565c0] px-[10.6375px] text-[20.0088px] font-normal leading-[30px] tracking-[-0.05em] text-[#e3f2fd]"
        >
          {buttonLabel}
        </Link>
      ) : (
        <button
          type="button"
          className="absolute bottom-[15px] left-4 flex h-[50px] w-[342px] items-center justify-center rounded-2xl bg-[#1565c0] px-[10.6375px] text-[20.0088px] font-normal leading-[30px] tracking-[-0.05em] text-[#e3f2fd]"
        >
          {buttonLabel}
        </button>
      )}
    </article>
  );
}

function PatientIcon() {
  return (
    <Image
      src="/Vector (4).png"
      alt=""
      aria-hidden
      width={64}
      height={64}
      className="h-16 w-16 object-contain"
    />
  );
}

function ProfessionalIcon() {
  return (
    <Image
      src="/streamline-plump_office-worker-solid - Copy.png"
      alt=""
      aria-hidden
      width={64}
      height={64}
      className="h-16 w-16 object-contain"
    />
  );
}

function OrganisationIcon() {
  return (
    <Image
      src="/Group (2).png"
      alt=""
      aria-hidden
      width={64}
      height={64}
      className="h-16 w-16 object-contain"
    />
  );
}

export function GetStartedPage() {
  return (
    <section className="bg-[#f8fafc] px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
      <div className="relative mx-auto h-auto min-h-[832px] w-full max-w-[1280px] bg-[#f8fafc] max-[1200px]:min-h-[1360px]">
        <div className="absolute left-[61px] top-[37px] flex h-[66px] w-[184px] items-center p-0 max-[1200px]:left-6 max-[1200px]:top-6">
          <span className="inline-flex h-[66px] w-[66px] items-center justify-center">
            <Image
              src="/jam_medical.png"
              alt="Swifthelp logo"
              width={66}
              height={66}
              className="h-[66px] w-[66px] object-contain"
              priority
            />
          </span>
          <span className="text-[28.0396px] font-medium leading-[42px] tracking-[-0.05em] text-[#1e88e5]">
            Swifthelp
          </span>
        </div>

        <div className="absolute left-1/2 top-[143px] flex h-[216px] w-[510px] -translate-x-1/2 flex-col items-center justify-center gap-6 p-0 max-[1200px]:top-[130px] max-[1200px]:w-[92%]">
          <h1 className="m-0 w-[373px] text-center text-[64px] font-semibold leading-[68px] tracking-[-0.05em] text-[#334155] max-[1200px]:w-full max-[1200px]:text-[48px] max-[1200px]:leading-[52px]">
            Welcome to Swifthelp
          </h1>
          <p className="m-0 w-full text-center text-[24px] font-light leading-7 tracking-[-0.05em] text-[#334155] max-[1200px]:text-[20px] max-[1200px]:leading-6">
            Choose how you&apos;ll be using the platform so we can personalize your
            setup.
          </p>
        </div>

        <div className="absolute left-1/2 top-[425px] flex w-[1152px] -translate-x-1/2 items-start justify-between max-[1200px]:static max-[1200px]:mt-[390px] max-[1200px]:w-full max-[1200px]:translate-x-0 max-[1200px]:flex-col max-[1200px]:items-center max-[1200px]:gap-5">
          <OptionCard
            background="#E3F2FD"
            title="Patient"
            description="Get AI-guided health support, book consultations, and manage your care in one secure place"
            buttonLabel="Continue as patient"
            icon={<PatientIcon />}
            href="/get-started/create-account"
          />

          <OptionCard
            background="#DEF8E4"
            title="Healthcare Professional"
            description="Manage consultations, schedules, and patient interactions through a secure clinical workspace."
            buttonLabel="Continue as professional"
            icon={<ProfessionalIcon />}
          />

          <OptionCard
            background="#E9EEF4"
            title="Organisation"
            description="Set up your organization, manage teams, and coordinate staffing across your healthcare operations."
            buttonLabel="Continue as organisation"
            icon={<OrganisationIcon />}
          />
        </div>
      </div>
    </section>
  );
}
