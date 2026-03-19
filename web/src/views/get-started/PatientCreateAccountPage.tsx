import Image from "next/image";
import Link from "next/link";

export function PatientCreateAccountPage() {
  return (
    <section className="bg-[#e2e8f0] px-4 py-6 sm:px-6 lg:px-8">
      <div className="relative mx-auto h-auto min-h-[957px] w-full max-w-[1280px] overflow-hidden bg-[#e2e8f0] max-[1200px]:min-h-[1580px]">
        <div className="absolute left-0 top-0 h-[957px] w-[713px] bg-black max-[1200px]:relative max-[1200px]:h-[540px] max-[1200px]:w-full">
          <Image
            src="/80b7f44a49de7bd948953fbe2f81ec3b8ee42169.jpg"
            alt="Doctor background"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-black/65" />

          <div className="absolute left-[49px] top-[63px] flex h-[66px] w-[184px] items-center p-0 max-[1200px]:left-6 max-[1200px]:top-6">
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

          <div className="absolute left-[54px] top-1/2 flex h-[320px] w-[496px] -translate-y-1/2 flex-col items-start gap-8 max-[1200px]:left-6 max-[1200px]:top-[220px] max-[1200px]:h-auto max-[1200px]:w-[86%] max-[1200px]:translate-y-0">
            <h2 className="m-0 w-[451px] text-[64px] font-semibold leading-[68px] tracking-[-0.05em] text-[#f8fafc] max-[1200px]:w-full max-[1200px]:text-[50px] max-[1200px]:leading-[54px]">
              Care starts with a secure connection
            </h2>
            <p className="m-0 w-full text-[24px] font-light leading-7 tracking-[-0.05em] text-white max-[1200px]:text-[22px]">
              Create your account to access AI-guided support, book consultations,
              and manage care with confidence.
            </p>
          </div>
        </div>

        <div className="absolute left-[587px] top-0 h-[957px] w-[693px] rounded-l-[64px] bg-[#f8fafc] max-[1200px]:relative max-[1200px]:left-0 max-[1200px]:h-auto max-[1200px]:w-full max-[1200px]:rounded-none max-[1200px]:pt-10 max-[1200px]:pb-12">
          <div className="absolute left-1/2 top-[86px] flex h-[66px] w-[341px] -translate-x-1/2 flex-col items-end gap-1 max-[1200px]:relative max-[1200px]:top-0">
            <h1 className="m-0 w-full text-[36px] font-normal leading-10 tracking-[-0.05em] text-[#334155]">
              Create your account
            </h1>
            <p className="m-0 w-full text-[18px] font-light leading-[22px] tracking-[-0.05em] text-black">
              Set up your secure account to get started
            </p>
          </div>

          <div className="absolute left-1/2 top-[170px] h-[42px] w-[186px] -translate-x-1/2 max-[1200px]:relative max-[1200px]:top-5">
            <Image
              src="/Frame 58.png"
              alt="Social sign in options"
              width={186}
              height={42}
              className="h-[42px] w-[186px] object-contain"
            />
            <Link
              href="#"
              aria-label="Continue with Facebook"
              className="absolute left-0 top-0 h-[42px] w-[52px]"
            />
            <Link
              href="#"
              aria-label="Continue with Apple"
              className="absolute left-[64px] top-0 h-[42px] w-[58px]"
            />
            <Link
              href="#"
              aria-label="Continue with Google"
              className="absolute right-0 top-0 h-[42px] w-[52px]"
            />
          </div>

          <div className="absolute left-1/2 top-[236px] flex h-[19px] w-[391px] -translate-x-1/2 items-center gap-[10px] max-[1200px]:relative max-[1200px]:top-9">
            <span className="h-px w-[164px] bg-[#556578]" />
            <span className="text-[16px] font-normal leading-[120%] text-[#334155]">
              Or
            </span>
            <span className="h-px w-[188px] bg-[#556578]" />
          </div>

          <div className="absolute left-1/2 top-[280px] h-[543px] w-[491px] -translate-x-1/2 rounded-[32px] bg-white shadow-[0_0_30px_rgba(0,0,0,0.05)] max-[1200px]:relative max-[1200px]:top-12 max-[1200px]:h-auto max-[1200px]:w-[92%] max-[1200px]:max-w-[520px] max-[1200px]:pb-6">
            <div className="absolute left-[25px] top-[34px] flex h-[356px] w-[440px] flex-col gap-4 max-[1200px]:relative max-[1200px]:left-0 max-[1200px]:top-0 max-[1200px]:h-auto max-[1200px]:w-full max-[1200px]:px-[25px] max-[1200px]:pt-[34px]">
              <label className="flex flex-col gap-2">
                <span className="text-[18px] font-light leading-[22px] tracking-[-0.05em] text-black">
                  Full Name
                </span>
                <input
                  type="text"
                  placeholder="e.g John Doe"
                  className="h-[47px] rounded-[12px] border border-[#94a3b8] bg-transparent px-[18px] text-[18px] font-light leading-[22px] tracking-[-0.05em] text-[#334155] outline-none placeholder:text-[#94a3b8]"
                />
              </label>

              <label className="flex flex-col gap-2">
                <span className="text-[18px] font-light leading-[22px] tracking-[-0.05em] text-black">
                  Email address
                </span>
                <input
                  type="email"
                  placeholder="e.g john@dig.com"
                  className="h-[47px] rounded-[12px] border border-[#94a3b8] bg-transparent px-[18px] text-[18px] font-light leading-[22px] tracking-[-0.05em] text-[#334155] outline-none placeholder:text-[#94a3b8]"
                />
              </label>

              <label className="flex flex-col gap-2">
                <span className="text-[18px] font-light leading-[22px] tracking-[-0.05em] text-black">
                  Phone number
                </span>
                <span className="relative block h-[47px] rounded-[12px] border border-[#94a3b8] bg-[#f8fafc]">
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
                    className="h-full w-full rounded-[12px] border-0 bg-transparent pl-[99px] pr-[18px] text-[18px] font-light leading-[22px] tracking-[-0.05em] text-[#334155] outline-none placeholder:text-[#334155]"
                  />
                </span>
              </label>

              <label className="flex flex-col gap-2">
                <span className="text-[18px] font-light leading-[22px] tracking-[-0.05em] text-black">
                  Password
                </span>
                <span className="relative block h-[47px] rounded-[12px] border border-[#94a3b8]">
                  <input
                    type="password"
                    placeholder="Not more than 8 characters"
                    className="h-full w-full rounded-[12px] border-0 bg-transparent px-[18px] pr-12 text-[18px] font-light leading-[22px] tracking-[-0.05em] text-[#334155] outline-none placeholder:text-[#94a3b8]"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2">
                    <svg
                      viewBox="0 0 24 24"
                      className="h-6 w-6 text-black"
                      aria-hidden
                    >
                      <path
                        fill="currentColor"
                        d="M12 5c5.5 0 9.8 4.7 10 7c-.2 2.3-4.5 7-10 7S2.2 14.3 2 12c.2-2.3 4.5-7 10-7m0 3.5A3.5 3.5 0 1 0 12 15.5a3.5 3.5 0 0 0 0-7"
                      />
                    </svg>
                  </span>
                </span>
              </label>
            </div>

            <p className="absolute left-7 top-[418px] m-0 w-[433px] text-[14px] font-semibold leading-[17px] tracking-[-0.05em] text-black max-[1200px]:relative max-[1200px]:left-0 max-[1200px]:top-0 max-[1200px]:mt-7 max-[1200px]:w-full max-[1200px]:px-7">
              By continuing, you agree to our Terms of Service and Privacy Policy.
            </p>

            <Link
              href="/otp"
              className="absolute bottom-6 left-[29px] inline-flex h-[50px] w-[436px] items-center justify-center rounded-[18.0973px] bg-[linear-gradient(180deg,#1e88e5_0%,#114b7f_72.12%)] text-[20.0088px] font-normal leading-[30px] tracking-[-0.05em] text-[#e3f2fd] max-[1200px]:relative max-[1200px]:bottom-0 max-[1200px]:left-0 max-[1200px]:mt-5 max-[1200px]:mx-auto max-[1200px]:w-[calc(100%-58px)]"
            >
              Next
            </Link>
          </div>

          <p className="absolute left-[195px] top-[857px] m-0 text-[18px] font-light leading-[22px] tracking-[-0.05em] text-black max-[1200px]:relative max-[1200px]:left-0 max-[1200px]:top-[70px] max-[1200px]:text-center">
            Already have an account?{" "}
            <Link href="/signup" className="font-semibold text-[#1565c0]">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}
