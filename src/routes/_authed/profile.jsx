import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ChevronRight, LogOut, Plus, ShieldCheck, Wrench } from "lucide-react";
import { toast } from "sonner";
import AppShell from "@/components/AppShell";
import Pill from "@/components/Pill";
import FeedbackSheet from "@/components/FeedbackSheet";
import MemberDialog from "@/components/profile/MemberDialog";
import SavedVersionList from "@/components/profile/SavedVersionList";
import PreferencesSection from "@/components/profile/PreferencesSection";
import { LanguageSheet, PlainSheet, ServingsSheet, StaplesSheet, UnitsSheet } from "@/components/profile/KitchenSheets";
import SettingsRow from "@/components/settings/SettingsRow";
import DinerAvatar from "@/components/table/DinerAvatar";
import { db } from "@/api/db";
import { APP_NAME_KEY, useAppName } from "@/hooks/useAppName";
import { usePrefs } from "@/hooks/usePrefs";
import {
  firstNameOf,
  membersOf,
  useCookLog,
  useHousehold,
  useSavedVersions,
  useUserSettings,
} from "@/hooks/useKitchen";
import { formatServings } from "@/lib/allocations";
import { APP_VERSION } from "@/lib/appVersion";
import { useAuth } from "@/lib/AuthContext";
import { leaveDemo } from "@/lib/demo";
import { allergenLabel } from "@/lib/foodInfo";
import { currentStreak, LANGUAGES, saveSettings } from "@/lib/settings";
import { addDays, parseISODate, todayISO } from "@/lib/slots";
import { weekDays } from "@/lib/suggest";
import { UNIT_SYSTEMS } from "@/lib/units";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authed/profile")({
  ssr: false,
  head: () => ({ meta: [{ title: "Profile · Rozana" }] }),
  component: ProfilePage,
});

const DIET_WORDS = { vegetarian: "Vegetarian", "gluten-free": "Gluten-free", "nut-free": "Nut-free", egg: "Eats egg" };

/** "No tree nuts · Jain · 1½ portions" */
function dinerSummary(member) {
  const parts = [];
  (member.allergies || []).forEach((item) => parts.push(`No ${allergenLabel(item).toLowerCase()}`));
  const diet = member.diet || [];
  if (diet.includes("jain")) parts.push("Jain");
  else if (diet.includes("vegan")) parts.push("Vegan");
  else diet.forEach((item) => DIET_WORDS[item] && parts.push(DIET_WORDS[item]));
  const portion = Number(member.portion) || 1;
  parts.push(`${formatServings(portion)} ${portion === 1 ? "portion" : "portions"}`);
  if (member.dislikes?.length) parts.push(`Dislikes ${member.dislikes.slice(0, 2).join(", ")}`);
  return parts.join(" · ");
}

function Section({ title, hint, children }) {
  return (
    <section className="mt-10">
      <h2 className="text-title">{title}</h2>
      {hint ? <p className="mt-1 text-body text-ink-mid">{hint}</p> : null}
      <div className="mt-2">{children}</div>
    </section>
  );
}

const DAY_LETTER = new Intl.DateTimeFormat("en-GB", { weekday: "narrow" });

function StreakCalendar({ cookLog, today }) {
  const cooked = new Set(cookLog.map((entry) => entry.cooked_on));
  const weeks = [weekDays(addDays(today, -7)), weekDays(today)];
  const streak = currentStreak(cookLog, today, addDays);
  return (
    <div className="rounded-2xl border border-border p-4">
      <p className="text-heading">{streak ? `${streak}-day cooking streak` : "No streak yet"}</p>
      <p className="text-small text-ink-mid">Every “Cooked it” on a recipe or a planned meal counts.</p>
      <div className="mt-3 grid grid-cols-7 gap-1 text-center">
        {weeks[0].map((day) => (
          <span key={`h-${day}`} className="text-small text-ink-mid" aria-hidden="true">
            {DAY_LETTER.format(parseISODate(day))}
          </span>
        ))}
        {weeks.flat().map((day) => {
          const done = cooked.has(day);
          return (
            <span
              key={day}
              aria-label={`${day}${done ? ", cooked" : ""}`}
              className={cn(
                "mx-auto flex h-10 w-10 items-center justify-center rounded-full text-small",
                done ? "bg-primary font-semibold text-primary-foreground" : "border border-border text-ink-mid",
                day === today && !done && "border-2 border-primary text-ink",
                day > today && "opacity-40",
              )}
            >
              {parseISODate(day).getDate()}
            </span>
          );
        })}
      </div>
    </div>
  );
}

function ProfilePage() {
  const { user } = Route.useRouteContext();
  const { logout } = useAuth();
  const queryClient = useQueryClient();
  const { data: household } = useHousehold();
  const { data: saved = [] } = useSavedVersions();
  const { data: settings } = useUserSettings();
  const { data: cookLog = [] } = useCookLog();
  const { prefs, update } = usePrefs();
  const appName = useAppName();
  const today = todayISO();

  const members = membersOf(household, user);
  const demo = Boolean(user?.is_demo);
  const [editing, setEditing] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [sheet, setSheet] = useState(null);
  const [nameDraft, setNameDraft] = useState(appName);
  const [savingName, setSavingName] = useState(false);

  useEffect(() => setNameDraft(appName), [appName]);

  const saveHousehold = async (nextMembers) => {
    if (household) await db.Household.update(household.id, { members: nextMembers });
    else await db.Household.create({ name: `${firstNameOf(user)}’s kitchen`, members: nextMembers });
    await queryClient.invalidateQueries({ queryKey: ["household"] });
    setDialogOpen(false);
  };
  const saveMember = (member) => {
    const exists = members.some((item) => item.id === member.id);
    return saveHousehold(exists ? members.map((item) => (item.id === member.id ? member : item)) : [...members, member]);
  };
  const deleteMember = (member) => saveHousehold(members.filter((item) => item.id !== member.id));
  const updateSettings = async (patch) => {
    await saveSettings(patch);
    await queryClient.invalidateQueries({ queryKey: ["user-settings"] });
    toast.success("Saved");
  };
  const removeVersion = async (version) => {
    await db.SavedVersion.delete(version.id);
    await queryClient.invalidateQueries({ queryKey: ["saved-versions"] });
  };
  const saveAppName = async () => {
    const value = nameDraft.trim();
    if (!value) return;
    setSavingName(true);
    try {
      const rows = await db.AppSetting.filter({ key: APP_NAME_KEY });
      if (rows?.[0]) await db.AppSetting.update(rows[0].id, { value });
      else await db.AppSetting.create({ key: APP_NAME_KEY, value, label: "App name" });
      await queryClient.invalidateQueries({ queryKey: ["app-name"] });
      toast.success("Name updated");
    } finally {
      setSavingName(false);
    }
  };
  const exitDemo = () => {
    leaveDemo();
    window.location.assign("/login");
  };

  const units = UNIT_SYSTEMS.find((item) => item.key === settings?.units)?.label || "Keep each recipe's units";
  const language = LANGUAGES.find((item) => item.key === settings?.recipe_language)?.label || "English";
  const staples = settings?.staples || [];
  const translating = settings?.recipe_language && settings.recipe_language !== "en";

  return (
    <AppShell>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-display">{user?.full_name || user?.email}</h1>
          <p className="mt-1 text-body text-ink-mid">{demo ? "Exploring with sample data" : user?.email}</p>
        </div>
        <Pill variant="soft" size="sm" onClick={() => setSheet("feedback")} className="shrink-0">
          Feedback
        </Pill>
      </div>

      {/* 1. Your table: the people every dish is adapted for */}
      <Section title="Your table" hint="Everyone Rozana cooks for. Every check and swap starts here.">
        <ul>
          {members.map((member) => (
            <li key={member.id}>
              <button
                type="button"
                onClick={() => {
                  setEditing(member);
                  setDialogOpen(true);
                }}
                className="flex min-h-[72px] w-full items-center gap-3 border-t border-border py-3 text-left"
              >
                <DinerAvatar member={member} size={48} />
                <span className="min-w-0 flex-1">
                  <span className="block text-body font-semibold">
                    {member.name}
                    {member.is_self ? <span className="font-normal text-ink-mid"> (you)</span> : null}
                  </span>
                  <span className="block text-small text-ink-soft">{dinerSummary(member)}</span>
                </span>
                <ChevronRight className="h-5 w-5 shrink-0 text-ink-mid" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
        <Pill
          variant="soft"
          className="mt-3 w-full"
          onClick={() => {
            setEditing(null);
            setDialogOpen(true);
          }}
        >
          <Plus className="h-5 w-5" aria-hidden="true" /> Add someone
        </Pill>
      </Section>

      {/* 2. In the kitchen */}
      <Section title="In the kitchen">
        <SettingsRow label="Units" hint={units} onClick={() => setSheet("units")} />
        <SettingsRow
          label="Servings"
          hint={settings?.auto_scale ? "Scaled to your table" : `Batches start at ${settings?.default_servings || 4}`}
          onClick={() => setSheet("servings")}
        />
        <SettingsRow
          label="Recipe language"
          hint={`${language}${translating ? " · translation coming soon" : ""}`}
          onClick={() => setSheet("language")}
        />
        <SettingsRow
          label="Pantry staples"
          hint={staples.length ? staples.slice(0, 4).join(", ") + (staples.length > 4 ? ` +${staples.length - 4}` : "") : "None yet"}
          onClick={() => setSheet("staples")}
        />
        <SettingsRow label="Saved versions" hint={`${saved.length} saved from the batch screen`} onClick={() => setSheet("saved")} />
      </Section>

      {/* 3. Your rhythm */}
      <Section title="Your rhythm">
        <StreakCalendar cookLog={cookLog} today={today} />
        <div className="mt-3">
          <PreferencesSection prefs={prefs} update={update} title={null} />
        </div>
      </Section>

      {/* 4. Household */}
      <Section title="Household">
        <div className="rounded-2xl bg-sand p-4">
          <p className="text-body font-semibold">Share your table · coming soon</p>
          <p className="mt-1 text-body text-ink-soft">
            Invite the people you cook with so they see the same plan and grocery list. This needs shared accounts,
            which arrive with the move to Supabase.
          </p>
        </div>
      </Section>

      {/* 5. About Rozana */}
      <Section title="About Rozana">
        <SettingsRow label="Our story" to="/info/$topic" params={{ topic: "our-story" }} />
        <SettingsRow
          label="How swaps and allergy checks work"
          hint="Always check labels"
          to="/info/$topic"
          params={{ topic: "how-checks-work" }}
        />
        <SettingsRow label="FAQ" to="/info/$topic" params={{ topic: "faq" }} />
        <SettingsRow label="Send feedback" onClick={() => setSheet("feedback")} />
        <SettingsRow label="Contact us" to="/info/$topic" params={{ topic: "contact" }} />
        <SettingsRow label="Privacy" to="/info/$topic" params={{ topic: "privacy-policy" }} />
        <SettingsRow label="Terms" to="/info/$topic" params={{ topic: "user-terms" }} />
      </Section>

      {/* 6. Account */}
      <Section title="Account">
        {demo ? (
          <SettingsRow icon={LogOut} label="Leave demo" hint="Removes the sample data from this browser" tone="danger" onClick={exitDemo} />
        ) : (
          <>
            <SettingsRow icon={ShieldCheck} label="Sign-in and security" hint="Two-step sign-in and password" to="/mfa" params={undefined} />
            {user?.role === "admin" ? (
              <SettingsRow icon={Wrench} label="Recipe tools (admin)" to="/admin/enrich" params={undefined} />
            ) : null}
            <SettingsRow icon={LogOut} label="Sign out" tone="danger" onClick={() => logout()} />
          </>
        )}
        {user?.role === "admin" ? (
          <div className="mt-4 flex items-center gap-2">
            <input
              value={nameDraft}
              onChange={(event) => setNameDraft(event.target.value)}
              aria-label="App name (admin)"
              placeholder="Rozana"
              className="h-11 min-w-0 flex-1 rounded-full bg-sand px-4 text-body outline-none"
            />
            <Pill variant="soft" size="sm" onClick={saveAppName} disabled={savingName}>
              {savingName ? "Saving" : "Rename app"}
            </Pill>
          </div>
        ) : null}
        <p className="num mt-6 text-center text-small text-ink-mid">Rozana {APP_VERSION}</p>
      </Section>

      <MemberDialog open={dialogOpen} onOpenChange={setDialogOpen} member={editing} onSave={saveMember} onDelete={deleteMember} />
      <FeedbackSheet open={sheet === "feedback"} onOpenChange={(open) => setSheet(open ? "feedback" : null)} user={user} />
      <UnitsSheet
        open={sheet === "units"}
        onOpenChange={(open) => setSheet(open ? "units" : null)}
        value={settings?.units || "recipe"}
        onSave={(value) => updateSettings({ units: value })}
      />
      <ServingsSheet
        open={sheet === "servings"}
        onOpenChange={(open) => setSheet(open ? "servings" : null)}
        servings={settings?.default_servings || 4}
        autoScale={Boolean(settings?.auto_scale)}
        onSave={(draft) => updateSettings({ default_servings: draft.servings, auto_scale: draft.autoScale })}
      />
      <LanguageSheet
        open={sheet === "language"}
        onOpenChange={(open) => setSheet(open ? "language" : null)}
        value={settings?.recipe_language || "en"}
        onSave={(value) => updateSettings({ recipe_language: value })}
      />
      <StaplesSheet
        open={sheet === "staples"}
        onOpenChange={(open) => setSheet(open ? "staples" : null)}
        value={staples}
        onSave={(list) => updateSettings({ staples: list })}
      />
      <PlainSheet
        open={sheet === "saved"}
        onOpenChange={(open) => setSheet(open ? "saved" : null)}
        title="Saved versions"
        description="Batches you saved from the batch screen, ready to cook again."
      >
        <SavedVersionList versions={saved} onRemove={removeVersion} />
      </PlainSheet>
    </AppShell>
  );
}
