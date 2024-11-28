import React, { useRef, useState } from "react";
// Import Swiper React components
import { Swiper, SwiperProps, SwiperSlide } from "swiper/react";

// Import Swiper styles
import "swiper/css";
import "swiper/css/effect-cards";

import "@/index.css";

// import required modules
import { EffectCards } from "swiper/modules";
import GameModeCard from "./GameModeCard";
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
