import { useNavigate } from "react-router-dom";
import { Button } from "@ui/button";

// Foto dari Unsplash (lisensi Unsplash), disimpan lokal supaya ikut ter-cache PWA.
const heroPhoto = "/splash/hero.jpg";
const sidePhotoTop = "/splash/side-top.jpg";
const sidePhotoBottom = "/splash/side-bottom.jpg";

const SplashScreen = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-dvh bg-paper-raised flex flex-col">
      <div className="px-5 pt-10 pb-20">
        <div
          className="mx-auto grid w-full max-w-sm grid-cols-5 gap-3"
          style={{ gridTemplateRows: "1fr 1fr", height: "340px" }}
        >
          <div className="col-span-3 row-span-2 overflow-hidden rounded-[28px] bg-[#E6E6E3]">
            <img
              src={heroPhoto}
              alt=""
              draggable={false}
              loading="eager"
              className="h-full w-full object-cover select-none pointer-events-none"
            />
          </div>
          <div className="col-span-2 overflow-hidden rounded-[24px] bg-[#E6E6E3]">
            <img
              src={sidePhotoTop}
              alt=""
              draggable={false}
              loading="eager"
              className="h-full w-full object-cover select-none pointer-events-none"
            />
          </div>
          <div className="col-span-2 overflow-hidden rounded-[24px] bg-[#E6E6E3]">
            <img
              src={sidePhotoBottom}
              alt=""
              draggable={false}
              loading="eager"
              className="h-full w-full object-cover select-none pointer-events-none"
            />
          </div>
        </div>
      </div>

      <div className="-mt-10 flex flex-1 flex-col rounded-t-[2.5rem] bg-muted px-6 pt-10 pb-8">
        <div className="mx-auto w-full max-w-md text-center">
          <h1 className="text-[30px] font-semibold tracking-tight leading-[1.12] text-ink">
            Attendance,
            <br />
            made effortless.
          </h1>
          <div className="mx-auto mt-4 h-[3px] w-10 rounded-full bg-brand" />
          <p className="mt-5 text-[14px] leading-relaxed text-ink-muted">
            One tap to clock in. Nothing more.
          </p>
        </div>

        <div className="flex-1" />

        <div className="mx-auto w-full max-w-sm">
          <Button
            onClick={() => navigate("/auth/login")}
            className="w-full h-12 mt-2 rounded-lg bg-brand hover:bg-brand-bright text-white text-[15px] font-medium disabled:opacity-60"
          >
            Get started
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SplashScreen;
