import { useCallback, useEffect, useRef, useState } from 'react';
import { Button, MenuList, MenuListItem, Separator } from 'react95';
import { AgentSprite, type AnimationPlayRequest } from '../assistant/AgentSprite';
import { assistants, type AssistantSpeech } from '../assistant/content';
import { updateSettings, useSettings } from '../settings/settings';

type ExternalAction = 'welcome' | 'tip' | 'animate';

const externalListeners = new Set<(action: ExternalAction) => void>();

export function triggerDesktopAssistantAction(action: ExternalAction) {
  externalListeners.forEach((listener) => listener(action));
}

type DesktopAssistantProps = {
  openApp: (appId: string) => void;
  activeAppId: string | null;
  paused?: boolean;
};

type BubbleMode = 'speech' | 'interactive';

type BubbleState = {
  text: string;
  mode: BubbleMode;
  tag?: 'tip' | 'remark';
};

const spriteBox = { width: 128, height: 128 };
const margin = 12;
const taskbarHeight = 44;

function defaultPosition() {
  // Oberhalb der beiden Rechts-Symbole (Impressum & Datenschutz) rechts unten platzieren,
  // damit Impressum und Datenschutz jederzeit frei anklickbar bleiben.
  return {
    x: Math.max(margin, window.innerWidth - spriteBox.width - 36),
    y: Math.max(margin, window.innerHeight - spriteBox.height - taskbarHeight - 96),
  };
}

function clampPosition(pos: { x: number; y: number }) {
  const maxX = Math.max(margin, window.innerWidth - spriteBox.width - margin);
  const maxY = Math.max(margin, window.innerHeight - spriteBox.height - taskbarHeight - 6);
  return {
    x: Math.min(maxX, Math.max(margin, Math.round(pos.x))),
    y: Math.min(maxY, Math.max(margin, Math.round(pos.y))),
  };
}

export function DesktopAssistant({ openApp, activeAppId, paused = false }: DesktopAssistantProps) {
  const settings = useSettings();
  const profile = assistants[settings.assistant];
  const [pos, setPos] = useState<{ x: number; y: number }>(() =>
    clampPosition(settings.assistantPosition ?? defaultPosition()),
  );
  const [anim, setAnim] = useState<AnimationPlayRequest | null>({ name: 'Show', key: 1 });
  const [bubble, setBubble] = useState<BubbleState | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [animSubmenu, setAnimSubmenu] = useState(false);
  const [hiding, setHiding] = useState(false);

  const tipDeckRef = useRef<number[]>([]);
  const remarkDeckRef = useRef<number[]>([]);
  const showcaseIdxRef = useRef(0);
  const lastReactedAppRef = useRef<string | null>(null);
  const hideBubbleTimerRef = useRef(0);
  const dragRef = useRef<{
    startX: number;
    startY: number;
    origX: number;
    origY: number;
    moved: boolean;
  } | null>(null);

  // Position bei Fenstergrößenänderung oder Reset anpassen
  useEffect(() => {
    setPos(clampPosition(settings.assistantPosition ?? defaultPosition()));
  }, [settings.assistantPosition]);

  useEffect(() => {
    const onResize = () => {
      setPos((prev) => clampPosition(prev));
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const playAnim = useCallback((name: string, maxDurationMs = 4000) => {
    setAnim((prev) => ({
      name,
      key: (prev?.key ?? 0) + 1,
      maxDurationMs,
    }));
  }, []);

  const showBubble = useCallback(
    (speech: AssistantSpeech, mode: BubbleMode = 'speech', tag?: 'tip' | 'remark', autoCloseMs = 12500) => {
      window.clearTimeout(hideBubbleTimerRef.current);
      setBubble({ text: speech.text, mode, tag });
      playAnim(speech.animation);
      if (autoCloseMs > 0) {
        hideBubbleTimerRef.current = window.setTimeout(() => {
          setBubble(null);
        }, autoCloseMs);
      }
    },
    [playAnim],
  );

  const nextFromDeck = (deckRef: React.MutableRefObject<number[]>, total: number): number => {
    if (deckRef.current.length === 0) {
      const indices = Array.from({ length: total }, (_, i) => i);
      for (let i = indices.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        [indices[i], indices[j]] = [indices[j], indices[i]];
      }
      deckRef.current = indices;
    }
    return deckRef.current.pop() ?? 0;
  };

  const speakDiscoveryTip = useCallback(
    (mode: BubbleMode = 'speech') => {
      const list = profile.discoveryTips;
      const idx = nextFromDeck(tipDeckRef, list.length);
      showBubble(list[idx], mode, 'tip', mode === 'interactive' ? 16000 : 11500);
    },
    [profile, showBubble],
  );

  const speakRandomRemark = useCallback(
    (mode: BubbleMode = 'speech') => {
      const list = profile.randomRemarks;
      const idx = nextFromDeck(remarkDeckRef, list.length);
      showBubble(list[idx], mode, 'remark', mode === 'interactive' ? 14000 : 9500);
    },
    [profile, showBubble],
  );

  const playShowcaseAnimation = useCallback(() => {
    const list = profile.showcaseAnimations;
    const item = list[showcaseIdxRef.current % list.length];
    showcaseIdxRef.current += 1;
    showBubble({ text: item.line, animation: item.id }, 'interactive', 'remark', 12000);
  }, [profile, showBubble]);

  // Bei Assistenten-Wechsel Decks leeren und Begrüßung zeigen
  const prevAssistantRef = useRef(settings.assistant);
  useEffect(() => {
    tipDeckRef.current = [];
    remarkDeckRef.current = [];
    showcaseIdxRef.current = 0;
    if (prevAssistantRef.current !== settings.assistant) {
      prevAssistantRef.current = settings.assistant;
      showBubble(assistants[settings.assistant].welcomeAfterWizard, 'interactive', 'remark', 13000);
    }
  }, [settings.assistant, showBubble]);

  // Beim ersten Erscheinen auf dem Desktop kurz begrüßen
  const greetedOnMountRef = useRef(false);
  useEffect(() => {
    if (!settings.assistantSetupDone || !settings.assistantEnabled || greetedOnMountRef.current) return;
    greetedOnMountRef.current = true;
    const timer = window.setTimeout(() => {
      const boots = profile.welcomeOnBoot;
      const chosen = boots[Math.floor(Math.random() * boots.length)];
      showBubble(chosen, 'speech', 'remark', 9000);
    }, 900);
    return () => window.clearTimeout(timer);
  }, [settings.assistantSetupDone, settings.assistantEnabled, profile, showBubble]);

  // Externe Trigger aus dem Einrichtungs-Wizard
  useEffect(() => {
    const listener = (action: ExternalAction) => {
      if (action === 'welcome') {
        greetedOnMountRef.current = true;
        showBubble(profile.welcomeAfterWizard, 'interactive', 'remark', 14000);
      } else if (action === 'tip') {
        speakDiscoveryTip('interactive');
      } else if (action === 'animate') {
        playShowcaseAnimation();
      }
    };
    externalListeners.add(listener);
    return () => {
      externalListeners.delete(listener);
    };
  }, [profile, showBubble, speakDiscoveryTip, playShowcaseAnimation]);

  // Periodisch zufällige Sprüche und subtile Entdecker-Tipps einblenden
  useEffect(() => {
    if (!settings.assistantSetupDone || !settings.assistantEnabled || paused || hiding) return;
    const delay = 26000 + Math.random() * 18000;
    const timer = window.setTimeout(() => {
      if (bubble) return;
      const giveTip = settings.assistantTips && Math.random() < 0.62;
      if (giveTip) {
        speakDiscoveryTip('speech');
      } else {
        speakRandomRemark('speech');
      }
    }, delay);
    return () => window.clearTimeout(timer);
  }, [
    settings.assistantSetupDone,
    settings.assistantEnabled,
    settings.assistantTips,
    paused,
    hiding,
    bubble,
    speakDiscoveryTip,
    speakRandomRemark,
  ]);

  // Reaktion auf neu geöffnete Fenster
  useEffect(() => {
    if (!settings.assistantSetupDone || !settings.assistantEnabled || paused || hiding) return;
    if (!activeAppId || activeAppId === lastReactedAppRef.current) return;
    lastReactedAppRef.current = activeAppId;
    if (activeAppId === 'assistant') return;
    const reaction = profile.appReactions[activeAppId];
    if (!reaction) return;
    // Wenn gerade kein interaktiver Dialog offen ist, reagiert der Assistent dezent
    if (!bubble || bubble.mode === 'speech') {
      showBubble(reaction, 'speech', 'remark', 8500);
    }
  }, [activeAppId, settings.assistantSetupDone, settings.assistantEnabled, paused, hiding, profile, bubble, showBubble]);

  // Kontextmenü schließen bei Klick außerhalb
  useEffect(() => {
    if (!contextMenu) return;
    const onDown = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target?.closest('.assistant-context-menu')) {
        setContextMenu(null);
        setAnimSubmenu(false);
      }
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [contextMenu]);

  if (!settings.assistantSetupDone || (!settings.assistantEnabled && !hiding)) {
    return null;
  }

  const hideAssistant = () => {
    setContextMenu(null);
    setBubble(null);
    setHiding(true);
    playAnim('Hide', 2400);
    window.setTimeout(() => {
      setHiding(false);
      updateSettings({ assistantEnabled: false });
    }, 1600);
  };

  // Position der Sprechblase berechnen (oben oder unten, links oder rechts)
  const bubbleAbove = pos.y > 190;
  const bubbleLeft = pos.x > window.innerWidth / 2;

  return (
    <div
      className="desktop-assistant"
      style={{
        left: pos.x,
        top: pos.y,
        width: spriteBox.width,
        height: spriteBox.height,
      }}
    >
      {bubble ? (
        <div
          className={[
            'assistant-balloon',
            bubbleAbove ? 'is-above' : 'is-below',
            bubbleLeft ? 'is-left' : 'is-right',
          ].join(' ')}
          onMouseDown={(event) => event.stopPropagation()}
        >
          <button
            type="button"
            className="assistant-balloon-close"
            title="Schließen"
            aria-label="Sprechblase schließen"
            onClick={() => {
              window.clearTimeout(hideBubbleTimerRef.current);
              setBubble(null);
            }}
          >
            ×
          </button>
          {bubble.tag === 'tip' ? (
            <div className="assistant-balloon-header">
              <span className="assistant-bulb" aria-hidden="true">💡</span>
              <strong>Tipp zur Entdeckungsreise:</strong>
            </div>
          ) : null}
          <p
            className="assistant-balloon-text"
            onClick={() => {
              if (bubble.mode === 'speech') {
                setBubble({ ...bubble, mode: 'interactive' });
              }
            }}
          >
            {bubble.text}
          </p>
          <div className="assistant-balloon-actions">
            <Button
              size="sm"
              onClick={() => speakDiscoveryTip('interactive')}
              title="Einen subtilen Hinweis zu versteckten Funktionen dieser Website geben"
            >
              💡 Tipp
            </Button>
            <Button
              size="sm"
              onClick={playShowcaseAnimation}
              title="Eine bekannte Animation vorführen"
            >
              ✨ Kunststück
            </Button>
            <Button
              size="sm"
              onClick={() => {
                setBubble(null);
                openApp('assistant');
              }}
              title="Office-Assistenten wechseln oder Optionen anpassen"
            >
              Assistent...
            </Button>
          </div>
          <span className="assistant-balloon-pointer" aria-hidden="true" />
        </div>
      ) : null}

      <div
        className="assistant-actor"
        role="button"
        tabIndex={0}
        aria-label={`${profile.name} – Office-Assistent`}
        title={`${profile.name} (Klick für Tipp, Rechtsklick für Menü, Ziehen zum Verschieben)`}
        onPointerDown={(event) => {
          if (event.button !== 0) return;
          event.stopPropagation();
          dragRef.current = {
            startX: event.clientX,
            startY: event.clientY,
            origX: pos.x,
            origY: pos.y,
            moved: false,
          };
          event.currentTarget.setPointerCapture(event.pointerId);
        }}
        onPointerMove={(event) => {
          const drag = dragRef.current;
          if (!drag) return;
          const dx = event.clientX - drag.startX;
          const dy = event.clientY - drag.startY;
          if (!drag.moved && Math.hypot(dx, dy) > 5) {
            drag.moved = true;
          }
          if (drag.moved) {
            setPos(clampPosition({ x: drag.origX + dx, y: drag.origY + dy }));
          }
        }}
        onPointerUp={(event) => {
          const drag = dragRef.current;
          dragRef.current = null;
          if (!drag) return;
          if (drag.moved) {
            const next = clampPosition({
              x: drag.origX + (event.clientX - drag.startX),
              y: drag.origY + (event.clientY - drag.startY),
            });
            setPos(next);
            updateSettings({ assistantPosition: next });
            return;
          }
          // Einfacher Klick auf die Figur:
          if (settings.assistantTips && (!bubble || bubble.tag !== 'tip')) {
            speakDiscoveryTip('interactive');
          } else {
            speakRandomRemark('interactive');
          }
        }}
        onContextMenu={(event) => {
          event.preventDefault();
          event.stopPropagation();
          setAnimSubmenu(false);
          setContextMenu({
            x: Math.min(event.clientX, window.innerWidth - 210),
            y: Math.min(event.clientY, window.innerHeight - 190),
          });
        }}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            speakDiscoveryTip('interactive');
          }
        }}
      >
        <AgentSprite
          assistant={settings.assistant}
          animation={anim}
          autoIdle={!paused}
          muted={paused}
        />
      </div>

      {contextMenu ? (
        <MenuList
          className="context-menu assistant-context-menu"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          <MenuListItem
            size="sm"
            onClick={() => {
              setContextMenu(null);
              speakDiscoveryTip('interactive');
            }}
          >
            Geheimtipp anzeigen
          </MenuListItem>
          <MenuListItem
            size="sm"
            onClick={() => {
              setContextMenu(null);
              speakRandomRemark('interactive');
            }}
          >
            Spruch klopfen
          </MenuListItem>
          <MenuListItem
            size="sm"
            className="assistant-submenu-root"
            onMouseEnter={() => setAnimSubmenu(true)}
            onClick={() => setAnimSubmenu((open) => !open)}
          >
            <span>Animation vorführen</span>
            <span className="start-arrow" aria-hidden="true" />
            {animSubmenu ? (
              <MenuList className="assistant-anim-submenu">
                {profile.showcaseAnimations.map((item) => (
                  <MenuListItem
                    key={item.id}
                    size="sm"
                    onClick={(event) => {
                      event.stopPropagation();
                      setContextMenu(null);
                      setAnimSubmenu(false);
                      showBubble({ text: item.line, animation: item.id }, 'interactive', 'remark', 11000);
                    }}
                  >
                    {item.label}
                  </MenuListItem>
                ))}
              </MenuList>
            ) : null}
          </MenuListItem>
          <Separator />
          <MenuListItem
            size="sm"
            onClick={() => {
              setContextMenu(null);
              openApp('assistant');
            }}
          >
            Assistenten auswählen...
          </MenuListItem>
          <MenuListItem size="sm" onClick={hideAssistant}>
            Ausblenden
          </MenuListItem>
        </MenuList>
      ) : null}
    </div>
  );
}
