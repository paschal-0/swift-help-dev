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

export function PatientHealthProfilePage() {
  return (
    <section className="bg-[#f8fafc] px-4 py-6 sm:px-6 lg:px-8">
      <div className="relative mx-auto h-auto min-h-[957px] w-full max-w-[1280px] bg-[#f8fafc] max-[1200px]:min-h-[1220px]">
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

        <div className="absolute left-1/2 top-[167px] flex h-3 w-[995px] -translate-x-1/2 items-center gap-[37px] p-0 max-[1200px]:top-[120px] max-[1200px]:w-[92%]">
          <span className="relative h-3 w-[460px] rounded-[40px] bg-[#e2e8f0] max-[1200px]:w-[46%]">
            <span className="absolute left-0 top-0 h-3 w-[459px] rounded-[40px] bg-[#30b11f] max-[1200px]:w-full" />
          </span>
          <span className="h-3 w-[498px] rounded-[40px] bg-[#e2e8f0] max-[1200px]:w-[50%]" />
        </div>

        <div className="absolute left-1/2 top-[259px] flex h-[74px] w-[537px] -translate-x-1/2 flex-col items-end gap-3 p-0 max-[1200px]:top-[175px] max-[1200px]:w-[92%]">
          <h1 className="m-0 w-[511px] text-center text-[36px] font-normal leading-10 tracking-[-0.05em] text-[#334155] max-[1200px]:w-full">
            Complete Your Health Profile
          </h1>
          <p className="m-0 w-full text-center text-[18px] font-light leading-[22px] tracking-[-0.05em] text-black">
            Help us personalize your care experience with a few basic details.
          </p>
        </div>

        <div className="absolute left-1/2 top-[368px] h-[345px] w-[1012px] -translate-x-1/2 rounded-3xl bg-white max-[1200px]:top-[290px] max-[1200px]:h-auto max-[1200px]:w-[92%] max-[1200px]:pb-8">
          <div className="absolute left-[37px] top-[25px] flex w-[440px] flex-col gap-2 max-[1200px]:relative max-[1200px]:left-0 max-[1200px]:top-0 max-[1200px]:w-full max-[1200px]:px-6 max-[1200px]:pt-6">
            <span className="text-[18px] font-light leading-[22px] tracking-[-0.05em] text-black">
              Date of birth
            </span>
            <label className="relative h-[47px] w-[440px] rounded-[12px] border border-[#94a3b8] max-[1200px]:w-full">
              <span className="absolute left-3 top-[12px] text-[22px]">📅</span>
              <input
                type="text"
                defaultValue="24 / 05 / 2003"
                className="h-full w-full rounded-[12px] border-0 bg-transparent pl-[46px] pr-4 text-[18px] font-light leading-[22px] tracking-[-0.05em] text-[#94a3b8] outline-none"
              />
            </label>
          </div>

          <div className="absolute left-[535px] top-[25px] flex w-[440px] flex-col gap-4 max-[1200px]:relative max-[1200px]:left-0 max-[1200px]:top-0 max-[1200px]:w-full max-[1200px]:px-6 max-[1200px]:pt-6">
            <span className="text-[18px] font-light leading-[22px] tracking-[-0.05em] text-black">
              Gender <span className="text-red-500">*</span>
            </span>
            <div className="flex h-[22px] w-[264.26px] items-center gap-3">
              <label className="flex items-center gap-2 text-[18px] font-light leading-[22px] tracking-[-0.05em] text-[#334155]">
                Male
                <SelectedRadio />
              </label>
              <label className="flex items-center gap-2 text-[18px] font-light leading-[22px] tracking-[-0.05em] text-[#334155]">
                Female
                <UnselectedRadio />
              </label>
              <label className="flex items-center gap-2 text-[18px] font-light leading-[22px] tracking-[-0.05em] text-[#334155]">
                Other
                <UnselectedRadio />
              </label>
            </div>
          </div>

          <div className="absolute left-[37px] top-[134px] flex w-[440px] flex-col gap-2 max-[1200px]:relative max-[1200px]:left-0 max-[1200px]:top-0 max-[1200px]:w-full max-[1200px]:px-6 max-[1200px]:pt-6">
            <span className="text-[18px] font-light leading-[22px] tracking-[-0.05em] text-black">
              Phone number
            </span>
            <label className="relative h-[47px] w-[440px] rounded-[12px] border border-[#94a3b8] bg-[#f8fafc] max-[1200px]:w-full">
              <span className="absolute left-0 top-0 inline-flex h-[47px] w-[83px] items-center justify-center gap-2 bg-[#e3f2fd]">
                <span className="inline-flex h-6 w-6 items-center justify-center overflow-hidden rounded-[3px] border border-[#d2dce8] bg-white">
                  <span className="h-full w-2 bg-[#009A49]" />
                  <span className="h-full w-2 bg-[#EEEEEE]" />
                  <span className="h-full w-2 bg-[#009A49]" />
                </span>
                <span className="mt-1 h-2 w-2 rotate-45 border-r-[2px] border-b-[2px] border-[#94a3b8]" />
              </span>
              <input
                type="tel"
                placeholder="+234"
                className="h-full w-full rounded-[12px] border-0 bg-transparent pl-[99px] pr-[18px] text-[18px] font-light leading-[22px] tracking-[-0.05em] text-[#334155] outline-none placeholder:text-[18px] placeholder:text-[#334155]"
              />
            </label>
          </div>

          <div className="absolute left-[535px] top-[134px] flex w-[440px] flex-col gap-2 max-[1200px]:relative max-[1200px]:left-0 max-[1200px]:top-0 max-[1200px]:w-full max-[1200px]:px-6 max-[1200px]:pt-6">
            <span className="text-[18px] font-light leading-[22px] tracking-[-0.05em] text-black">
              Preferred location
            </span>
            <label className="relative h-[47px] w-[440px] rounded-[12px] border border-[#94a3b8] max-[1200px]:w-full">
              <input
                type="text"
                defaultValue="United States"
                className="h-full w-full rounded-[12px] border-0 bg-transparent pl-[17px] pr-[42px] text-[18px] font-light leading-[22px] tracking-[-0.05em] text-[#94a3b8] outline-none"
              />
              <span className="absolute right-[23px] top-[17px] h-[10px] w-[10px] rotate-45 border-r-[2.57778px] border-b-[2.57778px] border-[#94a3b8]" />
            </label>
          </div>

          <div className="absolute left-[37px] top-[243px] flex w-[440px] flex-col gap-4 max-[1200px]:relative max-[1200px]:left-0 max-[1200px]:top-0 max-[1200px]:w-full max-[1200px]:px-6 max-[1200px]:pt-6">
            <span className="text-[18px] font-light leading-[22px] tracking-[-0.05em] text-black">
              Preferred consultation type <span className="text-red-500">*</span>
            </span>
            <div className="flex h-[22px] w-[283.26px] items-center gap-3">
              <label className="flex items-center gap-2 text-[18px] font-light leading-[22px] tracking-[-0.05em] text-[#334155]">
                Virtual
                <SelectedRadio />
              </label>
              <label className="flex items-center gap-2 text-[18px] font-light leading-[22px] tracking-[-0.05em] text-[#334155]">
                In person
                <UnselectedRadio />
              </label>
              <label className="flex items-center gap-2 text-[18px] font-light leading-[22px] tracking-[-0.05em] text-[#334155]">
                Both
                <UnselectedRadio />
              </label>
            </div>
          </div>

          <div className="absolute left-[535px] top-[243px] flex w-[440px] flex-col gap-2 max-[1200px]:relative max-[1200px]:left-0 max-[1200px]:top-0 max-[1200px]:w-full max-[1200px]:px-6 max-[1200px]:pt-6">
            <span className="text-[18px] font-light leading-[22px] tracking-[-0.05em] text-black">
              Blood group
            </span>
            <label className="relative h-[47px] w-[440px] rounded-[12px] border border-[#94a3b8] max-[1200px]:w-full">
              <input
                type="text"
                placeholder="Eg AA"
                className="h-full w-full rounded-[12px] border-0 bg-transparent pl-[23px] pr-4 text-[18px] font-light leading-[22px] tracking-[-0.05em] text-[#334155] outline-none placeholder:text-[#94a3b8]"
              />
            </label>
          </div>
        </div>

        <div className="absolute left-1/2 top-[785px] flex h-[50px] w-[444px] -translate-x-1/2 flex-col items-start gap-3 p-0 max-[1200px]:top-[calc(290px+345px+40px)] max-[1200px]:w-[92%] max-[1200px]:max-w-[444px]">
          <Link
            href="/onboarding/health-profile-2"
            className="inline-flex h-[50px] w-full items-center justify-center rounded-[18.0973px] bg-[linear-gradient(180deg,#1e88e5_0%,#114b7f_72.12%)] px-[10.6375px] text-[20.0088px] font-normal leading-[30px] tracking-[-0.05em] text-[#e3f2fd]"
          >
            Continue
          </Link>
        </div>
      </div>
    </section>
  );
}
