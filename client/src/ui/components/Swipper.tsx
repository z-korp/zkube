import { Swiper, SwiperSlide } from "swiper/react";

import "swiper/css";
import "swiper/css/effect-cards";

import "@/index.css";

import { EffectCards } from "swiper/modules";
import { ModeType } from "@/dojo/game/types/mode";
import GameModeCardMobile from "./GameModeCardMobile";

interface SwiperProps {
  setIsGameOn: (isOn: string) => void;
}

export default function Swipper({ setIsGameOn }: SwiperProps) {
  return (
    <>
      <Swiper
        effect={"cards"}
        grabCursor={true}
        modules={[EffectCards]}
        className="mySwiper"
        initialSlide={1}
      >
        <SwiperSlide>
          <GameModeCardMobile
            mode={ModeType.Free}
            handleGameMode={() => setIsGameOn("isOn")}
          />
        </SwiperSlide>

        <SwiperSlide>
          <GameModeCardMobile
            mode={ModeType.Daily}
            handleGameMode={() => setIsGameOn("isOn")}
          />
        </SwiperSlide>
        <SwiperSlide>
          <GameModeCardMobile
            mode={ModeType.Normal}
            handleGameMode={() => setIsGameOn("isOn")}
          />
        </SwiperSlide>
      </Swiper>
    </>
  );
}
