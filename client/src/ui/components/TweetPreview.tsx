import React, { ChangeEvent, useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/ui/elements/dialog";
import useRank from "@/hooks/useRank";

interface TweetPreviewProps {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  level: number | "";
  score: number | undefined;
  imgSrc: string;
  gameId: string;
  tournamentId: number;
}

export const TweetPreview: React.FC<TweetPreviewProps> = ({
  open,
  setOpen,
  score,
  imgSrc,
  gameId,
  tournamentId,
}) => {
  const bodyRef: React.RefObject<HTMLDivElement> | null = useRef(null);
  const [tweetMsg, setTweetMsg] = useState("");

  const { rank, suffix } = useRank({
    tournamentId,
    gameId,
  });

  useEffect(() => {
    setTweetMsg(
      `🎮 Just crushed it on ZKUBE with a score of ${score}! Ranked ${rank}${suffix} 💥
Can you beat that? 😎
Ready to level up! Who's joining the challenge? 🚀
Play now: app.zkube.xyz
@zkorp_ @zkube_game`,
    );
  }, [open, rank, score, suffix]);

  const handleChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    setTweetMsg(event.target.value);
  };

  // const textQuery = encodeURIComponent(
  //   `Just had a blast on @zkorp_ 's zkube game but lost with a score of ${score} 😅. But I’m not giving up—next stop, Level ${Number(level) ? Number(level) + 1 : 1} \n\n🏆! Who’s ready to join me on this epic adventure? 🚀🚀 \n\n#GameOn #ChallengeAccepte\n\n`,
  // );
  const tweetText = `https://x.com/intent/tweet?text=${encodeURIComponent(tweetMsg)}&url=app.zkube.xyz`;
  useEffect(() => {
    if (imgSrc !== null) {
      let twitterImageMetaTag = document.querySelector(
        'meta[name="twitter:image"]',
      );

      if (twitterImageMetaTag) {
        twitterImageMetaTag.setAttribute("content", imgSrc);
      } else {
        twitterImageMetaTag = document.createElement("meta");
        twitterImageMetaTag.setAttribute("name", "twitter:image");
        twitterImageMetaTag.setAttribute("content", imgSrc);
        document.head.appendChild(twitterImageMetaTag);
        const twitterMetaCard = document.createElement("meta");
        twitterMetaCard.setAttribute("name", "twitter:card");
        twitterMetaCard.setAttribute("content", "summary_large_image");
        document.head.appendChild(twitterMetaCard);
      }
      //console.log("second => ", imgSrc, bodyRef.current);
    }
  }, [imgSrc, bodyRef]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        ref={bodyRef}
        className="sm:max-w-[500px] rounded-lg"
        aria-describedby={undefined}
      >
        <DialogHeader className="flex items-center text-2xl">
          <DialogTitle>Share Progress on X</DialogTitle>
        </DialogHeader>
        {/* <p className="mt-4">
          Just had a blast on @zkorp_ 's zkube game but lost with a score of {score} at Level {level} 😅. But I’m not giving up—next stop, Level {Number(level) ? Number(level) + 1 : 1} <br />🏆! Who’s ready to join me on this epic adventure? 🚀🚀 \n\n#GameOn #ChallengeAccepte\n\n
        </p> */}
        <textarea
          className="bg-transparent text-white border border-white outline-none p-2"
          value={tweetMsg}
          onChange={handleChange}
          rows={6}
        />
        <div className="mt-8 flex w-full justify-center">
          <a
            className={
              "text-white twitter-share-button bg-black border border-white rounded px-4 py-2"
            }
            href={tweetText}
            target="_blank"
            rel="noreferrer"
          >
            Share on X
          </a>
        </div>
      </DialogContent>
    </Dialog>
  );
};
