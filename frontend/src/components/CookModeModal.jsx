import { useState, useEffect, useRef } from 'react';
import { sound } from '../utils/soundEffects';

/**
 * Extracts minutes from instruction text like "cook for 15 minutes", "simmer 10 mins", "bake for 30 minutes"
 */
function extractMinutes(text) {
  if (!text) return null;
  const match = text.match(/(\d+)\s*(?:-|to)?\s*(\d+)?\s*(?:min|mins|minute|minutes)/i);
  if (match) {
    return parseInt(match[2] || match[1], 10);
  }
  return null;
}

export default function CookModeModal({ recipe, instructions, onClose }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState({});
  const [showIngredientsDrawer, setShowIngredientsDrawer] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Timer state
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [totalTimerSeconds, setTotalTimerSeconds] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const timerRef = useRef(null);

  // Screen Wake Lock
  const wakeLockRef = useRef(null);

  const totalSteps = instructions.length;
  const stepText = instructions[currentStep] || '';
  const detectedMins = extractMinutes(stepText);

  // Initialize or reset timer when changing step
  useEffect(() => {
    if (detectedMins) {
      const secs = detectedMins * 60;
      setTimerSeconds(secs);
      setTotalTimerSeconds(secs);
      setTimerActive(false);
    } else {
      setTimerSeconds(0);
      setTotalTimerSeconds(0);
      setTimerActive(false);
    }
    // Stop speech when step changes
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, [currentStep, detectedMins]);

  // Timer interval
  useEffect(() => {
    if (timerActive && timerSeconds > 0) {
      timerRef.current = setInterval(() => {
        setTimerSeconds(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            setTimerActive(false);
            sound.playChime();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [timerActive, timerSeconds]);

  // Request WakeLock to prevent phone/laptop screen sleep
  useEffect(() => {
    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator) {
          wakeLockRef.current = await navigator.wakeLock.request('screen');
        }
      } catch {
        // WakeLock catch
      }
    };
    requestWakeLock();

    return () => {
      if (wakeLockRef.current) {
        wakeLockRef.current.release().catch(() => {});
      }
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight' && currentStep < totalSteps - 1) {
        setCurrentStep(p => p + 1);
        sound.playClick();
      }
      if (e.key === 'ArrowLeft' && currentStep > 0) {
        setCurrentStep(p => p - 1);
        sound.playClick();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentStep, totalSteps, onClose]);

  const toggleTimer = () => {
    sound.playClick();
    setTimerActive(p => !p);
  };

  const resetTimer = () => {
    sound.playClick();
    setTimerActive(false);
    setTimerSeconds(totalTimerSeconds);
  };

  const toggleComplete = (idx) => {
    sound.playClick();
    const next = { ...completedSteps, [idx]: !completedSteps[idx] };
    setCompletedSteps(next);
    
    // Auto-advance if checking the current step
    if (!completedSteps[idx] && idx === currentStep && currentStep < totalSteps - 1) {
      setTimeout(() => setCurrentStep(currentStep + 1), 350);
    }

    // If all completed
    const allDone = instructions.every((_, i) => next[i]);
    if (allDone) {
      sound.playSuccess();
    }
  };

  const speakStep = () => {
    if (!('speechSynthesis' in window)) return;
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(`Step ${currentStep + 1}. ${stepText}`);
    utterance.rate = 0.95;
    utterance.pitch = 1.0;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const formatTimer = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const isAllComplete = instructions.length > 0 && instructions.every((_, i) => completedSteps[i]);

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 9999,
      backgroundColor: '#070b12',
      color: '#f8fafc',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: "'Inter', sans-serif",
      overflow: 'hidden'
    }}>
      {/* Top HUD Bar */}
      <div style={{
        padding: '16px 28px',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        background: 'rgba(11,17,29,0.95)',
        backdropFilter: 'blur(16px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        zIndex: 10
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <span style={{
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            color: 'white',
            padding: '6px 12px',
            borderRadius: 8,
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: 1
          }}>
            COOK MODE
          </span>
          <h2 style={{
            fontFamily: 'Playfair Display',
            fontSize: '1.2rem',
            margin: 0,
            color: '#f1f5f9',
            maxWidth: 400,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}>
            {recipe.name}
          </h2>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Ingredients toggle */}
          <button
            onClick={() => {
              sound.playClick();
              setShowIngredientsDrawer(!showIngredientsDrawer);
            }}
            style={{
              background: showIngredientsDrawer ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.06)',
              border: `1px solid ${showIngredientsDrawer ? '#10b981' : 'rgba(255,255,255,0.1)'}`,
              color: showIngredientsDrawer ? '#10b981' : '#e2e8f0',
              padding: '8px 16px',
              borderRadius: 20,
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            <span>🧺</span>
            <span>Ingredients ({recipe.ingredients?.length || 0})</span>
          </button>

          {/* Close Cook Mode */}
          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            style={{
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.12)',
              color: '#f1f5f9',
              width: 38,
              height: 38,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 18,
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            title="Exit Cook Mode (Esc)"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Progress Line */}
      <div style={{ width: '100%', height: 4, background: 'rgba(255,255,255,0.05)' }}>
        <div style={{
          width: `${((currentStep + 1) / totalSteps) * 100}%`,
          height: '100%',
          background: 'linear-gradient(90deg, #10b981, #3b82f6)',
          transition: 'width 0.3s ease'
        }} />
      </div>

      {/* Main Cooking Viewport */}
      <div style={{
        flex: 1,
        display: 'flex',
        overflow: 'hidden',
        position: 'relative'
      }}>
        {/* Central Instruction Card */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '30px 40px',
          maxWidth: 900,
          margin: '0 auto',
          textAlign: 'center'
        }}>
          {isAllComplete ? (
            <div className="animate-bounceIn" style={{ textAlign: 'center', padding: 40 }}>
              <div style={{ fontSize: 72, marginBottom: 16 }}>🎉👨‍🍳⭐</div>
              <h1 style={{
                fontFamily: 'Playfair Display',
                fontSize: '2.5rem',
                fontWeight: 700,
                color: '#34d399',
                marginBottom: 12
              }}>
                Bon Appétit!
              </h1>
              <p style={{ fontSize: '1.2rem', color: '#94a3b8', maxWidth: 500, margin: '0 auto 28px' }}>
                You have successfully completed all steps for <strong>{recipe.name}</strong>. Plate your masterpiece and enjoy!
              </p>
              <div style={{ display: 'flex', gap: 14, justifyContent: 'center' }}>
                <button
                  className="btn-primary"
                  onClick={() => {
                    setCompletedSteps({});
                    setCurrentStep(0);
                  }}
                  style={{ padding: '12px 24px', fontSize: 15 }}
                >
                  Cook Again 🔄
                </button>
                <button
                  className="btn-secondary"
                  onClick={onClose}
                  style={{ padding: '12px 24px', fontSize: 15 }}
                >
                  Exit to Recipe ✕
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Step indicator */}
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '6px 16px',
                borderRadius: 20,
                background: 'rgba(16,185,129,0.12)',
                border: '1px solid rgba(16,185,129,0.3)',
                color: '#10b981',
                fontSize: 14,
                fontWeight: 700,
                marginBottom: 20
              }}>
                <span>STEP {currentStep + 1} OF {totalSteps}</span>
                {completedSteps[currentStep] && <span>✓ Done</span>}
              </div>

              {/* Big bold Instruction Text */}
              <div style={{
                fontSize: 'clamp(1.5rem, 3.2vw, 2.3rem)',
                fontFamily: 'Playfair Display',
                fontWeight: 600,
                lineHeight: 1.5,
                color: completedSteps[currentStep] ? '#94a3b8' : '#ffffff',
                textDecoration: completedSteps[currentStep] ? 'line-through' : 'none',
                marginBottom: 32,
                maxWidth: 820
              }}>
                {stepText}
              </div>

              {/* Step Tools (Voice Readout + Timer) */}
              <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center', marginBottom: 28 }}>
                {/* Voice narration button */}
                <button
                  onClick={speakStep}
                  style={{
                    background: isSpeaking ? 'rgba(59,130,246,0.25)' : 'rgba(255,255,255,0.06)',
                    border: `1px solid ${isSpeaking ? '#3b82f6' : 'rgba(255,255,255,0.12)'}`,
                    color: isSpeaking ? '#60a5fa' : '#cbd5e1',
                    borderRadius: 14,
                    padding: '10px 18px',
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    transition: 'all 0.2s'
                  }}
                >
                  <span style={{ fontSize: 16 }}>{isSpeaking ? '⏹️' : '🔊'}</span>
                  <span>{isSpeaking ? 'Stop Reading' : 'Read Aloud'}</span>
                </button>

                {/* Interactive Timer if detected or manual */}
                {totalTimerSeconds > 0 && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    background: timerActive ? 'rgba(16,185,129,0.18)' : 'rgba(255,255,255,0.05)',
                    border: `1px solid ${timerActive ? '#10b981' : 'rgba(255,255,255,0.12)'}`,
                    borderRadius: 14,
                    padding: '8px 18px'
                  }}>
                    <span style={{ fontSize: 20 }}>⏱️</span>
                    <span style={{
                      fontFamily: 'monospace',
                      fontSize: 22,
                      fontWeight: 700,
                      color: timerSeconds === 0 ? '#ef4444' : timerActive ? '#34d399' : '#f1f5f9'
                    }}>
                      {formatTimer(timerSeconds)}
                    </span>
                    <button
                      onClick={toggleTimer}
                      style={{
                        background: timerActive ? '#ef4444' : '#10b981',
                        border: 'none',
                        color: 'white',
                        borderRadius: 8,
                        padding: '6px 14px',
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      {timerActive ? 'Pause' : timerSeconds === 0 ? 'Restart' : 'Start Timer'}
                    </button>
                    <button
                      onClick={resetTimer}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#94a3b8',
                        cursor: 'pointer',
                        fontSize: 14
                      }}
                    >
                      ↺
                    </button>
                  </div>
                )}
              </div>

              {/* Mark Complete Checkbox */}
              <button
                onClick={() => toggleComplete(currentStep)}
                style={{
                  background: completedSteps[currentStep]
                    ? 'rgba(16,185,129,0.2)'
                    : 'rgba(255,255,255,0.05)',
                  border: `2px solid ${completedSteps[currentStep] ? '#10b981' : 'rgba(255,255,255,0.2)'}`,
                  color: completedSteps[currentStep] ? '#10b981' : '#f1f5f9',
                  borderRadius: 14,
                  padding: '12px 28px',
                  fontSize: 16,
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  transition: 'all 0.2s',
                  boxShadow: completedSteps[currentStep] ? '0 0 20px rgba(16,185,129,0.3)' : 'none'
                }}
              >
                <span style={{ fontSize: 20 }}>
                  {completedSteps[currentStep] ? '✅' : '⚪'}
                </span>
                <span>
                  {completedSteps[currentStep] ? 'Step Completed!' : 'Mark Step as Done'}
                </span>
              </button>
            </>
          )}
        </div>

        {/* Collapsible Ingredients Drawer on Right */}
        {showIngredientsDrawer && (
          <div className="animate-slideInRight" style={{
            width: 320,
            borderLeft: '1px solid rgba(255,255,255,0.08)',
            background: 'rgba(15,22,36,0.95)',
            backdropFilter: 'blur(16px)',
            padding: 24,
            overflowY: 'auto'
          }}>
            <h3 style={{
              fontFamily: 'Playfair Display',
              fontSize: '1.15rem',
              fontWeight: 700,
              marginBottom: 16,
              color: '#34d399'
            }}>
              Recipe Ingredients
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {recipe.ingredients?.map((ing, i) => (
                <div key={i} style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: 10,
                  padding: '8px 12px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: 13
                }}>
                  <span style={{ color: '#e2e8f0', fontWeight: 500 }}>{ing.name}</span>
                  <span style={{ color: '#94a3b8', fontSize: 12 }}>{ing.quantity} {ing.unit}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Step Control Dock */}
      <div style={{
        padding: '16px 28px',
        borderTop: '1px solid rgba(255,255,255,0.08)',
        background: 'rgba(11,17,29,0.95)',
        backdropFilter: 'blur(16px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        zIndex: 10
      }}>
        {/* Step dots */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {instructions.map((_, i) => (
            <button
              key={i}
              onClick={() => {
                sound.playClick();
                setCurrentStep(i);
              }}
              style={{
                width: i === currentStep ? 24 : 10,
                height: 10,
                borderRadius: 5,
                background: completedSteps[i]
                  ? '#10b981'
                  : i === currentStep
                  ? '#3b82f6'
                  : 'rgba(255,255,255,0.2)',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s',
                padding: 0
              }}
              title={`Go to Step ${i + 1}`}
            />
          ))}
        </div>

        {/* Step Prev / Next Buttons */}
        <div style={{ display: 'flex', gap: 12 }}>
          <button
            onClick={() => {
              if (currentStep > 0) {
                sound.playClick();
                setCurrentStep(p => p - 1);
              }
            }}
            disabled={currentStep === 0}
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: currentStep === 0 ? '#475569' : '#f1f5f9',
              borderRadius: 12,
              padding: '10px 20px',
              fontSize: 14,
              fontWeight: 600,
              cursor: currentStep === 0 ? 'not-allowed' : 'pointer'
            }}
          >
            ← Previous Step
          </button>

          <button
            onClick={() => {
              if (currentStep < totalSteps - 1) {
                sound.playClick();
                setCurrentStep(p => p + 1);
              } else {
                sound.playSuccess();
              }
            }}
            style={{
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              border: 'none',
              color: 'white',
              borderRadius: 12,
              padding: '10px 24px',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 0 15px rgba(16,185,129,0.3)'
            }}
          >
            {currentStep === totalSteps - 1 ? 'Finish Cooking 🏁' : 'Next Step →'}
          </button>
        </div>
      </div>
    </div>
  );
}
