import React, { ChangeEvent, useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/ui/elements/dialog";

interface TweetPreviewProps {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  level: number | "";
  score: number | undefined;
  imgSrc: string;
}

export const TweetPreview: React.FC<TweetPreviewProps> = ({
  open,
  setOpen,
  level,
  score,
  imgSrc,
}) => {
  const bodyRef: React.RefObject<HTMLDivElement> | null = useRef(null);
  const [tweetMsg, setTweetMsg] = useState("");

  useEffect(() => {
    setTweetMsg(
      `🎮 Just crushed it on ZKUBE a @zkorp_ game with an awesome score of ${score}! 💥 Can you beat that? 😎\n\nI'm pumped to go even higher\nWho's ready to join the challenge? 🚀 Let's see who can set the new high score!\n\n#HighScore #GameOn #ChallengeAccepted`,
    );
  }, [open, score]);

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
  }, [imgSrc, bodyRef, bodyRef.current]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        ref={bodyRef}
        className="sm:max-w-[500px]"
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
        <img src={imgSrc ? imgSrc : ""} />
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
