import React from "react";
import { Composition } from "remotion";
import { SlotWinVideo, type SlotWinVideoProps } from "./compositions/SlotWinVideo";
import { PlatformShowcase } from "./compositions/PlatformShowcase";
import { PlatformWalkthrough } from "./compositions/PlatformWalkthrough";

const defaultProps: SlotWinVideoProps = {
  tier: "legendary",
  amount: 1000000,
  multiplier: 2.5,
  duration: 72,
  username: "Anonymous",
  walletAddress: "7a3...f9d",
};

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {/* Spin result share video - 1080x1080 square for social */}
      <Composition
        id="SlotWinVideo"
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        component={SlotWinVideo as any}
        durationInFrames={150}
        fps={30}
        width={1080}
        height={1080}
        defaultProps={defaultProps}
      />

      {/* Platform showcase - 15 second explainer video */}
      <Composition
        id="PlatformShowcase"
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        component={PlatformShowcase as any}
        durationInFrames={450}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{}}
      />

      {/* Platform walkthrough - 18 second cinematic demo using real components */}
      <Composition
        id="PlatformWalkthrough"
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        component={PlatformWalkthrough as any}
        durationInFrames={540}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{}}
      />
    </>
  );
};
