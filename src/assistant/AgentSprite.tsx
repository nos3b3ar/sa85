import { useEffect, useRef, useState } from 'react';
import { loadAgentData, playAgentSound, type AgentFrame, type LoadedAgent } from './agentData';
import type { AssistantId } from '../settings/settings';

export type AnimationPlayRequest = {
  name: string;
  key: number;
  /** Maximale Spielzeit bei Endlosschleifen-Animationen vor dem Exit-Branch (Standard: 3800ms). */
  maxDurationMs?: number;
};

type AgentSpriteProps = {
  assistant: AssistantId;
  animation?: AnimationPlayRequest | null;
  /** Wenn true, spielt die Figur zwischendurch dezente Idle-Animationen ab. */
  autoIdle?: boolean;
  /** Wenn true, sind Soundeffekte dieser Instanz stumm (z. B. wenn der Nutzer sie stummgeschaltet hat). */
  muted?: boolean;
  onAnimationEnd?: (name: string) => void;
  className?: string;
};

function pickNextFrameIndex(frame: AgentFrame, currentIndex: number, exiting: boolean): number {
  if (exiting && frame.exitBranch !== undefined) {
    return frame.exitBranch;
  }
  if (frame.branching?.branches.length) {
    let rnd = Math.random() * 100;
    for (const branch of frame.branching.branches) {
      if (rnd <= branch.weight) return branch.frameIndex;
      rnd -= branch.weight;
    }
  }
  return currentIndex + 1;
}

export function AgentSprite({
  assistant,
  animation,
  autoIdle = true,
  muted = false,
  onAnimationEnd,
  className,
}: AgentSpriteProps) {
  const [loaded, setLoaded] = useState<LoadedAgent | null>(null);
  const [images, setImages] = useState<[number, number][]>([[0, 0]]);
  const [hidden, setHidden] = useState(false);
  const onEndRef = useRef(onAnimationEnd);
  onEndRef.current = onAnimationEnd;
  const mutedRef = useRef(muted);
  mutedRef.current = muted;

  useEffect(() => {
    let cancelled = false;
    setLoaded((prev) => (prev?.id === assistant ? prev : null));
    void loadAgentData(assistant).then((data) => {
      if (!cancelled) {
        setLoaded(data);
        setImages([[0, 0]]);
        setHidden(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [assistant]);

  useEffect(() => {
    if (!loaded) return;
    let timer = 0;
    let exitTimer = 0;
    let idleTimer = 0;
    let cancelled = false;

    const { spec, sounds, id } = loaded;
    const idleNames = Object.keys(spec.animations).filter((name) => name.startsWith('Idle'));

    const playSequence = (animName: string, maxDurationMs = 3800, isIdle = false) => {
      window.clearTimeout(timer);
      window.clearTimeout(exitTimer);
      window.clearTimeout(idleTimer);

      const anim = spec.animations[animName] ?? spec.animations.RestPose;
      if (!anim || anim.frames.length === 0) {
        setImages([[0, 0]]);
        if (!isIdle) onEndRef.current?.(animName);
        scheduleIdle();
        return;
      }

      setHidden(false);
      let frameIndex = 0;
      let exiting = false;
      let steps = 0;
      const maxSteps = 90;

      exitTimer = window.setTimeout(() => {
        exiting = true;
      }, maxDurationMs);

      const finish = () => {
        window.clearTimeout(timer);
        window.clearTimeout(exitTimer);
        if (cancelled) return;
        if (animName === 'Hide') {
          setHidden(true);
        } else {
          setImages([[0, 0]]);
        }
        if (!isIdle) onEndRef.current?.(animName);
        if (animName !== 'Hide') scheduleIdle();
      };

      const step = () => {
        if (cancelled) return;
        steps += 1;
        const frame = anim.frames[frameIndex];
        if (!frame || steps > maxSteps) {
          finish();
          return;
        }

        if (frame.images && frame.images.length > 0) {
          setImages(frame.images);
        } else if (frame.duration === 0) {
          finish();
          return;
        }

        if (frame.sound) {
          playAgentSound(id, frame.sound, sounds, mutedRef.current || isIdle);
        }

        const isLast = frameIndex >= anim.frames.length - 1;
        if (isLast && (!anim.useExitBranching || exiting || frame.duration === 0)) {
          if (frame.duration > 0) {
            timer = window.setTimeout(finish, frame.duration);
          } else {
            finish();
          }
          return;
        }

        const waitMs = Math.max(30, frame.duration || 80);
        timer = window.setTimeout(() => {
          const nextIndex = pickNextFrameIndex(frame, frameIndex, exiting);
          if (nextIndex >= anim.frames.length) {
            finish();
            return;
          }
          frameIndex = nextIndex;
          step();
        }, waitMs);
      };

      step();
    };

    const scheduleIdle = () => {
      if (!autoIdle || cancelled || idleNames.length === 0) return;
      const delay = 9000 + Math.random() * 9000;
      idleTimer = window.setTimeout(() => {
        if (cancelled) return;
        const randomIdle = idleNames[Math.floor(Math.random() * idleNames.length)];
        playSequence(randomIdle, 3200, true);
      }, delay);
    };

    if (animation?.name) {
      playSequence(animation.name, animation.maxDurationMs ?? 3800, false);
    } else {
      setImages([[0, 0]]);
      setHidden(false);
      scheduleIdle();
    }

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      window.clearTimeout(exitTimer);
      window.clearTimeout(idleTimer);
    };
  }, [loaded, animation?.key, animation?.name, animation?.maxDurationMs, autoIdle]);

  if (!loaded) {
    return <div className={className} style={{ width: 128, height: 128 }} />;
  }

  const [width, height] = loaded.spec.framesize;

  return (
    <div
      className={['agent-sprite', className].filter(Boolean).join(' ')}
      style={{
        width,
        height,
        position: 'relative',
        visibility: hidden ? 'hidden' : 'visible',
      }}
    >
      {Array.from({ length: loaded.spec.overlayCount }, (_, layer) => {
        const coords = images[layer];
        if (!coords) return null;
        return (
          <div
            key={layer}
            className="agent-sprite-layer"
            style={{
              position: 'absolute',
              inset: 0,
              width,
              height,
              backgroundImage: `url("${loaded.mapUrl}")`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: `${-coords[0]}px ${-coords[1]}px`,
              imageRendering: 'pixelated',
            }}
          />
        );
      })}
    </div>
  );
}
