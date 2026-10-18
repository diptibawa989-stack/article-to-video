import React from 'react';
import {AbsoluteFill, Audio, Sequence, Series, staticFile} from 'remotion';
import {Background} from './components/Background';
import {Progress} from './components/Progress';
import {IdeaScene, Intro, MapScene, Outro, Statement} from './scenes/Scenes';
import {C} from './theme';
import {FPS, VOICE_LEAD_SEC, slots} from './timing';
import type {Storyboard} from './types';

const Voice: React.FC<{sb: Storyboard; k: string}> = ({sb, k}) => {
  const v = sb.voice?.[k];
  if (!v) return null;
  return (
    <Sequence from={Math.round(VOICE_LEAD_SEC * FPS)} layout="none">
      <Audio src={staticFile(v.src)} />
    </Sequence>
  );
};

export const Essay: React.FC<Storyboard> = (sb) => {
  const s = slots(sb);
  const d = (k: string) => s.find((x) => x.key === k)!.frames;
  return (
    <AbsoluteFill style={{backgroundColor: C.bg}}>
      <Background />
      <Series>
        <Series.Sequence durationInFrames={d('intro')}><Voice sb={sb} k="intro" /><Intro sb={sb} dur={d('intro')} /></Series.Sequence>
        <Series.Sequence durationInFrames={d('hook')}><Voice sb={sb} k="hook" /><Statement kicker="THE QUESTION" text={sb.hook} color={C.pink} dur={d('hook')} /></Series.Sequence>
        <Series.Sequence durationInFrames={d('thesis')}><Voice sb={sb} k="thesis" /><Statement kicker="THE BIG IDEA" text={sb.thesis} color={C.cyan} dur={d('thesis')} boxed /></Series.Sequence>
        {sb.ideas.map((idea, i) => (
          <Series.Sequence key={i} durationInFrames={d(`idea${i}`)}>
            <Voice sb={sb} k={`idea${i}`} />
            <IdeaScene idea={idea} i={i} n={sb.ideas.length} dur={d(`idea${i}`)} />
          </Series.Sequence>
        ))}
        <Series.Sequence durationInFrames={d('map')}><Voice sb={sb} k="map" /><MapScene sb={sb} dur={d('map')} /></Series.Sequence>
        <Series.Sequence durationInFrames={d('takeaway')}><Voice sb={sb} k="takeaway" /><Statement kicker="SO WHAT, FOR YOU" text={sb.takeaway} color={C.lime} dur={d('takeaway')} boxed /></Series.Sequence>
        <Series.Sequence durationInFrames={d('outro')}><Voice sb={sb} k="outro" /><Outro sb={sb} dur={d('outro')} /></Series.Sequence>
      </Series>
      <Progress slots={s} title={sb.publication} />
    </AbsoluteFill>
  );
};
