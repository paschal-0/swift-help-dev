import Image from "next/image";
import Link from "next/link";

function SelectedRadio() {
  return (
    <span className="relative inline-block h-[20.42px] w-[20.42px]">
      <span className="absolute inset-0 rounded-full border-[2.55264px] border-[#1565c0]" />
      <span className="absolute left-[3.4px] top-[3.4px] h-[13.61px] w-[13.61px] rounded-full border-[0.850879px] border-[#1565c0] bg-[#1565c0]" />
    </span>
  );
}

function UnselectedRadio() {
  return (
    <span className="inline-block h-[20.42px] w-[20.42px] rounded-full border-[2.55264px] border-[#94a3b8]" />
  );
}

function TopLogo() {
  return (
    <div className="absolute left-[63px] top-[51px] flex h-[66px] w-[184px] items-center p-0 max-[1200px]:left-6 max-[1200px]:top-6">
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
  );
}

function StepHeader() {
  return (
    <>
      <div className="absolute left-1/2 top-[167px] flex h-3 w-[957px] -translate-x-1/2 items-center gap-[37px] p-0 max-[1200px]:top-[120px] max-[1200px]:w-[92%]">
        <span className="relative h-3 w-[460px] rounded-[40px] bg-[#e2e8f0] max-[1200px]:w-1/2">
          <span className="absolute left-0 top-0 h-3 w-[459px] rounded-[40px] bg-[#30b11f] max-[1200px]:w-full" />
        </span>
        <span className="relative h-3 w-[460px] rounded-[40px] bg-[#e2e8f0] max-[1200px]:w-1/2">
          <span className="absolute left-0 top-0 h-3 w-[459px] rounded-[40px] bg-[#30b11f] max-[1200px]:w-full" />
        </span>
      </div>

      <div className="absolute left-1/2 top-[244px] flex h-[74px] w-[706px] -translate-x-1/2 flex-col items-center justify-center gap-3 max-[1200px]:top-[175px] max-[1200px]:w-[92%]">
        <h1 className="m-0 w-[554px] text-center text-[36px] font-normal leading-10 tracking-[-0.05em] text-[#334155] max-[1200px]:w-full">
          Add Important Health Information
        </h1>
        <p className="m-0 w-full text-center text-[18px] font-light leading-[22px] tracking-[-0.05em] text-black">
          Provide relevant health details to support safer recommendations and
          consultations.
        </p>
      </div>
    </>
  );
}

function SectionTitle({
  index,
  title,
  subtitle,
}: {
  index: number;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="flex w-[782px] flex-col items-start gap-4 max-[1200px]:w-full">
      <div className="flex h-12 items-center gap-[22px]">
        <span className="inline-flex h-12 w-[49px] items-center justify-center rounded-[100px] border-2 border-[#1565c0] bg-[#f8fafc] text-[24px] font-light leading-7 tracking-[-0.05em] text-black">
          {index}
        </span>
        <span className="text-[24px] font-semibold leading-7 tracking-[-0.05em] text-[#1565c0]">
          {title}
        </span>
      </div>
      <p className="m-0 text-[18px] font-semibold leading-[22px] tracking-[-0.05em] text-black">
        {subtitle}
      </p>
    </div>
  );
}

function BooleanQuestion({ label }: { label: string }) {
  return (
    <div className="flex w-[440px] flex-col gap-4 max-[1200px]:w-full">
      <span className="text-[18px] font-light leading-[22px] tracking-[-0.05em] text-black">
        {label}
      </span>
      <div className="flex h-[22px] items-center gap-3">
        <label className="flex items-center gap-2 text-[18px] font-light leading-[22px] tracking-[-0.05em] text-[#94a3b8]">
          Male
          <SelectedRadio />
        </label>
        <label className="flex items-center gap-2 text-[18px] font-light leading-[22px] tracking-[-0.05em] text-[#94a3b8]">
          Female
          <UnselectedRadio />
        </label>
        <label className="flex items-center gap-2 text-[18px] font-light leading-[22px] tracking-[-0.05em] text-[#94a3b8]">
          Other
          <UnselectedRadio />
        </label>
      </div>
    </div>
  );
}

function MedicationEntryRow() {
  return (
    <div className="rounded-[24px] bg-[#f8fafc] p-[18px_26px] max-[1200px]:p-4">
      <div className="flex w-full items-center gap-[33px] max-[1200px]:flex-col max-[1200px]:items-stretch">
        <div className="flex w-[327px] flex-col gap-2 max-[1200px]:w-full">
          <span className="text-[18px] font-light leading-[22px] tracking-[-0.05em] text-black">
            Name of medication
          </span>
          <input
            type="text"
            placeholder="e.g John Doe"
            className="h-[47px] rounded-[12px] border border-[#94a3b8] bg-transparent px-[18px] text-[18px] font-light leading-[22px] tracking-[-0.05em] text-[#334155] outline-none placeholder:text-[#94a3b8]"
          />
        </div>

        <div className="flex w-[346px] flex-col gap-2 max-[1200px]:w-full">
          <span className="text-[18px] font-light leading-[22px] tracking-[-0.05em] text-black">
            Date issued
          </span>
          <label className="relative">
            <span className="pointer-events-none absolute left-3 top-[12px] text-[20px]">
              📅
            </span>
            <input
              type="text"
              defaultValue="24 / 05 / 2003"
              className="h-[47px] w-full rounded-[12px] border border-[#94a3b8] bg-transparent pl-[46px] pr-4 text-[18px] font-light leading-[22px] tracking-[-0.05em] text-[#94a3b8] outline-none"
            />
          </label>
        </div>

        <div className="flex w-[294px] flex-col gap-2 max-[1200px]:w-full">
          <span className="text-[18px] font-light leading-[22px] tracking-[-0.05em] text-black">
            Duration
          </span>
          <input
            type="text"
            placeholder="e.g John Doe"
            className="h-[47px] rounded-[12px] border border-[#94a3b8] bg-transparent px-[18px] text-[18px] font-light leading-[22px] tracking-[-0.05em] text-[#334155] outline-none placeholder:text-[#94a3b8]"
          />
        </div>
      </div>
    </div>
  );
}

function AllergySection() {
  const chips = ["Boiled foods", "Boiled foods", "Boiled foods", "Boiled foods"];
  return (
    <div className="rounded-3xl bg-white p-[24px_32px] max-[1200px]:p-5">
      <div className="flex flex-col gap-8">
        <SectionTitle
          index={1}
          title="Allergies"
          subtitle="Tell us about any allergies you have, including medications, foods, or environmental triggers."
        />

        <div className="flex flex-col gap-6">
          <BooleanQuestion label="Do you have any known allergies?" />

          <div className="rounded-3xl bg-[#f8fafc] p-[27px_28px]">
            <div className="flex w-[369px] flex-col gap-2 max-[1200px]:w-full">
              <span className="text-[18px] font-light leading-[22px] tracking-[-0.05em] text-black">
                Name of allergy
              </span>
              <div className="flex h-[47px] items-center gap-2">
                <input
                  type="text"
                  placeholder="e.g Junks"
                  className="h-[47px] w-[273px] rounded-[12px] border border-[#94a3b8] bg-transparent px-[18px] text-[18px] font-light leading-[22px] tracking-[-0.05em] text-[#334155] outline-none placeholder:text-[#94a3b8] max-[1200px]:w-full"
                />
                <button
                  type="button"
                  className="inline-flex h-10 w-[88px] items-center justify-center rounded-[18.0973px] bg-[linear-gradient(180deg,#1e88e5_0%,#114b7f_72.12%)] text-[18px] font-normal leading-[30px] tracking-[-0.05em] text-[#e3f2fd]"
                >
                  Add
                </button>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              {chips.map((chip, i) => (
                <span
                  key={`${chip}-${i}`}
                  className="inline-flex h-[39px] items-center gap-2 rounded-[40px] border border-[#94a3b8] bg-[#94a3b8] px-[10px] text-[18px] font-light leading-[22px] tracking-[-0.05em] text-[#f8fafc]"
                >
                  {chip}
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full text-[16px] leading-none">
                    ×
                  </span>
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MedicationSection({ index }: { index: number }) {
  return (
    <div className="rounded-[24px_24px_24px_32px] bg-white p-6">
      <div className="flex flex-col gap-[37px]">
        <SectionTitle
          index={index}
          title="Current Medications"
          subtitle="List any medications, supplements, or vitamins you are currently taking."
        />

        <div className="flex flex-col gap-6">
          <BooleanQuestion label="Are you currently taking any medications?" />

          <div className="flex flex-col gap-6">
            <MedicationEntryRow />
            <button
              type="button"
              className="inline-flex h-[87px] w-full items-center justify-center gap-[10px] rounded-[24px] border border-dashed border-[#94a3b8] text-[20.0088px] font-normal leading-[30px] tracking-[-0.05em] text-[#1565c0]"
            >
              <span className="text-[28px] leading-none">+</span>
              Add Medication
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function PatientHealthProfileTwoPage() {
  return (
    <section className="bg-[#f8fafc] px-4 py-6 sm:px-6 lg:px-8">
      <div className="relative mx-auto h-auto min-h-[2135px] w-full max-w-[1280px] bg-[#f8fafc] max-[1200px]:min-h-[2900px]">
        <TopLogo />
        <StepHeader />

        <div className="absolute left-1/2 top-[383px] w-[1152px] -translate-x-1/2 max-[1200px]:top-[330px] max-[1200px]:w-[92%]">
          <AllergySection />
        </div>

        <div className="absolute left-1/2 top-[873px] w-[1152px] -translate-x-1/2 max-[1200px]:top-[1060px] max-[1200px]:w-[92%]">
          <MedicationSection index={2} />
        </div>

        <div className="absolute left-1/2 top-[1385px] w-[1152px] -translate-x-1/2 max-[1200px]:top-[1700px] max-[1200px]:w-[92%]">
          <MedicationSection index={3} />
        </div>

        <div className="absolute left-1/2 bottom-[71px] flex w-[444px] -translate-x-1/2 flex-col items-start gap-3 max-[1200px]:w-[92%] max-[1200px]:max-w-[444px]">
          <button
            type="button"
            className="inline-flex h-[50px] w-full items-center justify-center rounded-[18.0973px] bg-[linear-gradient(180deg,#1e88e5_0%,#114b7f_72.12%)] text-[20.0088px] font-normal leading-[30px] tracking-[-0.05em] text-[#e3f2fd]"
          >
            Finish
          </button>
          <Link
            href="/onboarding/health-profile"
            className="inline-flex h-[42px] w-full items-center justify-center rounded-[15.1111px] border border-[#334155] text-[16.7072px] font-normal leading-[25px] tracking-[-0.05em] text-[#334155]"
          >
            Back
          </Link>
        </div>
      </div>
    </section>
  );
}
