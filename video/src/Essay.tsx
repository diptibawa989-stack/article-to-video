import React from 'react';
import {AbsoluteFill, Series} from 'remotion';
import {Background} from './components/Background';
import {Progress} from './components/Progress';
import {IdeaScene, Intro, MapScene, Outro, Statement} from './scenes/Scenes';
import {C} from './theme';
import {slots} from './timing';
import type {Storyboard} from './types';

export const Essay: React.FC<Storyboard> = (sb) => {
  const s = slots(sb);
  const d = (k: string) => s.find((x) => x.key === k)!.frames;
  return (
    <AbsoluteFill style={{backgroundColor: C.bg}}>
      <Background />
      <Series>
        <Series.Sequence durationInFrames={d('intro')}><Intro sb={sb} dur={d('intro')} /></Series.Sequence>
        <Series.Sequence durationInFrames={d('hook')}><Statement kicker="THE QUESTION" text={sb.hook} color={C.pink} dur={d('hook')} /></Series.Sequence>
        <Series.Sequence durationInFrames={d('thesis')}><Statement kicker="THE BIG IDEA" text={sb.thesis} color={C.cyan} dur={d('thesis')} boxed /></Series.Sequence>
        {sb.ideas.map((idea, i) => (
          <Series.Sequence key={i} durationInFrames={d(`idea${i}`)}>
            <IdeaScene idea={idea} i={i} n={sb.ideas.length} dur={d(`idea${i}`)} />
          </Series.Sequence>
        ))}
        <Series.Sequence durationInFrames={d('map')}><MapScene sb={sb} dur={d('map')} /></Series.Sequence>
        <Series.Sequence durationInFrames={d('takeaway')}><Statement kicker="SO WHAT, FOR YOU" text={sb.takeaway} color={C.lime} dur={d('takeaway')} boxed /></Series.Sequence>
        <Series.Sequence durationInFrames={d('outro')}><Outro sb={sb} dur={d('outro')} /></Series.Sequence>
      </Series>
      <Progress slots={s} title={sb.publication} />
    </AbsoluteFill>
  );
};
