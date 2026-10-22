import { useEffect, useState } from 'react';
import { Button, Checkbox, Frame, GroupBox, Tab, TabBody, Tabs } from 'react95';
import { AgentSprite, type AnimationPlayRequest } from '../assistant/AgentSprite';
import { assistantOrder, assistants } from '../assistant/content';
import { triggerDesktopAssistantAction } from '../desktop/DesktopAssistant';
import { getSettings, updateSettings, type AssistantId } from '../settings/settings';
import type { AppProps } from './types';

export function AssistantApp({ onClose, setCloseGuard }: AppProps) {
  const initial = getSettings();
  const [tab, setTab] = useState(0);
  const [selectedId, setSelectedId] = useState<AssistantId>(initial.assistant);
  const [enabled, setEnabled] = useState(initial.assistantEnabled);
  const [sounds, setSounds] = useState(initial.assistantSounds);
  const [tips, setTips] = useState(initial.assistantTips);
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [animReq, setAnimReq] = useState<AnimationPlayRequest | null>(() => ({
    name: assistants[initial.assistant].galleryQuotes[0].animation,
    key: 1,
  }));

  // Beide Assistenten für das sofortige Blättern in der Galerie vorladen
  useEffect(() => {
    assistantOrder.forEach((id) => {
      void import('../assistant/agentData').then(({ loadAgentData }) => loadAgentData(id));
    });
  }, []);

  const currentIndex = assistantOrder.indexOf(selectedId);
  const profile = assistants[selectedId];
  const quote = profile.galleryQuotes[quoteIndex % profile.galleryQuotes.length];

  // Wenn der Einrichtungs-Wizard zum allerersten Mal über X geschlossen wird,
  // gilt die Ersteinrichtung als gesehen, damit der Assistent danach auf dem Desktop erscheint.
  useEffect(() => {
    setCloseGuard?.(() => {
      if (!getSettings().assistantSetupDone) {
        updateSettings({ assistantSetupDone: true });
      }
      onClose();
    });
    return () => setCloseGuard?.(null);
  }, [onClose, setCloseGuard]);

  const stepAssistant = (delta: number) => {
    const nextIdx = (currentIndex + delta + assistantOrder.length) % assistantOrder.length;
    const nextId = assistantOrder[nextIdx];
    const nextQuote = assistants[nextId].galleryQuotes[0];
    setSelectedId(nextId);
    setQuoteIndex(0);
    setAnimReq((prev) => ({
      name: nextQuote.animation,
      key: (prev?.key ?? 0) + 1,
    }));
  };

  const cyclePreview = () => {
    const nextQuoteIdx = (quoteIndex + 1) % profile.galleryQuotes.length;
    const nextQuote = profile.galleryQuotes[nextQuoteIdx];
    setQuoteIndex(nextQuoteIdx);
    setAnimReq((prev) => ({
      name: nextQuote.animation,
      key: (prev?.key ?? 0) + 1,
    }));
  };

  const confirm = () => {
    const wasFirstSetup = !getSettings().assistantSetupDone;
    const changedAssistant = getSettings().assistant !== selectedId || !getSettings().assistantEnabled;
    updateSettings({
      assistant: selectedId,
      assistantEnabled: enabled,
      assistantSounds: sounds,
      assistantTips: tips,
      assistantSetupDone: true,
    });
    onClose();
    if (enabled && (wasFirstSetup || changedAssistant)) {
      window.setTimeout(() => {
        triggerDesktopAssistantAction('welcome');
      }, 120);
    }
  };

  const cancel = () => {
    if (!getSettings().assistantSetupDone) {
      updateSettings({ assistantSetupDone: true });
    }
    onClose();
  };

  return (
    <div className="props-dialog assistant-dialog">
      <Tabs value={tab} onChange={(value) => setTab(value as number)}>
        <Tab value={0}>Galerie</Tab>
        <Tab value={1}>Optionen</Tab>
      </Tabs>
      <TabBody className="props-body assistant-tab-body">
        {tab === 0 ? (
          <div className="assistant-gallery">
            <p className="assistant-gallery-intro">
              Blättern Sie mit den Schaltflächen &lt;Zurück und Weiter&gt; durch die verschiedenen Assistenten.
              Klicken Sie auf OK, wenn Sie Ihren Assistenten ausgewählt haben.
            </p>
            <div className="assistant-gallery-stage">
              <Frame
                variant="field"
                className="assistant-preview-box"
                title="Klicken, um eine weitere Animation zu sehen"
                onClick={cyclePreview}
              >
                <AgentSprite
                  assistant={selectedId}
                  animation={animReq}
                  muted={!sounds}
                  autoIdle
                />
              </Frame>
              <div className="assistant-gallery-info">
                <div className="assistant-wizard-balloon" onClick={cyclePreview}>
                  <span className="assistant-wizard-tip" aria-hidden="true" />
                  <p>{quote.text}</p>
                </div>
                <div className="assistant-meta">
                  <p className="assistant-meta-name">
                    <span>Name:</span>
                    <strong>{profile.galleryName}</strong>
                  </p>
                  <p className="assistant-meta-desc">{profile.description}</p>
                </div>
              </div>
            </div>
            <div className="assistant-gallery-nav">
              <Button
                disabled={currentIndex === 0}
                onClick={() => stepAssistant(-1)}
                className="assistant-nav-btn"
              >
                &lt; Zurück
              </Button>
              <Button
                disabled={currentIndex === assistantOrder.length - 1}
                onClick={() => stepAssistant(1)}
                className="assistant-nav-btn"
              >
                Weiter &gt;
              </Button>
              <Button onClick={cyclePreview} className="assistant-demo-btn">
                Animation testen
              </Button>
            </div>
          </div>
        ) : null}
        {tab === 1 ? (
          <div className="stack assistant-options">
            <GroupBox label="Assistenten-Funktionen">
              <div className="assistant-check-list">
                <Checkbox
                  label="Office-Assistenten auf dem Desktop anzeigen"
                  checked={enabled}
                  onChange={(event) => setEnabled(event.target.checked)}
                />
                <Checkbox
                  label="Klänge wiedergeben"
                  checked={sounds}
                  onChange={(event) => setSounds(event.target.checked)}
                />
                <Checkbox
                  label="Subtile Entdecker-Tipps zur Website einblenden"
                  checked={tips}
                  onChange={(event) => setTips(event.target.checked)}
                />
              </div>
            </GroupBox>
            <GroupBox label="Aktionen auf dem Desktop">
              <p className="assistant-options-hint">
                Ein Klick auf den Assistenten entlockt ihm Hinweise auf versteckte Funktionen dieser Seite.
                Über die rechte Maustaste führen Sie einzelne Animationen vor.
              </p>
              <div className="button-row">
                <Button
                  onClick={() => {
                    updateSettings({ assistantPosition: null });
                  }}
                >
                  Position zurücksetzen
                </Button>
                <Button
                  onClick={() => {
                    updateSettings({
                      assistant: selectedId,
                      assistantEnabled: true,
                      assistantSounds: sounds,
                      assistantTips: tips,
                      assistantSetupDone: true,
                    });
                    onClose();
                    window.setTimeout(() => triggerDesktopAssistantAction('tip'), 120);
                  }}
                >
                  Jetzt Geheimtipp zeigen
                </Button>
              </div>
            </GroupBox>
          </div>
        ) : null}
      </TabBody>
      <div className="dialog-footer">
        <Button onClick={confirm} style={{ minWidth: 78 }}>OK</Button>
        <Button onClick={cancel} style={{ minWidth: 78 }}>Abbrechen</Button>
      </div>
    </div>
  );
}
