import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { LogOut, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import AppShell from "@/components/AppShell";
import Pill from "@/components/Pill";
import MemberDialog from "@/components/profile/MemberDialog";
import SavedVersionList from "@/components/profile/SavedVersionList";
import FoodRulesSection from "@/components/profile/FoodRulesSection";
import PreferencesSection from "@/components/profile/PreferencesSection";
import SettingsRow from "@/components/settings/SettingsRow";
import { db } from "@/api/db";
import { APP_NAME_KEY, useAppName } from "@/hooks/useAppName";
import { usePrefs } from "@/hooks/usePrefs";
import { firstNameOf, membersOf, useHousehold, useSavedVersions } from "@/hooks/useKitchen";
import { APP_VERSION } from "@/lib/appVersion";
import { useAuth } from "@/lib/AuthContext";
import FeedbackSheet from "@/components/FeedbackSheet";
import { leaveDemo } from "@/lib/demo";

export const Route = createFileRoute("/_authed/profile")({
  ssr: false,
  head: () => ({ meta: [{ title: "Profile · Rozana" }] }),
  component: ProfilePage,
});

function ProfilePage() {
  const { user } = Route.useRouteContext();
  const { logout } = useAuth();
  const queryClient = useQueryClient();
  const { data: household } = useHousehold();
  const { data: saved = [] } = useSavedVersions();
  const { prefs, update } = usePrefs();
  const appName = useAppName();

  const members = membersOf(household, user);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [nameDraft, setNameDraft] = useState(appName);
  const [savingName, setSavingName] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const demo = Boolean(user?.is_demo);

  const exitDemo = () => {
    leaveDemo();
    window.location.assign("/login");
  };

  useEffect(() => setNameDraft(appName), [appName]);

  const saveHousehold = async (patch, nextMembers) => {
    if (household) {
      await db.Household.update(household.id, {
        ...patch,
        ...(nextMembers ? { members: nextMembers } : {}),
      });
    } else {
      await db.Household.create({
        name: `${firstNameOf(user)}’s kitchen`,
        members: nextMembers || members,
        ...patch,
      });
    }
    await queryClient.invalidateQueries({ queryKey: ["household"] });
    setDialogOpen(false);
  };

  const handleSaveMember = async (member) => {
    const exists = members.some((item) => item.id === member.id);
    const next = exists ? members.map((item) => (item.id === member.id ? member : item)) : [...members, member];
    await saveHousehold({}, next);
  };

  const handleDeleteMember = async (member) => {
    await saveHousehold({}, members.filter((item) => item.id !== member.id));
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
      if (rows?.[0]) {
        await db.AppSetting.update(rows[0].id, { value });
      } else {
        await db.AppSetting.create({ key: APP_NAME_KEY, value, label: "App name" });
      }
      await queryClient.invalidateQueries({ queryKey: ["app-name"] });
      toast.success("Name updated");
    } finally {
      setSavingName(false);
    }
  };

  return (
    <AppShell>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-display leading-tight">{user?.full_name || user?.email}</h1>
          {demo ? null : <p className="mt-1 text-body text-ink-mid">{user?.email}</p>}
        </div>
        <Pill variant="soft" size="sm" onClick={() => setFeedbackOpen(true)} className="shrink-0">
          Feedback
        </Pill>
      </div>

      <FoodRulesSection
        members={members}
        household={household}
        saved={saved}
        onAdd={() => {
          setEditing(null);
          setDialogOpen(true);
        }}
        onEdit={(member) => {
          setEditing(member);
          setDialogOpen(true);
        }}
        onSaveHousehold={(patch) => saveHousehold(patch)}
      />

      <section className="mt-9">
        <h2 className="text-heading leading-tight">Saved versions</h2>
        <SavedVersionList versions={saved} onRemove={removeVersion} />
      </section>

      <PreferencesSection prefs={prefs} update={update} />

      <section className="mt-9">
        <h2 className="text-heading leading-tight">General</h2>
        <div className="mt-1">
          <SettingsRow label="Privacy choices" to="/info/$topic" params={{ topic: "privacy-choices" }} />
          <SettingsRow label="Privacy policy" to="/info/$topic" params={{ topic: "privacy-policy" }} />
          <SettingsRow label="Community guidelines" to="/info/$topic" params={{ topic: "community-guidelines" }} />
          <SettingsRow label="User terms" to="/info/$topic" params={{ topic: "user-terms" }} />
        </div>
      </section>

      <section className="mt-9">
        <h2 className="text-heading leading-tight">Support and tools</h2>
        <div className="mt-1">
          <SettingsRow label="Our story" to="/info/$topic" params={{ topic: "our-story" }} />
          <SettingsRow label="How swaps and allergy checks work" to="/info/$topic" params={{ topic: "how-checks-work" }} />
          <SettingsRow label="Send feedback" onClick={() => setFeedbackOpen(true)} />
          <SettingsRow label="Report a bug" to="/info/$topic" params={{ topic: "report-a-bug" }} />
          <SettingsRow label="FAQs" to="/info/$topic" params={{ topic: "faq" }} />
          <SettingsRow label="About Rozana" to="/info/$topic" params={{ topic: "about" }} />
          <SettingsRow label="Contact us" to="/info/$topic" params={{ topic: "contact" }} />
        </div>
      </section>

      {user?.role === "admin" ? (
        <section className="mt-9">
          <p className="eyebrow">App name (admin)</p>
          <div className="mt-2 flex items-center gap-2">
            <input
              value={nameDraft}
              onChange={(event) => setNameDraft(event.target.value)}
              className="w-full border-b border-black/15 bg-transparent pb-1 text-body font-medium outline-none"
              placeholder="Rozana"
            />
            <Pill variant="outline" size="sm" onClick={saveAppName} disabled={savingName}>
              {savingName ? "Saving" : "Save"}
            </Pill>
          </div>
        </section>
      ) : null}

      <section className="mt-9">
        <h2 className="text-heading leading-tight">Account</h2>
        <div className="mt-1">
          {demo ? (
            <SettingsRow
              icon={LogOut}
              label="Leave demo"
              hint="Removes the sample data from this browser"
              tone="danger"
              onClick={exitDemo}
            />
          ) : (
            <>
              <SettingsRow
                icon={ShieldCheck}
                label="Account & sign-in"
                hint="Two-factor authentication and password"
                to="/mfa"
                params={undefined}
              />
              <SettingsRow icon={LogOut} label="Sign out" tone="danger" onClick={() => logout()} />
            </>
          )}
        </div>
        <p className="num mt-4 text-center text-small text-ink-mid">Rozana {APP_VERSION}</p>
      </section>

      <FeedbackSheet open={feedbackOpen} onOpenChange={setFeedbackOpen} user={user} />

      <MemberDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        member={editing}
        onSave={handleSaveMember}
        onDelete={handleDeleteMember}
      />
    </AppShell>
  );
}