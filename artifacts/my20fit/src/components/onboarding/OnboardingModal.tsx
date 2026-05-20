import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import OnboardingStepBasic from "./OnboardingStepBasic";
import OnboardingStepPhysical from "./OnboardingStepPhysical";
import OnboardingStepGoals from "./OnboardingStepGoals";
import { useProfile } from "@/hooks/useProfile";

interface OnboardingModalProps {
  open: boolean;
  onClose: () => void;
}

const STEPS = ["Basic Info", "Physical Data", "Goals & Lifestyle"];

const primaryBtn: React.CSSProperties = {
  width: "100%",
  height: 48,
  background: "#C41101",
  color: "#FFFFFF",
  border: "none",
  borderRadius: 12,
  fontFamily: "'Anton', sans-serif",
  fontSize: 15,
  letterSpacing: "1px",
  cursor: "pointer",
  transition: "background 0.2s",
};

const secondaryBtn: React.CSSProperties = {
  width: "100%",
  height: 48,
  background: "transparent",
  color: "#6E665C",
  border: "1.5px solid #E5E1D8",
  borderRadius: 12,
  fontFamily: "Inter, sans-serif",
  fontWeight: 400,
  fontSize: 14,
  cursor: "pointer",
};

export default function OnboardingModal({ open, onClose }: OnboardingModalProps) {
  const [step, setStep] = useState(0);
  const [saved, setSaved] = useState(false);

  // Step 1 fields
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");

  // Step 2 fields
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");

  // Step 3 fields
  const [activityLevel, setActivityLevel] = useState("");
  const [gymExperience, setGymExperience] = useState("");
  const [dailySchedule, setDailySchedule] = useState("");

  const { saving, saveError, updateProfile } = useProfile();

  const handleSkip = async () => {
    try {
      await updateProfile({ onboarding_skipped_at: new Date().toISOString() });
    } catch { /* ignore */ }
    onClose();
  };

  const handleNext = async () => {
    if (step < STEPS.length - 1) {
      setStep((s) => s + 1);
    } else {
      await handleFinish();
    }
  };

  const handleFinish = async () => {
    const updates: Record<string, unknown> = {
      onboarding_completed: true,
    };
    if (age) updates.age = parseInt(age, 10);
    if (gender) {
      updates.gender = gender;
      updates.gender_selected_at = new Date().toISOString();
    }
    if (height) updates.height_cm = parseFloat(height);
    if (weight) updates.weight_kg = parseFloat(weight);
    if (activityLevel) updates.activity_level = activityLevel;
    if (gymExperience) updates.gym_experience = gymExperience;
    if (dailySchedule) updates.daily_schedule = dailySchedule;

    try {
      await updateProfile(updates);
      // Sync gender to localStorage so QuickCheckin stays in sync
      if (gender) {
        localStorage.setItem("my20fit_gender", gender);
        window.dispatchEvent(new CustomEvent("my20fit_gender_updated"));
      }
      setSaved(true);
      setTimeout(() => {
        setSaved(false);
        onClose();
      }, 1500);
    } catch {
      // error shown inline
    }
  };

  const canProceed = () => {
    if (step === 0) return true; // all optional
    if (step === 1) return true;
    if (step === 2) return true;
    return true;
  };

  return (
    <Dialog.Root open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <Dialog.Portal>
        <Dialog.Overlay
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(10,9,8,0.5)",
            backdropFilter: "blur(4px)",
            zIndex: 900,
            animation: "fadeIn 0.15s ease",
          }}
        />
        <Dialog.Content
          style={{
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            zIndex: 901,
            width: "calc(100% - 32px)",
            maxWidth: 540,
            maxHeight: "90vh",
            overflowY: "auto",
            background: "#FFFFFF",
            borderRadius: 16,
            padding: "32px 28px",
            boxShadow: "0 24px 64px rgba(0,0,0,0.16)",
            animation: "slideUp 0.2s ease",
          }}
        >
          {/* Close button */}
          <Dialog.Close
            style={{
              position: "absolute",
              top: 16,
              right: 16,
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#6E665C",
              padding: 4,
            }}
            aria-label="Close"
          >
            <X size={20} />
          </Dialog.Close>

          {/* Header */}
          <div style={{ marginBottom: 24 }}>
            <p
              style={{
                fontFamily: "Inter, sans-serif",
                fontWeight: 900,
                fontSize: 10,
                letterSpacing: "2px",
                color: "#C41101",
                margin: "0 0 4px",
              }}
            >
              PERSONALIZATION
            </p>
            <h2
              style={{
                fontFamily: "'Anton', sans-serif",
                fontSize: 22,
                color: "#0A0908",
                margin: "0 0 16px",
                paddingRight: 32,
              }}
            >
              {STEPS[step]}
            </h2>

            {/* Progress dots */}
            <div style={{ display: "flex", gap: 6 }}>
              {STEPS.map((_, i) => (
                <div
                  key={i}
                  style={{
                    height: 4,
                    flex: 1,
                    borderRadius: 99,
                    background: i <= step ? "#C41101" : "#E5E1D8",
                    transition: "background 0.2s",
                  }}
                />
              ))}
            </div>
          </div>

          {/* Content */}
          {saved ? (
            <div
              style={{
                textAlign: "center",
                padding: "32px 0",
              }}
            >
              <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
              <p
                style={{
                  fontFamily: "'Anton', sans-serif",
                  fontSize: 20,
                  color: "#0A0908",
                  margin: 0,
                }}
              >
                Profile saved!
              </p>
            </div>
          ) : (
            <>
              <div style={{ marginBottom: 24 }}>
                {step === 0 && (
                  <OnboardingStepBasic
                    age={age}
                    gender={gender}
                    onAgeChange={setAge}
                    onGenderChange={setGender}
                  />
                )}
                {step === 1 && (
                  <OnboardingStepPhysical
                    height={height}
                    weight={weight}
                    onHeightChange={setHeight}
                    onWeightChange={setWeight}
                  />
                )}
                {step === 2 && (
                  <OnboardingStepGoals
                    activityLevel={activityLevel}
                    gymExperience={gymExperience}
                    dailySchedule={dailySchedule}
                    onActivityChange={setActivityLevel}
                    onExperienceChange={setGymExperience}
                    onScheduleChange={setDailySchedule}
                  />
                )}
              </div>

              {/* Actions */}
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {saveError && (
                  <div
                    style={{
                      background: "#FEF2F2",
                      border: "1px solid #FCA5A5",
                      color: "#991B1B",
                      padding: "10px 12px",
                      borderRadius: 8,
                      fontFamily: "Inter, sans-serif",
                      fontSize: 14,
                    }}
                  >
                    {saveError}
                  </div>
                )}
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={saving || !canProceed()}
                  style={{
                    ...primaryBtn,
                    opacity: saving ? 0.7 : 1,
                    cursor: saving ? "default" : "pointer",
                  }}
                >
                  {saving
                    ? "Saving…"
                    : step === STEPS.length - 1
                    ? "Finish →"
                    : "Continue →"}
                </button>
                <button type="button" onClick={handleSkip} style={secondaryBtn} disabled={saving}>
                  Skip for now
                </button>
              </div>
            </>
          )}
        </Dialog.Content>
      </Dialog.Portal>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translate(-50%, calc(-50% + 16px)); } to { opacity: 1; transform: translate(-50%, -50%); } }
      `}</style>
    </Dialog.Root>
  );
}
