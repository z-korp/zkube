import { Swiper, SwiperSlide } from "swiper/react";

import "swiper/css";
import "swiper/css/effect-cards";

import "@/index.css";

import { EffectCards } from "swiper/modules";
import { ModeType } from "@/dojo/game/types/mode";
import GameModeCardMobile from "./GameModeCardMobile";
import { trackEvent } from "@/services/analytics";
import { useCallback } from "react";

interface SwiperProps {
  setIsGameOn: (isOn: string) => void;
}

export default function Swipper({ setIsGameOn }: SwiperProps) {
  const handleSlideChange = useCallback(
    (mode: ModeType) => {
      trackEvent("Game Mode Selected Mobile", {
        mode: mode,
        interface: "mobile_swiper",
      });
      setIsGameOn("isOn");
    },
    [setIsGameOn],
  );

  return (
    <>
      <Swiper
        effect={"cards"}
        grabCursor={true}
        modules={[EffectCards]}
        className="mySwiper"
        initialSlide={1}
        onSlideChange={(swiper) => {
          trackEvent("Swiper Slide Change", {
            slideIndex: swiper.activeIndex,
            mode: Object.values(ModeType)[swiper.activeIndex],
          });
        }}
      >
        <SwiperSlide>
          <GameModeCardMobile
            mode={ModeType.Free}
            handleGameMode={() => handleSlideChange(ModeType.Free)}
          />
        </SwiperSlide>

        <SwiperSlide>
          <GameModeCardMobile
            mode={ModeType.Daily}
            handleGameMode={() => handleSlideChange(ModeType.Daily)}
          />
        </SwiperSlide>
        <SwiperSlide>
          <GameModeCardMobile
            mode={ModeType.Normal}
            handleGameMode={() => handleSlideChange(ModeType.Normal)}
          />
        </SwiperSlide>
      </Swiper>
    </>
  );
}
