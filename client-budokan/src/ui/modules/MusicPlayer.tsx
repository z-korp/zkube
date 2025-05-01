import { Button } from "@/ui/elements/button";
import { Slider } from "@/ui/elements/slider";
import { useMusicPlayer } from "@/contexts/hooks";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faVolumeHigh, faVolumeMute } from "@fortawesome/free-solid-svg-icons";

export const MusicPlayer = () => {
  const {
    playTheme,
    isPlaying,
    stopTheme,
    musicVolume,
    setMusicVolume,
    effectsVolume,
    setEffectsVolume,
  } = useMusicPlayer();

  const handlePlay = () => {
    if (isPlaying) {
      stopTheme();
    } else {
      playTheme();
    }
  };

  return (
    <div>
      <h2 className="py-2">Music :</h2>
      <div className="flex space-x-3 rounded-md p-2 backdrop-blur-lg z-1 border">
        <Button
          onClick={() => handlePlay()}
          variant={"link"}
          className="self-center"
          size={"sm"}
        >
          {isPlaying ? (
            <FontAwesomeIcon className="h-6 w-6" icon={faVolumeHigh} />
          ) : (
            <FontAwesomeIcon className="h-6 w-6" icon={faVolumeMute} />
          )}
        </Button>
        <Slider
          onValueChange={(value) => setMusicVolume(value[0])}
          defaultValue={[musicVolume]}
          max={1}
          step={0.1}
        />
      </div>
      <h2 className="py-2">Effect :</h2>
      <div className="flex space-x-3 rounded-md p-2 backdrop-blur-lg z-1 border w-40">
        <Button
          onClick={() => handlePlay()}
          variant={"link"}
          className="self-center"
          size={"sm"}
        >
          {isPlaying ? (
            <FontAwesomeIcon className="h-6 w-6" icon={faVolumeHigh} />
          ) : (
            <FontAwesomeIcon className="h-6 w-6" icon={faVolumeMute} />
          )}
        </Button>
        <Slider
          onValueChange={(value) => setEffectsVolume(value[0])}
          defaultValue={[effectsVolume]}
          max={1}
          step={0.1}
        />
      </div>
    </div>
  );
};
