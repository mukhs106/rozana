import { useEffect, useState } from "react";
import SettingsRow from "@/components/settings/SettingsRow";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

const APPEARANCE = [
  { key: "system", label: "System" },
  { key: "light", label: "Light" },
  { key: "dark", label: "Dark" },
];

const AVAILABILITY = {
  unsupported: "This browser cannot show notifications, so reminders cannot be delivered here.",
  denied: "Notifications are blocked for this site. Allow them in your browser settings, then switch a reminder on again.",
  granted:
    "Reminders arrive on this device while Rozana is open, timed to this device's clock. They reschedule when a meal moves and disappear when it is removed.",
  default: "Switching a reminder on asks your browser for permission first.",
};

export default function PreferencesSection({ prefs, update }) {
  const [permission, setPermission] = useState("default");
  const [asking, setAsking] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      setPermission("unsupported");
      return;
    }
    setPermission(Notification.permission);
  }, []);

  const toggleReminder = async (key, checked) => {
    if (!checked) {
      update({ notifications: { [key]: false } });
      return;
    }
    if (typeof window === "undefined" || !("Notification" in window)) {
      setPermission("unsupported");
      return;
    }
    setAsking(true);
    try {
      let state = Notification.permission;
      if (state === "default") state = await Notification.requestPermission();
      setPermission(state);
      if (state === "granted") update({ notifications: { [key]: true } });
    } finally {
      setAsking(false);
    }
  };

  return (
    <section className="mt-9">
      <h2 className="text-[19px] leading-tight">Preferences</h2>

      <div className="mt-1">
        <SettingsRow label="Prep reminders" hint="A nudge the evening you cook.">
          <Switch
            checked={Boolean(prefs.notifications.prep)}
            disabled={asking}
            onCheckedChange={(checked) => toggleReminder("prep", checked)}
            aria-label="Prep reminders"
          />
        </SettingsRow>
        <SettingsRow label="Lunchbox reminders" hint="The night before a packed lunch.">
          <Switch
            checked={Boolean(prefs.notifications.lunchbox)}
            disabled={asking}
            onCheckedChange={(checked) => toggleReminder("lunchbox", checked)}
            aria-label="Lunchbox reminders"
          />
        </SettingsRow>
        <p className="border-t border-border py-2 text-[11.5px] leading-snug text-ink-mid">
          {AVAILABILITY[permission]}
        </p>
      </div>

      <div className="mt-4">
        <p className="text-[12.5px] font-medium text-ink-mid">Appearance</p>
        <div className="mt-2 flex gap-1.5">
          {APPEARANCE.map((option) => (
            <button
              key={option.key}
              type="button"
              onClick={() => update({ appearance: option.key })}
              aria-pressed={prefs.appearance === option.key}
              className={cn(
                "rounded-full border px-3 py-1.5 text-[12.5px] font-medium",
                prefs.appearance === option.key
                  ? "border-oxblood bg-oxblood text-field-paper"
                  : "border-border text-ink-mid",
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
        <p className="mt-1.5 text-[11.5px] leading-snug text-ink-mid">
          System follows this device. Light and Dark apply to every screen, sheet and the tab bar.
        </p>
      </div>

      <div className="mt-4">
        <SettingsRow
          label="Autoplay homepage videos"
          hint="Off by default. Clips are muted and never play when reduced motion is on."
        >
          <Switch
            checked={Boolean(prefs.autoplay)}
            onCheckedChange={(checked) => update({ autoplay: checked })}
            aria-label="Autoplay homepage videos"
          />
        </SettingsRow>
      </div>
    </section>
  );
}